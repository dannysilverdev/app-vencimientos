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
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
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

export default function EditEntityPage() {
  const params = useParams()
  const router = useRouter()
  const entityId = params?.id as string

  const [entity, setEntity] = useState<any>(null)
  const [editedName, setEditedName] = useState('')
  const [editedTypeId, setEditedTypeId] = useState('')
  const [tracksUsage, setTracksUsage] = useState(false)
  const [entityTypes, setEntityTypes] = useState<any[]>([])
  const [deadlines, setDeadlines] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [openAddDeadline, setOpenAddDeadline] = useState(false)
  const [newDeadlineTypeId, setNewDeadlineTypeId] = useState('')
  const [newFrequency, setNewFrequency] = useState('')
  const [newLastDone, setNewLastDone] = useState('')
  const [newFrequencyUnit, setNewFrequencyUnit] = useState('')
  const [newDailyAverage, setNewDailyAverage] = useState('')
  const [deadlineTypes, setDeadlineTypes] = useState<any[]>([])

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
        setDeadlineTypes(deadlineTypesData)
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

      router.push('/manage')
    } catch (err) {
      console.error(err)
      setError('Error al guardar los cambios.')
    }
  }

  const handleAddDeadline = async () => {
    try {
      if (!newDeadlineTypeId || !newFrequency || !newLastDone) {
        setError("Completa todos los campos requeridos.")
        return
      }

      const selectedType = deadlineTypes.find((t) => t.id === newDeadlineTypeId)
      const measureByUsage = selectedType?.measure_by === 'usage'

      if (measureByUsage && (!newFrequencyUnit || !newDailyAverage)) {
        setError("Debes ingresar unidad y promedio diario para vencimientos por uso.")
        return
      }

      const payload: any = {
        entity_id: entityId,
        type_id: newDeadlineTypeId,
        frequency: parseInt(newFrequency),
        last_done: newLastDone,
        frequency_unit: measureByUsage ? newFrequencyUnit : null,
        usage_daily_average: measureByUsage ? parseFloat(newDailyAverage) : null
      }

      const res = await fetch(`/api/deadlines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.clone().json().catch(() => null)
        const msg = errorData?.error || errorData?.message || await res.text() || 'Error al guardar vencimiento'
        throw new Error(msg)
      }

      const refreshed = await fetch(`/api/deadlines?entity_id=${entityId}`)
      const newData = await refreshed.json()
      setDeadlines(newData)

      setOpenAddDeadline(false)
      setNewDeadlineTypeId('')
      setNewFrequency('')
      setNewLastDone('')
      setNewFrequencyUnit('')
      setNewDailyAverage('')
      setError(null)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'No se pudo guardar el nuevo vencimiento.')
    }
  }

  const handleDeleteDeadline = async (deadlineId: string) => {
    const confirmed = window.confirm("¿Seguro que deseas eliminar este vencimiento?")
    if (!confirmed) return

    try {
      const res = await fetch(`/api/deadlines/${deadlineId}`, { method: 'DELETE' })
      if (!res.ok) {
        throw new Error("Error al eliminar el vencimiento.")
      }
      setDeadlines(prev => prev.filter(d => d.id !== deadlineId))
    } catch (err: any) {
      console.error(err)
      setError(err.message || "No se pudo eliminar el vencimiento.")
    }
  }

  if (loading || !entity) return <Container sx={{ mt: 4 }}><Typography>Cargando...</Typography></Container>

  return (
    <Container sx={{ mt: 4, maxWidth: 600 }}>
      <Typography variant="h5" gutterBottom>Editar entidad</Typography>

      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      <TextField label="Nombre" value={editedName} onChange={(e) => setEditedName(e.target.value)} fullWidth sx={{ mb: 2 }} />

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Tipo de entidad</InputLabel>
        <Select value={editedTypeId} onChange={(e) => setEditedTypeId(e.target.value)} label="Tipo de entidad">
          {entityTypes.map(type => (
            <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControlLabel
        control={<Switch checked={tracksUsage} onChange={(e) => setTracksUsage(e.target.checked)} />}
        label="¿Registrar uso acumulado?"
        sx={{ mb: 2 }}
      />

      <Box mt={2} mb={3}>
        <Button variant="contained" onClick={handleSubmit} startIcon={<SaveIcon />}>Guardar</Button>
      </Box>

      {tracksUsage && entity?.id && (
        <Card sx={{ mb: 4 }}>
          <CardHeader title="Registro de uso acumulado" avatar={<FileIcon />} />
          <CardContent>
            <UsageLogFormForEntity entityId={entity.id} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Vencimientos"
          avatar={<CalendarIcon />}
          action={<Button onClick={() => setOpenAddDeadline(true)} startIcon={<PlusIcon />} size="small">Agregar</Button>}
        />
        <CardContent>
          {deadlines.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Sin vencimientos asignados aún.</Typography>
          ) : (
            <Stack spacing={2}>
              {deadlines.map((d) => (
                <Box key={d.id} display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography>{d.deadline_types.name}</Typography>
                    {d.frequency && <Typography variant="body2" color="text.secondary">Cada {d.frequency} {d.frequency_unit || 'días'}</Typography>}
                    {d.usage_daily_average && <Typography variant="body2" color="text.secondary">Promedio diario: {d.usage_daily_average}</Typography>}
                  </Box>
                  <IconButton onClick={() => handleDeleteDeadline(d.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Dialog open={openAddDeadline} onClose={() => setOpenAddDeadline(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar nuevo vencimiento</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <FormControl fullWidth>
              <InputLabel>Tipo de vencimiento</InputLabel>
              <Select
                value={newDeadlineTypeId}
                label="Tipo de vencimiento"
                onChange={(e) => setNewDeadlineTypeId(e.target.value)}
              >
                {deadlineTypes.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Frecuencia"
              type="number"
              value={newFrequency}
              onChange={(e) => setNewFrequency(e.target.value)}
              fullWidth
            />

            <TextField
              label="Último realizado"
              type="date"
              value={newLastDone}
              onChange={(e) => setNewLastDone(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            {deadlineTypes.find(t => t.id === newDeadlineTypeId)?.measure_by === 'usage' && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Unidad</InputLabel>
                  <Select
                    value={newFrequencyUnit}
                    label="Unidad"
                    onChange={(e) => setNewFrequencyUnit(e.target.value)}
                  >
                    <MenuItem value="hours">Horas</MenuItem>
                    <MenuItem value="kilometers">Kilómetros</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Promedio diario"
                  type="number"
                  value={newDailyAverage}
                  onChange={(e) => setNewDailyAverage(e.target.value)}
                  fullWidth
                />
              </>
            )}

            <Box display="flex" justifyContent="flex-end" gap={1}>
              <Button onClick={() => setOpenAddDeadline(false)}>Cancelar</Button>
              <Button onClick={handleAddDeadline} variant="contained">Guardar</Button>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </Container>
  )
}