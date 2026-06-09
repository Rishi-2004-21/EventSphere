import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import { Toaster } from 'react-hot-toast'
import { AppProvider, useApp } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import ChatBot from './components/ChatBot'
import LoadingSpinner from './components/LoadingSpinner'
import BecomeOrganizerPopup from './components/BecomeOrganizerPopup'

// Route Guards
import AttendeeRoute from './routes/AttendeeRoute'
import OrganizerRoute from './routes/OrganizerRoute'
import AdminRoute from './routes/AdminRoute'

// Navbars
import AttendeeNavbar from './components/AttendeeNavbar'
import OrganizerNavbar from './components/OrganizerNavbar'
import AdminNavbar from './components/AdminNavbar'

// Public Pages
import LandingPage from './pages/attendee/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'

// Attendee Pages
import DiscoveryFeed from './pages/DiscoveryFeed'
import EventDetail from './pages/EventDetail'
import Checkout from './pages/Checkout'
import ConsentPage from './pages/ConsentPage'
import MyTickets from './pages/MyTickets'
import TicketDetail from './pages/TicketDetail'
import Profile from './pages/Profile'

// Organizer Pages
import OrgDashboard from './pages/organizer/Dashboard'
import OrgCreateEvent from './pages/organizer/CreateEvent'
import OrgWallet from './pages/organizer/WalletPage'
import OrgEventDetail from './pages/organizer/EventDetail'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminModeration from './pages/admin/Moderation'
import AdminUsers from './pages/admin/UserManagement'
import AdminRevenue from './pages/admin/RevenuePage'
import AdminAnalytics from './pages/admin/Analytics'

function AppInner() {
  const { state, authLoading } = useApp()
  const currentUser = state?.auth?.currentUser

  console.log("CURRENT USER ROLE:", currentUser?.role)
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

  // Apply Theme to root element
  useEffect(() => {
    const theme = state?.theme || 'dark'
    document.documentElement.className = theme === 'dark' ? 'dark-theme' : 'light-theme'
    document.body.setAttribute('data-theme', theme)
  }, [state?.theme])

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a' }}>
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <BrowserRouter>
      {currentUser?.role === 'attendee' && <AttendeeNavbar />}
      {currentUser?.role === 'organizer' && <OrganizerNavbar />}
      {currentUser?.role === 'admin' && <AdminNavbar />}
      
      <main style={{ minHeight: '100vh' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/login" 
            element={
              currentUser 
                ? <Navigate to={currentUser.role === 'admin' ? '/admin' : currentUser.role === 'organizer' ? '/organizer' : '/discover'} replace /> 
                : <Login />
            } 
          />
          <Route 
            path="/register" 
            element={
              currentUser 
                ? <Navigate to={currentUser.role === 'admin' ? '/admin' : currentUser.role === 'organizer' ? '/organizer' : '/discover'} replace /> 
                : <Register />
            } 
          />

          {/* Attendee Routes */}
          <Route path="/discover" element={<AttendeeRoute><DiscoveryFeed /></AttendeeRoute>} />
          <Route path="/events" element={<AttendeeRoute><DiscoveryFeed /></AttendeeRoute>} />
          <Route path="/events/:id" element={<AttendeeRoute><EventDetail /></AttendeeRoute>} />
          <Route path="/consent/:id" element={<AttendeeRoute><ConsentPage /></AttendeeRoute>} />
          <Route path="/checkout/:id" element={<AttendeeRoute><Checkout /></AttendeeRoute>} />
          <Route path="/my-tickets" element={<AttendeeRoute><MyTickets /></AttendeeRoute>} />
          <Route path="/my-tickets/:bookingId" element={<AttendeeRoute><TicketDetail /></AttendeeRoute>} />
          <Route path="/profile" element={<AttendeeRoute><Profile /></AttendeeRoute>} />

          {/* Organizer Routes */}
          <Route path="/organizer" element={<OrganizerRoute><OrgDashboard /></OrganizerRoute>} />
          <Route path="/organizer/create" element={<OrganizerRoute><OrgCreateEvent /></OrganizerRoute>} />
          <Route path="/organizer/wallet" element={<OrganizerRoute><OrgWallet /></OrganizerRoute>} />
          <Route path="/organizer/profile" element={<OrganizerRoute><Profile /></OrganizerRoute>} />
          <Route path="/organizer/events/:id" element={<OrganizerRoute><OrgEventDetail /></OrganizerRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/moderation" element={<AdminRoute><AdminModeration /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/revenue" element={<AdminRoute><AdminRevenue /></AdminRoute>} />
          <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />

          {/* Catch All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <ChatBot />
      <BecomeOrganizerPopup />
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
      <AppProvider>
        <AppInner />
      </AppProvider>
    </AuthProvider>
  )
}
