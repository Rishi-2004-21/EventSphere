import { useState, useEffect, useRef } from 'react'
import { X, Sparkles, ExternalLink, Info } from 'lucide-react'
import { useApp } from '../context/AppContext'

const ORGANIZER_PORTAL_URL = import.meta.env.VITE_ORGANIZER_PORTAL_URL || 'https://event-sphere-2q6v.vercel.app/login'

export default function BecomeOrganizerPopup() {
  // Use AppContext (same source of truth as the rest of the app) instead of AuthContext
  const { state } = useApp()
  const currentUser = state?.auth?.currentUser

  const [visible, setVisible] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const autoDismissRef = useRef(null)
  const hasShownRef = useRef(false) // prevent showing twice in same mount cycle

  useEffect(() => {
    // Only for attendees
    if (!currentUser || currentUser.role !== 'attendee') return

    // Don't show if already dismissed this session
    if (sessionStorage.getItem('organizer_popup_dismissed') === 'true') return

    // Don't show again if already shown this component lifecycle
    if (hasShownRef.current) return

    hasShownRef.current = true
    setVisible(true)

    // Auto-dismiss after 10 seconds
    autoDismissRef.current = setTimeout(() => {
      setVisible(false)
    }, 10000)

    return () => {
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current)
    }
  }, [currentUser?.id, currentUser?.role]) // trigger when user logs in

  function dismiss() {
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current)
    setVisible(false)
    sessionStorage.setItem('organizer_popup_dismissed', 'true')
  }

  function openOrganizerPortal() {
    window.open(ORGANIZER_PORTAL_URL, '_blank', 'noopener,noreferrer')
    dismiss()
  }

  if (!visible) return null

  return (
    <>
      {/* Info Modal */}
      {showInfo && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
            zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowInfo(false)}
        >
          <div
            style={{
              background: '#1a2235', border: '1px solid rgba(13,148,136,0.3)',
              borderRadius: '1rem', width: '100%', maxWidth: '420px',
              padding: '2rem', position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowInfo(false)}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Sparkles size={20} style={{ color: '#0d9488' }} />
              <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#f0f4ff', margin: 0 }}>
                Become an Organizer
              </h2>
            </div>

            <div style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              <p style={{ margin: '0 0 0.75rem' }}>
                As an <strong style={{ color: '#f0f4ff' }}>Tixque Organizer</strong>, you can:
              </p>
              <ul style={{ margin: 0, padding: '0 0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li>Create and publish your own events</li>
                <li>Reach thousands of attendees across India</li>
                <li>Manage ticket sales and track revenue</li>
                <li>Get AI-powered spam protection and categorization</li>
                <li>Send automated email reminders to your audience</li>
              </ul>
            </div>

            <div style={{
              background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)',
              borderRadius: '0.65rem', padding: '0.75rem 1rem',
              fontSize: '0.78rem', color: '#94a3b8', marginBottom: '1.25rem',
            }}>
              ℹ️ After registration, your account will be reviewed by our admin team within 24 hours before you can start creating events.
            </div>

            <button
              onClick={openOrganizerPortal}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '0.65rem',
                background: '#0d9488', border: 'none', color: '#fff',
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
            >
              <ExternalLink size={15} /> Get Started as Organizer
            </button>
          </div>
        </div>
      )}

      {/* Popup Card */}
      <div
        style={{
          position: 'fixed', bottom: '24px', left: '24px',
          zIndex: 999, maxWidth: '320px', width: 'calc(100vw - 48px)',
          background: '#1a2235',
          border: '1px solid rgba(255,255,255,0.08)',
          borderLeft: '4px solid #0d9488',
          borderRadius: '0.875rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(13,148,136,0.15)',
          overflow: 'hidden',
          animation: 'slideInPopup 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div style={{ padding: '1.1rem 1.25rem 1.25rem' }}>
          {/* Close button */}
          <button
            onClick={dismiss}
            aria-label="Dismiss popup"
            style={{
              position: 'absolute', top: '0.75rem', right: '0.75rem',
              background: 'rgba(255,255,255,0.06)', border: 'none',
              borderRadius: '50%', width: '26px', height: '26px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#94a3b8',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            <X size={13} />
          </button>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.3)',
            borderRadius: '999px', padding: '0.2rem 0.6rem',
            fontSize: '0.68rem', fontWeight: 700, color: '#0d9488',
            marginBottom: '0.6rem', letterSpacing: '0.04em',
          }}>
            <Sparkles size={10} /> NEW OPPORTUNITY
          </div>

          {/* Heading */}
          <h3 style={{
            color: '#f0f4ff', fontWeight: 800, fontSize: '0.95rem',
            lineHeight: 1.3, margin: '0 0 0.5rem',
          }}>
            Host Your Own Events on Tixque
          </h3>

          {/* Body */}
          <p style={{
            color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.55, margin: '0 0 1rem',
          }}>
            Become an organizer and reach thousands of attendees. Set up your events in minutes.
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setShowInfo(true)}
              style={{
                flex: 1, padding: '0.55rem 0.5rem', borderRadius: '0.55rem',
                background: 'transparent', border: '1px solid #0d9488',
                color: '#0d9488', fontSize: '0.78rem', fontWeight: 600,
                cursor: 'pointer', transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(13,148,136,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Info size={12} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
              Learn More
            </button>
            <button
              onClick={openOrganizerPortal}
              style={{
                flex: 1.2, padding: '0.55rem 0.5rem', borderRadius: '0.55rem',
                background: '#0d9488', border: 'none',
                color: '#fff', fontSize: '0.78rem', fontWeight: 700,
                cursor: 'pointer', transition: 'background 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#0f766e'}
              onMouseLeave={e => e.currentTarget.style.background = '#0d9488'}
            >
              <ExternalLink size={12} /> Become an Organizer
            </button>
          </div>
        </div>

        <style>{`
          @keyframes slideInPopup {
            from { opacity: 0; transform: translateY(20px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0)     scale(1); }
          }
        `}</style>
      </div>
    </>
  )
}
