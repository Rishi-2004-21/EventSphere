import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { format } from 'date-fns'
import { ArrowLeft, Calendar, CheckCircle } from 'lucide-react'

function formatCurrency(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}` }

function StatusBadge({ status }) {
  const map = {
    approved: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
    pending: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    rejected: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
    draft: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
    'changes-requested': { bg: 'rgba(249,115,22,0.15)', color: '#f97316', border: 'rgba(249,115,22,0.3)' },
  }
  const s = map[status] || map.draft
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: '6px', padding: '0.15rem 0.55rem', fontSize: '0.78rem', fontWeight: 600
    }}>{status}</span>
  )
}

export default function OrganizerEvents() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [organizer, setOrganizer] = useState(null)
  const [events, setEvents] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [orgRes, evtRes, bkgRes] = await Promise.all([
        supabase.from('users').select('name, email').eq('id', id).single(),
        supabase.from('events').select('*').eq('organizer_id', id).order('created_at', { ascending: false }),
        supabase.from('bookings').select('event_id, organizer_received').eq('organizer_id', id),
      ])
      if (orgRes.data) setOrganizer(orgRes.data)
      if (evtRes.data) setEvents(evtRes.data)
      if (bkgRes.data) setBookings(bkgRes.data)
      setLoading(false)
    }
    fetchData()
  }, [id])

  return (
    <div className="page-wrapper">
      <button className="btn-ghost" onClick={() => navigate('/organizers')} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <ArrowLeft size={15} /> Back to Organizers
      </button>

      <div className="page-header">
        <h1 className="page-title">Events — {organizer?.name || 'Organizer'}</h1>
        <p className="page-subtitle">{organizer?.email} · {events.length} event{events.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="loading-wrap" style={{ padding: '3rem' }}><div className="spinner" /></div>
        ) : events.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem' }}>
            <div className="empty-icon">🎪</div>
            <div className="empty-title">No events yet</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>City</th>
                  <th>Capacity</th>
                  <th>Tickets Sold</th>
                  <th>Price</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => {
                  const evtRevenue = bookings
                    .filter(b => b.event_id === evt.id)
                    .reduce((s, b) => s + (Number(b.organizer_received) || 0), 0)
                  return (
                    <tr key={evt.id}>
                      <td style={{ fontWeight: 600, maxWidth: '200px' }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {evt.title}
                        </span>
                      </td>
                      <td><span className="badge badge-blue">{evt.category}</span></td>
                      <td><StatusBadge status={evt.status} /></td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {evt.date ? format(new Date(evt.date), 'dd MMM yyyy') : '—'}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{evt.city || '—'}</td>
                      <td>{evt.capacity || '—'}</td>
                      <td style={{ fontWeight: 600, color: '#60a5fa' }}>{evt.tickets_sold || 0}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(evt.price)}</td>
                      <td style={{ color: 'var(--green)', fontWeight: 700 }}>{formatCurrency(evtRevenue)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
