"use client"

import { useEffect, useState } from "react"
import { Container, Typography, Button, Box, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip, Stack } from "@mui/material"
import { Plus, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"

// Tipo explícito para Entity
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

  useEffect(() => {
    fetch("/api/entities")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setEntities(data)
      })
  }, [])

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
                <IconButton component={Link} href={`/entities/${entity.id}/edit`}><Pencil size={16} /></IconButton>
                <IconButton><Trash2 size={16} /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  )
} 
