import { useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { Bell, LogOut, X, Menu, User, Sun, Moon } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { formatDistanceToNow } from 'date-fns'

export default function AttendeeNavbar() {
  const { currentUser, logout } = useAuth()
  const { state, dispatch } = useApp()
  const theme = state?.theme || 'dark'
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const notifRef = useRef(null)

  useEffect(() => {
    if (!currentUser) return
    fetchNotifications()

    const channel = supabase
      .channel('attendee-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUser.id}`,
      }, () => fetchNotifications())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [currentUser])

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifPanel(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => { setIsMenuOpen(false) }, [navigate])

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications').select('*', { count: 'exact' })
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false }).limit(20)
    setNotifications(data || [])
    setUnreadCount((data || []).filter(n => !n.is_read).length)
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ is_read: true })
      .eq('user_id', currentUser.id).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  async function handleLogout() {
    try {
      const { supabase } = await import('../supabase')
      await supabase.auth.signOut().catch(() => {})
    } catch {}
    logout()
    sessionStorage.clear()
    navigate('/login', { replace: true })
  }

  const navLinks = [
    { to: '/discover', label: 'Discover' },
    { to: '/my-tickets', label: 'My Tickets' },
    { to: '/wishlist', label: 'Wishlist' },
    { to: '/profile', label: 'Profile' },
  ]

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <span className="navbar-logo gradient-text">EventSphere</span>

          {/* Desktop nav links */}
          <div className="navbar-links navbar-links-desktop">
            {navLinks.map(link => (
              <NavLink key={link.to} to={link.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="navbar-right">
            {/* Theme Toggle */}
            <button 
              onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'transparent', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.3s ease',
                color: theme === 'dark' ? 'var(--amber)' : 'var(--purple)'
              }}
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notification Bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button id="notif-bell-btn" className="notif-btn" title="Notifications"
                onClick={() => setShowNotifPanel(v => !v)} style={{ position: 'relative' }}>
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-6px', right: '-6px',
                    minWidth: '18px', height: '18px', background: '#ef4444',
                    borderRadius: '9px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '10px', fontWeight: 700,
                    color: 'white', padding: '0 3px', border: '2px solid #070d1a',
                    lineHeight: 1, pointerEvents: 'none',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifPanel && (
                <div className="notif-dropdown">
                  <div className="notif-dropdown-header">
                    <span className="notif-dropdown-title">
                      <Bell size={14} /> Notifications
                      {unreadCount > 0 && <span className="notif-count-badge">{unreadCount}</span>}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {unreadCount > 0 && (
                        <button className="notif-mark-read-btn" onClick={markAllRead}>Mark all read</button>
                      )}
                      <button className="chatbot-close-btn" onClick={() => setShowNotifPanel(false)}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <div className="notif-empty">
                        <Bell size={24} style={{ opacity: 0.3 }} />
                        <span>No notifications yet</span>
                      </div>
                    ) : notifications.map(n => (
                      <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
                        <div className="notif-item-dot" style={{ background: n.is_read ? 'transparent' : 'var(--purple)' }} />
                        <div className="notif-item-content">
                          <p className="notif-item-msg">{n.message}</p>
                          <span className="notif-item-time">
                            {n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true }) : 'just now'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User chip — desktop only — links to profile (logout lives on Profile page) */}
            {currentUser && (
              <button
                className="nav-user-name-desktop nav-user-chip"
                onClick={() => navigate('/profile')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
                  borderRadius: '999px', padding: '0.3rem 0.75rem', cursor: 'pointer',
                  color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600,
                }}
                title="Go to profile"
              >
                <User size={14} style={{ color: 'var(--purple)' }} />
                {currentUser.name?.split(' ')[0]}
              </button>
            )}

            {/* Hamburger — mobile only */}
            <button id="hamburger-btn" className="hamburger-btn"
              onClick={() => setIsMenuOpen(v => !v)} aria-label="Toggle menu">
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {isMenuOpen && (
        <div className="mobile-nav-dropdown">
          {navLinks.map(link => (
            <NavLink key={link.to} to={link.to}
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}>
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
