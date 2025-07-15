'use client'

import { useEffect, useState } from 'react'
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Stack
} from '@mui/material'
import Link from 'next/link'
import CircleIcon from '@mui/icons-material/Circle'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

type Entity = {
  id: string
  name: string
  type_id: string
  entity_types?: {
    name: string
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

export default function HomePage() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [deadlinesByEntity, setDeadlinesByEntity] = useState<Record<string, Deadline[]>>({})

  useEffect(() => {
    const loadEntities = async () => {
      const res = await fetch('/api/entities')
      const data = await res.json()
      if (Array.isArray(data)) setEntities(data)
    }

    loadEntities()
  }, [])

  useEffect(() => {
    const loadDeadlines = async () => {
      const allDeadlines: Record<string, Deadline[]> = {}
      await Promise.all(
        entities.map(async (e) => {
          const res = await fetch(`/api/deadlines?entity_id=${e.id}`)
          const data = await res.json()
          allDeadlines[e.id] = data
        })
      )
      setDeadlinesByEntity(allDeadlines)
    }

    if (entities.length > 0) {
      loadDeadlines()
    }
  }, [entities])

  function getDeadlineInfo(d: Deadline): { text: string; color: string } {
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

    let color = 'success.main'
    if (diffDays < 0) color = 'error.main'
    else if (diffDays <= d.frequency * 0.3) color = 'warning.main'

    const text = `${d.deadline_types.name}: ${estimated.toISOString().split('T')[0]}`
    return { text, color }
  }

  const grouped = entities.reduce<Record<string, Entity[]>>((acc, entity) => {
    const typeName = entity.entity_types?.name || 'Sin tipo'
    if (!acc[typeName]) acc[typeName] = []
    acc[typeName].push(entity)
    return acc
  }, {})

  return (
    <Container sx={{ mt: 4, maxWidth: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Entidades registradas
      </Typography>

      {Object.entries(grouped).map(([typeName, group]) => (
        <Box key={typeName} sx={{ mb: 5 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            {typeName}
          </Typography>

          <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            xl: 'repeat(4, 1fr)'
          }
        }}
      >
            {group.map((entity) => {
              const deadlines = deadlinesByEntity[entity.id] || []
              const deadline = deadlines.length > 0 ? getDeadlineInfo(deadlines[0]) : null

              return (
                <Card
                  key={entity.id}
                  elevation={3}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    boxShadow: 3
                  }}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {entity.name}
                    </Typography>

                    {deadline && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <CircleIcon sx={{ fontSize: 16, color: deadline.color, mr: 1 }} />
                        <Typography variant="body2">{deadline.text}</Typography>
                      </Box>
                    )}
                  </Box>

                  <Link href={`/entities/${entity.id}`} passHref>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ alignSelf: 'flex-end' }}
                      endIcon={<OpenInNewIcon />}
                    >
                    </Button>
                  </Link>
                </Card>
              )
            })}
          </Box>
        </Box>
      ))}
    </Container>
  )
}