"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material'

type Entity = {
  id: string
  name: string
}

type UsageLogFormProps = {
  entities: Entity[]
}

export default function UsageLogForm({ entities }: UsageLogFormProps) {
  const [value, setValue] = useState('')
  const [selectedEntity, setSelectedEntity] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!selectedEntity) {
      setMessage('Selecciona una entidad.')
      return
    }

    const { error } = await supabase.from('usage_logs').insert([
      {
        value: parseFloat(value),
        entity_id: selectedEntity
      }
    ])

    if (error) {
      setMessage('Error al guardar.')
      console.error(error)
    } else {
      setMessage('Uso registrado con éxito.')
      setValue('')
    }
  }

  return (
    <Box sx={{ maxWidth: 400 }}>
      <Typography variant="h6" gutterBottom>
        Registrar uso
      </Typography>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Entidad</InputLabel>
        <Select
          value={selectedEntity}
          onChange={(e) => setSelectedEntity(e.target.value)}
          label="Entidad"
        >
          {entities.map((entity) => (
            <MenuItem key={entity.id} value={entity.id}>
              {entity.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

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

      {message && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}
    </Box>
  )
}
