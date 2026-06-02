import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { format } from 'date-fns'
import { BookOpen, DollarSign, TrendingUp, Users, Search, Filter, Download, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

function formatCurrency(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}` }

export default function AllBookings() {
  const [bookings, setBookings] = useState([])
  const [organizers, setOrganizers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedOrg, setSelectedOrg] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    async function fetchData() {
      const [bkgRes, orgRes] = await Promise.all([
        supabase.from('bookings').select('*').order('booked_at', { ascending: false }),
        supabase.from('users').select('id, name').eq('role', 'organizer').order('name'),
      ])
      if (bkgRes.data) setBookings(bkgRes.data)
      if (orgRes.data) setOrganizers(orgRes.data)
      setLoading(false)
    }
    fetchData()
  }, [])

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase()
    const matchesSearch = [b.attendee_name, b.attendee_email, b.event_title, b.organizer_name]
      .some(f => (f || '').toLowerCase().includes(q))
    const matchesOrg = selectedOrg === 'all' || b.organizer_id === selectedOrg
    let matchesDate = true
    if (dateFrom) matchesDate = matchesDate && new Date(b.booked_at) >= new Date(dateFrom)
    if (dateTo) matchesDate = matchesDate && new Date(b.booked_at) <= new Date(dateTo + 'T23:59:59')
    return matchesSearch && matchesOrg && matchesDate
  })

  const totalGross = filtered.reduce((s, b) => s + (Number(b.amount_paid) || 0), 0)
  const totalFees = filtered.reduce((s, b) => s + (Number(b.platform_fee) || 0), 0)
  const totalPayouts = filtered.reduce((s, b) => s + (Number(b.organizer_received) || 0), 0)
  const uniqueAttendees = new Set(filtered.map(b => b.attendee_id)).size

  function exportCSV() {
    if (filtered.length === 0) { toast.error('No bookings to export.'); return }
    const headers = ['Booking ID', 'Attendee', 'Email', 'Event', 'Organizer', 'Date', 'Amount', 'Platform Fee', 'Organizer Received', 'Status']
    const rows = filtered.map(b => [
      b.id, b.attendee_name || '', b.attendee_email || '', b.event_title || '', b.organizer_name || '',
      b.booked_at ? format(new Date(b.booked_at), 'dd MMM yyyy HH:mm') : '',
      b.amount_paid || 0, b.platform_fee || 0, b.organizer_received || 0, b.payment_status || 'confirmed'
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'all-bookings.csv'; a.click()
    toast.success(`Exported ${filtered.length} bookings!`)
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <BookOpen size={22} style={{ color: '#60a5fa' }} />
          <h1 className="page-title" style={{ margin: 0 }}>All Bookings</h1>
        </div>
        <p className="page-subtitle">Platform-wide booking records across all organizers</p>
      </div>

      {/* Summary Row */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Bookings', value: filtered.length, color: '#60a5fa', icon: <BookOpen size={15} /> },
          { label: 'Gross Revenue', value: formatCurrency(totalGross), color: 'var(--teal)', icon: <DollarSign size={15} /> },
          { label: 'Platform Fees', value: formatCurrency(totalFees), color: '#f97316', icon: <TrendingUp size={15} /> },
          { label: 'Organizer Payouts', value: formatCurrency(totalPayouts), color: 'var(--green)', icon: <TrendingUp size={15} /> },
          { label: 'Unique Attendees', value: uniqueAttendees, color: '#a855f7', icon: <Users size={15} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '0.9rem 1.25rem', flex: '1', minWidth: '150px',
            borderTop: `3px solid ${color}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color, marginBottom: '0.25rem' }}>
              {icon}
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="table-wrap">
        {/* Filters */}
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" className="form-input" placeholder="Search attendee, email, event or organizer..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2rem', fontSize: '0.85rem' }} />
          </div>
          <div style={{ position: 'relative', minWidth: '180px' }}>
            <Filter size={13} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <select className="form-select" value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}
              style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}>
              <option value="all">All Organizers</option>
              {organizers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ fontSize: '0.85rem', minWidth: '140px' }} />
          <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ fontSize: '0.85rem', minWidth: '140px' }} />
          <button className="btn-secondary" onClick={exportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            <Download size={14} /> Export CSV
          </button>
        </div>

        {loading ? (
          <div className="loading-wrap" style={{ padding: '3rem' }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem' }}>
            <div className="empty-icon">📋</div>
            <div className="empty-title">No bookings found</div>
            <div className="empty-sub">Try adjusting your filters</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Attendee</th>
                  <th>Email</th>
                  <th>Event</th>
                  <th>Organizer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Platform Fee</th>
                  <th>Org. Received</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {b.id?.slice(0, 8)}…
                    </td>
                    <td style={{ fontWeight: 600 }}>{b.attendee_name || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{b.attendee_email || '—'}</td>
                    <td style={{ maxWidth: '160px' }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        {b.event_title || '—'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{b.organizer_name || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {b.booked_at ? format(new Date(b.booked_at), 'dd MMM yyyy, HH:mm') : '—'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(b.amount_paid)}</td>
                    <td style={{ color: '#f97316', fontWeight: 600 }}>{formatCurrency(b.platform_fee)}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 700 }}>{formatCurrency(b.organizer_received)}</td>
                    <td>
                      <span style={{
                        background: 'rgba(16,185,129,0.15)', color: '#10b981',
                        border: '1px solid rgba(16,185,129,0.3)',
                        borderRadius: '6px', padding: '0.15rem 0.5rem', fontSize: '0.75rem', fontWeight: 600,
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
