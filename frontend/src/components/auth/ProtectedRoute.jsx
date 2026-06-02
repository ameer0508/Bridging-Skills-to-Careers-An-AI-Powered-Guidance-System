/**
 * ProtectedRoute — redirects unauthenticated users to /login
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useApp()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}
