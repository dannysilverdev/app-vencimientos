"use client"

import { useEffect, useState } from "react"
import {
  Chip,
  Stack,
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
  Clock,
  Info,
  Tag,
  User
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import EntityCard from "@/components/EntityCard"

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
          const [dRes, fRes] = await Promise.all([
            fetch(`/api/deadlines?entity_id=${e.id}`),
            fetch(`/api/entity-field-values?entity_id=${e.id}`)
          ])
          allDeadlines[e.id] = await dRes.json()
          allFields[e.id] = await fRes.json()
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
    const today = new Date()
    const last = new Date(d.last_done)
    const estimated = new Date(last)

    if (d.deadline_types.measure_by === "date") {
      estimated.setDate(estimated.getDate() + d.frequency)
    } else {
      const daily = d.usage_daily_average || 0
      const daysUntilDue = daily > 0 ? d.frequency / daily : 0
      estimated.setDate(estimated.getDate() + Math.round(daysUntilDue))
    }

    const diffDays = Math.ceil((estimated.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    let variant: DeadlineStatus["variant"] = "default"
    let icon: React.ReactNode = <CheckCircle size={16} />

    if (diffDays < 0) {
      variant = "destructive"
      icon = <XCircle size={16} />
    } else if (diffDays <= d.frequency * 0.3) {
      variant = "secondary"
      icon = <AlertTriangle size={16} />
    }

    return {
      text: estimated.toISOString().split("T")[0],
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

  const grouped = entities.reduce<Record<string, Entity[]>>((acc, entity) => {
    const typeName = entity.entity_types?.name || "Sin clasificar"
    if (!acc[typeName]) acc[typeName] = []
    acc[typeName].push(entity)
    return acc
  }, {})

  const allTypes = Array.from(new Set(entities.map(e => e.entity_types?.name || "Sin clasificar")))

  const openEntity = openEntityId ? entities.find(e => e.id === openEntityId) : null
  const openFields = openEntityId ? fieldValuesByEntity[openEntityId] || [] : []
  const openDeadlines = openEntityId ? deadlinesByEntity[openEntityId] || [] : []

  return (
    <Box sx={{ mt: 4, width: "100%", px: { xs: 0, sm: 3 }, maxWidth: 1200, mx: "auto" }}>
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
        {allTypes.map(type => (
          <Chip
            key={type}
            label={type}
            onClick={() => setSelectedType(type === selectedType ? null : type)}
            color={selectedType === type ? "primary" : "default"}
            variant="outlined"
          />
        ))}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Chip label="Todos" onClick={() => setSelectedStatus("all")} color={selectedStatus === "all" ? "primary" : "default"} icon={<Circle style={{ fontSize: 12 }} />} />
        <Chip label="Al día" onClick={() => setSelectedStatus("good")} color={selectedStatus === "good" ? "success" : "default"} icon={<CheckCircle size={14} />} />
        <Chip label="Pronto" onClick={() => setSelectedStatus("warning")} color={selectedStatus === "warning" ? "warning" : "default"} icon={<AlertTriangle size={14} />} />
        <Chip label="Vencidas" onClick={() => setSelectedStatus("overdue")} color={selectedStatus === "overdue" ? "error" : "default"} icon={<XCircle size={14} />} />
      </Stack>

      {Object.entries(grouped)
        .filter(([type]) => !selectedType || type === selectedType)
        .map(([typeName, group]) => (
          <Box key={typeName} sx={{ mb: 5 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>{typeName}</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center" }}>
              {group.map(entity => {
                const deadlines = deadlinesByEntity[entity.id] || []
                const deadlineWithStatus = deadlines.map(d => ({ ...d, status: getDeadlineStatus(d) }))
                const entityStatus = getEntityStatus(deadlineWithStatus.map(d => d.status))
                if (selectedStatus !== "all" && entityStatus !== selectedStatus) return null

                return (
                  <EntityCard
                  key={entity.id}
                  entity={entity}
                  deadlines={deadlineWithStatus}
                  fieldValues={fieldValuesByEntity[entity.id] || []}
                  onClick={() => setOpenEntityId(entity.id)}
                />

                )
              })}
            </Box>
          </Box>
        ))}

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
              size="small"
              title="Editar entidad"
            >
              <Pencil size={18} />
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
                  <Tag size={16} />
                  Tipo de entidad
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
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Calendar size={16} />
                    Vencimientos
                  </Typography>
                  <Box component="ul" sx={{ listStyle: "none", pl: 0, mt: 1 }}>
                    {openDeadlines.map((d) => {
                      const status = getDeadlineStatus(d)
                      return (
                        <li key={d.id}>
                          <Box display="flex" justifyContent="space-between" fontSize={13} py={0.5}>
                            <Typography>{d.deadline_types.name}</Typography>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Clock size={12} />
                              <Typography variant="caption">{status.text}</Typography>
                            </Box>
                          </Box>
                        </li>
                      )
                    })}
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
