"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Box,
  Stack,
  Alert
} from "@mui/material"
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  FileCopy as FileIcon,
  Add as PlusIcon,
  Circle as CircleIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Warning as WarningIcon
} from "@mui/icons-material"
import UsageLogFormForEntity from '@/components/UsageLogFormForEntity'

// Tipado

type FieldValue = {
  id: string
  value: string
  field_id: string
  entity_fields: {
    name: string
    field_type: string
  }
}

type Deadline = {
  id: string
  last_done: string
  frequency: number
  frequency_unit: string
  usage_daily_average: number | null
  deadline_types: {
    name: string
    measure_by: string
    unit: string | null
  }
}

type Entity = {
  id: string
  name: string
  tracks_usage?: boolean
}

export default function EntityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const entityId = params?.id as string

  const [entity, setEntity] = useState<Entity | null>(null)
  const [fieldValues, setFieldValues] = useState<FieldValue[]>([])
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [hasDeadlineTypes, setHasDeadlineTypes] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editedName, setEditedName] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!entityId) return

      const [resEntity, resFields, resDeadlines, resTypes] = await Promise.all([
        fetch(`/api/entities/${entityId}`),
        fetch(`/api/entity-field-values?entity_id=${entityId}`),
        fetch(`/api/deadlines?entity_id=${entityId}`),
        fetch(`/api/deadline-types`)
      ])

      const [entityData, fieldData, deadlineData, typeData] = await Promise.all([
        resEntity.json(),
        resFields.json(),
        resDeadlines.json(),
        resTypes.json()
      ])

      setEntity(entityData)
      setFieldValues(fieldData)
      setDeadlines(deadlineData)
      setHasDeadlineTypes(Array.isArray(typeData) && typeData.length > 0)
      setEditedName(entityData.name)
      setLoading(false)
    }

    load()
  }, [entityId])

  const handleEditClick = () => setEditDialogOpen(true)

  const handleSave = async () => {
    const res = await fetch(`/api/entities/${entityId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editedName })
    })
    if (res.ok && entity) {
      setEntity({ ...entity, name: editedName })
      setEditDialogOpen(false)
    }
  }

  const handleDelete = async () => {
    const res = await fetch(`/api/entities/${entityId}`, { method: 'DELETE' })
    if (res.ok) router.push('/')
  }

  const getDeadlineStatus = (d: Deadline): 'red' | 'yellow' | 'green' => {
    const today = new Date()
    const last = new Date(d.last_done)
    let estimated = new Date(last)
    if (d.deadline_types.measure_by === 'date') {
      estimated.setDate(estimated.getDate() + d.frequency)
    } else {
      const daily = d.usage_daily_average || 0
      const daysUntilDue = daily > 0 ? d.frequency / daily : 0
      estimated.setDate(estimated.getDate() + Math.round(daysUntilDue))
    }
    const diffMs = estimated.getTime() - today.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return 'red'
    if (diffDays <= d.frequency * 0.3) return 'yellow'
    return 'green'
  }

  const getEstimatedDate = (d: Deadline): string => {
    const last = new Date(d.last_done)
    const est = new Date(last)
    if (d.deadline_types.measure_by === 'date') {
      est.setDate(est.getDate() + d.frequency)
    } else {
      const daily = d.usage_daily_average || 0
      const daysUntilDue = daily > 0 ? d.frequency / daily : 0
      est.setDate(est.getDate() + Math.round(daysUntilDue))
    }
    return est.toISOString().split('T')[0]
  }

  if (loading || !entity) return <Container sx={{ mt: 4 }}><Typography>Cargando entidad...</Typography></Container>

  return (
    <Container sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{entity.name}</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button variant="outlined" onClick={handleEditClick} startIcon={<EditIcon />}>Renombrar</Button>
          <Link href={`/entities/${entity.id}/edit-info`} passHref><Button variant="outlined" startIcon={<FileIcon />}>Editar información</Button></Link>
          {hasDeadlineTypes ? (
            <Link href={`/entities/${entity.id}/deadlines/new`} passHref><Button variant="outlined" startIcon={<PlusIcon />}>Agregar vencimiento</Button></Link>
          ) : hasDeadlineTypes === false ? (
            <Alert severity="warning" icon={<WarningIcon />} sx={{ maxWidth: 360 }}>Debes crear al menos un tipo de vencimiento para poder asignar uno.</Alert>
          ) : null}
          <Button variant="outlined" color="error" onClick={() => setDeleteDialogOpen(true)} startIcon={<DeleteIcon />}>Eliminar entidad</Button>
        </Stack>
      </Box>

      {/* Diálogo editar nombre */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Editar nombre de la entidad</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} startIcon={<CloseIcon />}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} startIcon={<SaveIcon />}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo eliminar */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ color: 'error.main' }}>¿Eliminar entidad?</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de que quieres eliminar esta entidad? Esta acción no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete} startIcon={<DeleteIcon />}>Eliminar definitivamente</Button>
        </DialogActions>
      </Dialog>

      {/* Campos personalizados */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Campos personalizados" avatar={<FileIcon />} />
        <CardContent>
          {fieldValues.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No hay información personalizada aún.</Typography>
          ) : (
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
              {fieldValues.map((fv) => (
                <Box key={fv.id}>
                  <Typography variant="subtitle2">{fv.entity_fields.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{fv.value || '—'}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Formulario de registro de uso acumulado */}
      {entity.tracks_usage && (
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Registro de uso acumulado" avatar={<CalendarIcon />} />
          <CardContent>
            <UsageLogFormForEntity entityId={entity.id} />
          </CardContent>
        </Card>
      )}

      {/* Vencimientos */}
      <Card>
        <CardHeader title="Vencimientos" avatar={<CalendarIcon />} />
        <CardContent>
          {deadlines.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Sin vencimientos asignados aún.</Typography>
          ) : (
            <Stack spacing={2}>
              {deadlines.map((d) => {
                const status = getDeadlineStatus(d)
                const estimated = getEstimatedDate(d)
                const color = status === 'red' ? 'error.main' : status === 'yellow' ? 'warning.main' : 'success.main'

                return (
                  <Box key={d.id} display="flex" gap={2} alignItems="start" p={2} border={1} borderColor="divider" borderRadius={2}>
                    <CircleIcon sx={{ fontSize: 12, color, mt: '4px' }} />
                    <Box flex={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="subtitle1">{d.deadline_types.name}</Typography>
                        <Chip
                          label={status === 'red' ? 'Vencido' : status === 'yellow' ? 'Próximo' : 'Al día'}
                          color={status === 'red' ? 'error' : status === 'yellow' ? 'warning' : 'success'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {d.deadline_types.measure_by === 'date'
                          ? `Último: ${d.last_done} • Frecuencia: ${d.frequency} días`
                          : `Último: ${d.last_done} • Cada ${d.frequency} ${d.frequency_unit} • Promedio diario: ${d.usage_daily_average ?? '—'}`}
                      </Typography>
                      <Typography variant="body2">Fecha estimada de vencimiento: <strong>{estimated}</strong></Typography>
                    </Box>
                  </Box>
                )
              })}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}
