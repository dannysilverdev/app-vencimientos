'use client'

import { IconButton, Tooltip } from '@mui/material'
import { Sun, Moon } from 'lucide-react'
import { useColorMode } from '@/context/ThemeContext'

const ThemeToggleButton = () => {
  const { toggleColorMode, mode } = useColorMode()

  return (
    <Tooltip title={mode === 'light' ? 'Modo oscuro' : 'Modo claro'}>
      <IconButton onClick={toggleColorMode} color="inherit">
        {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </IconButton>
    </Tooltip>
  )
}

export default ThemeToggleButton
