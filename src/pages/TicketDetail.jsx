import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, ExternalLink, User, Calendar, MapPin } from 'lucide-react'
import TicketGenerator from '../components/TicketGenerator'

export default function TicketDetail() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [booking, setBooking] = useState(null)
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!currentUser || !bookingId) return

      const { data: b } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .eq('attendee_id', currentUser.id)
        .single()

      if (!b) { setLoading(false); return }
      setBooking(b)

      const { data: evt } = await supabase
        .from('events')
        .select('*')
        .eq('id', b.event_id)
        .single()

      setEvent(evt)
      setLoading(false)
    }
    load()
  }, [bookingId, currentUser])

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>
  if (!booking) return (
    <div className="page-wrapper">
      <div className="empty-state">
        <div className="empty-icon">🎟️</div>
        <div className="empty-title">Ticket not found</div>
        <div className="empty-sub">This ticket doesn't exist or you don't have access.</div>
        <button className="btn-purple" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/my-tickets')}>
          Back to My Tickets
        </button>
      </div>
    </div>
  )

  return (
    <div className="page-wrapper">
      <button className="btn-ghost" onClick={() => navigate('/my-tickets')} style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Back to My Tickets
      </button>

      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>Your Ticket</h1>

      {/* The ticket */}
      <TicketGenerator booking={booking} event={event} />

      {/* Event Information section */}
      {event && (
        <div className="ticket-detail-info-section">
          <h2 className="ticket-detail-section-title">Event Information</h2>

          {event.description && (
            <div className="ticket-detail-desc">
              <p>{event.description}</p>
            </div>
          )}

          <div className="ticket-detail-meta-grid">
            {event.date && (
              <div className="ticket-detail-meta-item">
                <Calendar size={16} style={{ color: 'var(--purple)' }} />
                <div>
                  <div className="ticket-detail-meta-label">Date & Time</div>
                  <div className="ticket-detail-meta-value">{event.date}</div>
                </div>
              </div>
            )}
            {event.venue && (
              <div className="ticket-detail-meta-item">
                <MapPin size={16} style={{ color: 'var(--purple)' }} />
                <div>
                  <div className="ticket-detail-meta-label">Venue</div>
                  <div className="ticket-detail-meta-value">{event.venue}, {event.city}</div>
                </div>
              </div>
            )}
            {(event.organizer_name || booking.organizer_name) && (
              <div className="ticket-detail-meta-item">
                <User size={16} style={{ color: 'var(--purple)' }} />
                <div>
                  <div className="ticket-detail-meta-label">Organizer</div>
                  <div className="ticket-detail-meta-value">{event.organizer_name || booking.organizer_name}</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <Link to={`/events/${booking.event_id}`} className="btn-outline-purple">
              <ExternalLink size={14} />
              View Event Page
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
