import { useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Bell, LogOut, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { formatDistanceToNow } from 'date-fns'

export default function AttendeeNavbar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const notifRef = useRef(null)

  useEffect(() => {
    if (!currentUser) return
    fetchNotifications()

    // Realtime subscription for new notifications
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

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPanel(false)
      }
    }
    if (showNotifPanel) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showNotifPanel])

  async function fetchNotifications() {
    const { data, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(20)

    setNotifications(data || [])
    setUnreadCount((data || []).filter(n => !n.is_read).length)
  }

  async function markAllRead() {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', currentUser.id)
      .eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-logo">EventSphere</span>

        <div className="navbar-links">
          <NavLink to="/discover" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Discover
          </NavLink>
          <NavLink to="/my-tickets" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            My Tickets
          </NavLink>
          <NavLink to="/wishlist" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Wishlist
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Profile
          </NavLink>
        </div>

        <div className="navbar-right">
          {/* Notification Bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              id="notif-bell-btn"
              className="notif-btn"
              title="Notifications"
              onClick={() => setShowNotifPanel(v => !v)}
              style={{ position: 'relative' }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  minWidth: '18px',
                  height: '18px',
                  background: '#ef4444',
                  borderRadius: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'white',
                  padding: '0 3px',
                  border: '2px solid #0a0f1e',
                  lineHeight: 1,
                  pointerEvents: 'none',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifPanel && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">
                  <span className="notif-dropdown-title">
                    <Bell size={14} /> Notifications
                    {unreadCount > 0 && <span className="notif-count-badge">{unreadCount}</span>}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {unreadCount > 0 && (
                      <button className="notif-mark-read-btn" onClick={markAllRead}>
                        Mark all read
                      </button>
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
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
                        <div className="notif-item-dot" style={{ background: n.is_read ? 'transparent' : 'var(--purple)' }} />
                        <div className="notif-item-content">
                          <p className="notif-item-msg">{n.message}</p>
                          <span className="notif-item-time">
                            {n.created_at
                              ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true })
                              : 'just now'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {currentUser && (
            <span className="nav-user-name">{currentUser.name?.split(' ')[0]}</span>
          )}
          <button id="logout-btn" className="nav-logout-btn" onClick={handleLogout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
