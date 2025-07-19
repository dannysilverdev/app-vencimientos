'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Chip,
  Box,
  Stack,
  Button,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Switch,
  FormControlLabel
} from "@mui/material"
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  FileCopy as FileIcon,
  Add as PlusIcon,
  Circle as CircleIcon,
  Save as SaveIcon,
  Warning as WarningIcon
} from "@mui/icons-material"
import UsageLogFormForEntity from '@/components/UsageLogFormForEntity'

type Field = {
  id: string
  name: string
  field_type: 'text' | 'number' | 'date'
  is_required: boolean
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

type Entity = {
  id: string
  name: string
  type_id: string
  tracks_usage?: boolean
}

type EntityType = {
  id: string
  name: string
}

type EditingDeadlineValues = {
  frequency?: number | ''
  last_done?: string
  usage_daily_average?: number | null
}

export default function EditEntityPage() {
  const params = useParams()
  const router = useRouter()
  const entityId = params?.id as string

  const [entity, setEntity] = useState<Entity | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [fields, setFields] = useState<Field[]>([])
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([])
  const [editedName, setEditedName] = useState('')
  const [editedTypeId, setEditedTypeId] = useState('')
  const [tracksUsage, setTracksUsage] = useState(false)
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [hasDeadlineTypes, setHasDeadlineTypes] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingDeadlineId, setEditingDeadlineId] = useState<string | null>(null)
  const [editingDeadlineValues, setEditingDeadlineValues] = useState<EditingDeadlineValues>({})

  useEffect(() => {
    const loadAll = async () => {
      if (!entityId) return

      try {
        const [resEntity, resTypes, resDeadlines, resDeadlineTypes] = await Promise.all([
          fetch(`/api/entities/${entityId}`),
          fetch(`/api/entity-types`),
          fetch(`/api/deadlines?entity_id=${entityId}`),
          fetch(`/api/deadline-types`)
        ])

        const [entityData, typeData, deadlineData, deadlineTypesData] = await Promise.all([
          resEntity.json(),
          resTypes.json(),
          resDeadlines.json(),
          resDeadlineTypes.json()
        ])

        setEntity(entityData)
        setEditedName(entityData.name)
        setEditedTypeId(entityData.type_id)
        setTracksUsage(entityData.tracks_usage ?? false)
        setEntityTypes(typeData)
        setDeadlines(deadlineData)
        setHasDeadlineTypes(Array.isArray(deadlineTypesData) && deadlineTypesData.length > 0)

        const [resFields, resValues] = await Promise.all([
          fetch(`/api/entity-fields?entity_type_id=${entityData.type_id}`),
          fetch(`/api/entity-field-values?entity_id=${entityId}`)
        ])

        const fieldData = await resFields.json()
        const valueData = await resValues.json()

        setFields(fieldData)
        const valueMap: Record<string, string> = {}
        valueData.forEach((v: { field_id: string, value: string }) => {
          valueMap[v.field_id] = v.value
        })
        setFieldValues(valueMap)
      } catch (err) {
        console.error(err)
        setError('Error al cargar los datos.')
      } finally {
        setLoading(false)
      }
    }

    loadAll()
  }, [entityId])

  const handleSubmit = async () => {
    try {
      await fetch(`/api/entities/${entityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedName,
          type_id: editedTypeId,
          tracks_usage: tracksUsage
        })
      })

      await fetch('/api/entity-field-values/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_id: entityId,
          values: fields.map(f => ({
            field_id: f.id,
            value: fieldValues[f.id] || ''
          }))
        })
      })

      router.push('/manage')
    } catch (err) {
      console.error(err)
      setError('Error al guardar los cambios.')
    }
  }

  const handleEditDeadline = (d: Deadline) => {
    setEditingDeadlineId(d.id)
    setEditingDeadlineValues({
      frequency: d.frequency,
      last_done: d.last_done,
      usage_daily_average: d.usage_daily_average
    })
  }

  const handleSaveDeadline = async () => {
    if (!editingDeadlineId) return

    const payload = {
      frequency: editingDeadlineValues.frequency ?? 0,
      last_done: editingDeadlineValues.last_done ?? '',
      usage_daily_average: editingDeadlineValues.usage_daily_average ?? null
    }

    try {
      const res = await fetch(`/api/deadlines/${editingDeadlineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Error al guardar vencimiento')

      const refreshed = await fetch(`/api/deadlines?entity_id=${entityId}`)
      const newData = await refreshed.json()
      setDeadlines(newData)

      setEditingDeadlineId(null)
      setEditingDeadlineValues({})
    } catch (error) {
      console.error('Error actualizando vencimiento:', error)
      setError('No se pudo guardar el vencimiento. Revisa los datos.')
    }
  }

  const getDeadlineStatus = (d: Deadline): 'red' | 'yellow' | 'green' => {
    const today = new Date()
    const last = new Date(d.last_done)
    let estimated = new Date(last)
    if (d.deadline_types.measure_by === 'date') {
      estimated.setDate(estimated.getDate() + d.frequency)
    } else {
      const daily = d.usage_daily_average || 0
      const daysUntilDue = daily > 0 ? d.frequency / daily : 0
      estimated.setDate(estimated.getDate() + Math.round(daysUntilDue))
    }
    const diffMs = estimated.getTime() - today.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return 'red'
    if (diffDays <= d.frequency * 0.3) return 'yellow'
    return 'green'
  }

  const getEstimatedDate = (d: Deadline): string => {
    const last = new Date(d.last_done)
    const est = new Date(last)
    if (d.deadline_types.measure_by === 'date') {
      est.setDate(est.getDate() + d.frequency)
    } else {
      const daily = d.usage_daily_average || 0
      const daysUntilDue = daily > 0 ? d.frequency / daily : 0
      est.setDate(est.getDate() + Math.round(daysUntilDue))
    }
    return est.toISOString().split('T')[0]
  }

  if (loading || !entity) return <Container sx={{ mt: 4 }}><Typography>Cargando...</Typography></Container>

  return (
    <Container sx={{ mt: 4, maxWidth: 600 }}>
      <Typography variant="h5" gutterBottom>Editar entidad</Typography>

      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      <Box display="flex" flexDirection="column" gap={2}>
        <TextField label="Nombre" value={editedName} onChange={(e) => setEditedName(e.target.value)} fullWidth />

        <FormControl fullWidth>
          <InputLabel>Tipo de entidad</InputLabel>
          <Select value={editedTypeId} onChange={(e) => setEditedTypeId(e.target.value)} label="Tipo de entidad">
            {entityTypes.map(type => (
              <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {fields.length > 0 && (
          <>
            <Typography variant="h6">Campos personalizados</Typography>
            {fields.map(field => (
              <TextField
                key={field.id}
                label={field.name}
                type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                InputLabelProps={field.field_type === 'date' ? { shrink: true } : undefined}
                value={fieldValues[field.id] || ''}
                onChange={(e) =>
                  setFieldValues((prev: Record<string, string>) => ({
                    ...prev,
                    [field.id]: e.target.value
                  }))
                }
                fullWidth
              />
            ))}
          </>
        )}

        <Box mt={3}>
          <Button variant="contained" onClick={handleSubmit} startIcon={<SaveIcon />}>Guardar</Button>
        </Box>

        <FormControlLabel
          control={<Switch checked={tracksUsage} onChange={(e) => setTracksUsage(e.target.checked)} />}
          label="¿Registrar uso acumulado?"
        />

        {tracksUsage && entity?.id && (
          <Card sx={{ mt: 5 }}>
            <CardHeader title="Registro de uso acumulado" avatar={<FileIcon />} />
            <CardContent>
              <UsageLogFormForEntity entityId={entity.id} />
            </CardContent>
          </Card>
        )}

        <Card sx={{ mt: 5 }}>
          <CardHeader title="Vencimientos" avatar={<CalendarIcon />} />
          <CardContent>
            {deadlines.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Sin vencimientos asignados aún.</Typography>
            ) : (
              <Stack spacing={2}>
                {deadlines.map((d) => {
                  const status = getDeadlineStatus(d)
                  const estimated = getEstimatedDate(d)
                  const color = status === 'red' ? 'error.main' : status === 'yellow' ? 'warning.main' : 'success.main'

                  return (
                    <Box key={d.id} display="flex" gap={2} alignItems="start" p={2} border={1} borderColor="divider" borderRadius={2}>
                      <CircleIcon sx={{ fontSize: 12, color, mt: '4px' }} />
                      <Box flex={1}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle1">{d.deadline_types.name}</Typography>
                          <Stack direction="row" spacing={1}>
                            <Chip
                              label={status === 'red' ? 'Vencido' : status === 'yellow' ? 'Próximo' : 'Al día'}
                              color={status === 'red' ? 'error' : status === 'yellow' ? 'warning' : 'success'}
                              size="small"
                            />
                            <Button size="small" variant="outlined" onClick={() => handleEditDeadline(d)}>Editar</Button>
                          </Stack>
                        </Box>
                        {editingDeadlineId === d.id ? (
                          <Box>
                            <TextField
                              label="Frecuencia"
                              type="number"
                              value={editingDeadlineValues.frequency !== undefined ? String(editingDeadlineValues.frequency) : ''}
                              onChange={(e) => {
                                const value = e.target.value
                                setEditingDeadlineValues((prev: EditingDeadlineValues) => ({
                                  ...prev,
                                  frequency: value === '' ? '' : parseInt(value)
                                }))
                              }}
                              fullWidth sx={{ mt: 1 }}
                            />
                            <TextField
                              label="Último realizado"
                              type="date"
                              value={editingDeadlineValues.last_done || ''}
                              onChange={(e) => setEditingDeadlineValues((prev) => ({ ...prev, last_done: e.target.value }))}
                              InputLabelProps={{ shrink: true }}
                              fullWidth sx={{ mt: 1 }}
                            />
                            {d.deadline_types.measure_by === 'usage' && (
                              <TextField
                                label="Promedio diario"
                                type="number"
                                value={editingDeadlineValues.usage_daily_average !== undefined ? String(editingDeadlineValues.usage_daily_average) : ''}
                                onChange={(e) => {
                                  const value = e.target.value
                                  setEditingDeadlineValues((prev: EditingDeadlineValues) => ({
                                    ...prev,
                                    usage_daily_average: value === '' ? null : parseFloat(value)
                                  }))
                                }}
                                fullWidth sx={{ mt: 1 }}
                              />
                            )}
                            <Box mt={1}>
                              <Button onClick={handleSaveDeadline} variant="contained" size="small">Guardar cambios</Button>
                            </Box>
                          </Box>
                        ) : (
                          <>
                            <Typography variant="body2" color="text.secondary">
                              {d.deadline_types.measure_by === 'date'
                                ? `Último: ${d.last_done} • Frecuencia: ${d.frequency} días`
                                : `Último: ${d.last_done} • Cada ${d.frequency} ${d.frequency_unit} • Promedio diario: ${d.usage_daily_average ?? '—'}`}
                            </Typography>
                            <Typography variant="body2">Fecha estimada de vencimiento: <strong>{estimated}</strong></Typography>
                          </>
                        )}
                      </Box>
                    </Box>
                  )
                })}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}
