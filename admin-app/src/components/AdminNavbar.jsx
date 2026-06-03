import { useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, Shield, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function AdminNavbar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  function handleLogout() { logout(); navigate('/login') }

  function handleNavClick() { setMobileMenuOpen(false) }

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/moderation', label: 'Moderation' },
    { to: '/users', label: 'Users' },
    { to: '/organizers', label: 'Organizers' },
    { to: '/revenue', label: 'Revenue' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/bookings', label: 'All Bookings' },
    { to: '/emails', label: 'Email Logs' },
  ]

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <span className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Shield size={18} /> EventSphere
          </span>

          {/* Desktop links */}
          <div className="navbar-links">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="navbar-right">
            {currentUser && <span className="nav-user-name">SuperAdmin</span>}
            <button id="logout-btn" className="nav-logout-btn" onClick={handleLogout}>
              <LogOut size={14} /> Logout
            </button>

            {/* Hamburger — mobile only */}
            <button
              className="hamburger-btn"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-nav-dropdown">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              {link.label}
            </NavLink>
          ))}
          <div className="mobile-nav-divider" />
          <div className="mobile-nav-user">🛡️ SuperAdmin</div>
          <button className="mobile-nav-logout" onClick={handleLogout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      )}
    </>
  )
}
