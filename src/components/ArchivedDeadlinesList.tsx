
'use client'

import { useEffect, useState } from 'react'
import {
  Box, Typography, Collapse, Button, Stack, TextField
} from '@mui/material'

export default function ArchivedDeadlinesList({ entityId }: { entityId: string }) {
  const [allDeadlines, setAllDeadlines] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [show, setShow] = useState(false)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/api/deadlines?entity_id=${entityId}`)
      const data = await res.json()
      const archived = data.filter((d: any) => d.status !== 'active')
      setAllDeadlines(archived)
    }
    fetchData()
  }, [entityId])

  useEffect(() => {
    const filtered = allDeadlines.filter((d: any) => {
      const done = new Date(d.last_done).toISOString().slice(0, 10)
      return (!startDate || done >= startDate) && (!endDate || done <= endDate)
    })
    setFiltered(filtered)
  }, [allDeadlines, startDate, endDate])

  if (allDeadlines.length === 0) return null

  return (
    <Box mt={4}>
      <Button onClick={() => setShow(s => !s)} size="small">
        {show ? 'Ocultar historial de vencimientos' : 'Mostrar historial de vencimientos'}
      </Button>

      <Collapse in={show}>
        <Box mt={2}>
          <Typography variant="subtitle1" gutterBottom>Historial de vencimientos</Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
            <TextField
              type="date"
              label="Desde"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
            />
            <TextField
              type="date"
              label="Hasta"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
            />
          </Stack>

          {filtered.map((d) => (
            <Box key={d.id} sx={{ border: '1px solid #ccc', borderRadius: 2, p: 2, mb: 2 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle2">{d.deadline_types.name}</Typography>
                <Typography variant="caption" color="text.secondary">{d.status}</Typography>
              </Stack>

              {d.last_done && !isNaN(new Date(d.last_done).getTime()) && (
                <Typography variant="body2">
                  Realizado el: {new Date(d.last_done).toISOString().split('T')[0]}
                </Typography>
              )}

              {d.next_due_date && !isNaN(new Date(d.next_due_date).getTime()) && (
                <Typography variant="body2">
                  Vencía el: {new Date(d.next_due_date).toISOString().split('T')[0]}
                </Typography>
              )}
            </Box>
          ))}

          {filtered.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No hay vencimientos en este rango.
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  )
}
