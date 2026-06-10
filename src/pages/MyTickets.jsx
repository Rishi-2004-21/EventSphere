import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { Ticket, CalendarCheck, Clock, ShieldCheck, RefreshCw } from 'lucide-react'
import { isAfter, parseISO } from 'date-fns'
import CompactTicketCard from '../components/CompactTicketCard'

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
          .select('title, date, venue, city, category, organizer_name, description, organizer_id, time, event_time')
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
            My Tickets <Ticket size={24} style={{ color: 'var(--purple)' }} /> 
            <span style={{ 
              background: 'var(--purple)', color: 'white', fontSize: '14px', 
              padding: '2px 8px', borderRadius: '12px', marginLeft: '4px', verticalAlign: 'middle'
            }}>
              {tickets.length}
            </span>
          </h1>
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
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button 
          onClick={() => setFilter('upcoming')}
          style={{ 
            padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            background: filter === 'upcoming' ? 'var(--purple)' : 'transparent',
            color: filter === 'upcoming' ? 'white' : 'var(--text-secondary)',
            border: filter === 'upcoming' ? 'none' : '1px solid var(--border)',
            transition: 'all 0.2s'
          }}
        >
          Upcoming
        </button>
        <button 
          onClick={() => setFilter('past')}
          style={{ 
            padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            background: filter === 'past' ? 'var(--purple)' : 'transparent',
            color: filter === 'past' ? 'white' : 'var(--text-secondary)',
            border: filter === 'past' ? 'none' : '1px solid var(--border)',
            transition: 'all 0.2s'
          }}
        >
          Past
        </button>
        <button 
          onClick={() => setFilter('all')}
          style={{ 
            padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            background: filter === 'all' ? 'var(--purple)' : 'transparent',
            color: filter === 'all' ? 'white' : 'var(--text-secondary)',
            border: filter === 'all' ? 'none' : '1px solid var(--border)',
            transition: 'all 0.2s'
          }}
        >
          All
        </button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <Ticket size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.5 }} />
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No tickets found
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
            {filter === 'all' ? 'Start exploring events and book your first ticket!' : 'Switch to a different filter to see your tickets.'}
          </div>
          <button 
            className="btn-purple" 
            onClick={() => window.location.href = '/discover'}
          >
            Discover Events
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((ticket) => (
            <div key={ticket.id}>
              {consentedEventIds.has(ticket.event_id) && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: '12px', padding: '2px 8px',
                  fontSize: '11px', color: 'var(--green)', fontWeight: 600,
                  marginBottom: '8px',
                }}>
                  <ShieldCheck size={12} /> Terms Agreed
                </div>
              )}
              <CompactTicketCard booking={ticket} event={ticket.event} />
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
