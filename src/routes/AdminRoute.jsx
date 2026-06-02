import { Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function AdminRoute({ children }) {
  const { state } = useApp()
  const currentUser = state?.auth?.currentUser

  if (!currentUser) return <Navigate to="/login" replace />

  if (currentUser.role === 'attendee') return <Navigate to="/app" replace />
  if (currentUser.role === 'organizer') return <Navigate to="/organizer" replace />
  if (currentUser.role !== 'admin') return <Navigate to="/login" replace />

  return children
}
