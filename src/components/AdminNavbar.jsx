import { useNavigate, NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { LogOut, Shield } from 'lucide-react'

export default function AdminNavbar() {
  const { state, logoutUser } = useApp()
  const currentUser = state?.auth?.currentUser
  const navigate = useNavigate()

  function handleLogout() {
    logoutUser()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Shield size={18} /> EventSphere
        </span>
        <div className="navbar-links">
          <NavLink to="/admin" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
          <NavLink to="/admin/moderation" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Moderation</NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Users</NavLink>
          <NavLink to="/admin/revenue" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Revenue</NavLink>
          <NavLink to="/admin/analytics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Analytics</NavLink>
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
