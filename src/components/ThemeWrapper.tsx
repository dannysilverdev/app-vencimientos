'use client'

import { ThemeContextProvider } from '@/context/ThemeContext'
import ResponsiveDrawer from './ResponsiveDrawer'

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContextProvider>
      <ResponsiveDrawer>{children}</ResponsiveDrawer>
    </ThemeContextProvider>
  )
}
