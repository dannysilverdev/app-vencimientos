'use client'

import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Stack,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TextField
} from '@mui/material'
import {
  CalendarToday as CalendarIcon,
  Delete as DeleteIcon,
  Add as PlusIcon
} from '@mui/icons-material'
import { useEffect, useState } from 'react'

export default function EntityDeadlinesManager({ entityId }: { entityId: string }) {
  const [deadlines, setDeadlines] = useState<any[]>([])
  const [deadlineTypes, setDeadlineTypes] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [openAddDeadline, setOpenAddDeadline] = useState(false)

  const [newDeadlineTypeId, setNewDeadlineTypeId] = useState('')
  const [newFrequency, setNewFrequency] = useState('')
  const [newLastDone, setNewLastDone] = useState('')
  const [newFrequencyUnit, setNewFrequencyUnit] = useState('')
  const [newDailyAverage, setNewDailyAverage] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resDeadlines, resDeadlineTypes] = await Promise.all([
          fetch(`/api/deadlines?entity_id=${entityId}`),
          fetch(`/api/deadline-types`)
        ])
        const [deadlineData, deadlineTypesData] = await Promise.all([
          resDeadlines.json(),
          resDeadlineTypes.json()
        ])
        setDeadlines(deadlineData)
        setDeadlineTypes(deadlineTypesData)
      } catch (err) {
        console.error(err)
        setError('Error al cargar vencimientos.')
      }
    }

    loadData()
  }, [entityId])

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
      if (!res.ok) throw new Error("Error al eliminar el vencimiento.")
      setDeadlines(prev => prev.filter(d => d.id !== deadlineId))
    } catch (err: any) {
      console.error(err)
      setError(err.message || "No se pudo eliminar el vencimiento.")
    }
  }

  return (
    <>
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
    </>
  )
}
