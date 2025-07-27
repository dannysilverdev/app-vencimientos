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
  DialogActions,
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

  const selectedType = deadlineTypes.find(t => t.id === newDeadlineTypeId)

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

        const now = new Date()
        const enhancedDeadlines = deadlineData.map((d: any) => {
          let estimatedDueDate: Date | null = null
          let status = 'good'

          if (d.deadline_types.measure_by === 'date') {
            const last = new Date(d.last_done)
            estimatedDueDate = new Date(last)
            if (d.frequency && d.frequency_unit) {
              if (d.frequency_unit === 'days') estimatedDueDate.setDate(last.getDate() + d.frequency)
              else if (d.frequency_unit === 'months') estimatedDueDate.setMonth(last.getMonth() + d.frequency)
              else if (d.frequency_unit === 'years') estimatedDueDate.setFullYear(last.getFullYear() + d.frequency)
            }

            const diffDays = estimatedDueDate ? Math.ceil((estimatedDueDate.getTime() - now.getTime()) / (1000 * 3600 * 24)) : 0
            if (diffDays <= 0) status = 'expired'
            else if (diffDays <= 10) status = 'warning'
          } else if (d.deadline_types.measure_by === 'usage') {
            const usageSince = d.current_usage - d.last_done
            const remaining = d.frequency - usageSince
            const daysLeft = d.usage_daily_average ? remaining / d.usage_daily_average : null
            if (daysLeft != null) {
              estimatedDueDate = new Date(now)
              estimatedDueDate.setDate(now.getDate() + Math.ceil(daysLeft))
              if (remaining <= 0) status = 'expired'
              else if (remaining <= d.usage_daily_average * 5) status = 'warning'
            }
          }

          return { ...d, estimatedDueDate, status }
        })

        setDeadlines(enhancedDeadlines)
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
      const res = await fetch('/api/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_id: entityId,
          deadline_type_id: newDeadlineTypeId,
          frequency: Number(newFrequency),
          last_done: newLastDone,
          frequency_unit: newFrequencyUnit || null,
          usage_daily_average: newDailyAverage ? Number(newDailyAverage) : null
        })
      })

      if (!res.ok) {
        const errorData = await res.clone().json().catch(() => null)
        const msg = errorData?.error || errorData?.message || await res.text() || 'Error al guardar vencimiento'
        throw new Error(msg)
      }

      const refreshed = await fetch(`/api/deadlines?entity_id=${entityId}`)
      const updated = await refreshed.json()
      setDeadlines(updated)
      setOpenAddDeadline(false)
      setNewDeadlineTypeId('')
      setNewFrequency('')
      setNewLastDone('')
      setNewFrequencyUnit('')
      setNewDailyAverage('')
    } catch (err) {
      console.error(err)
      alert('Error al guardar vencimiento.')
    }
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>Vencimientos</Typography>

      <Button
        variant="outlined"
        startIcon={<PlusIcon />}
        onClick={() => setOpenAddDeadline(true)}
        sx={{ mb: 2 }}
      >
        Agregar vencimiento
      </Button>

      {deadlines.map((d) => (
        <Box key={d.id} sx={{ border: '1px solid #ccc', borderRadius: 2, p: 2, mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor:
                  d.status === 'expired' ? 'error.main' :
                    d.status === 'warning' ? 'warning.main' :
                      'success.main'
              }}
            />
            <Typography variant="subtitle1">{d.deadline_types.name}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Última realización: {new Date(d.last_done).toLocaleDateString()}
          </Typography>
          {d.estimatedDueDate && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Estimado vencimiento: {new Date(d.estimatedDueDate).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      ))}

      <Dialog open={openAddDeadline} onClose={() => setOpenAddDeadline(false)}>
        <DialogTitle>Nuevo vencimiento</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={newDeadlineTypeId}
              onChange={(e) => setNewDeadlineTypeId(e.target.value)}
              label="Tipo"
            >
              {deadlineTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Frecuencia"
            value={newFrequency}
            onChange={(e) => setNewFrequency(e.target.value)}
            fullWidth
            type="number"
            sx={{ mt: 2 }}
          />

          <TextField
            label="Última realización"
            type="date"
            value={newLastDone}
            onChange={(e) => setNewLastDone(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
          />

          {selectedType?.measure_by === 'usage' && (
            <>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Unidad</InputLabel>
                <Select
                  value={newFrequencyUnit}
                  onChange={(e) => setNewFrequencyUnit(e.target.value)}
                  label="Unidad"
                >
                  <MenuItem value="hours">Horas</MenuItem>
                  <MenuItem value="kilometers">Kilómetros</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Promedio de uso diario"
                value={newDailyAverage}
                onChange={(e) => setNewDailyAverage(e.target.value)}
                fullWidth
                type="number"
                sx={{ mt: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenAddDeadline(false)}>Cancelar</Button>
          <Button onClick={handleAddDeadline} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
