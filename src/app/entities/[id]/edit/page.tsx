'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Container,
  Typography,
  TextField,
  Button,
  MenuItem,
  Box,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Card,
  CardHeader,
  CardContent
} from "@mui/material"
import { Save as SaveIcon, FileCopy as FileIcon } from "@mui/icons-material"
import UsageLogFormForEntity from '@/components/UsageLogFormForEntity'
import EntityDeadlinesManager from '@/components/EntityDeadlinesManager'

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

  useEffect(() => {
    const loadData = async () => {
      if (!entityId) return
      try {
        const [resEntity, resTypes] = await Promise.all([
          fetch(`/api/entities/${entityId}`),
          fetch(`/api/entity-types`)
        ])

        const [entityData, typeData] = await Promise.all([
          resEntity.json(),
          resTypes.json()
        ])

        setEntity(entityData)
        setEditedName(entityData.name)
        setEditedTypeId(entityData.type_id)
        setTracksUsage(entityData.tracks_usage ?? false)
        setEntityTypes(typeData)
      } catch (err) {
        console.error(err)
        setError('Error al cargar los datos.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [entityId])

  const handleSubmit = async () => {
    try {
      await fetch(`/api/entities/${entityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedName,
          type_id: editedTypeId,
          tracks_usage: tracksUsage
        })
      })

      router.push('/manage')
    } catch (err) {
      console.error(err)
      setError('Error al guardar los cambios.')
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
          onChange={(e) => setEditedTypeId(e.target.value)}
          label="Tipo de entidad"
        >
          {entityTypes.map(type => (
            <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControlLabel
        control={
          <Switch
            checked={tracksUsage}
            onChange={(e) => setTracksUsage(e.target.checked)}
          />
        }
        label="¿Registrar uso acumulado?"
        sx={{ mb: 2 }}
      />

      <Box mt={2} mb={3}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          startIcon={<SaveIcon />}
        >
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
    </Container>
  )
}
