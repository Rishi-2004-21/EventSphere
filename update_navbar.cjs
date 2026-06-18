const fs = require('fs');
let code = fs.readFileSync('organizer-app/src/components/OrganizerNavbar.jsx', 'utf-8');

// Imports
code = code.replace(
  "import { useState, useRef, useEffect } from 'react'",
  "import { useState, useRef, useEffect } from 'react'\nimport { supabase } from '../supabase'\nimport { formatDistanceToNow } from 'date-fns'\nimport toast from 'react-hot-toast'"
);

// State vars
code = code.replace(
  "const [showUserMenu, setShowUserMenu] = useState(false)",
  "const [showUserMenu, setShowUserMenu] = useState(false)\n  const [notifications, setNotifications] = useState([])\n  const [unreadCount, setUnreadCount] = useState(0)\n  const [showNotifDropdown, setShowNotifDropdown] = useState(false)\n  const notifRef = useRef(null)"
);

// Mousedown effect
code = code.replace(
  "if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false)",
  "if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false)\n      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifDropdown(false)"
);

// Add new effect for notifs
const notifLogic = `
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
        filter: \`user_id=eq.\${currentUser.id}\`
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
`;
code = code.replace("function handleLogout() {", notifLogic + "\n  function handleLogout() {");

// Theme toggle button replacement
const themeToggleOld = `            <button 
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
            </button>`;

const themeToggleNew = `            <button 
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
            </button>`;
code = code.replace(themeToggleOld, themeToggleNew);

// Notification bell
const notifBellOld = `<Bell size={18} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />`;
const notifBellNew = `            <div ref={notifRef} style={{ position: 'relative' }}>
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
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{formatDistanceToNow(new Date(notif.created_at))} ago</div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>`;
code = code.replace(notifBellOld, notifBellNew);

fs.writeFileSync('organizer-app/src/components/OrganizerNavbar.jsx', code);
console.log('Updated OrganizerNavbar.jsx');
