import { useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, Shield } from 'lucide-react'

export default function AdminNavbar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() { logout(); navigate('/login') }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Shield size={18} /> EventSphere
        </span>
        <div className="navbar-links">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
          <NavLink to="/moderation" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Moderation</NavLink>
          <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Users</NavLink>
          <NavLink to="/organizers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Organizers</NavLink>
          <NavLink to="/revenue" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Revenue</NavLink>
          <NavLink to="/analytics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Analytics</NavLink>
          <NavLink to="/bookings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>All Bookings</NavLink>
          <NavLink to="/emails" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Email Logs</NavLink>
        </div>
        <div className="navbar-right">
          {currentUser && <span className="nav-user-name">SuperAdmin</span>}
          <button id="logout-btn" className="nav-logout-btn" onClick={handleLogout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
