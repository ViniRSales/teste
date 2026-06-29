import { Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  canAccessPrivateRoute,
  getDefaultAuthenticatedRoute,
  getSession,
  isAuthenticated,
} from '../auth/session'

export default function RequireAuth() {
  const location = useLocation()
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  const session = getSession()
  const pendente = session?.user?.cadastroPendente
  const token = session?.user?.conviteToken?.trim()
  if (pendente && token && !location.pathname.startsWith('/convite/')) {
    return <Navigate to={`/convite/${encodeURIComponent(token)}`} replace />
  }
  if (!canAccessPrivateRoute(session?.user, location.pathname)) {
    return <Navigate to={getDefaultAuthenticatedRoute()} replace />
  }
  return <Outlet />
}

