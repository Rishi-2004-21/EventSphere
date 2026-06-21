import { useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Bell, LogOut, Menu, X, User, ChevronDown, QrCode, Sun, Moon, Calendar } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabase'
import toast from 'react-hot-toast'

// Pure JS relative time — no date-fns timezone offset issues
function relativeTime(isoString) {
  const now = Date.now()
  const past = new Date(isoString).getTime()
  const diffMs = now - past
  if (diffMs < 0) return 'just now'
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`
  const diffDays = Math.floor(diffHr / 24)
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
}

export default function OrganizerNavbar() {
  const { currentUser, logout, theme, toggleTheme } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const notifRef = useRef(null)
  const userMenuRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!currentUser) return

    async function fetchNotifs() {
      const { data } = await supabase.from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(30)
      if (data) {
        // Deduplicate: keep only the most recent notification per unique message
        const seen = new Set()
        const unique = data.filter(n => {
          // Normalise: trim + lowercase for comparison
          const key = n.message.trim().toLowerCase()
          if (seen.has(key)) return false
          seen.add(key)
          return true
        }).slice(0, 15)
        setNotifications(unique)
        setUnreadCount(unique.filter(n => !n.is_read).length)
      }
    }
    fetchNotifs()

    const channel = supabase.channel('organizer-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUser.id}`
      }, (payload) => {
        const newNotif = payload.new
        setNotifications(prev => {
          // Don't add if an identical message already exists
          const isDuplicate = prev.some(n => n.message.trim().toLowerCase() === newNotif.message.trim().toLowerCase())
          if (isDuplicate) return prev
          return [newNotif, ...prev].slice(0, 15)
        })
        setUnreadCount(prev => prev + 1)

        if (newNotif.message.includes('rejected')) {
          toast.error(newNotif.message, {
            duration: 8000,
            style: { background: '#ef4444', color: '#fff' }
          })
        } else if (newNotif.message.includes('requires changes') || newNotif.message.includes('Changes requested')) {
          toast(newNotif.message, {
            duration: 8000,
            style: { background: '#f59e0b', color: '#111f35' }
          })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUser])

  async function handleNotifClick(notif) {
    // Mark as read
    if (!notif.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id)
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    setShowNotifDropdown(false)
    // Navigate to event if action_url present
    if (notif.action_url) {
      navigate(notif.action_url)
    } else if (notif.event_id) {
      navigate(`/events/${notif.event_id}`)
    }
  }

  async function markAllAsRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  function handleLogout() {
    logout()
    sessionStorage.clear()
    navigate('/login')
  }

  function handleNavClick() { setMobileMenuOpen(false) }

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', end: true },
    { to: '/events', label: 'My Events', icon: <Calendar size={14} /> },
    { to: '/create', label: 'Create Event' },
    { to: '/scanner', label: 'Scan Tickets', icon: <QrCode size={14} style={{ color: '#0891b2' }} /> },
    { to: '/wallet', label: 'Wallet' },
    { to: '/profile', label: 'Profile' },
  ]

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Logo */}
          <span className="navbar-logo" style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Tixque
          </span>

          {/* Desktop links — hidden on mobile via CSS */}
          <div className="navbar-links desktop-links">
            {navLinks.map(link => (
              <NavLink key={link.to} to={link.to} end={link.end}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {link.icon && link.icon}
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right controls — always visible */}
          <div className="navbar-right">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              style={{
                background: 'transparent', border: '1px solid var(--color-border)',
                borderRadius: '50%', width: '36px', height: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
              }}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-border)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="var(--color-organizer-light)" />}
            </button>

            {/* Notification bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifDropdown(v => !v)}
                style={{
                  position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
                  padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center',
                  transition: 'all 0.2s', color: 'var(--color-text-primary)',
                }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '2px', right: '2px', width: '18px', height: '18px',
                    borderRadius: '50%', background: 'var(--color-error)', border: '2px solid var(--color-bg)',
                    color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 700, lineHeight: 1,
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="notif-dropdown">
                  {/* Header */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.875rem 1rem', borderBottom: '1px solid var(--color-border)',
                    position: 'sticky', top: 0, background: 'var(--color-bg-card)', zIndex: 1,
                  }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                      Notifications{unreadCount > 0 && <span style={{ color: 'var(--color-error)', fontWeight: 600, fontSize: '0.8rem', marginLeft: '6px' }}>({unreadCount} new)</span>}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} style={{
                          background: 'none', border: 'none', color: 'var(--color-organizer-accent)',
                          fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600,
                        }}>Mark all read</button>
                      )}
                      <button
                        onClick={() => setShowNotifDropdown(false)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                          color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center',
                          borderRadius: '50%', lineHeight: 1,
                        }}
                        aria-label="Close notifications"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Notification list */}
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                      🔔 No notifications yet
                    </div>
                  ) : (
                    notifications.map(notif => {
                      let dotColor = 'var(--color-success)'
                      if (notif.message.toLowerCase().includes('rejected')) dotColor = 'var(--color-error)'
                      else if (notif.message.toLowerCase().includes('requires changes') || notif.message.toLowerCase().includes('changes requested')) dotColor = 'var(--color-warning)'
                      else if (notif.message.toLowerCase().includes('approved')) dotColor = 'var(--color-organizer-accent)'

                      const isClickable = !!(notif.action_url || notif.event_id)

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotifClick(notif)}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: '10px',
                            padding: '14px 16px', borderBottom: '1px solid var(--color-border)',
                            cursor: isClickable ? 'pointer' : 'default',
                            background: notif.is_read ? 'transparent' : 'rgba(8,145,178,0.06)',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-secondary)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = notif.is_read ? 'transparent' : 'rgba(8,145,178,0.06)' }}
                        >
                          {/* Colored dot */}
                          <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: dotColor, marginTop: '6px', flexShrink: 0,
                          }} />

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '13px', color: 'var(--color-text-primary)',
                              lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'break-word',
                              fontWeight: notif.is_read ? 400 : 600,
                            }}>
                              {notif.message}
                            </div>
                            <div
                              style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', cursor: 'help' }}
                              title={new Date(notif.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            >
                              {relativeTime(notif.created_at)}
                              {isClickable && <span style={{ marginLeft: '6px', color: 'var(--color-organizer-accent)', fontSize: '11px' }}>→ View</span>}
                            </div>
                          </div>

                          {/* Unread dot */}
                          {!notif.is_read && (
                            <div style={{
                              width: '6px', height: '6px', borderRadius: '50%',
                              background: 'var(--color-organizer-accent)', flexShrink: 0, marginTop: '6px',
                            }} />
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            {/* User chip + dropdown */}
            {currentUser && (
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    background: 'rgba(8,145,178,0.1)', border: '1px solid rgba(8,145,178,0.3)',
                    borderRadius: '999px', padding: '0.3rem 0.75rem', cursor: 'pointer',
                    color: 'var(--color-text-primary)', fontSize: '0.85rem', fontWeight: 600, flexShrink: 0,
                  }}
                >
                  <User size={14} style={{ color: 'var(--color-organizer-accent)' }} />
                  <span className="user-name-desktop">{currentUser.name?.split(' ')[0]}</span>
                  <ChevronDown size={12} style={{ color: 'var(--color-text-muted)', transition: 'transform 0.2s', transform: showUserMenu ? 'rotate(180deg)' : 'none' }} />
                </button>

                {showUserMenu && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                    borderRadius: '8px', minWidth: '160px', zIndex: 300,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)', overflow: 'hidden',
                  }}>
                    <button onClick={() => { navigate('/profile'); setShowUserMenu(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.65rem 1rem', background: 'none', border: 'none', color: 'var(--color-text-primary)', fontSize: '0.85rem', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <User size={14} style={{ color: 'var(--color-organizer-accent)' }} /> My Profile
                    </button>
                    <div style={{ height: '1px', background: 'var(--color-border)' }} />
                    <button onClick={handleLogout}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.65rem 1rem', background: 'none', border: 'none', color: 'var(--color-organizer-accent)', fontSize: '0.85rem', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Hamburger — only on mobile */}
            <button
              className="hamburger-btn"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Toggle menu"
              style={{ display: 'none' }}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div style={{
          background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)',
          zIndex: 99, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}>
          {navLinks.map(link => (
            <NavLink key={link.to} to={link.to} end={link.end}
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={handleNavClick}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', fontSize: '16px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              {link.icon && link.icon}
              {link.label}
            </NavLink>
          ))}
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none',
              border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.5rem 1rem',
              color: 'var(--color-error)', fontSize: '0.875rem', cursor: 'pointer',
            }}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  )
}
