import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { getAIInsights } from '../ai/claudeAI'
import { format } from 'date-fns'
import {
  Sparkles, Wallet, Ticket, TrendingUp, DollarSign, Eye,
  BarChart, Users, Calendar, Search, CheckCircle, ArrowRight
} from 'lucide-react'
import toast from 'react-hot-toast'

function formatCurrency(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}` }

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

const CATEGORY_COLORS = {
  Tech: '#3b82f6', Art: '#a855f7', Fitness: '#10b981',
  Cultural: '#f59e0b', Community: '#0d9488', Lifestyle: '#ec4899',
}

/* ── Discovery Analytics Component ──────────────────────────────────────── */
function DiscoveryAnalytics({ events, organizerId, bookings }) {
  const [viewStats, setViewStats] = useState({ total: 0, thisMonth: 0, byEvent: {} })
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  useEffect(() => {
    async function fetchViews() {
      if (!organizerId || !events?.length) { setAnalyticsLoading(false); return }
      const eventIds = events.map((e) => e.id)
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

      const { data } = await supabase
        .from('event_views')
        .select('event_id, viewed_at')
        .in('event_id', eventIds)

      if (data) {
        const thisMonth = data.filter((v) => new Date(v.viewed_at) >= oneMonthAgo).length
        const byEvent = {}
        data.forEach((v) => { byEvent[v.event_id] = (byEvent[v.event_id] || 0) + 1 })
        setViewStats({ total: data.length, thisMonth, byEvent })
      }
      setAnalyticsLoading(false)
    }
    fetchViews()
  }, [organizerId, events])

  const totalViews = viewStats.thisMonth
  const totalBookingsThisMonth = bookings.filter((b) => {
    const oneMonthAgo = new Date(); oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    return new Date(b.booked_at) >= oneMonthAgo
  }).length
  const conversionRate = totalViews > 0 ? ((totalBookingsThisMonth / totalViews) * 100).toFixed(1) : '0.0'

  // Top 5 events by view count
  const topEvents = events
    .map((e) => ({ ...e, views: viewStats.byEvent[e.id] || 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
  const maxViews = Math.max(...topEvents.map((e) => e.views), 1)

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Eye size={18} style={{ color: '#60a5fa' }} />
        <span style={{ fontWeight: 700, fontSize: '1rem' }}>Discovery Analytics</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
          How attendees are finding your events
        </span>
      </div>

      {analyticsLoading ? (
        <div className="spinner" style={{ width: 20, height: 20 }} />
      ) : (
        <>
          {/* Stats Row */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)',
              borderRadius: '10px', padding: '0.8rem 1.25rem', minWidth: '150px',
            }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Views This Month</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#60a5fa' }}>{totalViews.toLocaleString()}</div>
            </div>
            <div style={{
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: '10px', padding: '0.8rem 1.25rem', minWidth: '150px',
            }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Conversion Rate</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--green)' }}>{conversionRate}%</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>views → bookings</div>
            </div>
            <div style={{
              background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
              borderRadius: '10px', padding: '0.8rem 1.25rem', minWidth: '150px',
            }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Total All-Time Views</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a78bfa' }}>{viewStats.total.toLocaleString()}</div>
            </div>
          </div>

          {/* Top Events Bar Chart */}
          {topEvents.some((e) => e.views > 0) ? (
            <>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Top Events by Views
              </div>
              {topEvents.map((evt) => (
                <div key={evt.id} style={{ marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500, maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {evt.title}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{evt.views} views</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.round((evt.views / maxViews) * 100)}%`,
                      background: CATEGORY_COLORS[evt.category] || 'var(--purple)',
                      borderRadius: '3px',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No views recorded yet. Views will appear here as attendees browse your events on the discovery feed.
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default function OrganizerDashboard() {
  const { currentUser, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [bookings, setBookings] = useState([])
  const [walletBalance, setWalletBalance] = useState(currentUser?.wallet_balance || 0)
  const [loading, setLoading] = useState(true)
  const [aiInsights, setAiInsights] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [bookingSearch, setBookingSearch] = useState('')
  const realtimeRef = useRef(null)

  useEffect(() => {
    async function fetchData() {
      const [evtRes, userRes] = await Promise.all([
        supabase.from('events').select('*').eq('organizer_id', currentUser.id).order('created_at', { ascending: false }),
        supabase.from('users').select('wallet_balance').eq('id', currentUser.id).single(),
      ])
      if (evtRes.data) setEvents(evtRes.data)
      if (userRes.data) {
        setWalletBalance(userRes.data.wallet_balance || 0)
        updateUser({ wallet_balance: userRes.data.wallet_balance || 0 })
      }

      // Fetch bookings directly via organizer_id column
      const { data: bkgData } = await supabase
        .from('bookings')
        .select('*')
        .eq('organizer_id', currentUser.id)
        .order('booked_at', { ascending: false })

      if (bkgData) setBookings(bkgData)
      setLoading(false)
    }
    fetchData()

    // Real-time subscription for new bookings
    realtimeRef.current = supabase
      .channel('organizer-bookings-' + currentUser.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bookings',
        filter: `organizer_id=eq.${currentUser.id}`,
      }, (payload) => {
        const newBooking = payload.new
        setBookings((prev) => [newBooking, ...prev])
        toast.success(`🎟️ New booking received for "${newBooking.event_title || 'your event'}"!`, { duration: 5000 })
      })
      .subscribe()

    return () => {
      if (realtimeRef.current) supabase.removeChannel(realtimeRef.current)
    }
  }, [currentUser.id])

  async function handleGetInsights() {
    setAiLoading(true)
    const text = await getAIInsights(events)
    setAiInsights(text)
    setAiLoading(false)
  }

  const totalTicketsSold = events.reduce((s, e) => s + (e.tickets_sold || 0), 0)
  const totalRevenue = bookings.reduce((s, b) => s + (Number(b.organizer_received) || 0), 0)
  const totalFeesPaid = bookings.reduce((s, b) => s + (Number(b.platform_fee) || 0), 0)

  // Booking summary stats
  const totalBookingsCount = bookings.length
  const totalBookingsRevenue = bookings.reduce((s, b) => s + (Number(b.organizer_received) || 0), 0)
  const uniqueAttendees = new Set(bookings.map(b => b.attendee_id)).size

  // Filter bookings by search
  const filteredBookings = bookings.filter(b => {
    const q = bookingSearch.toLowerCase()
    return (
      (b.attendee_name || '').toLowerCase().includes(q) ||
      (b.event_title || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {currentUser?.name?.split(' ')[0]}</p>
      </div>

      {/* Wallet Card */}
      <div className="wallet-card">
        <div className="wallet-label">Your Wallet Balance</div>
        <div className="wallet-amount">{formatCurrency(walletBalance)}</div>
        <div className="wallet-note">Updated instantly after every booking</div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon"><BarChart size={20} style={{ color: 'var(--teal)' }} /></div>
          <div className="stat-card-label">Total Events Created</div>
          <div className="stat-card-value">{events.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon"><Ticket size={20} style={{ color: '#60a5fa' }} /></div>
          <div className="stat-card-label">Total Tickets Sold</div>
          <div className="stat-card-value">{totalTicketsSold.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon"><TrendingUp size={20} style={{ color: 'var(--green)' }} /></div>
          <div className="stat-card-label">Total Revenue Earned</div>
          <div className="stat-card-value">{formatCurrency(totalRevenue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon"><DollarSign size={20} style={{ color: 'var(--red)' }} /></div>
          <div className="stat-card-label">Platform Fees Paid</div>
          <div className="stat-card-value">{formatCurrency(totalFeesPaid)}</div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="ai-insights-card">
        <div className="ai-badge">AI</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} style={{ color: 'var(--teal)' }} />
            <span style={{ fontWeight: 700 }}>AI Insights</span>
          </div>
          <button id="get-ai-insights-btn" className="btn-ai" onClick={handleGetInsights} disabled={aiLoading}>
            {aiLoading ? <span className="btn-spinner" style={{ borderTopColor: 'var(--teal-light)' }} /> : <><Sparkles size={14} /> Get AI Insights</>}
          </button>
        </div>
        {aiInsights && <div className="ai-insights-text">{aiInsights}</div>}
        {!aiInsights && !aiLoading && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.75rem' }}>
            Click "Get AI Insights" to receive personalized recommendations based on your event performance.
          </p>
        )}
      </div>

      {/* ── Discovery Analytics ─────────────────────────────────────────────── */}
      <DiscoveryAnalytics events={events} organizerId={currentUser?.id} bookings={bookings} />

      {/* Events Table */}
      <div className="table-wrap" style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700 }}>My Events</span>
          <button className="btn-teal" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }} onClick={() => navigate('/create')}>
            + Create Event
          </button>
        </div>

        {loading ? (
          <div className="loading-wrap" style={{ padding: '2rem' }}><div className="spinner" /></div>
        ) : events.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-icon">🎪</div>
            <div className="empty-title">No events yet</div>
            <button className="btn-teal" style={{ marginTop: '0.75rem' }} onClick={() => navigate('/create')}>Create your first event</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Tickets Sold</th>
                <th>Revenue</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((evt) => {
                const evtRevenue = bookings
                  .filter((b) => b.event_id === evt.id)
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
                    <td>{evt.tickets_sold || 0}</td>
                    <td style={{ color: 'var(--green)' }}>{formatCurrency(evtRevenue)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                          onClick={() => navigate(`/events/${evt.id}`)}>
                          <Eye size={12} /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Bookings Section ── */}
      <div className="table-wrap">
        {/* Section Header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={18} style={{ color: 'var(--teal)' }} />
            <span style={{ fontWeight: 700 }}>Bookings for My Events</span>
            <span style={{
              background: 'rgba(13,148,136,0.15)', color: 'var(--teal)',
              fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem',
              borderRadius: '999px', border: '1px solid rgba(13,148,136,0.3)'
            }}>LIVE</span>
          </div>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            onClick={() => navigate('/bookings')}
          >
            View All <ArrowRight size={13} />
          </button>
        </div>

        {/* Summary Chips */}
        <div style={{ display: 'flex', gap: '1rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <div style={{
            background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.25)',
            borderRadius: '10px', padding: '0.6rem 1rem', minWidth: '130px'
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Total Bookings</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--teal)' }}>{totalBookingsCount}</div>
          </div>
          <div style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: '10px', padding: '0.6rem 1rem', minWidth: '160px'
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Total Revenue</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--green)' }}>{formatCurrency(totalBookingsRevenue)}</div>
          </div>
          <div style={{
            background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)',
            borderRadius: '10px', padding: '0.6rem 1rem', minWidth: '130px'
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Unique Attendees</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#60a5fa' }}>{uniqueAttendees}</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative', maxWidth: '360px' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by attendee name or event..."
              value={bookingSearch}
              onChange={(e) => setBookingSearch(e.target.value)}
              style={{ paddingLeft: '2rem', fontSize: '0.85rem', padding: '0.5rem 0.75rem 0.5rem 2rem' }}
            />
          </div>
        </div>

        {/* Bookings Table */}
        {loading ? (
          <div className="loading-wrap" style={{ padding: '2rem' }}><div className="spinner" /></div>
        ) : filteredBookings.length === 0 ? (
          <div className="empty-state" style={{ padding: '2.5rem' }}>
            <div className="empty-icon"><Calendar size={36} style={{ color: 'var(--text-muted)', opacity: 0.5 }} /></div>
            <div className="empty-title">No bookings yet</div>
            <div className="empty-sub">Your events will show bookings here once attendees start buying tickets.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Attendee</th>
                  <th>Email</th>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Amount Paid</th>
                  <th>You Received</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.slice(0, 10).map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.attendee_name || '—'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{b.attendee_email || '—'}</td>
                    <td>
                      <span style={{
                        background: `${CATEGORY_COLORS[b.event_category] || 'var(--teal)'}22`,
                        color: CATEGORY_COLORS[b.event_category] || 'var(--teal)',
                        border: `1px solid ${CATEGORY_COLORS[b.event_category] || 'var(--teal)'}44`,
                        borderRadius: '6px', padding: '0.15rem 0.55rem', fontSize: '0.78rem', fontWeight: 600
                      }}>
                        {b.event_title || '—'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {b.booked_at ? format(new Date(b.booked_at), 'dd MMM yyyy') : '—'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(b.amount_paid)}</td>
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
            {filteredBookings.length > 10 && (
              <div style={{ padding: '0.75rem 1.25rem', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                <button className="btn-secondary" style={{ fontSize: '0.82rem' }} onClick={() => navigate('/bookings')}>
                  View all {filteredBookings.length} bookings →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* ── Account & Sign Out ──────────────────────────── */}
      <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{currentUser?.name}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{currentUser?.email}</div>
          <span style={{ display: 'inline-block', background: 'var(--teal-dim)', color: 'var(--teal)', borderRadius: '999px', padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.4rem' }}>
            Organizer
          </span>
        </div>
        <button
          id="dashboard-signout-btn"
          onClick={() => { logout(); sessionStorage.clear(); navigate('/organizer/login') }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.45rem',
            padding: '0.65rem 1.25rem', background: 'transparent',
            border: '1.5px solid var(--teal)', borderRadius: '10px',
            color: 'var(--teal)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(8,145,178,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
