import { useState, useEffect } from 'react'
import {
  Stack,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import { supabase } from '@/lib/supabaseClient'

export default function UsageLogFormForEntity({ entityId }: { entityId: string }) {
  const [date, setDate] = useState<Dayjs>(dayjs())
  const [value, setValue] = useState<number>(0)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [lastLog, setLastLog] = useState<{ date: string; value: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingLast, setLoadingLast] = useState(true)

  const fetchLastLog = async () => {
    try {
      setLoadingLast(true)
      const { data } = await supabase
        .from('usage_logs')
        .select('date, value')
        .eq('entity_id', entityId)
        .order('date', { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        setLastLog({ date: data[0].date, value: Number(data[0].value) })
      } else {
        setLastLog(null)
      }
    } finally {
      setLoadingLast(false)
    }
  }

  useEffect(() => {
    if (entityId) fetchLastLog()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId])

  const handleSubmit = async () => {
    try {
      setMessage(null)

      // Validación básica del input
      const numeric = Number(value)
      if (Number.isNaN(numeric)) {
        setMessage({ type: 'error', text: '❌ Ingresa un número válido.' })
        return
      }
      if (numeric < 0) {
        setMessage({ type: 'error', text: '❌ El valor no puede ser negativo.' })
        return
      }

      // Validación contra el último valor cargado en memoria
      if (lastLog && numeric < Number(lastLog.value)) {
        setMessage({ type: 'error', text: `❌ El valor (${numeric}) no puede ser menor que el último registrado (${lastLog.value}).` })
        return
      }

      setSubmitting(true)

      // Revalidar contra el último valor más reciente justo antes de insertar (reduce riesgos de simultaneidad)
      const { data: fresh } = await supabase
        .from('usage_logs')
        .select('date, value')
        .eq('entity_id', entityId)
        .order('date', { ascending: false })
        .limit(1)

      const freshLast = fresh && fresh.length > 0 ? Number(fresh[0].value) : null
      if (freshLast !== null && numeric < freshLast) {
        setMessage({ type: 'error', text: `❌ El valor (${numeric}) no puede ser menor que el último registrado (${freshLast}).` })
        return
      }

      const isoDate = date.toISOString().split('T')[0]

      const { error } = await supabase
        .from('usage_logs')
        .insert([
          {
            entity_id: entityId,
            date: isoDate,
            value: numeric,
          }
        ])

      if (error) {
        console.error('Error al insertar en usage_logs:', error.message, error.details, error)
        setMessage({ type: 'error', text: '❌ Error al guardar: ' + (error.message || 'Desconocido') })
        return
      }

      // Éxito
      setMessage({ type: 'success', text: '✅ Registro guardado.' })
      setLastLog({ date: isoDate, value: numeric })
      setValue(0) // limpia a 0 como tu versión original
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack spacing={2} mt={4} maxWidth={400}>
        <Typography variant="h6">Registrar uso acumulado</Typography>

        <DatePicker
          label="Fecha"
          value={date}
          onChange={(newDate) => newDate && setDate(newDate)}
        />

        <TextField
          label="Valor acumulado (ej: km, horas, etc)"
          type="number"
          value={isNaN(value as number) ? '' : value}
          onChange={(e) => setValue(parseFloat(e.target.value))}
          inputProps={{ min: 0, step: 'any' }}
        />

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || loadingLast}
          startIcon={submitting ? <CircularProgress size={18} /> : undefined}
        >
          {submitting ? 'Guardando…' : 'Registrar'}
        </Button>

        {message && (
          <Alert severity={message.type}>{message.text}</Alert>
        )}

        <Typography variant="body2" color="text.secondary">
          {loadingLast
            ? 'Cargando último registro…'
            : lastLog
              ? `Último registrado: ${lastLog.value} el ${lastLog.date}`
              : 'Aún no hay registros previos'}
        </Typography>
      </Stack>
    </LocalizationProvider>
  )
}
