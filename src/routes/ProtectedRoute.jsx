import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth()

  if (!currentUser || currentUser.role !== 'attendee') {
    return <Navigate to="/login" replace />
  }

  return children
}
