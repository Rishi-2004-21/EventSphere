import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { format } from 'date-fns'
import { ArrowLeft, CheckCircle, Download } from 'lucide-react'
import toast from 'react-hot-toast'

function formatCurrency(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}` }

export default function OrganizerBookings() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [organizer, setOrganizer] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [orgRes, bkgRes] = await Promise.all([
        supabase.from('users').select('name, email').eq('id', id).single(),
        supabase.from('bookings').select('*').eq('organizer_id', id).order('booked_at', { ascending: false }),
      ])
      if (orgRes.data) setOrganizer(orgRes.data)
      if (bkgRes.data) setBookings(bkgRes.data)
      setLoading(false)
    }
    fetchData()
  }, [id])

  const totalRevenue = bookings.reduce((s, b) => s + (Number(b.organizer_received) || 0), 0)
  const totalPlatformFee = bookings.reduce((s, b) => s + (Number(b.platform_fee) || 0), 0)

  function exportCSV() {
    if (bookings.length === 0) { toast.error('No bookings to export.'); return }
    const headers = ['Booking ID', 'Attendee', 'Email', 'Event', 'Date', 'Amount Paid', 'Platform Fee', 'Organizer Received', 'Status']
    const rows = bookings.map(b => [
      b.id, b.attendee_name || '', b.attendee_email || '', b.event_title || '',
      b.booked_at ? format(new Date(b.booked_at), 'dd MMM yyyy HH:mm') : '',
      b.amount_paid || 0, b.platform_fee || 0, b.organizer_received || 0, b.payment_status || 'confirmed'
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `bookings-${organizer?.name || id}.csv`
    a.click()
    toast.success(`Exported ${bookings.length} bookings!`)
  }

  return (
    <div className="page-wrapper">
      <button className="btn-ghost" onClick={() => navigate('/organizers')} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <ArrowLeft size={15} /> Back to Organizers
      </button>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Bookings — {organizer?.name || 'Organizer'}</h1>
          <p className="page-subtitle">{organizer?.email} · {bookings.length} booking{bookings.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-secondary" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Bookings', value: bookings.length, color: 'var(--teal)' },
          { label: 'Organizer Received', value: formatCurrency(totalRevenue), color: 'var(--green)' },
          { label: 'Platform Fees', value: formatCurrency(totalPlatformFee), color: '#f97316' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '0.9rem 1.25rem', minWidth: '180px',
            borderTop: `3px solid ${color}`
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="loading-wrap" style={{ padding: '3rem' }}><div className="spinner" /></div>
        ) : bookings.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem' }}>
            <div className="empty-icon">📋</div>
            <div className="empty-title">No bookings yet</div>
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
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Platform Fee</th>
                  <th>Organizer Received</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {b.id?.slice(0, 8)}…
                    </td>
                    <td style={{ fontWeight: 600 }}>{b.attendee_name || '—'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{b.attendee_email || '—'}</td>
                    <td style={{ maxWidth: '160px' }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        {b.event_title || '—'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {b.booked_at ? format(new Date(b.booked_at), 'dd MMM yyyy, HH:mm') : '—'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(b.amount_paid)}</td>
                    <td style={{ color: '#f97316', fontWeight: 600 }}>{formatCurrency(b.platform_fee)}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 700 }}>{formatCurrency(b.organizer_received)}</td>
                    <td>
                      <span style={{
                        background: 'rgba(16,185,129,0.15)', color: '#10b981',
                        border: '1px solid rgba(16,185,129,0.3)',
                        borderRadius: '6px', padding: '0.15rem 0.55rem', fontSize: '0.78rem', fontWeight: 600,
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
