import { useRef } from 'react'
import QRCode from 'react-qr-code'
import {
  Calendar, Clock, MapPin, Building, User, Hash,
  Download, Printer, Share2, CheckCircle
} from 'lucide-react'
import html2canvas from 'html2canvas'

function formatCurrency(amount) {
  if (!amount || amount === 0) return 'FREE'
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

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

const CATEGORY_GRADIENTS = {
  Tech:       'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
  Fitness:    'linear-gradient(135deg, #065f46 0%, #0d9488 100%)',
  Art:        'linear-gradient(135deg, #9d174d 0%, #ea580c 100%)',
  Cultural:   'linear-gradient(135deg, #92400e 0%, #dc2626 100%)',
  Community:  'linear-gradient(135deg, #0d9488 0%, #1e40af 100%)',
  Lifestyle:  'linear-gradient(135deg, #6d28d9 0%, #db2777 100%)',
  Music:      'linear-gradient(135deg, #1e3a5f 0%, #7c3aed 100%)',
  Sports:     'linear-gradient(135deg, #14532d 0%, #15803d 100%)',
  Food:       'linear-gradient(135deg, #78350f 0%, #b45309 100%)',
  Business:   'linear-gradient(135deg, #1e3a5f 0%, #0f766e 100%)',
}

function getCategoryGradient(category) {
  return CATEGORY_GRADIENTS[category] || 'linear-gradient(135deg, #1e1b4b 0%, #7c3aed 100%)'
}

export default function TicketGenerator({ booking, event }) {
  const ticketRef = useRef(null)

  const qrValue = booking?.ticket_qr_code || booking?.id || 'EVENTSPHERE-TICKET'
  const category = event?.category || 'Event'
  const gradient = getCategoryGradient(category)

  const formattedDate = formatDate(event?.date || booking?.event_date)
  const formattedTime = formatTime(event?.date || booking?.event_date)
  const bookingRef = (booking?.id || '').slice(0, 14).toUpperCase()

  async function handleDownload() {
    if (!ticketRef.current) return
    try {
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: '#0a0f1e',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `Tixque-Ticket-${booking?.id || 'ticket'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Download error:', err)
    }
  }

  async function handleShare() {
    if (!ticketRef.current) return
    try {
      if (navigator.share) {
        const canvas = await html2canvas(ticketRef.current, { scale: 2, useCORS: true })
        canvas.toBlob(async (blob) => {
          const file = new File([blob], 'Tixque-Ticket.png', { type: 'image/png' })
          await navigator.share({ title: event?.title || 'My Tixque Ticket', files: [file] })
        })
      } else {
        await navigator.clipboard.writeText(qrValue)
        alert('Ticket link copied to clipboard!')
      }
    } catch (err) {
      console.error('Share error:', err)
    }
  }

  function handlePrint() {
    const printStyle = document.getElementById('ticket-print-style')
    if (!printStyle) {
      const style = document.createElement('style')
      style.id = 'ticket-print-style'
      style.innerHTML = `
        @media print {
          body > * { display: none !important; }
          .ticket-print-wrapper { display: block !important; position: fixed; top: 0; left: 0; width: 100%; }
        }
      `
      document.head.appendChild(style)
    }
    window.print()
  }

  return (
    <div className="ticket-wrapper">
      {/* The actual ticket (used for html2canvas) */}
      <div className="ticket-container ticket-print-wrapper" ref={ticketRef}>

        {/* ── Header Section ─────────────────── */}
        <div className="ticket-header" style={{ background: gradient }}>
          <div className="ticket-header-top">
            <div>
              <div className="ticket-brand-name">Tixque</div>
              <div className="ticket-brand-sub">Powered by Tixque</div>
            </div>
            <div className="ticket-category-pill">{category}</div>
          </div>
          <div className="ticket-event-title">{event?.title || 'Event'}</div>
        </div>

        {/* ── Main Content ────────────────────── */}
        <div className="ticket-body">
          {/* Left column: details */}
          <div className="ticket-details-col">
            <div className="ticket-detail-row">
              <Calendar size={14} className="ticket-detail-icon" />
              <div>
                <div className="ticket-detail-label">DATE</div>
                <div className="ticket-detail-value">{formattedDate || event?.date || booking?.event_date || '—'}</div>
              </div>
            </div>

            {formattedTime && (
              <div className="ticket-detail-row">
                <Clock size={14} className="ticket-detail-icon" />
                <div>
                  <div className="ticket-detail-label">TIME</div>
                  <div className="ticket-detail-value">{formattedTime}</div>
                </div>
              </div>
            )}

            <div className="ticket-detail-row">
              <MapPin size={14} className="ticket-detail-icon" />
              <div>
                <div className="ticket-detail-label">VENUE</div>
                <div className="ticket-detail-value">{event?.venue || '—'}</div>
              </div>
            </div>

            <div className="ticket-detail-row">
              <Building size={14} className="ticket-detail-icon" />
              <div>
                <div className="ticket-detail-label">CITY</div>
                <div className="ticket-detail-value">{event?.city || booking?.event_city || '—'}</div>
              </div>
            </div>

            <div className="ticket-detail-row">
              <User size={14} className="ticket-detail-icon" />
              <div>
                <div className="ticket-detail-label">ORGANIZER</div>
                <div className="ticket-detail-value">{event?.organizer_name || booking?.organizer_name || '—'}</div>
              </div>
            </div>

            <div className="ticket-detail-row">
              <Hash size={14} className="ticket-detail-icon" />
              <div>
                <div className="ticket-detail-label">BOOKING REF</div>
                <div className="ticket-detail-value ticket-mono">{bookingRef}</div>
              </div>
            </div>
          </div>

          {/* Right column: QR code */}
          <div className="ticket-qr-col">
            <div className="ticket-qr-box" style={{ background: '#fff', padding: '10px', borderRadius: '8px', display: 'inline-block' }}>
              <QRCode
                value={qrValue}
                size={150}
                level="H"
                style={{ height: 'auto', width: '100%', display: 'block' }}
                viewBox="0 0 256 256"
                fgColor="#0a0f1e"
              />
            </div>
            <div className="ticket-qr-label">SCAN AT ENTRY</div>
            <div className="ticket-qr-id">{(booking?.id || '').slice(0, 10).toLowerCase()}</div>
          </div>
        </div>

        {/* ── Perforated Divider ──────────────── */}
        <div className="ticket-perforation">
          <div className="ticket-cutout-left" />
          <div className="ticket-perf-line" />
          <div className="ticket-cutout-right" />
        </div>

        {/* ── Stub Section ───────────────────── */}
        <div className="ticket-stub">
          <div className="ticket-stub-attendee">
            <User size={14} className="ticket-stub-icon" />
            <span>{booking?.attendee_name || 'Attendee'}</span>
          </div>
          <div className="ticket-stub-price">
            {formatCurrency(booking?.amount_paid)}
          </div>
          <div className="ticket-confirmed-badge">
            <CheckCircle size={12} />
            CONFIRMED
          </div>
        </div>
      </div>

      {/* ── Action Buttons ─────────────────── */}
      <div className="ticket-actions">
        <button className="ticket-action-btn" id="download-ticket-btn" onClick={handleDownload}>
          <Download size={15} />
          Download
        </button>
        <button className="ticket-action-btn" id="print-ticket-btn" onClick={handlePrint}>
          <Printer size={15} />
          Print
        </button>
        <button className="ticket-action-btn" id="share-ticket-btn" onClick={handleShare}>
          <Share2 size={15} />
          Share
        </button>
      </div>
    </div>
  )
}
