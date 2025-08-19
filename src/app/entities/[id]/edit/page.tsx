'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Container, Typography, TextField, Button, MenuItem, Box,
  FormControl, InputLabel, Select, Switch, FormControlLabel,
  Card, CardHeader, CardContent
} from "@mui/material"
import { Save as SaveIcon, FileCopy as FileIcon } from "@mui/icons-material"
import UsageLogFormForEntity from '@/components/UsageLogFormForEntity'
import EntityDeadlinesManager from '@/components/EntityDeadlinesManager'
import CustomFieldsForm from '@/components/CustomFieldsForm'
import ArchivedDeadlinesList from '@/components/ArchivedDeadlinesList' // 👈 NUEVO IMPORT

type FieldValue = {
  field_id: string
  value: string
  entity_fields?: {
    name: string
    field_type: string
    entity_type_id: string
  } | null
}

export default function EditEntityPage() {
  const params = useParams()
  const router = useRouter()
  const entityId = params?.id as string

  const [entity, setEntity] = useState<any>(null)
  const [editedName, setEditedName] = useState('')
  const [editedTypeId, setEditedTypeId] = useState('')
  const [tracksUsage, setTracksUsage] = useState(false)
  const [entityTypes, setEntityTypes] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [fieldValues, setFieldValues] = useState<FieldValue[]>([])

  useEffect(() => {
    const loadData = async () => {
      if (!entityId) return
      try {
        const [resEntity, resTypes, resFieldValues] = await Promise.all([
          fetch(`/api/entities/${entityId}`, { cache: 'no-store' }),
          fetch(`/api/entity-types`),
          fetch(`/api/entity-field-values/bulk?entity_id=${entityId}`, { cache: 'no-store' })
        ])

        if (!resEntity.ok) throw new Error((await resEntity.json())?.error || 'No se pudo cargar la entidad')
        if (!resTypes.ok) throw new Error((await resTypes.json())?.error || 'No se pudieron cargar los tipos')

        const [entityData, typeData] = await Promise.all([resEntity.json(), resTypes.json()])
        const allFields = resFieldValues.ok ? await resFieldValues.json() : []

        const filteredFields = allFields.filter((f: FieldValue) =>
          f.entity_fields?.entity_type_id === entityData.type_id
        )

        setEntity(entityData)
        setEditedName(entityData.name)
        setEditedTypeId(entityData.type_id)
        setTracksUsage(Boolean(entityData?.tracks_usage))
        setEntityTypes(typeData)
        setFieldValues(filteredFields)
      } catch (err) {
        console.error(err)
        setError('Error al cargar los datos.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [entityId])

  const handleFieldValueChange = (fieldId: string, value: string) => {
    setFieldValues(prev =>
      prev.map(f => f.field_id === fieldId ? { ...f, value } : f)
    )
  }

  const handleSubmit = async () => {
    try {
      const entityPayload = {
        name: editedName?.trim(),
        type_id: editedTypeId,
        tracks_usage: Boolean(tracksUsage)
      }

      if (!entityPayload.name) throw new Error('El nombre no puede estar vacío.')

      const res = await fetch(`/api/entities/${entityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entityPayload)
      })

      if (!res.ok) throw new Error((await res.json())?.error || 'Error al guardar entidad')

      const resFields = await fetch(`/api/entity-field-values/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_id: entityId,
          values: fieldValues.map(f => ({
            field_id: f.field_id,
            value: f.value
          }))
        })
      })

      if (!resFields.ok) throw new Error((await resFields.json())?.error || 'Error al guardar campos personalizados')

      router.push('/manage')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al guardar los cambios.')
    }
  }

  if (loading || !entity) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>Cargando...</Typography>
      </Container>
    )
  }

  return (
    <Container sx={{ mt: 4, maxWidth: 600 }}>
      <Typography variant="h5" gutterBottom>Editar entidad</Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
      )}

      <TextField
        label="Nombre"
        value={editedName}
        onChange={(e) => setEditedName(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Tipo de entidad</InputLabel>
        <Select
          value={editedTypeId}
          onChange={(e) => setEditedTypeId(e.target.value as string)}
          label="Tipo de entidad"
        >
          {entityTypes.map((type) => (
            <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControlLabel
        control={<Switch checked={tracksUsage} onChange={(e) => setTracksUsage(Boolean(e.target.checked))} />}
        label="¿Registrar uso acumulado?"
        sx={{ mb: 2 }}
      />

      <CustomFieldsForm
        fieldValues={fieldValues}
        onChange={handleFieldValueChange}
      />

      <Box mt={2} mb={3}>
        <Button variant="contained" onClick={handleSubmit} startIcon={<SaveIcon />}>
          Guardar
        </Button>
      </Box>

      {tracksUsage && entity?.id && (
        <Card sx={{ mb: 4 }}>
          <CardHeader title="Registro de uso acumulado" avatar={<FileIcon />} />
          <CardContent>
            <UsageLogFormForEntity entityId={entity.id} />
          </CardContent>
        </Card>
      )}

      <EntityDeadlinesManager entityId={entityId} />

      <ArchivedDeadlinesList entityId={entityId} /> {/* ✅ Historial integrado aquí */}
    </Container>
  )
}
