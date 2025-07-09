// src/app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Container, Typography, Card, CardContent, Grid } from '@mui/material'

type Entity = {
  id: string
  name: string
  type_id: string
}

export default function HomePage() {
  const [entities, setEntities] = useState<Entity[]>([])

  useEffect(() => {
    fetch('/api/entities')
      .then(res => res.json())
      .then(data => setEntities(data))
  }, [])

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Entidades registradas
      </Typography>
      <Grid container spacing={2}>
        {entities.map(entity => (
          <Grid item xs={12} sm={6} md={4} key={entity.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{entity.name}</Typography>
                <Typography variant="body2">Tipo ID: {entity.type_id}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}
