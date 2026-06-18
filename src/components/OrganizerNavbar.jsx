import { useNavigate, NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Bell, LogOut } from 'lucide-react'

export default function OrganizerNavbar() {
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
        <span className="navbar-logo">Tixque</span>
        <div className="navbar-links">
          <NavLink to="/organizer" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
          <NavLink to="/organizer/create" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Create Event</NavLink>
          <NavLink to="/organizer/wallet" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Wallet</NavLink>
          <NavLink to="/organizer/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Profile</NavLink>
        </div>
        <div className="navbar-right">
          <Bell size={18} style={{ cursor: 'pointer', color: 'var(--color-text-muted)' }} />
          {currentUser && <span className="nav-user-name">{currentUser.name?.split(' ')[0]}</span>}
          <button id="logout-btn" className="nav-logout-btn" onClick={handleLogout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
