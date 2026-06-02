import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Calendar, MapPin, Users, Ticket, TrendingUp, DollarSign, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

function formatCurrency(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}` }
function formatDate(ts) { return ts ? new Date(ts).toLocaleDateString('en-IN') : '-' }

function StatusBadge({ status }) {
  const cls = {
    approved: 'status-approved',
    pending: 'status-pending',
    rejected: 'status-rejected',
    'changes-requested': 'status-changes-requested',
    draft: 'status-draft',
  }
  return <span className={`badge ${cls[status] || 'status-draft'}`}>{status}</span>
}

export default function OrganizerEventDetail() {
  const { id } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [evtRes, bkgRes] = await Promise.all([
        supabase.from('events').select('*').eq('id', id).single(),
        supabase.from('bookings')
          .select('id, attendee_name, booked_at, amount_paid, platform_fee, organizer_received, payment_status')
          .eq('event_id', id)
          .order('booked_at', { ascending: false }),
      ])

      if (!evtRes.data || evtRes.data.organizer_id !== currentUser.id) {
        toast.error('Event not found or access denied.')
        navigate('/dashboard')
        return
      }

      setEvent(evtRes.data)
      setBookings(bkgRes.data || [])
      setLoading(false)
    }
    fetchData()
  }, [id, currentUser.id])

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>
  if (!event) return null

  const totalRevenue = bookings.reduce((s, b) => s + (Number(b.organizer_received) || 0), 0)
  const totalFees = bookings.reduce((s, b) => s + (Number(b.platform_fee) || 0), 0)
  const capacityPct = event.capacity ? Math.round(((event.tickets_sold || 0) / event.capacity) * 100) : 0

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn-ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <h1 className="page-title">{event.title}</h1>
            <p className="page-subtitle">
              {event.category} • {event.city}
            </p>
          </div>
          <StatusBadge status={event.status} />
        </div>
      </div>

      {/* Event Banner */}
      {event.banner_url && (
        <div style={{ marginBottom: '1.5rem', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <img
            src={event.banner_url}
            alt={event.title}
            style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80' }}
          />
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-card-icon"><Ticket size={20} style={{ color: 'var(--teal)' }} /></div>
          <div className="stat-card-label">Tickets Sold</div>
          <div className="stat-card-value">{event.tickets_sold || 0} / {event.capacity}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon"><TrendingUp size={20} style={{ color: 'var(--green)' }} /></div>
          <div className="stat-card-label">Your Revenue</div>
          <div className="stat-card-value">{formatCurrency(totalRevenue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon"><DollarSign size={20} style={{ color: 'var(--red)' }} /></div>
          <div className="stat-card-label">Platform Fees</div>
          <div className="stat-card-value">{formatCurrency(totalFees)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon"><Users size={20} style={{ color: '#60a5fa' }} /></div>
          <div className="stat-card-label">Capacity Filled</div>
          <div className="stat-card-value">{capacityPct}%</div>
        </div>
      </div>

      {/* Capacity Bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Ticket Sales Progress</span>
          <span style={{ fontWeight: 600 }}>{event.tickets_sold || 0} / {event.capacity}</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(capacityPct, 100)}%`,
            background: capacityPct > 80 ? 'var(--red)' : 'var(--teal)',
            borderRadius: '999px',
            transition: 'width 0.5s ease',
          }} />
        </div>
        {capacityPct > 80 && (
          <p style={{ color: 'var(--amber)', fontSize: '0.8rem', marginTop: '0.5rem' }}>⚡ Almost sold out!</p>
        )}
      </div>

      {/* Event Info */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Event Details</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <Calendar size={14} style={{ color: 'var(--teal)' }} />
            {event.date || 'Date TBD'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <MapPin size={14} style={{ color: 'var(--teal)' }} />
            {event.venue}, {event.city}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <Ticket size={14} style={{ color: 'var(--teal)' }} />
            {event.pricing_type === 'free' ? 'Free' : formatCurrency(event.price)} per ticket
          </div>
        </div>
        {event.description && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, marginTop: '1rem' }}>
            {event.description}
          </p>
        )}
      </div>

      {/* Bookings Table */}
      <div className="table-wrap">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700 }}>Bookings ({bookings.length})</span>
        </div>

        {bookings.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-icon">🎟</div>
            <div className="empty-title">No bookings yet</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Ticket sales will appear here once the event is approved and attendees start booking.
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Attendee</th>
                <th>Booking Date</th>
                <th>Ticket Price</th>
                <th>Platform Fee</th>
                <th>You Received</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.attendee_name}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{formatDate(b.booked_at)}</td>
                  <td>{formatCurrency(b.amount_paid)}</td>
                  <td className="tx-debit">- {formatCurrency(b.platform_fee)}</td>
                  <td className="tx-credit">+ {formatCurrency(b.organizer_received)}</td>
                  <td>
                    <span className={`badge ${b.payment_status === 'confirmed' ? 'badge-green' : 'badge-amber'}`}>
                      {b.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="tx-summary-row">
                <td colSpan={2} style={{ fontWeight: 700 }}>Totals</td>
                <td />
                <td className="tx-debit">- {formatCurrency(totalFees)}</td>
                <td className="tx-credit">+ {formatCurrency(totalRevenue)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
