import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ResponsiveDrawer from '@/components/ResponsiveDrawer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Deadline Tracker',
  description: 'Control flexible de vencimientos por entidad'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ResponsiveDrawer>{children}</ResponsiveDrawer>
      </body>
    </html>
  )
}
