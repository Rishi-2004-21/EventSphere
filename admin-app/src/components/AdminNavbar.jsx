import { useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, Shield, Menu, X, User, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function AdminNavbar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleLogout() { logout(); sessionStorage.clear(); navigate('/admin/login') }
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
          <span className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'linear-gradient(135deg, #e11d48, #fb7185)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            <Shield size={18} style={{ WebkitTextFillColor: 'initial', color: '#e11d48' }} /> Tixque
          </span>

          {/* Desktop links */}
          <div className="navbar-links">
            {navLinks.map(link => (
              <NavLink key={link.to} to={link.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="navbar-right">
            {/* User chip + dropdown */}
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.3)',
                  borderRadius: '999px', padding: '0.3rem 0.75rem', cursor: 'pointer',
                  color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600,
                }}
              >
                <User size={14} style={{ color: 'var(--accent)' }} />
                SuperAdmin
                <ChevronDown size={12} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: showUserMenu ? 'rotate(180deg)' : 'none' }} />
              </button>

              {showUserMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '8px', minWidth: '160px', zIndex: 200,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)', overflow: 'hidden',
                }}>
                  <button onClick={handleLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.65rem 1rem', background: 'none', border: 'none', color: '#e11d48', fontSize: '0.85rem', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(225,29,72,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Hamburger — mobile only */}
            <button className="hamburger-btn" onClick={() => setMobileMenuOpen(v => !v)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-nav-dropdown">
          {navLinks.map(link => (
            <NavLink key={link.to} to={link.to}
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={handleNavClick}>
              {link.label}
            </NavLink>
          ))}
          <div className="mobile-nav-divider" />
          <div className="mobile-nav-user">🛡️ SuperAdmin</div>
          <button className="mobile-nav-logout" onClick={handleLogout}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      )}
    </>
  )
}
