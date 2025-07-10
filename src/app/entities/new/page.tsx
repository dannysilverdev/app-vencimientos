'use client'

import { useState, useEffect } from 'react'
import {
  Container, Typography, TextField, Button, MenuItem, Box, IconButton
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'

type EntityType = {
  id: string
  name: string
}

export default function NewEntityForm() {
  const [name, setName] = useState('')
  const [typeId, setTypeId] = useState('')
  const [newTypeName, setNewTypeName] = useState('')
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([])

  useEffect(() => {
    fetch('/api/entity-types')
      .then(res => res.json())
      .then(data => setEntityTypes(data))
  }, [])

  const createEntity = async () => {
    const res = await fetch('/api/entities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type_id: typeId })
    })

    if (res.ok) {
      alert('Entidad creada con éxito')
      setName('')
      setTypeId('')
    } else {
      const err = await res.json()
      alert('Error: ' + err.error)
    }
  }

  const createNewType = async () => {
    if (!newTypeName.trim()) return
    const res = await fetch('/api/entity-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTypeName })
    })

    if (res.ok) {
      const created = await res.json()
      setEntityTypes(prev => [...prev, created])
      setTypeId(created.id)
      setNewTypeName('')
    }
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Crear nueva entidad
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        <TextField
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />

        <TextField
          select
          label="Tipo de entidad"
          value={typeId}
          onChange={(e) => setTypeId(e.target.value)}
          fullWidth
        >
          {entityTypes.map(type => (
            <MenuItem key={type.id} value={type.id}>
              {type.name}
            </MenuItem>
          ))}
        </TextField>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="Nuevo tipo de entidad"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            fullWidth
          />
          <IconButton onClick={createNewType} color="primary" size="large">
            <AddIcon />
          </IconButton>
        </Box>

        <Button variant="contained" onClick={createEntity}>
          Crear entidad
        </Button>
      </Box>
    </Container>
  )
}
