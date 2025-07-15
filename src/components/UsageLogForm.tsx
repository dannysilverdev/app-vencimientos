'use client'

import { useState } from 'react'
import { Button, TextField, MenuItem, Typography, Stack } from '@mui/material'
import { DatePicker } from '@mui/lab'
import dayjs, { Dayjs } from 'dayjs'
import { useSupabase } from '@/lib/supabaseClient'

interface Entity {
  id: string
  name: string
}

interface Props {
  entities: Entity[] // Esto debe pasarse desde el backend
}

export default function UsageLogForm({ entities }: Props) {
  const [selectedEntity, setSelectedEntity] = useState('')
  const [date, setDate] = useState<Dayjs | null>(dayjs())
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('km') // Puedes cambiar por defecto 'horas'
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = useSupabase()

  const handleSubmit = async () => {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.from('usage_logs').insert({
      entity_id: selectedEntity,
      date: date?.format('YYYY-MM-DD'),
      value: parseFloat(value),
      unit,
    })
    setLoading(false)

    if (error) {
      setMessage('❌ Error al guardar')
      console.error(error)
    } else {
      setMessage('✅ Registro guardado')
      setValue('')
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Registrar uso diario</Typography>

      <TextField
        select
        label="Entidad"
        value={selectedEntity}
        onChange={(e) => setSelectedEntity(e.target.value)}
      >
        {entities.map((e) => (
          <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>
        ))}
      </TextField>

      <DatePicker
        label="Fecha"
        value={date}
        onChange={(newDate: Dayjs | null) => setDate(newDate)}

      />

      <TextField
        label="Valor acumulado"
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      <TextField
        select
        label="Unidad"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
      >
        <MenuItem value="km">km</MenuItem>
        <MenuItem value="horas">horas</MenuItem>
      </TextField>

      <Button variant="contained" onClick={handleSubmit} disabled={loading || !selectedEntity || !value}>
        Guardar
      </Button>

      {message && <Typography>{message}</Typography>}
    </Stack>
  )
}
