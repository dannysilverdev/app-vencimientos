'use client'

import { useEffect, useState } from 'react'
import { Container, Typography, Card, CardContent, Grid, Button } from '@mui/material'
import Link from 'next/link'

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
      <Grid container spacing={2}>
        {entities.map(entity => (
          <Grid item xs={12} sm={6} md={4} key={entity.id}>
            <Card>
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
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}
