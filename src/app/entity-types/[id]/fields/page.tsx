'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  IconButton,
  FormControlLabel,
  Checkbox
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'

type EntityField = {
  id: string
  name: string
  field_type: 'text' | 'number' | 'date'
  is_required: boolean
}

export default function EntityTypeFieldsPage() {
  const params = useParams()
  const entityTypeId = params?.id as string

  const [fields, setFields] = useState<EntityField[]>([])
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'text' | 'number' | 'date'>('text')
  const [isRequired, setIsRequired] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<Partial<EntityField>>({})

  useEffect(() => {
    fetchFields()
  }, [entityTypeId])

  const fetchFields = async () => {
    const res = await fetch(`/api/entity-fields?entity_type_id=${entityTypeId}`)
    const data = await res.json()
    setFields(data)
  }

  const addField = async () => {
    if (!newName.trim()) return
    await fetch('/api/entity-fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_type_id: entityTypeId,
        name: newName,
        field_type: newType,
        is_required: isRequired
      })
    })
    setNewName('')
    setNewType('text')
    setIsRequired(false)
    fetchFields()
  }

  const updateField = async (id: string) => {
    await fetch(`/api/entity-fields/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingField)
    })
    setEditingId(null)
    setEditingField({})
    fetchFields()
  }

  const deleteField = async (id: string) => {
    await fetch(`/api/entity-fields/${id}`, { method: 'DELETE' })
    fetchFields()
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Campos personalizados
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400, mb: 4 }}>
        <TextField
          label="Nombre del campo"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <TextField
          select
          label="Tipo de campo"
          value={newType}
          onChange={(e) => setNewType(e.target.value as 'text' | 'number' | 'date')}
        >
          <MenuItem value="text">Texto</MenuItem>
          <MenuItem value="number">Número</MenuItem>
          <MenuItem value="date">Fecha</MenuItem>
        </TextField>
        <FormControlLabel
          control={
            <Checkbox
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
            />
          }
          label="Requerido"
        />
        <Button variant="contained" onClick={addField}>
          Agregar campo
        </Button>
      </Box>

      <List>
        {fields.map((field) => (
          <ListItem
            key={field.id}
            disableGutters
            alignItems="flex-start"
            sx={{ flexDirection: 'column', alignItems: 'stretch', mb: 2, borderBottom: '1px solid #eee', pb: 2 }}
          >
            {editingId === field.id ? (
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <TextField
                    label="Nombre"
                    value={editingField.name || ''}
                    onChange={(e) => setEditingField(prev => ({ ...prev, name: e.target.value }))}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    select
                    label="Tipo"
                    value={editingField.field_type || ''}
                    onChange={(e) =>
                      setEditingField(prev => ({
                        ...prev,
                        field_type: e.target.value as EntityField['field_type']
                      }))
                    }
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="text">Texto</MenuItem>
                    <MenuItem value="number">Número</MenuItem>
                    <MenuItem value="date">Fecha</MenuItem>
                  </TextField>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={editingField.is_required || false}
                        onChange={(e) =>
                          setEditingField(prev => ({
                            ...prev,
                            is_required: e.target.checked
                          }))
                        }
                      />
                    }
                    label="Requerido"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                  <IconButton onClick={() => updateField(field.id)}>
                    <SaveIcon />
                  </IconButton>
                  <IconButton onClick={() => {
                    setEditingId(null)
                    setEditingField({})
                  }}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <ListItemText
                  primary={`${field.name} (${field.field_type})`}
                  secondary={field.is_required ? 'Requerido' : 'Opcional'}
                />
                <Box>
                  <IconButton onClick={() => {
                    setEditingId(field.id)
                    setEditingField(field)
                  }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => deleteField(field.id)}>
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
