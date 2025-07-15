import { useState, useEffect } from 'react'
import {
  Stack,
  Typography,
  TextField,
  Button,
  Alert,
} from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { supabase } from '@/lib/supabaseClient'

export default function UsageLogFormForEntity({ entityId }: { entityId: string }) {
  const [date, setDate] = useState(dayjs())
  const [value, setValue] = useState<number>(0)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [lastLog, setLastLog] = useState<{ date: string; value: number } | null>(null)

  useEffect(() => {
    const fetchLastLog = async () => {
      const { data, error } = await supabase
        .from('usage_logs')
        .select('date, value')
        .eq('entity_id', entityId)
        .order('date', { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        setLastLog(data[0])
      }
    }

    fetchLastLog()
  }, [entityId])

  const handleSubmit = async () => {
    setMessage(null)

    const { error, data } = await supabase
      .from('usage_logs')
      .insert([
        {
          entity_id: entityId,
          date: date.toISOString().split('T')[0],
          value
        }
      ])

    if (error) {
      console.error('Error al insertar en usage_logs:', error.message, error.details, error)
      setMessage({ type: 'error', text: '❌ Error al guardar: ' + (error.message || 'Desconocido') })
    } else {
      setMessage({ type: 'success', text: '✅ Registro guardado.' })
      setValue(0)
      setLastLog({ date: date.toISOString().split('T')[0], value })
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
          value={value}
          onChange={(e) => setValue(parseFloat(e.target.value))}
        />

        <Button variant="contained" onClick={handleSubmit}>
          Registrar
        </Button>

        {message && (
          <Alert severity={message.type}>{message.text}</Alert>
        )}

        {lastLog && (
          <Typography variant="body2" color="text.secondary">
            Último registrado: {lastLog.value} el {lastLog.date}
          </Typography>
        )}
      </Stack>
    </LocalizationProvider>
  )
}
