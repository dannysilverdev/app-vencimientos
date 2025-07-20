"use client"

import { useEffect, useState } from "react"
import {
  Box,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
  Paper,
  Divider
} from "@mui/material"
import { supabase } from "@/lib/supabaseClient"
import UsageLogFormByEntity from "@/components/UsageLogFormByEntity"

type Entity = {
  id: string
  name: string
  tracks_usage: boolean
}

type UsageLog = {
  id: number
  entity_id: string
  date: string
  value: number
}

export default function AddUsagePage() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([])

  useEffect(() => {
    const loadEntities = async () => {
      const { data } = await supabase
        .from("entities")
        .select("id, name, tracks_usage")
        .eq("tracks_usage", true)
        .order("name", { ascending: true })

      if (data) {
        setEntities(data)
      }
    }

    loadEntities()
  }, [])

  const handleSelectChange = async (event: SelectChangeEvent<string>) => {
    const entity = entities.find(e => e.id === event.target.value) || null
    setSelectedEntity(entity)

    if (entity) {
      const { data } = await supabase
        .from("usage_logs")
        .select("*")
        .eq("entity_id", entity.id)
        .order("date", { ascending: false })
        .limit(5)

      if (data) {
        setUsageLogs(data)
      } else {
        setUsageLogs([])
      }
    } else {
      setUsageLogs([])
    }
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Registrar uso acumulado
      </Typography>

      <FormControl fullWidth sx={{ maxWidth: 400, mb: 4 }}>
        <InputLabel id="entity-select-label">Selecciona una entidad</InputLabel>
        <Select
          labelId="entity-select-label"
          value={selectedEntity?.id || ""}
          onChange={handleSelectChange}
          label="Selecciona una entidad"
        >
          {entities.map(entity => (
            <MenuItem key={entity.id} value={entity.id}>
              {entity.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedEntity && (
        <>
          <UsageLogFormByEntity key={selectedEntity.id} entity={selectedEntity} />

          {usageLogs.length > 0 && (
            <Paper variant="outlined" sx={{ mt: 4, p: 2, maxWidth: 400 }}>
              <Typography variant="subtitle1" gutterBottom>
                Últimos registros
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {usageLogs.map(log => (
                <Box key={log.id} sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    {log.date}: <strong>{log.value}</strong>
                  </Typography>
                </Box>
              ))}
            </Paper>
          )}
        </>
      )}
    </Container>
  )
}
