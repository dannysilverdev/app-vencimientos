'use client'

import { useEffect, useState } from 'react'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Link from 'next/link'
import Box from '@mui/material/Box'

type Entity = {
  id: string
  name: string
  type_id: string
  entity_types?: {
    name: string
  }
}

export default function HomePage() {
  const [entities, setEntities] = useState<Entity[]>([])

  useEffect(() => {
    fetch('/api/entities')
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text()
          console.error('Error al obtener entidades:', errorText)
          return []
        }
        return res.json()
      })
      .then(data => {
        if (Array.isArray(data)) {
          setEntities(data)
        }
      })
  }, [])

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Entidades registradas
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: '1fr 1fr 1fr'
          },
          gap: 2,
          mt: 2
        }}
      >
        {entities.map(entity => (
          <Card key={entity.id}>
            <CardContent>
              <Typography variant="h6">{entity.name}</Typography>
              <Typography variant="body2">
                Tipo: {entity.entity_types?.name || '—'}
              </Typography>
              <Link href={`/entities/${entity.id}`} passHref>
                <Button variant="outlined" size="small" sx={{ mt: 1 }}>
                  Ver ficha
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  )
}
