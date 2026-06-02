import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { format } from 'date-fns'
import { Users, Eye, BookOpen, CheckCircle, Clock, TrendingUp, Search } from 'lucide-react'

function formatCurrency(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}` }

export default function OrganizersList() {
  const navigate = useNavigate()
  const [organizers, setOrganizers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchData() {
      // Fetch all organizers
      const { data: orgs } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'organizer')
        .order('created_at', { ascending: false })

      if (!orgs) { setLoading(false); return }

      // For each organizer, fetch event count and booking revenue
      const enriched = await Promise.all(orgs.map(async (org) => {
        const [evtRes, bkgRes] = await Promise.all([
          supabase.from('events').select('id', { count: 'exact' }).eq('organizer_id', org.id),
          supabase.from('bookings').select('organizer_received').eq('organizer_id', org.id),
        ])
        const totalRevenue = (bkgRes.data || []).reduce((s, b) => s + (Number(b.organizer_received) || 0), 0)
        return { ...org, eventCount: evtRes.count || 0, totalRevenue }
      }))

      setOrganizers(enriched)
      setLoading(false)
    }
    fetchData()
  }, [])

  const filtered = organizers.filter(o => {
    const q = search.toLowerCase()
    return (
      (o.name || '').toLowerCase().includes(q) ||
      (o.email || '').toLowerCase().includes(q) ||
      (o.city || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Users size={22} style={{ color: 'var(--teal)' }} />
          <h1 className="page-title" style={{ margin: 0 }}>Organizers</h1>
        </div>
        <p className="page-subtitle">All registered event organizers and their performance</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Organizers', value: organizers.length, color: 'var(--teal)', icon: <Users size={16} /> },
          { label: 'Total Events', value: organizers.reduce((s, o) => s + o.eventCount, 0), color: '#60a5fa', icon: <BookOpen size={16} /> },
          { label: 'Total Revenue', value: formatCurrency(organizers.reduce((s, o) => s + o.totalRevenue, 0)), color: 'var(--green)', icon: <TrendingUp size={16} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '0.9rem 1.25rem', minWidth: '180px',
            borderTop: `3px solid ${color}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color, marginBottom: '0.3rem' }}>
              {icon}
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="table-wrap">
        {/* Search */}
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative', maxWidth: '360px' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, email or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-wrap" style={{ padding: '3rem' }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem' }}>
            <div className="empty-icon">👥</div>
            <div className="empty-title">No organizers found</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Organizer</th>
                  <th>Email</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Events</th>
                  <th>Revenue Earned</th>
                  <th>Wallet</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((org) => (
                  <tr key={org.id}>
                    <td style={{ fontWeight: 700 }}>{org.name || '—'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{org.email || '—'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{org.city || '—'}</td>
                    <td>
                      <span style={{
                        background: org.verified ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                        color: org.verified ? '#10b981' : '#f59e0b',
                        border: `1px solid ${org.verified ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                        borderRadius: '6px', padding: '0.15rem 0.55rem', fontSize: '0.78rem', fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                      }}>
                        {org.verified ? <><CheckCircle size={11} /> Verified</> : <><Clock size={11} /> Pending</>}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#60a5fa' }}>{org.eventCount}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 700 }}>{formatCurrency(org.totalRevenue)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(org.wallet_balance)}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {org.created_at ? format(new Date(org.created_at), 'dd MMM yyyy') : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--teal)', borderColor: 'rgba(13,148,136,0.4)' }}
                          onClick={() => navigate(`/organizers/${org.id}/events`)}
                        >
                          <Eye size={12} /> Events
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#a855f7', borderColor: 'rgba(168,85,247,0.4)' }}
                          onClick={() => navigate(`/organizers/${org.id}/bookings`)}
                        >
                          <BookOpen size={12} /> Bookings
                        </button>
                      </div>
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
