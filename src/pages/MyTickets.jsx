import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { Ticket, RefreshCw } from 'lucide-react'
import { isAfter, parseISO } from 'date-fns'
import CompactTicketCard from '../components/CompactTicketCard'
import ExpandedTicketModal from '../components/ExpandedTicketModal'

export default function MyTickets() {
  const { currentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All')
  const [expandedBooking, setExpandedBooking] = useState(null)

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
          .select('title, date, venue, city, category, organizer_name, description, organizer_id, time, banner_url')
          .eq('id', b.event_id)
          .single()
        return { ...b, event: evt }
      })
    )

    setTickets(enriched)
    setLoading(false)
    setRefreshing(false)
  }, [currentUser])

  useEffect(() => {
    fetchTickets(false)
  }, [fetchTickets, location.key])

  const now = new Date()
  const filtered = tickets.filter(t => {
    const dateStr = t.event?.date || t.event_date
    if (!dateStr) return activeFilter === 'All'
    try {
      const eventDate = parseISO(dateStr)
      if (activeFilter === 'Upcoming') return isAfter(eventDate, now)
      if (activeFilter === 'Past') return !isAfter(eventDate, now)
      return true
    } catch {
      return activeFilter === 'All'
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

        <button
          onClick={() => fetchTickets(true)}
          disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'none', border: '1px solid var(--border-color)',
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
        {['All', 'Upcoming', 'Past'].map(f => (
          <button 
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{ 
              padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              background: activeFilter === f ? 'var(--purple)' : 'transparent',
              color: activeFilter === f ? 'white' : 'var(--text-secondary)',
              border: activeFilter === f ? 'none' : '1px solid var(--border-color)',
              transition: 'all 0.2s'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card-background)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <Ticket size={48} style={{ color: 'gray', margin: '0 auto 16px', opacity: 0.5 }} />
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
            No tickets found
          </div>
          <button 
            className="btn-purple" 
            onClick={() => navigate('/events')}
            style={{ marginTop: '16px' }}
          >
            Discover Events
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((ticket) => (
            <CompactTicketCard 
              key={ticket.id}
              booking={ticket} 
              event={ticket.event} 
              onExpand={(b) => setExpandedBooking(b)} 
            />
          ))}
        </div>
      )}

      {expandedBooking && (
        <ExpandedTicketModal 
          booking={expandedBooking} 
          event={expandedBooking.event} 
          onClose={() => setExpandedBooking(null)} 
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
