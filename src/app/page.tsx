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
  IconButton,
  Button
} from "@mui/material"
import Link from "next/link"
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Circle,
  Pencil
} from "lucide-react"

type Entity = {
  id: string
  name: string
  type_id: string
  entity_types?: {
    name: string
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
    const loadDeadlines = async () => {
      const allDeadlines: Record<string, Deadline[]> = {}
      await Promise.all(
        entities.map(async (e) => {
          const res = await fetch(`/api/deadlines?entity_id=${e.id}`)
          const data = await res.json()
          allDeadlines[e.id] = data
        })
      )
      setDeadlinesByEntity(allDeadlines)
    }

    if (entities.length > 0) {
      loadDeadlines()
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

  const selectedEntity = entities.find(e => e.id === openEntityId)
  const selectedDeadlines = openEntityId ? deadlinesByEntity[openEntityId] || [] : []

  return (
    <Container sx={{ mt: 4, maxWidth: "100%" }}>
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

      <Typography variant="h4" gutterBottom>Panel de monitoreo</Typography>

      {Object.entries(grouped)
        .filter(([type]) => !selectedType || type === selectedType)
        .map(([typeName, group]) => (
          <Box key={typeName} sx={{ mb: 5 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>{typeName}</Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {group
                .filter(entity => {
                  if (selectedStatus === "all") return true
                  const d = deadlinesByEntity[entity.id]?.[0]
                  if (!d) return false
                  const variant = getDeadlineStatus(d).variant
                  return (
                    (selectedStatus === "good" && variant === "default") ||
                    (selectedStatus === "warning" && variant === "secondary") ||
                    (selectedStatus === "overdue" && variant === "destructive")
                  )
                })
                .map(entity => {
                  const deadlines = deadlinesByEntity[entity.id] || []
                  const status = deadlines.length > 0 ? getDeadlineStatus(deadlines[0]) : null

                  return (
                    <Box
                      key={entity.id}
                      sx={{
                        flex: "1 1 300px",
                        maxWidth: 360,
                        border: "1px solid #ddd",
                        borderRadius: 3,
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        height: "100%",
                        cursor: "pointer",
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
        <DialogTitle>
          Ficha de entidad
          {selectedEntity && (
            <Link href={`/entities/${selectedEntity.id}/edit`} passHref>
              <IconButton sx={{ ml: 1 }} size="small">
                <Pencil size={18} />
              </IconButton>
            </Link>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {selectedEntity && (
            <Box>
              <Typography variant="h6">{selectedEntity.name}</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                Tipo: {selectedEntity.entity_types?.name || "Sin tipo"}
              </Typography>
              {selectedDeadlines.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Sin vencimientos.</Typography>
              ) : (
                selectedDeadlines.map(d => {
                  const status = getDeadlineStatus(d)
                  return (
                    <Box key={d.id} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">{d.deadline_types.name}</Typography>
                      <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {status.icon} Estimado: {status.text}
                      </Typography>
                    </Box>
                  )
                })
              )}
            </Box>
          )}
        </DialogContent>
        <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={() => setOpenEntityId(null)}>Cerrar</Button>
        </Box>
      </Dialog>
    </Container>
  )
}
