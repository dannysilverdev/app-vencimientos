// src/app/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Chip,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from "@mui/material"
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pencil,
  Circle,
  Calendar,
  Info,
  Tag,
  User
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import EntityCard from "@/components/EntityCard"

// ======= Tipos =======
type Entity = {
  id: string
  name: string
  type_id: string
  entity_types?: { name: string }
}

type FieldValue = {
  id: string
  value: string
  field_id: string
  entity_fields: {
    name: string
    field_type: string
    entity_type_id: string
  }
}

type Deadline = {
  id: string
  last_done: string
  frequency: number
  frequency_unit: string
  usage_daily_average: number | null
  next_due_date: string | null
  current_usage?: number
  baseline_usage?: number
  deadline_types: {
    name: string
    measure_by: string
    unit: string | null
  }
}

type DeadlineStatus = {
  text: string
  variant: "default" | "secondary" | "destructive"
  icon: React.ReactNode
  daysRemaining: number
}

// ======= Config =======
const DEADLINE_WARNING_DAYS = 30 // ⚠️ Amarillo si faltan ≤ 30 días (vencimientos por fecha)

// ======= Helpers UI =======
const HScroll: React.FC<React.PropsWithChildren<{ gap?: number }>> = ({ children, gap = 0.75 }) => (
  <Box
    component="nav"
    aria-label="Filtros"
    sx={{
      display: "flex",
      gap,
      overflowX: { xs: "auto", md: "visible" },
      py: 0.5,
      px: { xs: 1, sm: 0 },
      scrollbarWidth: "thin",
      scrollSnapType: { xs: "x mandatory", md: "none" },
      "& > *": {
        flex: "0 0 auto",
        scrollSnapAlign: { xs: "start", md: "none" },
      },
      mb: 1.5,
    }}
  >
    {children}
  </Box>
)

// ======= Página =======
export default function HomePage() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<"all" | "good" | "warning" | "overdue">("all")
  const [entities, setEntities] = useState<Entity[]>([])
  const [deadlinesByEntity, setDeadlinesByEntity] = useState<Record<string, Deadline[]>>({})
  const [fieldValuesByEntity, setFieldValuesByEntity] = useState<Record<string, FieldValue[]>>({})
  const [openEntityId, setOpenEntityId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/entities")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setEntities(data)
      })
  }, [])

  useEffect(() => {
    const loadRelated = async () => {
      const allDeadlines: Record<string, Deadline[]> = {}
      const allFields: Record<string, FieldValue[]> = {}

      await Promise.all(
        entities.map(async (e) => {
          // 1) Deadlines + Fields
          const [dRes, fRes] = await Promise.all([
            fetch(`/api/deadlines?entity_id=${e.id}`),
            fetch(`/api/entity-field-values?entity_id=${e.id}`)
          ])
          const rawDeadlines: Deadline[] = await dRes.json()
          const fields: FieldValue[] = await fRes.json()

          // 2) Último uso global
          const { data: latestUsageRows, error: latestUsageErr } = await supabase
            .from("usage_logs")
            .select("value, date")
            .eq("entity_id", e.id)
            .order("date", { ascending: false })
            .limit(1)

          const currentUsage: number | null =
            latestUsageErr ? null : (latestUsageRows?.[0]?.value ?? null)

          // 3) Enriquecer deadlines de uso con baseline_usage
          const enrichedDeadlines: Deadline[] = []

          for (const d of rawDeadlines) {
            if (d?.deadline_types?.measure_by === "usage" && d?.last_done) {
              const { data: baselineRows, error: baselineErr } = await supabase
                .from("usage_logs")
                .select("value, date")
                .eq("entity_id", e.id)
                .lte("date", d.last_done)
                .order("date", { ascending: false })
                .limit(1)

              const baselineUsage: number | undefined =
                baselineErr ? undefined : (baselineRows?.[0]?.value ?? undefined)

              enrichedDeadlines.push({
                ...d,
                current_usage: typeof currentUsage === "number" ? currentUsage : undefined,
                baseline_usage: baselineUsage
              })
            } else if (d?.deadline_types?.measure_by === "usage") {
              enrichedDeadlines.push({
                ...d,
                current_usage: typeof currentUsage === "number" ? currentUsage : undefined,
                baseline_usage: undefined
              })
            } else {
              enrichedDeadlines.push(d)
            }
          }

          allDeadlines[e.id] = enrichedDeadlines
          allFields[e.id] = fields
        })
      )

      setDeadlinesByEntity(allDeadlines)
      setFieldValuesByEntity(allFields)
    }

    if (entities.length > 0) {
      loadRelated()
    }
  }, [entities])

  // ======= Estado por deadline (solo FECHA aquí) =======
  function getDeadlineStatus(d: Deadline): DeadlineStatus {
    const today = new Date()
    const dueDate = d.next_due_date ? new Date(d.next_due_date) : null

    const diffDays = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : Infinity
    let variant: DeadlineStatus["variant"] = "default"
    let icon: React.ReactNode = <CheckCircle size={16} />

    if (dueDate && diffDays < 0) {
      variant = "destructive"      // rojo si venció
      icon = <XCircle size={16} />
    } else if (dueDate && diffDays <= DEADLINE_WARNING_DAYS) {
      variant = "secondary"        // amarillo si faltan ≤ 30 días
      icon = <AlertTriangle size={16} />
    }

    return {
      text: dueDate ? dueDate.toISOString().split("T")[0] : "Sin fecha",
      variant,
      icon,
      daysRemaining: diffDays
    }
  }

  function getEntityStatus(deadlines: DeadlineStatus[]): "good" | "warning" | "overdue" {
    if (deadlines.some(d => d.variant === "destructive")) return "overdue"
    if (deadlines.some(d => d.variant === "secondary")) return "warning"
    return "good"
  }

  // Agrupar por tipo
  const grouped = entities.reduce<Record<string, Entity[]>>((acc, entity) => {
    const typeName = entity.entity_types?.name || "Sin clasificar"
    if (!acc[typeName]) acc[typeName] = []
    acc[typeName].push(entity)
    return acc
  }, {})

  // Tipos ordenados alfabéticamente (estable)
  const allTypesSorted = useMemo(
    () =>
      Array.from(new Set(entities.map(e => e.entity_types?.name || "Sin clasificar")))
        .sort((a, b) => a.localeCompare(b, "es", { numeric: true, sensitivity: "base" })),
    [entities]
  )

  const openEntity = openEntityId ? entities.find(e => e.id === openEntityId) : null
  const openFields = openEntityId ? fieldValuesByEntity[openEntityId] || [] : []
  const openDeadlines = openEntityId ? deadlinesByEntity[openEntityId] || [] : []

  return (
    <Box
      sx={{
        mt: { xs: 2, sm: 3 },
        width: "100%",
        px: { xs: 1.5, sm: 3 },
        maxWidth: 1400,
        mx: "auto"
      }}
    >

      {/* ===== Barra de filtros sticky ===== */}
      <Box
        sx={{
          position: "sticky",
          top: 8,                // ajusta según el alto de tu header
          zIndex: 10,
          bgcolor: "background.default",
          borderBottom: "1px solid",
          borderColor: "divider",
          pt: 1,
          pb: 1,
          mb: 2,
        }}
      >
        {/* Fila 1: Estado (orden fijo) */}
        <HScroll gap={0.75}>
          <Chip
            label="Todos"
            onClick={() => setSelectedStatus("all")}
            color={selectedStatus === "all" ? "primary" : "default"}
            icon={<Circle style={{ fontSize: 12 }} />}
            sx={{ mr: 0.25 }}
          />
          <Chip
            label="Al día"
            onClick={() => setSelectedStatus("good")}
            color={selectedStatus === "good" ? "success" : "default"}
            icon={<CheckCircle size={14} />}
            sx={{ mr: 0.25 }}
          />
          <Chip
            label="Pronto"
            onClick={() => setSelectedStatus("warning")}
            color={selectedStatus === "warning" ? "warning" : "default"}
            icon={<AlertTriangle size={14} />}
            sx={{ mr: 0.25 }}
          />
          <Chip
            label="Vencidas"
            onClick={() => setSelectedStatus("overdue")}
            color={selectedStatus === "overdue" ? "error" : "default"}
            icon={<XCircle size={14} />}
          />
        </HScroll>

        {/* Fila 2: Tipos (orden alfabético) */}
        <HScroll gap={0.75}>
          {allTypesSorted.map(type => (
            <Chip
              key={type}
              label={type}
              onClick={() => setSelectedType(type === selectedType ? null : type)}
              color={selectedType === type ? "primary" : "default"}
              variant="outlined"
            />
          ))}
        </HScroll>
      </Box>

      {/* Listado por grupo */}
      {Object.entries(grouped)
        .filter(([type]) => !selectedType || type === selectedType)
        .map(([typeName, group]) => (
          <Box key={typeName} sx={{ mb: 5 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>{typeName}</Typography>

            {/* Grid fluido y simétrico */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(auto-fill, minmax(260px, 1fr))",
                  sm: "repeat(auto-fill, minmax(300px, 1fr))"
                },
                gap: 2,
                alignItems: "stretch"
              }}
            >
              {group.map(entity => {
                const deadlines = deadlinesByEntity[entity.id] || []
                const deadlineWithStatus = deadlines.map(d => ({
                  ...d,
                  next_due_date: d.next_due_date,
                  status: getDeadlineStatus(d)
                }))
                const entityStatus = getEntityStatus(deadlineWithStatus.map(d => d.status))

                if (selectedStatus !== "all" && entityStatus !== selectedStatus) return null

                return (
                  <EntityCard
                    key={entity.id}
                    entity={entity}
                    deadlines={deadlines}
                    fieldValues={fieldValuesByEntity[entity.id] || []}
                    onClick={() => setOpenEntityId(entity.id)}
                  />
                )
              })}
            </Box>
          </Box>
        ))}

      {/* Modal de ficha */}
      <Dialog open={!!openEntityId} onClose={() => setOpenEntityId(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box display="flex" alignItems="center" gap={1}>
            <User size={20} />
            Ficha de entidad
          </Box>
          {openEntityId && (
            <IconButton
              href={`/entities/${openEntityId}/edit`}
              component="a"
              title="Editar entidad"
              sx={{ p: 1.5 }}
            >
              <Pencil size={28} />
            </IconButton>
          )}
        </DialogTitle>

        <DialogContent dividers>
          {openEntity && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Tag size={16} />
                  Tipo de entidad
                </Typography>
                <Typography variant="body2" fontWeight="500">
                  {openEntity.entity_types?.name || "Sin tipo"}
                </Typography>
              </Box>

              {openFields.length > 0 && (
                <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Info size={16} />
                    Información personalizada
                  </Typography>
                  <Box component="ul" sx={{ listStyle: "none", pl: 0, mt: 1 }}>
                    {openFields.map((f) => (
                      <li key={f.id}>
                        <Box display="flex" justifyContent="space-between" fontSize={13} py={0.5}>
                          <Typography fontWeight={500}>{f.entity_fields.name}</Typography>
                          <Typography>{f.value || "—"}</Typography>
                        </Box>
                      </li>
                    ))}
                  </Box>
                </Box>
              )}

              {openDeadlines.length > 0 && (
                <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Calendar size={16} />
                    Vencimientos
                  </Typography>
                  <Box component="ul" sx={{ listStyle: "none", pl: 0, mt: 1 }}>
                    {openDeadlines.map((d) => (
                      <li key={d.id}>
                        <Box fontSize={13} py={1} sx={{ borderBottom: '1px dashed #ccc' }}>
                          <Typography fontWeight={500}>{d.deadline_types.name}</Typography>
                          <Box display="flex" flexDirection="column" gap={0.5} mt={0.5}>
                            <Typography variant="body2">Última realización: {d.last_done || '—'}</Typography>
                            <Typography variant="body2">Fecha de vencimiento: {d.next_due_date || '—'}</Typography>
                            {d.deadline_types.measure_by === "usage" && (
                              <>
                                <Typography variant="body2">Frecuencia: {d.frequency} {d.frequency_unit}</Typography>
                                <Typography variant="body2">Promedio diario: {d.usage_daily_average ?? '—'}</Typography>
                                <Typography variant="body2">Uso actual: {typeof d.current_usage === 'number' ? d.current_usage : '—'}</Typography>
                              </>
                            )}
                          </Box>
                        </Box>
                      </li>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}
