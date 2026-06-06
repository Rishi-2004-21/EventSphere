import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { Ticket, CalendarCheck, Clock, ShieldCheck, RefreshCw } from 'lucide-react'
import { isAfter, parseISO } from 'date-fns'
import TicketGenerator from '../components/TicketGenerator'

export default function MyTickets() {
  const { currentUser } = useAuth()
  const location = useLocation()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('all')
  const [consentedEventIds, setConsentedEventIds] = useState(new Set())

  const fetchTickets = useCallback(async (silent = false) => {
    if (!currentUser) return
    if (!silent) setLoading(true)
    else setRefreshing(true)

    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, event_id, attendee_name, attendee_email, ticket_qr_code, booked_at, amount_paid, payment_status, organizer_name, event_title, event_date, event_city, payment_id, upi_transaction_id')
      .eq('attendee_id', currentUser.id)
      .order('booked_at', { ascending: false })

    if (!bookings) { setLoading(false); setRefreshing(false); return }

    const enriched = await Promise.all(
      bookings.map(async (b) => {
        const { data: evt } = await supabase
          .from('events')
          .select('title, date, venue, city, category, organizer_name, description, organizer_id, time')
          .eq('id', b.event_id)
          .single()
        return { ...b, event: evt }
      })
    )

    setTickets(enriched)
    setLoading(false)
    setRefreshing(false)
  }, [currentUser])

  // Refetch on every navigation to this page (location.key is unique per navigate() call)
  useEffect(() => {
    fetchTickets(false)
  }, [fetchTickets, location.key])

  // Fetch consent records
  useEffect(() => {
    async function fetchConsents() {
      if (!currentUser) return
      const { data } = await supabase
        .from('consent_records')
        .select('event_id')
        .eq('attendee_id', currentUser.id)
      if (data) setConsentedEventIds(new Set(data.map(r => r.event_id)))
    }
    fetchConsents()
  }, [currentUser])

  const now = new Date()
  const filtered = tickets.filter(t => {
    const dateStr = t.event?.date || t.event_date
    if (!dateStr) return filter === 'all'
    try {
      const eventDate = parseISO(dateStr)
      if (filter === 'upcoming') return isAfter(eventDate, now)
      if (filter === 'past') return !isAfter(eventDate, now)
      return true
    } catch {
      return filter === 'all'
    }
  })

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Ticket size={24} style={{ color: 'var(--purple)' }} /> My Tickets
          </h1>
          <p className="page-subtitle">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} booked</p>
        </div>

        {/* Manual refresh button */}
        <button
          onClick={() => fetchTickets(true)}
          disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 8, padding: '0.5rem 0.875rem',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.83rem',
            opacity: refreshing ? 0.6 : 1,
          }}
        >
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="ticket-filter-tabs">
        <button className={`ticket-filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          All ({tickets.length})
        </button>
        <button className={`ticket-filter-tab ${filter === 'upcoming' ? 'active' : ''}`} onClick={() => setFilter('upcoming')}>
          <CalendarCheck size={14} /> Upcoming
        </button>
        <button className={`ticket-filter-tab ${filter === 'past' ? 'active' : ''}`} onClick={() => setFilter('past')}>
          <Clock size={14} /> Past
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎟️</div>
          <div className="empty-title">
            {filter === 'upcoming' ? 'No upcoming events' : filter === 'past' ? 'No past events' : 'No tickets yet'}
          </div>
          <div className="empty-sub">
            {filter === 'all' ? 'Start exploring events and book your first ticket!' : 'Switch to a different filter to see your tickets.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {filtered.map((ticket) => (
            <div key={ticket.id}>
              {consentedEventIds.has(ticket.event_id) && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)',
                  borderRadius: '999px', padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem', color: '#10b981', fontWeight: 600,
                  marginBottom: '0.6rem',
                }}>
                  <ShieldCheck size={13} /> Terms Agreed
                </div>
              )}
              <TicketGenerator booking={ticket} event={ticket.event} />
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
