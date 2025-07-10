'use client'

import { useEffect, useState } from 'react'
import {
  Container, Typography, Box, TextField, Button,
  List, ListItem, ListItemText, IconButton
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import Link from 'next/link'

type EntityType = {
  id: string
  name: string
}

export default function EntityTypesPage() {
  const [types, setTypes] = useState<EntityType[]>([])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  useEffect(() => {
    fetch('/api/entity-types')
      .then(res => res.json())
      .then(data => setTypes(data))
  }, [])

  const createType = async () => {
    if (!newName.trim()) return
    await fetch('/api/entity-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    })
    setNewName('')
    fetchTypes()
  }

  const updateType = async (id: string) => {
    await fetch(`/api/entity-types/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingName })
    })
    setEditingId(null)
    setEditingName('')
    fetchTypes()
  }

  const deleteType = async (id: string) => {
    await fetch(`/api/entity-types/${id}`, { method: 'DELETE' })
    fetchTypes()
  }

  const fetchTypes = async () => {
    const res = await fetch('/api/entity-types')
    const data = await res.json()
    setTypes(data)
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Tipos de entidad
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Nuevo tipo"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button variant="contained" onClick={createType}>
          Crear
        </Button>
      </Box>

      <List>
        {types.map((type) => (
          <ListItem
            key={type.id}
            secondaryAction={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Link href={`/entity-types/${type.id}/fields`} passHref>
                  <Button variant="outlined" size="small">Ver campos</Button>
                </Link>
                <IconButton onClick={() => {
                  setEditingId(type.id)
                  setEditingName(type.name)
                }}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => deleteType(type.id)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            }
          >
            {editingId === type.id ? (
              <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                <TextField
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  size="small"
                  fullWidth
                />
                <Button onClick={() => updateType(type.id)} size="small">
                  Guardar
                </Button>
                <Button onClick={() => setEditingId(null)} size="small">
                  Cancelar
                </Button>
              </Box>
            ) : (
              <ListItemText primary={type.name} />
            )}
          </ListItem>
        ))}
      </List>
    </Container>
  )
}
