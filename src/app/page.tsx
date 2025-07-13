'use client'

import { useEffect, useState } from 'react'
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box
} from '@mui/material'
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
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setEntities(data)
      })
  }, [])

  const grouped = entities.reduce<Record<string, Entity[]>>((acc, entity) => {
    const typeName = entity.entity_types?.name || 'Sin tipo'
    if (!acc[typeName]) acc[typeName] = []
    acc[typeName].push(entity)
    return acc
  }, {})

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Entidades registradas
      </Typography>

      {Object.entries(grouped).map(([typeName, group]) => (
        <Box
          key={typeName}
          sx={{
            mb: 6,
            pb: 2,
            borderBottom: '1px solid #ddd'
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: 'primary.main',
              fontWeight: 600,
              mb: 2
            }}
          >
            {typeName}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)'
              }
            }}
          >
            {group.map((entity) => (
              <Card
                key={entity.id}
                elevation={2}
                sx={{ borderRadius: 2, display: 'flex', flexDirection: 'column' }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    {entity.name}
                  </Typography>
                  <Link href={`/entities/${entity.id}`} passHref>
                    <Button variant="outlined" size="small">
                      Ver ficha
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      ))}
    </Container>
  )
}
