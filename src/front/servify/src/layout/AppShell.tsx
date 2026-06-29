import { Outlet } from 'react-router-dom'
import Box from '@mui/material/Box'
import AppSidebar from '../components/AppSidebar'
import {
  SidebarLayoutProvider,
  useSidebarLayout,
} from '../context/SidebarLayoutContext'

const EXPANDED_SIDEBAR_WIDTH = 280
const COLLAPSED_SIDEBAR_WIDTH = 76

/**
 * Layout principal da aplicação.
 * Contém o sidebar e o conteúdo principal.
 *
 * O SidebarLayoutProvider é um contexto que controla a expansão do sidebar.
 * O AppSidebar é o componente que contém o sidebar.
 * O Outlet é o componente que contém o conteúdo principal da tela.
 */

export default function AppShell() {
  return (
    <SidebarLayoutProvider>
      <AppShellContent />
    </SidebarLayoutProvider>
  )
}

function AppShellContent() {
  const { sidebarExpanded } = useSidebarLayout()
  const sidebarWidth = sidebarExpanded
    ? EXPANDED_SIDEBAR_WIDTH
    : COLLAPSED_SIDEBAR_WIDTH

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <AppSidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          ml: `${sidebarWidth}px`,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          transition: 'margin-left 0.22s ease',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
