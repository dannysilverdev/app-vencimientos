'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Container, Typography, TextField, Button, MenuItem, Box
} from '@mui/material'

type DeadlineType = {
  id: string
  name: string
  measure_by: 'date' | 'usage'
  unit: 'hours' | 'kilometers' | null
}

export default function NewDeadlinePage() {
  const { id: entityId } = useParams()
  const router = useRouter()

  const [types, setTypes] = useState<DeadlineType[]>([])
  const [typeId, setTypeId] = useState('')
  const [selectedType, setSelectedType] = useState<DeadlineType | null>(null)
  const [lastDone, setLastDone] = useState('')
  const [frequency, setFrequency] = useState('')
  const [usageDailyAvg, setUsageDailyAvg] = useState('')

  useEffect(() => {
    fetch('/api/deadline-types')
      .then(res => res.json())
      .then(data => setTypes(data))
  }, [])

  useEffect(() => {
    const found = types.find(t => t.id === typeId)
    setSelectedType(found || null)
  }, [typeId, types])

  const handleSubmit = async () => {
    const res = await fetch('/api/deadlines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_id: entityId,
        type_id: typeId,
        last_done: lastDone,
        frequency: parseFloat(frequency),
        frequency_unit: selectedType?.measure_by === 'date' ? 'days' : selectedType?.unit,
        usage_daily_average: selectedType?.measure_by === 'usage' ? parseFloat(usageDailyAvg) : null
      })
    })

    if (res.ok) {
      router.push(`/entities/${entityId}`)
    } else {
      const error = await res.json()
      alert(error.error)
    }
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Nuevo vencimiento para entidad
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        <TextField
          select
          label="Tipo de vencimiento"
          value={typeId}
          onChange={(e) => setTypeId(e.target.value)}
          fullWidth
        >
          {types.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              {t.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Fecha de último cumplimiento"
          type="date"
          value={lastDone}
          onChange={(e) => setLastDone(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label={
            selectedType?.measure_by === 'date'
              ? 'Frecuencia (en días)'
              : `Frecuencia (${selectedType?.unit})`
          }
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          type="number"
        />

        {selectedType?.measure_by === 'usage' && (
          <TextField
            label={`Promedio de uso diario (${selectedType?.unit})`}
            value={usageDailyAvg}
            onChange={(e) => setUsageDailyAvg(e.target.value)}
            type="number"
          />
        )}

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!typeId || !lastDone || !frequency}
        >
          Guardar vencimiento
        </Button>
      </Box>
    </Container>
  )
}
