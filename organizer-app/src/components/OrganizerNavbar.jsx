import { useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Bell, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function OrganizerNavbar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function handleNavClick() {
    setMobileMenuOpen(false)
  }

  const navLinks = [
    { to: '/organizer', label: 'Dashboard', end: true },
    { to: '/organizer/create', label: 'Create Event' },
    { to: '/organizer/wallet', label: 'Wallet' },
    { to: '/organizer/profile', label: 'Profile' },
  ]

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <span className="navbar-logo">EventSphere</span>

          {/* Desktop links */}
          <div className="navbar-links">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="navbar-right">
            <Bell size={18} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
            {currentUser && (
              <span className="nav-user-name">{currentUser.name?.split(' ')[0]}</span>
            )}
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
              end={link.end}
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              {link.label}
            </NavLink>
          ))}
          <div className="mobile-nav-divider" />
          {currentUser && (
            <div className="mobile-nav-user">👤 {currentUser.name}</div>
          )}
          <button className="mobile-nav-logout" onClick={handleLogout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      )}
    </>
  )
}
