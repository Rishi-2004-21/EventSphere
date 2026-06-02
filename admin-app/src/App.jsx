import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import AdminNavbar from './components/AdminNavbar'
import ChatBot from './components/ChatBot'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import EventModeration from './pages/EventModeration'
import UserManagement from './pages/UserManagement'
import Revenue from './pages/Revenue'
import Analytics from './pages/Analytics'
import OrganizersList from './pages/OrganizersList'
import OrganizerEvents from './pages/OrganizerEvents'
import OrganizerBookings from './pages/OrganizerBookings'
import AllBookings from './pages/AllBookings'
import EmailLogs from './pages/EmailLogs'

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth()
  if (!currentUser || currentUser.role !== 'admin') return <Navigate to="/login" replace />
  return children
}

function AppInner() {
  const { currentUser } = useAuth()
  const isLoggedIn = currentUser?.role === 'admin'

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase.from('users').select('id').limit(1)
      if (error) {
        console.error('Supabase connection error:', error)
      } else {
        console.log('Supabase connected successfully')
      }
    }
    testConnection()
  }, [])

  return (
    <BrowserRouter>
      {isLoggedIn && <AdminNavbar />}
      <main>
        <Routes>
          <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/moderation" element={<ProtectedRoute><EventModeration /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
          <Route path="/revenue" element={<ProtectedRoute><Revenue /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/organizers" element={<ProtectedRoute><OrganizersList /></ProtectedRoute>} />
          <Route path="/organizers/:id/events" element={<ProtectedRoute><OrganizerEvents /></ProtectedRoute>} />
          <Route path="/organizers/:id/bookings" element={<ProtectedRoute><OrganizerBookings /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><AllBookings /></ProtectedRoute>} />
          <Route path="/emails" element={<ProtectedRoute><EmailLogs /></ProtectedRoute>} />
          
          <Route path="/" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
          <Route path="*" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </main>
      <ChatBot />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1a2235', color: '#f0f4ff', border: '1px solid #2a3a55', borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  )
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>
}
