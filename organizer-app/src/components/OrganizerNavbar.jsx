import { useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Bell, LogOut, Menu, X, User, ChevronDown, QrCode, Sun, Moon } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function OrganizerNavbar() {
  const { currentUser, logout, theme, toggleTheme } = useAuth()
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

  function handleLogout() {
    logout()
    sessionStorage.clear()
    navigate('/organizer/login')
  }

  function handleNavClick() { setMobileMenuOpen(false) }

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', end: true },
    { to: '/create', label: 'Create Event' },
    { to: '/scanner', label: 'Scan Tickets', icon: <QrCode size={14} style={{ color: '#0891b2' }} /> },
    { to: '/wallet', label: 'Wallet' },
    { to: '/profile', label: 'Profile' },
  ]

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <span className="navbar-logo" style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Tixque
          </span>

          {/* Desktop links */}
          <div className="navbar-links">
            {navLinks.map(link => (
              <NavLink key={link.to} to={link.to} end={link.end}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {link.icon && link.icon}
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="navbar-right">
            <button 
              onClick={toggleTheme}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: 'none', cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {theme === 'dark' ? (
                <Sun size={18} style={{ color: '#f59e0b' }} />
              ) : (
                <Moon size={18} style={{ color: '#0891b2' }} />
              )}
            </button>
            <Bell size={18} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />

            {/* User chip + dropdown (desktop) */}
            {currentUser && (
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    background: 'rgba(8,145,178,0.1)', border: '1px solid rgba(8,145,178,0.3)',
                    borderRadius: '999px', padding: '0.3rem 0.75rem', cursor: 'pointer',
                    color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600,
                  }}
                >
                  <User size={14} style={{ color: 'var(--teal)' }} />
                  {currentUser.name?.split(' ')[0]}
                  <ChevronDown size={12} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: showUserMenu ? 'rotate(180deg)' : 'none' }} />
                </button>

                {showUserMenu && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: '8px', minWidth: '160px', zIndex: 200,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)', overflow: 'hidden',
                  }}>
                    <button onClick={() => { navigate('/organizer/profile'); setShowUserMenu(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.65rem 1rem', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <User size={14} style={{ color: 'var(--teal)' }} /> My Profile
                    </button>
                    <div style={{ height: '1px', background: 'var(--border)' }} />
                    <button onClick={handleLogout}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.65rem 1rem', background: 'none', border: 'none', color: '#0891b2', fontSize: '0.85rem', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(8,145,178,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

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
            <NavLink key={link.to} to={link.to} end={link.end}
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={handleNavClick}>
              {link.label}
            </NavLink>
          ))}
          <div className="mobile-nav-divider" />
          {currentUser && <div className="mobile-nav-user">👤 {currentUser.name}</div>}
          <button className="mobile-nav-logout" onClick={handleLogout}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      )}
    </>
  )
}
