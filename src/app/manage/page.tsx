"use client"

import { useEffect, useState } from "react"
import {
  Container,
  Typography,
  Button,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  Stack,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from "@mui/material"
import { Plus, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"

type Entity = {
  id: string
  name: string
  entity_types?: {
    name: string
  }
}

export default function ManageEntitiesPage() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success"
  })
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [entityToDelete, setEntityToDelete] = useState<Entity | null>(null)

  const fetchEntities = async () => {
    const res = await fetch("/api/entities")
    const data = await res.json()
    if (Array.isArray(data)) setEntities(data)
  }

  useEffect(() => {
    fetchEntities()
  }, [])

  const requestDelete = (entity: Entity) => {
    setEntityToDelete(entity)
    setConfirmDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!entityToDelete) return
    try {
      const res = await fetch(`/api/entities/${entityToDelete.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")
      setSnackbar({ open: true, message: "Entidad eliminada correctamente", severity: "success" })
      fetchEntities()
    } catch (err) {
      setSnackbar({ open: true, message: "No se pudo eliminar la entidad", severity: "error" })
    } finally {
      setConfirmDialogOpen(false)
      setEntityToDelete(null)
    }
  }

  const allTypes = Array.from(new Set(entities.map(e => e.entity_types?.name || "Sin tipo")))

  const filteredEntities = selectedType
    ? entities.filter(e => (e.entity_types?.name || "Sin tipo") === selectedType)
    : entities

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Gestión de Entidades</Typography>
        <Button variant="contained" startIcon={<Plus size={16} />} component={Link} href="/entities/new">
          Nueva entidad
        </Button>
      </Box>

      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: "wrap" }}>
        {allTypes.map(type => (
          <Chip
            key={type}
            label={type}
            onClick={() => setSelectedType(type === selectedType ? null : type)}
            color={selectedType === type ? "primary" : "default"}
            variant="outlined"
          />
        ))}
      </Stack>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredEntities.map(entity => (
            <TableRow key={entity.id}>
              <TableCell>{entity.name}</TableCell>
              <TableCell>{entity.entity_types?.name || "Sin tipo"}</TableCell>
              <TableCell align="right">
                <IconButton component={Link} href={`/entities/${entity.id}/edit`}>
                  <Pencil size={16} />
                </IconButton>
                <IconButton onClick={() => requestDelete(entity)}>
                  <Trash2 size={16} />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Diálogo de confirmación */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>¿Eliminar entidad?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar{" "}
            <strong>{entityToDelete?.name}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancelar</Button>
          <Button color="error" onClick={confirmDelete}>Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
