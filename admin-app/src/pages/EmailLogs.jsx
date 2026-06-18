import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { Mail, Search, CheckCircle, TrendingUp } from 'lucide-react'

export default function EmailLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('email_logs')
        .select('*')
        .order('sent_at', { ascending: false })
      if (data) setLogs(data)
      setLoading(false)
    }
    fetchData()
  }, [])

  // Emails sent this month
  const thisMonthStart = startOfMonth(new Date())
  const thisMonthEnd = endOfMonth(new Date())
  const thisMonthCount = logs.filter(l => {
    const d = new Date(l.sent_at)
    return d >= thisMonthStart && d <= thisMonthEnd
  }).length

  const filtered = logs.filter(l => {
    const q = search.toLowerCase()
    return (
      (l.organizer_name || '').toLowerCase().includes(q) ||
      (l.recipient_email || '').toLowerCase().includes(q) ||
      (l.recipient_name || '').toLowerCase().includes(q) ||
      (l.event_title || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Mail size={22} style={{ color: '#a855f7' }} />
          <h1 className="page-title" style={{ margin: 0 }}>Email Logs</h1>
        </div>
        <p className="page-subtitle">Audit trail of all automated reminder emails sent through Tixque</p>
      </div>

      {/* Summary Card */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Emails Sent', value: logs.length, color: '#a855f7', icon: <Mail size={15} /> },
          { label: 'Sent This Month', value: thisMonthCount, color: 'var(--teal)', icon: <TrendingUp size={15} /> },
          { label: 'Delivery Rate', value: '100%', color: 'var(--green)', icon: <CheckCircle size={15} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '0.9rem 1.25rem', minWidth: '170px',
            borderTop: `3px solid ${color}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color, marginBottom: '0.25rem' }}>
              {icon}
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
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
              placeholder="Search by organizer or recipient email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-wrap" style={{ padding: '3rem' }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem' }}>
            <div className="empty-icon"><Mail size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} /></div>
            <div className="empty-title">No email logs yet</div>
            <div className="empty-sub">Emails will appear here when organizers create new events and reminders are sent</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sent At</th>
                  <th>Organizer</th>
                  <th>Event</th>
                  <th>Recipient Name</th>
                  <th>Recipient Email</th>
                  <th>Subject</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {log.sent_at ? format(new Date(log.sent_at), 'dd MMM yyyy, HH:mm') : '—'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.organizer_name || '—'}</td>
                    <td style={{ maxWidth: '200px' }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        {log.event_title || '—'}
                      </span>
                    </td>
                    <td>{log.recipient_name || '—'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{log.recipient_email || '—'}</td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '200px' }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.email_subject || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        background: 'rgba(16,185,129,0.15)', color: '#10b981',
                        border: '1px solid rgba(16,185,129,0.3)',
                        borderRadius: '6px', padding: '0.15rem 0.55rem', fontSize: '0.78rem', fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                      }}>
                        <CheckCircle size={11} /> Sent
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
