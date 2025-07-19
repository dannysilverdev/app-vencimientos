'use client'

import { useState } from 'react'
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import Link from 'next/link'

// Íconos de menú
import HomeIcon from '@mui/icons-material/Home'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CategoryIcon from '@mui/icons-material/Category'
import ScheduleIcon from '@mui/icons-material/Schedule'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts' // nuevo ícono

const drawerWidth = 240

const navItems = [
  { text: 'Dashboard', href: '/', icon: <HomeIcon /> },
  { text: 'Gestor de Entidades', href: '/manage', icon: <ManageAccountsIcon /> },
  { text: 'Tipos de Entidad', href: '/entity-types', icon: <CategoryIcon /> },
  { text: 'Tipos de Vencimiento', href: '/deadline-types', icon: <ScheduleIcon /> }
]

export default function ResponsiveDrawer({
  children
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  const toggleDrawer = () => setOpen((prev) => !prev)
  const closeDrawer = () => setOpen(false)

  const drawer = (
    <Box onClick={closeDrawer} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        Deadline Tracker
      </Typography>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton component={Link} href={item.href}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar component="nav" position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Deadline Tracker
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        open={open}
        onClose={closeDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth
          }
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 5
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
