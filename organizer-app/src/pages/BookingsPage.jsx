import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import { Users, Search, Download, Filter, CheckCircle, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

function formatCurrency(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}` }

const CATEGORY_COLORS = {
  Tech: '#3b82f6', Art: '#a855f7', Fitness: '#10b981',
  Cultural: '#f59e0b', Community: '#0d9488', Lifestyle: '#ec4899',
}

export default function BookingsPage() {
  const { currentUser } = useAuth()
  const [bookings, setBookings] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedEvent, setSelectedEvent] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    async function fetchData() {
      const [bkgRes, evtRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .eq('organizer_id', currentUser.id)
          .order('booked_at', { ascending: false }),
        supabase
          .from('events')
          .select('id, title')
          .eq('organizer_id', currentUser.id)
          .order('created_at', { ascending: false }),
      ])
      if (bkgRes.data) setBookings(bkgRes.data)
      if (evtRes.data) setEvents(evtRes.data)
      setLoading(false)
    }
    fetchData()
  }, [currentUser.id])

  // Apply filters
  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase()
    const matchesSearch =
      (b.attendee_name || '').toLowerCase().includes(q) ||
      (b.event_title || '').toLowerCase().includes(q) ||
      (b.attendee_email || '').toLowerCase().includes(q)
    const matchesEvent = selectedEvent === 'all' || b.event_id === selectedEvent
    let matchesDate = true
    if (dateFrom) matchesDate = matchesDate && new Date(b.booked_at) >= new Date(dateFrom)
    if (dateTo) matchesDate = matchesDate && new Date(b.booked_at) <= new Date(dateTo + 'T23:59:59')
    return matchesSearch && matchesEvent && matchesDate
  })

  // Summary stats from filtered
  const totalRevenue = filtered.reduce((s, b) => s + (Number(b.organizer_received) || 0), 0)
  const totalPaid = filtered.reduce((s, b) => s + (Number(b.amount_paid) || 0), 0)
  const uniqueAttendees = new Set(filtered.map(b => b.attendee_id)).size

  function exportCSV() {
    if (filtered.length === 0) { toast.error('No bookings to export.'); return }
    const headers = ['Booking ID', 'Attendee Name', 'Attendee Email', 'Event Title', 'Booking Date', 'Amount Paid', 'You Received', 'Status']
    const rows = filtered.map(b => [
      b.id,
      b.attendee_name || '',
      b.attendee_email || '',
      b.event_title || '',
      b.booked_at ? format(new Date(b.booked_at), 'dd MMM yyyy HH:mm') : '',
      b.amount_paid || 0,
      b.organizer_received || 0,
      b.payment_status || 'confirmed',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'bookings.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filtered.length} bookings!`)
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Users size={22} style={{ color: 'var(--teal)' }} />
          <h1 className="page-title" style={{ margin: 0 }}>All Bookings</h1>
        </div>
        <p className="page-subtitle">Complete record of all ticket purchases for your events</p>
      </div>

      {/* Summary Chips */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Bookings', value: filtered.length, color: 'var(--teal)' },
          { label: 'Gross Revenue', value: formatCurrency(totalPaid), color: '#60a5fa' },
          { label: 'You Received (90%)', value: formatCurrency(totalRevenue), color: 'var(--green)' },
          { label: 'Unique Attendees', value: uniqueAttendees, color: '#a855f7' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '0.9rem 1.25rem', minWidth: '150px',
            borderTop: `3px solid ${color}`
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="table-wrap" style={{ marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search attendee or event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}
            />
          </div>

          {/* Event Filter */}
          <div style={{ position: 'relative', minWidth: '180px' }}>
            <Filter size={13} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <select
              className="form-select"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}
            >
              <option value="all">All Events</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </div>

          {/* Date Range */}
          <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ fontSize: '0.85rem', minWidth: '140px' }} title="From date" />
          <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ fontSize: '0.85rem', minWidth: '140px' }} title="To date" />

          {/* Export */}
          <button className="btn-teal" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}>
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="loading-wrap" style={{ padding: '3rem' }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem' }}>
            <div className="empty-icon"><Calendar size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} /></div>
            <div className="empty-title">No bookings found</div>
            <div className="empty-sub">Try adjusting your search or filters</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Attendee</th>
                  <th>Email</th>
                  <th>Event</th>
                  <th>Booking Date</th>
                  <th>Amount Paid</th>
                  <th>You Received</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.attendee_name || '—'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{b.attendee_email || '—'}</td>
                    <td>
                      <span style={{
                        background: 'var(--teal-dim)', color: 'var(--teal)',
                        border: '1px solid rgba(13,148,136,0.3)',
                        borderRadius: '6px', padding: '0.15rem 0.55rem',
                        fontSize: '0.78rem', fontWeight: 600,
                        display: 'inline-block', maxWidth: '180px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {b.event_title || '—'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {b.booked_at ? format(new Date(b.booked_at), 'dd MMM yyyy, HH:mm') : '—'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(b.amount_paid)}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 700 }}>{formatCurrency(b.organizer_received)}</td>
                    <td>
                      <span style={{
                        background: 'rgba(16,185,129,0.15)', color: '#10b981',
                        border: '1px solid rgba(16,185,129,0.3)',
                        borderRadius: '6px', padding: '0.15rem 0.55rem',
                        fontSize: '0.78rem', fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                      }}>
                        <CheckCircle size={11} /> Confirmed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
