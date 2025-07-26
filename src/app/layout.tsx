// archivo del servidor (NO lleva 'use client')
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ThemeWrapper from '@/components/ThemeWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Deadline Tracker',
  description: 'Control flexible de vencimientos por entidad'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ThemeWrapper>{children}</ThemeWrapper>
      </body>
    </html>
  )
}
