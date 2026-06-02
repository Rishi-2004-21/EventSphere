import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import AttendeeNavbar from './components/AttendeeNavbar'
import ChatBot from './components/ChatBot'
import ProtectedRoute from './routes/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import DiscoveryFeed from './pages/DiscoveryFeed'
import EventDetail from './pages/EventDetail'
import Checkout from './pages/Checkout'
import MyTickets from './pages/MyTickets'
import TicketDetail from './pages/TicketDetail'
import Profile from './pages/Profile'

function AppInner() {
  const { currentUser } = useAuth()
  const isLoggedIn = currentUser?.role === 'attendee'

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
      {isLoggedIn && <AttendeeNavbar />}
      <main style={{ minHeight: '100vh' }}>
        <Routes>
          <Route path="/login" element={isLoggedIn ? <Navigate to="/discover" replace /> : <Login />} />
          <Route path="/register" element={isLoggedIn ? <Navigate to="/discover" replace /> : <Register />} />

          <Route path="/discover" element={
            <ProtectedRoute><DiscoveryFeed /></ProtectedRoute>
          } />
          <Route path="/events/:id" element={
            <ProtectedRoute><EventDetail /></ProtectedRoute>
          } />
          <Route path="/checkout/:id" element={
            <ProtectedRoute><Checkout /></ProtectedRoute>
          } />
          <Route path="/my-tickets" element={
            <ProtectedRoute><MyTickets /></ProtectedRoute>
          } />
          <Route path="/my-tickets/:bookingId" element={
            <ProtectedRoute><TicketDetail /></ProtectedRoute>
          } />
          <Route path="/wishlist" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to={isLoggedIn ? '/discover' : '/login'} replace />} />
          <Route path="*" element={<Navigate to={isLoggedIn ? '/discover' : '/login'} replace />} />
        </Routes>
      </main>
      <ChatBot />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a2235',
            color: '#f0f4ff',
            border: '1px solid #2a3a55',
            borderRadius: '10px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
