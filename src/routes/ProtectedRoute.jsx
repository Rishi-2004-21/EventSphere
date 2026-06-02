import { Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function ProtectedRoute({ children }) {
  const { state } = useApp()
  const currentUser = state?.auth?.currentUser

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return children
}
