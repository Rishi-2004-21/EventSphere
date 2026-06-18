import { useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Bell, LogOut, Menu, X, User, ChevronDown, QrCode, Sun, Moon } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabase'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

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
    if (!currentUser) return;
    
    async function fetchNotifs() {
      const { data } = await supabase.from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    }
    fetchNotifs();

    const channel = supabase.channel('organizer-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUser.id}`
      }, (payload) => {
        const newNotif = payload.new;
        setNotifications(prev => [newNotif, ...prev].slice(0, 10));
        setUnreadCount(prev => prev + 1);

        if (newNotif.message.includes('rejected')) {
          toast.error(newNotif.message, { 
            duration: 8000, 
            style: { background: '#ef4444', color: '#fff' } 
          });
        } else if (newNotif.message.includes('requires changes') || newNotif.message.includes('Changes requested')) {
          toast(newNotif.message, { 
            duration: 8000, 
            style: { background: '#f59e0b', color: '#111f35' } 
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [currentUser]);

  async function markAsRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }

  async function markAllAsRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }

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
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-border)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {theme === 'dark' ? (
                <Sun size={18} color="#f59e0b" />
              ) : (
                <Moon size={18} color="var(--color-organizer-light)" />
              )}
            </button>
                        <div ref={notifRef} style={{ position: 'relative' }}>
              <button className="notif-btn" onClick={() => setShowNotifDropdown(!showNotifDropdown)} style={{
                position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
                padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', transition: 'all 0.2s'
              }}>
                <Bell size={18} style={{ color: 'var(--color-text-primary)' }} />
                {unreadCount > 0 && <span className="notif-dot" style={{
                  position: 'absolute', top: '4px', right: '4px', width: '16px', height: '16px',
                  borderRadius: '50%', background: 'var(--color-error)', border: '1px solid var(--color-bg)',
                  color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                }}>{unreadCount}</span>}
              </button>
              
              {showNotifDropdown && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: '320px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                  borderRadius: '12px', zIndex: 200, boxShadow: 'var(--color-shadow)',
                  maxHeight: '400px', overflowY: 'auto'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ fontWeight: 600 }}>Notifications</span>
                    <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--color-organizer-accent)', fontSize: '0.8rem', cursor: 'pointer' }}>Mark All as Read</button>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No notifications yet</div>
                  ) : (
                    notifications.map(notif => {
                      let dotColor = 'var(--color-success)'; // default green (booking)
                      if (notif.message.includes('rejected')) dotColor = 'var(--color-error)';
                      else if (notif.message.includes('requires changes') || notif.message.includes('Changes requested')) dotColor = 'var(--color-warning)';
                      else if (notif.message.includes('approved')) dotColor = 'var(--color-organizer-light)'; // teal
                      
                      return (
                        <div key={notif.id} onClick={() => markAsRead(notif.id)} style={{
                          padding: '1rem', borderBottom: '1px solid var(--color-border)', cursor: 'pointer',
                          background: notif.is_read ? 'transparent' : 'rgba(128,128,128,0.1)',
                          display: 'flex', gap: '0.75rem', alignItems: 'flex-start'
                        }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor, marginTop: '6px', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', marginBottom: '0.25rem', lineHeight: 1.4 }}>{notif.message}</div>
                            <div 
                              style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', cursor: 'help' }}
                              title={new Date(notif.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            >
                              {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, includeSeconds: true })}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>

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
                    background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                    borderRadius: '8px', minWidth: '160px', zIndex: 200,
                    boxShadow: '0 8px 24px var(--color-shadow)', overflow: 'hidden',
                  }}>
                    <button onClick={() => { navigate('/profile'); setShowUserMenu(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.65rem 1rem', background: 'none', border: 'none', color: 'var(--color-text-primary)', fontSize: '0.85rem', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <User size={14} style={{ color: 'var(--teal)' }} /> My Profile
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
