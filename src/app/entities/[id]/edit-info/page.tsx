'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Alert
} from '@mui/material'

type Field = {
  id: string
  name: string
  field_type: 'text' | 'number' | 'date'
  is_required: boolean
}

type Value = {
  id: string
  value: string
  field_id: string
}

type Entity = {
  id: string
  name: string
  type_id: string
}

export default function EditEntityInfoPage() {
  const params = useParams()
  const entityId = params?.id as string
  const router = useRouter()

  const [entity, setEntity] = useState<Entity | null>(null)
  const [fields, setFields] = useState<Field[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAll = async () => {
      if (!entityId) {
        setError('No se encontró el ID de la entidad.')
        return
      }

      try {
        setLoading(true)

        const resEntity = await fetch(`/api/entities/${entityId}`)
        const entityData: Entity = await resEntity.json()
        if (!entityData?.type_id) {
          setError('La entidad no tiene un tipo definido.')
          setLoading(false)
          return
        }
        setEntity(entityData)

        const [fieldRes, valueRes] = await Promise.all([
          fetch(`/api/entity-fields?entity_type_id=${entityData.type_id}`),
          fetch(`/api/entity-field-values?entity_id=${entityId}`)
        ])

        const fieldData = await fieldRes.json()
        const valueData = await valueRes.json()

        setFields(fieldData)

        const valueMap: Record<string, string> = {}
        valueData.forEach((v: Value) => {
          valueMap[v.field_id] = v.value
        })
        setValues(valueMap)
      } catch (err) {
        console.error(err)
        setError('Error al cargar los datos.')
      } finally {
        setLoading(false)
      }
    }

    loadAll()
  }, [entityId])

  const handleChange = (fieldId: string, value: string) => {
    setValues(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = async () => {
    await fetch('/api/entity-field-values/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_id: entityId,
        values: fields.map(field => ({
          field_id: field.id,
          value: values[field.id] || ''
        }))
      })
    })

    router.push(`/entities/${entityId}`)
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Editar información de entidad
      </Typography>

      {loading ? (
        <Typography>Cargando...</Typography>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : entity ? (
        <>
          <Typography variant="subtitle1" gutterBottom>{entity.name}</Typography>

          {fields.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              Este tipo de entidad no tiene campos personalizados definidos.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 500, mt: 2 }}>
              {fields.map((field) => (
                <TextField
                  key={field.id}
                  label={field.name}
                  required={field.is_required}
                  type={
                    field.field_type === 'number'
                      ? 'number'
                      : field.field_type === 'date'
                      ? 'date'
                      : 'text'
                  }
                  InputLabelProps={field.field_type === 'date' ? { shrink: true } : undefined}
                  value={values[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                />
              ))}
              <Button variant="contained" onClick={handleSubmit}>Guardar</Button>
            </Box>
          )}
        </>
      ) : null}
    </Container>
  )
}
