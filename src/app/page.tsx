// src/app/page.tsx
"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import {
  Chip,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import type { ChipProps } from "@mui/material/Chip"
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pencil,
  Circle,
  Calendar,
  Info,
  Tag,
  User,
  LayoutGrid,
  List
} from "lucide-react"
import { alpha } from "@mui/material/styles"
import { supabase } from "@/lib/supabaseClient"
import EntityCollection from "@/components/EntityCollection"

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
  status?: string // activo/inactivo
  deadline_types: {
    name: string
    measure_by: string
    unit: string | null
  }
}

type DeadlineStatus = {
  text: string
  variant: "default" | "warning" | "secondary" | "destructive"
  icon: React.ReactNode
  daysRemaining: number
}

// ======= Config =======
const DEADLINE_WARNING_DAYS = 30         // 🟠 Próximo a vencer (≤30 días)
const DEADLINE_EARLY_WARNING_DAYS = 60   // 🟧 Aviso (≤60 días)
const AVISO_HEX = "#ffb74d"              // color solicitado para “Aviso”

// ======= Helpers UI =======
const HScroll: React.FC<React.PropsWithChildren<{ gap?: number }>> = ({ children, gap = 0.5 }) => (
  <Box
    component="nav"
    aria-label="Filtros"
    sx={{
      display: "flex",
      gap,
      overflowX: { xs: "visible", md: "visible" },
      py: 0.25,
      px: { xs: 1, sm: 0 },
      scrollbarWidth: "thin",
      flexWrap: { xs: "wrap", md: "nowrap" }, // compacto en mobile: puede cortar a 2 filas
      rowGap: { xs: 0.5, md: 0 },
      mb: 0.75,
      justifyContent: { xs: "space-between", md: "flex-start" },
    }}
  >
    {children}
  </Box>
)

// ======= Estilos consistentes de Chips =======
function paletteChipSx(theme: any, main: string, selected: boolean) {
  const contrast = theme.palette.getContrastText(main)
  const hoverOutlinedBg = alpha(main, theme.palette.mode === "dark" ? 0.2 : 0.12)
  const hoverFilledBg = alpha(main, theme.palette.mode === "dark" ? 0.92 : 0.9)

  return selected
    ? {
        // Filled (seleccionado)
        bgcolor: main,
        color: contrast,
        "& .MuiChip-icon": { color: contrast },
        "&:hover": {
          bgcolor: hoverFilledBg,
        },
      }
    : {
        // Outlined (no seleccionado)
        borderColor: main,
        color: main,
        "& .MuiChip-icon": { color: main },
        "&:hover": {
          bgcolor: hoverOutlinedBg, // no gris
          borderColor: main,
        },
      }
}

function avisoChipSx(theme: any, selected: boolean) {
  const main = AVISO_HEX
  const contrast = "rgba(0,0,0,0.87)"
  const hoverOutlinedBg = alpha(main, theme.palette.mode === "dark" ? 0.22 : 0.14)
  const hoverFilledBg = alpha(main, theme.palette.mode === "dark" ? 0.92 : 0.9)

  return selected
    ? {
        bgcolor: main,
        color: contrast,
        "& .MuiChip-icon": { color: contrast },
        "&:hover": { bgcolor: hoverFilledBg },
      }
    : {
        borderColor: main,
        color: main,
        "& .MuiChip-icon": { color: main },
        "&:hover": {
          bgcolor: hoverOutlinedBg,
          borderColor: main,
        },
      }
}

type StatusKey = "all" | "good" | "early" | "warning" | "overdue"

const StatusFilterBar: React.FC<{
  selected: StatusKey
  onChange: (s: StatusKey) => void
}> = ({ selected, onChange }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  // 🟢 Mobile: "Todos" ocupa toda la fila; el resto a 1/2
  const todosMobileSx = isMobile ? { px: 1.25, py: 0.5, flex: "1 1 100%" } : {}
  const othersMobileSx = isMobile ? { px: 1, py: 0.25, flex: "1 1 48%" } : {}

  const variantFor = (active: boolean): ChipProps["variant"] => (active ? "filled" : "outlined")
  const sizeFor = isMobile ? ("small" as const) : ("medium" as const)

  const commonProps = (key: StatusKey) =>
    ({
      onClick: () => onChange(key),
      size: sizeFor,
      variant: variantFor(selected === key),
    } satisfies Pick<ChipProps, "onClick" | "size" | "variant">)

  const primaryMain = theme.palette.primary.main
  const successMain = theme.palette.success.main
  const warningMain = theme.palette.warning.main
  const errorMain = theme.palette.error.main

  return (
    <HScroll gap={0.5}>
      {/* TODOS: ancho completo en mobile + un pelín más de presencia */}
      <Chip
        label="Todos"
        icon={<Circle size={14} />}
        sx={{
          ...todosMobileSx,
          ...paletteChipSx(theme, primaryMain, selected === "all"),
          fontWeight: 700,
        }}
        size={isMobile ? "medium" : "medium"}
        onClick={() => onChange("all")}
        variant={variantFor(selected === "all")}
      />
      <Chip
        label="Al día"
        icon={<CheckCircle size={14} />}
        sx={{ ...othersMobileSx, ...paletteChipSx(theme, successMain, selected === "good") }}
        {...commonProps("good")}
      />
      <Chip
        label="Aviso"
        icon={<Info size={14} />}
        sx={{ ...othersMobileSx, ...avisoChipSx(theme, selected === "early") }}
        {...commonProps("early")}
      />
      <Chip
        label="Pronto"
        icon={<AlertTriangle size={14} />}
        sx={{ ...othersMobileSx, ...paletteChipSx(theme, warningMain, selected === "warning") }}
        {...commonProps("warning")}
      />
      <Chip
        label="Vencidas"
        icon={<XCircle size={14} />}
        sx={{ ...othersMobileSx, ...paletteChipSx(theme, errorMain, selected === "overdue") }}
        {...commonProps("overdue")}
      />
    </HScroll>
  )
}

// ======= Página =======
export default function HomePage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<StatusKey>("all")
  const [entities, setEntities] = useState<Entity[]>([])
  const [deadlinesByEntity, setDeadlinesByEntity] = useState<Record<string, Deadline[]>>({})
  const [fieldValuesByEntity, setFieldValuesByEntity] = useState<Record<string, FieldValue[]>>({})
  const [openEntityId, setOpenEntityId] = useState<string | null>(null)
  const [viewModes, setViewModes] = useState<Record<string, "grid" | "list">>({}) // 👈 modo por tipo (key: typeName)

  useEffect(() => {
    fetch("/api/entities")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEntities(data)
      })
  }, [])

  useEffect(() => {
    const loadRelated = async () => {
      const allDeadlines: Record<string, Deadline[]> = {}
      const allFields: Record<string, FieldValue[]> = {}

      await Promise.all(
        entities.map(async (e) => {
          const [dRes, fRes] = await Promise.all([
            fetch(`/api/deadlines?entity_id=${e.id}`),
            fetch(`/api/entity-field-values?entity_id=${e.id}`),
          ])
          const rawDeadlines: Deadline[] = await dRes.json()
          const fields: FieldValue[] = await fRes.json()

          // Solo deadlines activos
          const activeDeadlines = (rawDeadlines || []).filter((d) => d.status === "active")

          // uso actual (último registro)
          const { data: latestUsageRows, error: latestUsageErr } = await supabase
            .from("usage_logs")
            .select("value, date")
            .eq("entity_id", e.id)
            .order("date", { ascending: false })
            .limit(1)

          const currentUsage: number | null = latestUsageErr ? null : latestUsageRows?.[0]?.value ?? null

          const enrichedDeadlines: Deadline[] = []

          for (const d of activeDeadlines) {
            if (d?.deadline_types?.measure_by === "usage" && d?.last_done) {
              const { data: baselineRows, error: baselineErr } = await supabase
                .from("usage_logs")
                .select("value, date")
                .eq("entity_id", e.id)
                .lte("date", d.last_done)
                .order("date", { ascending: false })
                .limit(1)

              const baselineUsage: number | undefined = baselineErr ? undefined : baselineRows?.[0]?.value ?? undefined

              enrichedDeadlines.push({
                ...d,
                current_usage: typeof currentUsage === "number" ? currentUsage : undefined,
                baseline_usage: baselineUsage,
              })
            } else if (d?.deadline_types?.measure_by === "usage") {
              enrichedDeadlines.push({
                ...d,
                current_usage: typeof currentUsage === "number" ? currentUsage : undefined,
                baseline_usage: undefined,
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

  function getDeadlineStatus(d: Deadline): DeadlineStatus {
    // Estado por FECHA para los filtros
    const today = new Date()
    const dueDate = d.next_due_date ? new Date(d.next_due_date) : null

    const diffDays = dueDate
      ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : Infinity
    let variant: DeadlineStatus["variant"] = "default"
    let icon: React.ReactNode = <CheckCircle size={16} />

    if (dueDate && diffDays < 0) {
      variant = "destructive"
      icon = <XCircle size={16} />
    } else if (dueDate && diffDays <= DEADLINE_WARNING_DAYS) {
      variant = "secondary" // 🟠 ≤30 días
      icon = <AlertTriangle size={16} />
    } else if (dueDate && diffDays <= DEADLINE_EARLY_WARNING_DAYS) {
      variant = "warning" // 🟧 ≤60 días (Aviso)
      icon = <Info size={16} />
    }

    return {
      text: dueDate ? dueDate.toISOString().split("T")[0] : "Sin fecha",
      variant,
      icon,
      daysRemaining: diffDays,
    }
  }

  // Prioridad: overdue > warning(🟠) > early(🟧) > good
  function getEntityStatus(
    deadlines: DeadlineStatus[]
  ): "good" | "early" | "warning" | "overdue" {
    if (deadlines.some((d) => d.variant === "destructive")) return "overdue"
    if (deadlines.some((d) => d.variant === "secondary")) return "warning"
    if (deadlines.some((d) => d.variant === "warning")) return "early"
    return "good"
  }

  const grouped = entities.reduce<Record<string, Entity[]>>((acc, entity) => {
    const typeName = entity.entity_types?.name || "Sin clasificar"
    if (!acc[typeName]) acc[typeName] = []
    acc[typeName].push(entity)
    return acc
  }, {})

  const allTypesSorted = useMemo(
    () =>
      Array.from(new Set(entities.map((e) => e.entity_types?.name || "Sin clasificar"))).sort(
        (a, b) => a.localeCompare(b, "es", { numeric: true, sensitivity: "base" })
      ),
    [entities]
  )

  const openEntity = openEntityId ? entities.find((e) => e.id === openEntityId) : null
  const openFields = openEntityId ? fieldValuesByEntity[openEntityId] || [] : []
  const openDeadlines = openEntityId ? deadlinesByEntity[openEntityId] || [] : []

  return (
    <Box
      sx={{
        mt: 0,
        width: "100%",
        maxWidth: "100%", // usar máximo ancho en todos los modos
        px: { xs: 1, sm: 2, md: 3 }, // leve respiro
        mx: "auto",
      }}
    >
      {/* ===== Barra de filtros sticky ===== */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "background.default",
          borderBottom: "1px solid",
          borderColor: "divider",
          pt: 0.25,
          pb: 0.25,
          mb: 0.5,
          px: 0,
        }}
      >
        {/* Estado: compacta en mobile, colores normalizados y tipos seguros */}
        <StatusFilterBar selected={selectedStatus} onChange={setSelectedStatus} />

        {/* Tipos: wrap/scroll compacto con colores por defecto del tema */}
        <HScroll gap={0.5}>
          {allTypesSorted.map((type) => {
            const variant: ChipProps["variant"] = selectedType === type ? "filled" : "outlined"
            return (
              <Chip
                key={type}
                label={type}
                onClick={() => setSelectedType(type === selectedType ? null : type)}
                variant={variant}
                color={selectedType === type ? "primary" : "default"}
                size={isMobile ? "small" : "medium"}
                sx={
                  selectedType === type
                    ? paletteChipSx(theme, theme.palette.primary.main, true)
                    : paletteChipSx(theme, theme.palette.primary.main, false)
                }
              />
            )
          })}
        </HScroll>
      </Box>

      {Object.entries(grouped)
        .filter(([type]) => !selectedType || type === selectedType)
        .map(([typeName, group]) => {
          // filtrar por estado usando la misma lógica que antes
          const entitiesToShow = group.filter((entity) => {
            const deadlinesAll = deadlinesByEntity[entity.id] || []
            const deadlinesActive = deadlinesAll.filter((d) => d.status === "active")
            const deadlineWithStatus = deadlinesActive.map((d) => ({
              ...d,
              status: getDeadlineStatus(d),
            }))
            const entityStatus = getEntityStatus(
              deadlineWithStatus.map((d) => d.status as unknown as DeadlineStatus)
            )
            return selectedStatus === "all" || entityStatus === selectedStatus
          })

          const currentView = viewModes[typeName] ?? "grid"

          return (
            <Box key={typeName} sx={{ mb: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1, px: 1 }}>
                <Typography variant="h6" sx={{ color: "primary.main" }}>
                  {typeName}
                </Typography>
                <IconButton
                  aria-label={`Cambiar a vista ${currentView === "grid" ? "lista" : "tarjetas"}`}
                  title={`Cambiar a vista ${currentView === "grid" ? "lista" : "tarjetas"}`}
                  onClick={() =>
                    setViewModes((prev) => ({
                      ...prev,
                      [typeName]: prev[typeName] === "list" ? "grid" : "list",
                    }))
                  }
                  sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
                >
                  {currentView === "list" ? <LayoutGrid size={18} /> : <List size={18} />}
                </IconButton>
              </Box>

              <EntityCollection
                entities={entitiesToShow}
                deadlinesByEntity={deadlinesByEntity}
                fieldValuesByEntity={fieldValuesByEntity}
                viewMode={currentView}
                onOpenEntity={(id) => setOpenEntityId(id)}
              />
            </Box>
          )
        })}

      {/* Modal de ficha */}
      <Dialog
        open={!!openEntityId}
        onClose={() => setOpenEntityId(null)}
        maxWidth={isMobile ? "xs" : "sm"}
        fullWidth
      >
        <DialogTitle sx={{ display:"flex", justifyContent: "space-between", alignItems: "center" }}>
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
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Tag size={16} /> Tipo de entidad
                </Typography>
                <Typography variant="body2" fontWeight="500">
                  {openEntity.entity_types?.name || "Sin tipo"}
                </Typography>
              </Box>
              {openFields.length > 0 && (
                <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Info size={16} /> Información personalizada
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
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Calendar size={16} /> Vencimientos
                  </Typography>
                  <Box component="ul" sx={{ listStyle: "none", pl: 0, mt: 1 }}>
                    {openDeadlines.map((d) => (
                      <li key={d.id}>
                        <Box fontSize={13} py={1} sx={{ borderBottom: "1px dashed #ccc" }}>
                          <Typography fontWeight={500}>{d.deadline_types.name}</Typography>
                          <Box display="flex" flexDirection="column" gap={0.5} mt={0.5}>
                            <Typography variant="body2">
                              Última realización: {d.last_done || "—"}
                            </Typography>
                            <Typography variant="body2">
                              Fecha de vencimiento: {d.next_due_date || "—"}
                            </Typography>
                            {d.deadline_types.measure_by === "usage" && (
                              <>
                                <Typography variant="body2">
                                  Frecuencia: {d.frequency} {d.frequency_unit}
                                </Typography>
                                <Typography variant="body2">
                                  Promedio diario: {d.usage_daily_average ?? "—"}
                                </Typography>
                                <Typography variant="body2">
                                  Uso actual:{" "}
                                  {typeof d.current_usage === "number" ? d.current_usage : "—"}
                                </Typography>
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
