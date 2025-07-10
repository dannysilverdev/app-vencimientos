'use client'

import { AppBar, Box, Toolbar, Typography, Button, Container } from '@mui/material'
import Link from 'next/link'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              App Vencimientos
            </Typography>
            <Link href="/" passHref>
              <Button color="inherit">Dashboard</Button>
            </Link>
            <Link href="/entities/new" passHref>
              <Button color="inherit">+ Entidad</Button>
            </Link>
            <Link href="/entity-types" passHref>
              <Button color="inherit">Tipos</Button>
            </Link>
            <Link href="/deadline-types" passHref>
              <Button color="inherit">Vencimientos</Button>
            </Link>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4 }}>
          {children}
        </Container>
      </body>
    </html>
  )
}
