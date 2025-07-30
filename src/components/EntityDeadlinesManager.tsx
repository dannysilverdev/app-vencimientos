// src/components/EntityDeadlinesManager.tsx
'use client'

import {
  Box,
  Typography,
  Button,
  Stack,
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
  Add as PlusIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material'
import { useEffect, useState } from 'react'

export default function EntityDeadlinesManager({ entityId }: { entityId: string }) {
  const [deadlines, setDeadlines] = useState<any[]>([])
  const [deadlineTypes, setDeadlineTypes] = useState<any[]>([])
  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState<any>(null)

  const [form, setForm] = useState({
    type_id: '',
    frequency: '',
    last_done: '',
    frequency_unit: '',
    usage_daily_average: ''
  })

  const selectedType = deadlineTypes.find(t => t.id === form.type_id)

  const resetForm = () => {
    setForm({
      type_id: '',
      frequency: '',
      last_done: '',
      frequency_unit: '',
      usage_daily_average: ''
    })
  }

  const loadData = async () => {
    const [resDeadlines, resDeadlineTypes] = await Promise.all([
      fetch(`/api/deadlines?entity_id=${entityId}`),
      fetch(`/api/deadline-types`)
    ])
    const [dData, dtData] = await Promise.all([resDeadlines.json(), resDeadlineTypes.json()])
    setDeadlines(dData)
    setDeadlineTypes(dtData)
  }

  useEffect(() => {
    loadData()
  }, [entityId])

  const handleSave = async () => {
    const body = {
      entity_id: entityId,
      type_id: form.type_id,
      last_done: form.last_done,
      frequency: Number(form.frequency),
      frequency_unit: selectedType?.measure_by === 'usage' ? form.frequency_unit : null,
      usage_daily_average: selectedType?.measure_by === 'usage' ? Number(form.usage_daily_average) : null
    }

    const method = editingDeadline ? 'PUT' : 'POST'
    const url = '/api/deadlines'
    const fullBody = editingDeadline ? { ...body, id: editingDeadline.id } : body

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullBody)
    })

    if (!res.ok) {
      const msg = (await res.json()).error || 'Error al guardar'
      alert(msg)
      return
    }

    await loadData()
    setOpenAdd(false)
    setOpenEdit(false)
    resetForm()
    setEditingDeadline(null)
  }

  const handleEdit = (deadline: any) => {
    setEditingDeadline(deadline)
    setForm({
      type_id: deadline.type_id,
      frequency: deadline.frequency.toString(),
      last_done: deadline.last_done.slice(0, 10),
      frequency_unit: deadline.frequency_unit || '',
      usage_daily_average: deadline.usage_daily_average?.toString() || ''
    })
    setOpenEdit(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar vencimiento?')) return
    const res = await fetch('/api/deadlines', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (!res.ok) return alert('Error al eliminar')
    await loadData()
  }

  const renderForm = (
    <>
      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel>Tipo</InputLabel>
        <Select
          value={form.type_id}
          label="Tipo"
          onChange={(e) => setForm(f => ({ ...f, type_id: e.target.value }))}
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
        fullWidth
        sx={{ mt: 2 }}
        type="number"
        value={form.frequency}
        onChange={(e) => setForm(f => ({ ...f, frequency: e.target.value }))}
      />

      <TextField
        label="Última realización"
        type="date"
        value={form.last_done}
        onChange={(e) => setForm(f => ({ ...f, last_done: e.target.value }))}
        fullWidth
        sx={{ mt: 2 }}
        InputLabelProps={{ shrink: true }}
      />

      {selectedType?.measure_by === 'usage' && (
        <>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Unidad</InputLabel>
            <Select
              value={form.frequency_unit}
              onChange={(e) => setForm(f => ({ ...f, frequency_unit: e.target.value }))}
              label="Unidad"
            >
              <MenuItem value="hours">Horas</MenuItem>
              <MenuItem value="kilometers">Kilómetros</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Promedio de uso diario"
            fullWidth
            sx={{ mt: 2 }}
            type="number"
            value={form.usage_daily_average}
            onChange={(e) => setForm(f => ({ ...f, usage_daily_average: e.target.value }))}
          />
        </>
      )}
    </>
  )

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>Vencimientos</Typography>

      <Button variant="outlined" startIcon={<PlusIcon />} onClick={() => setOpenAdd(true)} sx={{ mb: 2 }}>
        Agregar vencimiento
      </Button>

      {deadlines.map((d) => (
        <Box key={d.id} sx={{ border: '1px solid #ccc', borderRadius: 2, p: 2, mb: 2 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="subtitle1">{d.deadline_types.name}</Typography>
            <Box>
              <IconButton onClick={() => handleEdit(d)}><EditIcon /></IconButton>
              <IconButton onClick={() => handleDelete(d.id)}><DeleteIcon /></IconButton>
            </Box>
          </Stack>
          <Typography variant="body2">
            Última realización: {new Date(d.last_done).toLocaleDateString()}
          </Typography>
        </Box>
      ))}

      <Dialog open={openAdd || openEdit} onClose={() => {
        setOpenAdd(false)
        setOpenEdit(false)
        resetForm()
        setEditingDeadline(null)
      }}>
        <DialogTitle>{editingDeadline ? 'Editar' : 'Nuevo'} vencimiento</DialogTitle>
        <DialogContent>{renderForm}</DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenAdd(false)
            setOpenEdit(false)
            resetForm()
            setEditingDeadline(null)
          }}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
