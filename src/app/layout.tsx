// src/app/layout.tsx
'use client'

import { CssBaseline } from '@mui/material'
import { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <CssBaseline />
        {children}
      </body>
    </html>
  )
}
