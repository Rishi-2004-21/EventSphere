import { useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Bell, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function OrganizerNavbar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!currentUser) return
    supabase.from('notifications').select('id', { count: 'exact' })
      .eq('user_id', currentUser.id).eq('is_read', false)
      .then(({ count }) => setUnreadCount(count || 0))
  }, [currentUser])

  function handleLogout() { logout(); navigate('/login') }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-logo">EventSphere</span>
        <div className="navbar-links">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
          <NavLink to="/create" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Create Event</NavLink>
          <NavLink to="/events" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>My Events</NavLink>
          <NavLink to="/bookings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Bookings</NavLink>
          <NavLink to="/wallet" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Wallet</NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Profile</NavLink>
        </div>
        <div className="navbar-right">
          <button className="notif-btn" title="Notifications">
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-dot" />}
          </button>
          {currentUser && <span className="nav-user-name">{currentUser.name?.split(' ')[0]}</span>}
          <button id="logout-btn" className="nav-logout-btn" onClick={handleLogout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
