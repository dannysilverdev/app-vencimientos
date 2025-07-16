"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert
} from '@mui/material'

export default function UsageLogForm() {
  const [value, setValue] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async () => {
    const { error } = await supabase.from('usage_logs').insert([
      { value: parseFloat(value), entity_id: 'some-id' }
    ])

    if (error) {
      setMessage('Error al guardar.')
      console.error(error)
    } else {
      setMessage('Uso registrado con éxito.')
    }
  }

  return (
    <Box>
      <Typography variant="h6">Registrar uso</Typography>
      <TextField
        label="Valor"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        type="number"
        fullWidth
      />
      <Button onClick={handleSubmit} variant="contained" sx={{ mt: 2 }}>
        Guardar
      </Button>
      {message && <Alert severity="info" sx={{ mt: 2 }}>{message}</Alert>}
    </Box>
  )
}