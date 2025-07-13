'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material'
import Link from 'next/link'
import CircleIcon from '@mui/icons-material/Circle'
import React from 'react'

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

type Entity = {
  id: string
  name: string
}

export default function EntityDetailPage() {
  const params = useParams()
  const entityId = params?.id as string

  const [entity, setEntity] = useState<Entity | null>(null)
  const [fieldValues, setFieldValues] = useState<FieldValue[]>([])
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [hasDeadlineTypes, setHasDeadlineTypes] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editedName, setEditedName] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!entityId) return

      const [resEntity, resFields, resDeadlines, resTypes] = await Promise.all([
        fetch(`/api/entities/${entityId}`),
        fetch(`/api/entity-field-values?entity_id=${entityId}`),
        fetch(`/api/deadlines?entity_id=${entityId}`),
        fetch(`/api/deadline-types`)
      ])

      const [entityData, fieldData, deadlineData, typeData] = await Promise.all([
        resEntity.json(),
        resFields.json(),
        resDeadlines.json(),
        resTypes.json()
      ])

      setEntity(entityData)
      setFieldValues(fieldData)
      setDeadlines(deadlineData)
      setHasDeadlineTypes(Array.isArray(typeData) && typeData.length > 0)
      setLoading(false)
    }

    load()
  }, [entityId])

  function getDeadlineStatus(d: Deadline): 'green' | 'yellow' | 'red' {
    const today = new Date()
    const last = new Date(d.last_done)

    let estimatedDue: Date

    if (d.deadline_types.measure_by === 'date') {
      estimatedDue = new Date(last)
      estimatedDue.setDate(estimatedDue.getDate() + d.frequency)
    } else {
      const daily = d.usage_daily_average || 0
      const daysUntilDue = daily > 0 ? d.frequency / daily : 0
      estimatedDue = new Date(last)
      estimatedDue.setDate(estimatedDue.getDate() + Math.round(daysUntilDue))
    }

    const diffMs = estimatedDue.getTime() - today.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'red'
    if (diffDays <= d.frequency * 0.3) return 'yellow'
    return 'green'
  }

  function getEstimatedDate(d: Deadline): string | null {
    const last = new Date(d.last_done)

    if (d.deadline_types.measure_by === 'date') {
      const est = new Date(last)
      est.setDate(est.getDate() + d.frequency)
      return est.toISOString().split('T')[0]
    } else {
      const daily = d.usage_daily_average || 0
      const daysUntilDue = daily > 0 ? d.frequency / daily : 0
      const est = new Date(last)
      est.setDate(est.getDate() + Math.round(daysUntilDue))
      return est.toISOString().split('T')[0]
    }
  }

  const handleEditClick = () => {
    if (entity) {
      setEditedName(entity.name)
      setEditDialogOpen(true)
    }
  }

  const handleSave = async () => {
    const res = await fetch(`/api/entities/${entityId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editedName })
    })

    if (res.ok && entity) {
      setEntity({ ...entity, name: editedName })
      setEditDialogOpen(false)
    }
  }

  if (loading || !entity) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>Cargando entidad...</Typography>
      </Container>
    )
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">{entity.name}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={handleEditClick}>
            ✏️ Renombrar
          </Button>
          <Link href={`/entities/${entityId}/edit-info`} passHref>
            <Button variant="outlined">📝 Editar información</Button>
          </Link>
          {hasDeadlineTypes ? (
            <Link href={`/entities/${entityId}/deadlines/new`} passHref>
              <Button variant="outlined">+ Agregar vencimiento</Button>
            </Link>
          ) : hasDeadlineTypes === false ? (
            <Alert severity="warning" sx={{ ml: 2 }}>
              Debes crear al menos un tipo de vencimiento para poder asignar uno.
            </Alert>
          ) : null}
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Campos personalizados</Typography>
          {fieldValues.length === 0 ? (
            <Typography variant="body2">No hay información personalizada aún.</Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', rowGap: 1, columnGap: 2 }}>
              {fieldValues.map((fv) => (
                <React.Fragment key={fv.id}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {fv.entity_fields.name}
                  </Typography>
                  <Typography variant="body2">
                    {fv.value || '—'}
                  </Typography>
                </React.Fragment>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6">Vencimientos</Typography>
          {deadlines.length === 0 ? (
            <Typography variant="body2">Sin vencimientos asignados aún.</Typography>
          ) : (
            <List dense>
              {deadlines.map((d) => {
                const status = getDeadlineStatus(d)
                const estimated = getEstimatedDate(d)

                return (
                  <ListItem key={d.id} sx={{ alignItems: 'flex-start' }}>
                    <CircleIcon
                      fontSize="small"
                      sx={{
                        color:
                          status === 'red'
                            ? 'error.main'
                            : status === 'yellow'
                            ? 'warning.main'
                            : 'success.main',
                        mt: '4px',
                        mr: 1
                      }}
                    />
                    <ListItemText
                      primary={d.deadline_types.name}
                      secondary={
                        <>
                          {d.deadline_types.measure_by === 'date'
                            ? `Último: ${d.last_done} • Frecuencia: ${d.frequency} días`
                            : `Último: ${d.last_done} • Cada ${d.frequency} ${d.frequency_unit} • Promedio diario: ${d.usage_daily_average ?? '—'}`}
                          <br />
                          Fecha estimada de vencimiento: <strong>{estimated}</strong>
                        </>
                      }
                    />
                  </ListItem>
                )
              })}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para renombrar entidad */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Editar nombre de la entidad</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            label="Nombre"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
