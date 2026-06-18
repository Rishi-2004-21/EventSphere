import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import OrganizerNavbar from './components/OrganizerNavbar'
import ChatBot from './components/ChatBot'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateEvent from './pages/CreateEvent'
import WalletPage from './pages/WalletPage'
import EventDetail from './pages/EventDetail'
import BookingsPage from './pages/BookingsPage'
import TicketScanner from './pages/TicketScanner'
import Profile from './pages/Profile'

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth()
  if (!currentUser || currentUser.role !== 'organizer') return <Navigate to="/login" replace />
  return children
}

function AppInner() {
  const { currentUser, theme } = useAuth()
  const isLoggedIn = currentUser?.role === 'organizer'

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

  useEffect(() => {
    if (theme) {
      // Apply to <html> element so native browser controls (date pickers) inherit color-scheme
      document.documentElement.setAttribute('data-theme', theme)
      document.body.setAttribute('data-theme', theme) // keep for any old body selectors
    }
  }, [theme])

  return (
    <BrowserRouter>
      {isLoggedIn && <OrganizerNavbar />}
      <main>
        <Routes>
          <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/register" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
          <Route path="/scanner" element={<ProtectedRoute><TicketScanner /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
          <Route path="*" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </main>
      <ChatBot />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1a2235', color: '#f0f4ff', border: '1px solid #2a3a55', borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' },
          success: { iconTheme: { primary: '#0d9488', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  )
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>
}
