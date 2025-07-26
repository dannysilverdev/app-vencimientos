// src/context/ThemeContext.tsx
'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { getTheme } from '@/theme'

const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: 'light' as 'light' | 'dark'
})

export const useColorMode = () => useContext(ColorModeContext)

export const ThemeContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<'light' | 'dark'>('light')

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () =>
        setMode(prev => (prev === 'light' ? 'dark' : 'light')),
      mode,
    }),
    [mode]
  )

  const theme = useMemo(() => getTheme(mode), [mode])

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}