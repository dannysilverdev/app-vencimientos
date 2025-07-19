"use client"

import { useEffect, useState } from "react"
import {
  Container,
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
  Circle,
  Pencil
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

type Entity = {
  id: string
  name: string
  type_id: string
  entity_types?: {
    name: string
  }
}

type FieldValue = {
  id: string
  value: string
  field_id: string
  entity_fields: {
    name: string
    field_type: string
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
  const [good, setGood] = useState(0)
  const [warning, setWarning] = useState(0)
  const [overdue, setOverdue] = useState(0)

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

  useEffect(() => {
    let goodCount = 0
    let warningCount = 0
    let overdueCount = 0

    entities.forEach(entity => {
      const deadlines = deadlinesByEntity[entity.id] || []
      if (deadlines.length > 0) {
        const status = getDeadlineStatus(deadlines[0])
        if (status.variant === "destructive") overdueCount++
        else if (status.variant === "secondary") warningCount++
        else goodCount++
      }
    })

    setGood(goodCount)
    setWarning(warningCount)
    setOverdue(overdueCount)
  }, [entities, deadlinesByEntity])

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

  const grouped = entities.reduce<Record<string, Entity[]>>((acc, entity) => {
    const typeName = entity.entity_types?.name || "Sin clasificar"
    if (!acc[typeName]) acc[typeName] = []
    acc[typeName].push(entity)
    return acc
  }, {})

  const allTypes = Array.from(new Set(entities.map(e => e.entity_types?.name || "Sin clasificar")))

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

      <Typography variant="h4" gutterBottom>Entidades registradas</Typography>

      {Object.entries(grouped)
        .filter(([type]) => !selectedType || type === selectedType)
        .map(([typeName, group]) => (
          <Box key={typeName} sx={{ mb: 5 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>{typeName}</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center" }}>
              {group.map(entity => {
                const deadlines = deadlinesByEntity[entity.id] || []
                const status = deadlines.length > 0 ? getDeadlineStatus(deadlines[0]) : null

                return (
                  <Box
                    key={entity.id}
                    sx={{
                      flex: { xs: "1 1 100%", sm: "1 1 300px" },
                      maxWidth: { xs: "100%", sm: 360 },
                      border: "1px solid #ddd",
                      borderRadius: 3,
                      p: 2,
                      cursor: "pointer",
                      transition: "box-shadow 0.2s",
                      ":hover": { boxShadow: 6 }
                    }}
                    onClick={() => setOpenEntityId(entity.id)}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }} noWrap gutterBottom>
                      {entity.name}
                    </Typography>

                    {status && (
                      <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
                        {status.icon}
                        <Typography variant="body2">{status.text}</Typography>
                      </Box>
                    )}
                  </Box>
                )
              })}
            </Box>
          </Box>
        ))}

      <Dialog open={!!openEntityId} onClose={() => setOpenEntityId(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Ficha de entidad
          {openEntityId && (
            <IconButton
              href={`/entities/${openEntityId}/edit`}
              component="a"
              size="small"
              sx={{ ml: 2 }}
              title="Editar entidad"
            >
              <Pencil size={18} />
            </IconButton>
          )}
        </DialogTitle>

        <DialogContent dividers>
          {openEntityId && (() => {
            const entity = entities.find(e => e.id === openEntityId)
            const fields = fieldValuesByEntity[openEntityId] || []
            const deadlines = deadlinesByEntity[openEntityId] || []

            return (
              <>
                <Typography variant="h6">{entity?.name}</Typography>
                <Typography variant="body2" gutterBottom>
                  Tipo: {entity?.entity_types?.name || "Sin tipo"}
                </Typography>

                {fields.length > 0 && (
                  <>
                    <Typography variant="subtitle1" sx={{ mt: 2 }}>Información personalizada</Typography>
                    {fields.map(f => (
                      <Typography key={f.id} variant="body2">
                        • {f.entity_fields.name}: {f.value || "—"}
                      </Typography>
                    ))}
                  </>
                )}

                {deadlines.length > 0 && (
                  <>
                    <Typography variant="subtitle1" sx={{ mt: 2 }}>Vencimientos</Typography>
                    {deadlines.map(d => {
                      const status = getDeadlineStatus(d)
                      return (
                        <Box key={d.id} sx={{ mb: 1 }}>
                          <Typography variant="body2">
                            • {d.deadline_types.name} — {status.text} ({status.variant === "destructive" ? "Vencido" : status.variant === "secondary" ? "Próximo" : "Al día"})
                          </Typography>
                        </Box>
                      )
                    })}
                  </>
                )}
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </Box>
  )
}