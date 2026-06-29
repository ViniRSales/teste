import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import AppShell from './layout/AppShell'
import AgendamentosPage from './pages/AgendamentosPage'
import ComissaoPage from './pages/ComissaoPage'
import ClientesPage from './pages/ClientesPage'
import DashboardPage from './pages/DashboardPage'
import DisponibilidadePage from './pages/DisponibilidadePage'
import GerenciarColaboradorPage from './pages/GerenciarColaboradorPage'
import LoginPage from './pages/LoginPage'
import ServicosPage from './pages/ServicosPage'
import RegisterPage from './pages/RegisterPage'
import CompletarCadastroConvitePage from './pages/CompletarCadastroConvitePage'
import GoogleMailOAuthCallbackPage from './pages/GoogleMailOAuthCallbackPage'
import RequireAuth from './routes/RequireAuth'

/**
 * Data Router (`createBrowserRouter`) para suportar APIs como `useBlocker`
 * na tela de completar cadastro do convite.
 */
const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/cadastro', element: <RegisterPage /> },
  { path: '/convite/:token', element: <CompletarCadastroConvitePage /> },
  {
    path: '/oauth/google/callback',
    element: <GoogleMailOAuthCallbackPage />,
  },
  {
    path: '/gerenciar-colaborador',
    element: <Navigate to="/colaboradores" replace />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/agendamentos', element: <AgendamentosPage /> },
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
          { path: '/servicos', element: <ServicosPage /> },
          {
            path: '/comissao',
            element: <ComissaoPage />,
          },
          {
            path: '/colaboradores',
            element: <GerenciarColaboradorPage />,
          },
          {
            path: '/disponibilidade/:colaboradorId',
            element: <DisponibilidadePage />,
          },
          { path: '/clientes', element: <ClientesPage /> },
        ],
      },
    ],
  },
  { path: '/', element: <Navigate to="/agendamentos" replace /> },
])

export default function App() {
  return <RouterProvider router={router} />
}