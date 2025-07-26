// src/theme.ts
import { createTheme } from '@mui/material/styles'

export const getTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#4682B4', // azul acero
      },
      secondary: {
        main: '#b0bec5',
      },
      background: {
        default: mode === 'light' ? '#f4f6f8' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
      text: {
        primary: mode === 'light' ? '#1a1a1a' : '#f0f0f0',
        secondary: mode === 'light' ? '#5f6368' : '#cccccc',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: 14,
    },
    shape: {
      borderRadius: 8,
    },
  })
