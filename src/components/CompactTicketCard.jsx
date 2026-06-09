import { Calendar, MapPin, Clock } from 'lucide-react'
import QRCode from 'react-qr-code'

function formatTime(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  } catch {
    return ''
  }
}

function formatDateReadable(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

const CATEGORY_COLORS = {
  Tech: '#3b82f6',
  Fitness: '#10b981',
  Art: '#ec4899',
  Cultural: '#f97316',
  Community: '#14b8a6',
  Lifestyle: '#a855f7',
}

function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat] || '#8b5cf6'
}

export default function CompactTicketCard({ booking, event, onExpand }) {
  const catColor = getCategoryColor(event?.category)

  return (
    <div 
      onClick={() => onExpand(booking)}
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '90px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        borderLeft: `4px solid ${catColor}`,
        background: 'var(--card-background)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ width: '80px', height: '90px', flexShrink: 0 }}>
        {event?.banner_url ? (
          <img 
            src={event.banner_url} 
            alt="Event banner" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${catColor}, #000)` }} />
        )}
      </div>
      
      <div style={{ 
        flex: 1, 
        padding: '10px 12px', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center' 
      }}>
        <div style={{
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)'
        }}>
          {event?.title || 'Event'}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
          <Calendar size={11} /> {formatDateReadable(event?.date)}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <MapPin size={11} /> {event?.venue || 'TBA'}
        </div>
        {event?.date && (
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <Clock size={11} /> {formatTime(event?.date)}
          </div>
        )}
      </div>

      <div style={{
        width: '72px', flexShrink: 0, background: 'rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
        borderLeft: '1px solid var(--border-color)'
      }}>
        <div style={{ background: '#fff', padding: '3px', borderRadius: '4px' }}>
          <QRCode 
            value={booking?.ticket_qr_code || booking?.id || ''} 
            size={48} 
            viewBox={`0 0 48 48`}
          />
        </div>
        <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textAlign: 'center' }}>Tap to open</span>
      </div>
    </div>
  )
}
