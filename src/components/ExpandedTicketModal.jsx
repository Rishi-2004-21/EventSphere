import { Calendar, Clock, MapPin, Building, Download, Share2, X } from 'lucide-react'
import QRCode from 'react-qr-code'
import html2canvas from 'html2canvas'
import { useRef } from 'react'

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
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export default function ExpandedTicketModal({ booking, event, onClose }) {
  const modalRef = useRef(null)

  async function handleDownload() {
    if (!modalRef.current) return
    try {
      const canvas = await html2canvas(modalRef.current, { scale: 2, useCORS: true, backgroundColor: null })
      const link = document.createElement('a')
      link.download = `EventSphere-ticket-${booking?.id}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleShare() {
    const title = 'My EventSphere Ticket'
    const text = `I am going to ${event?.title} on ${formatDateReadable(event?.date)}`
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
      } catch (err) {
        console.error(err)
      }
    } else {
      navigator.clipboard.writeText(`${title} - ${text} ${url}`)
      alert('Ticket details copied to clipboard')
    }
  }

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
    >
      <div 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '400px', width: '90%', background: 'var(--card-background)',
          borderRadius: '16px', overflow: 'hidden'
        }}
      >
        <div style={{ height: '140px', position: 'relative', overflow: 'hidden' }}>
          {event?.banner_url ? (
            <img src={event.banner_url} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--purple), #000)' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))' }} />
          <div style={{ position: 'absolute', bottom: '12px', left: '12px', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
            {event?.title}
          </div>
          <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--purple)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
            {event?.category || 'Event'}
          </div>
        </div>

        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
            <Calendar size={16} color="var(--purple)" />
            <div>
              <div style={{ textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Date</div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{formatDateReadable(event?.date)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
            <Clock size={16} color="var(--purple)" />
            <div>
              <div style={{ textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Time</div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{formatTime(event?.date)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
            <MapPin size={16} color="var(--purple)" />
            <div>
              <div style={{ textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Venue</div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{event?.venue}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
            <Building size={16} color="var(--purple)" />
            <div>
              <div style={{ textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>City</div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{event?.city}</div>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', height: '1px', borderTop: '2px dashed var(--border-color)', position: 'relative', margin: '8px 0' }}>
          <div style={{ width: '16px', height: '16px', background: 'var(--background)', borderRadius: '50%', position: 'absolute', left: '-8px', top: '-8px' }} />
          <div style={{ width: '16px', height: '16px', background: 'var(--background)', borderRadius: '50%', position: 'absolute', right: '-8px', top: '-8px' }} />
        </div>

        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '14px' }}>{booking?.attendee_name || 'Attendee'}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '10px', marginTop: '4px' }}>Booking Ref</div>
            <div style={{ color: 'var(--purple)', fontFamily: 'monospace', fontSize: '11px' }}>{(booking?.id || '').slice(0, 14)}</div>
          </div>
          <div style={{ background: '#fff', padding: '8px', borderRadius: '8px' }}>
            <QRCode value={booking?.ticket_qr_code || booking?.id || ''} size={100} />
          </div>
        </div>

        <div style={{ padding: '12px', display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)' }}>
          <button onClick={handleDownload} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
            <Download size={14} /> <span style={{ fontSize: '12px' }}>Download</span>
          </button>
          <button onClick={handleShare} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
            <Share2 size={14} /> <span style={{ fontSize: '12px' }}>Share</span>
          </button>
          <button onClick={onClose} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
            <X size={14} /> <span style={{ fontSize: '12px' }}>Close</span>
          </button>
        </div>
      </div>
    </div>
  )
}
