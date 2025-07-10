'use client'

import { useEffect, useState } from 'react'
import {
  Container, Typography, Box, TextField, Button,
  List, ListItem, ListItemText, MenuItem, IconButton
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'

type DeadlineType = {
  id: string
  name: string
  measure_by: 'date' | 'usage'
  unit: 'hours' | 'kilometers' | null
}

export default function DeadlineTypesPage() {
  const [types, setTypes] = useState<DeadlineType[]>([])
  const [name, setName] = useState('')
  const [measureBy, setMeasureBy] = useState<'date' | 'usage'>('date')
  const [unit, setUnit] = useState<'hours' | 'kilometers' | ''>('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingMeasureBy, setEditingMeasureBy] = useState<'date' | 'usage'>('date')
  const [editingUnit, setEditingUnit] = useState<'hours' | 'kilometers' | ''>('')

  useEffect(() => {
    fetchTypes()
  }, [])

  const fetchTypes = async () => {
    const res = await fetch('/api/deadline-types')
    setTypes(await res.json())
  }

  const createType = async () => {
    if (!name) return
    await fetch('/api/deadline-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        measure_by: measureBy,
        unit: measureBy === 'usage' ? unit : null
      })
    })
    setName('')
    setMeasureBy('date')
    setUnit('')
    fetchTypes()
  }

  const updateType = async (id: string) => {
    await fetch(`/api/deadline-types/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editingName,
        measure_by: editingMeasureBy,
        unit: editingMeasureBy === 'usage' ? editingUnit : null
      })
    })

    setEditingId(null)
    setEditingName('')
    setEditingUnit('')
    setEditingMeasureBy('date')
    fetchTypes()
  }

  const deleteType = async (id: string) => {
    await fetch(`/api/deadline-types/${id}`, { method: 'DELETE' })
    setTypes(prev => prev.filter(t => t.id !== id))
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Tipos de Vencimiento
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
        <TextField
          label="Nombre"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <TextField
          select
          label="Medición"
          value={measureBy}
          onChange={(e) => {
            const value = e.target.value as 'date' | 'usage'
            setMeasureBy(value)
            if (value === 'date') setUnit('')
          }}
        >
          <MenuItem value="date">Por fecha</MenuItem>
          <MenuItem value="usage">Por uso</MenuItem>
        </TextField>
        {measureBy === 'usage' && (
          <TextField
            select
            label="Unidad"
            value={unit}
            onChange={e => setUnit(e.target.value as any)}
          >
            <MenuItem value="hours">Horas</MenuItem>
            <MenuItem value="kilometers">Kilómetros</MenuItem>
          </TextField>
        )}
        <Button variant="contained" onClick={createType}>
          Crear tipo de vencimiento
        </Button>
      </Box>

      <List>
        {types.map((t) => (
          <ListItem
            key={t.id}
            alignItems="flex-start"
            disableGutters
            sx={{ flexDirection: 'column', alignItems: 'stretch', mb: 2, borderBottom: '1px solid #eee', pb: 2 }}
          >
            {editingId === t.id ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <TextField
                  label="Nombre"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  size="small"
                  fullWidth
                />
                <TextField
                  select
                  label="Medición"
                  value={editingMeasureBy}
                  onChange={(e) => {
                    const value = e.target.value as 'date' | 'usage'
                    setEditingMeasureBy(value)
                    if (value === 'date') setEditingUnit('')
                  }}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="date">Por fecha</MenuItem>
                  <MenuItem value="usage">Por uso</MenuItem>
                </TextField>
                {editingMeasureBy === 'usage' && (
                  <TextField
                    select
                    label="Unidad"
                    value={editingUnit}
                    onChange={(e) => setEditingUnit(e.target.value as any)}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="hours">Horas</MenuItem>
                    <MenuItem value="kilometers">Kilómetros</MenuItem>
                  </TextField>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <IconButton onClick={() => updateType(t.id)} color="success">
                    <SaveIcon />
                  </IconButton>
                  <IconButton onClick={() => setEditingId(null)} color="inherit">
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <ListItemText
                  primary={t.name}
                  secondary={`Medición: ${t.measure_by}${t.unit ? ` • Unidad: ${t.unit}` : ''}`}
                />
                <Box>
                  <IconButton onClick={() => {
                    setEditingId(t.id)
                    setEditingName(t.name)
                    setEditingMeasureBy(t.measure_by)
                    setEditingUnit(t.unit || '')
                  }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => deleteType(t.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            )}
          </ListItem>
        ))}
      </List>
    </Container>
  )
}
