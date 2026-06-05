import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { getAIPlatformInsights } from '../ai/claudeAI'
import { PieChart, Pie, Cell, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { DollarSign, Ticket, Activity, ShieldAlert, Users, TrendingUp, Filter, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

function formatCurrency(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}` }

export default function AdminDashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [platformStats, setPlatformStats] = useState({ revenue: 0, pendingEvents: 0, totalUsers: 0, activeEvents: 0, totalBookings: 0, uniqueAttendees: 0, totalFees: 0, totalPayouts: 0 })
  const [events, setEvents] = useState([])
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [aiInsights, setAiInsights] = useState('')

  useEffect(() => {
    async function fetchData() {
      const [revRes, evtRes, userRes, bkgRes] = await Promise.all([
        supabase.from('platform_revenue').select('amount_collected'),
        supabase.from('events').select('*').order('created_at', { ascending: false }),
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('bookings').select('id, amount_paid, platform_fee, organizer_received, attendee_id, booked_at').order('booked_at', { ascending: false }).limit(20)
      ])

      const totalRev = (revRes.data || []).reduce((s, r) => s + Number(r.amount_collected), 0)
      const evts = evtRes.data || []
      const allBookings = bkgRes.data || []
      const totalFees = allBookings.reduce((s, b) => s + (Number(b.platform_fee) || 0), 0)
      const totalPayouts = allBookings.reduce((s, b) => s + (Number(b.organizer_received) || 0), 0)
      const uniqueAttendees = new Set(allBookings.map(b => b.attendee_id)).size
      
      setPlatformStats({
        revenue: totalRev,
        pendingEvents: evts.filter(e => e.status === 'pending').length,
        totalUsers: userRes.count || 0,
        activeEvents: evts.filter(e => e.status === 'approved').length,
        totalBookings: allBookings.length,
        uniqueAttendees,
        totalFees,
        totalPayouts,
      })
      setEvents(evts)
      setRecentBookings(allBookings)
      setLoading(false)

      // Fetch AI platform insights in background
      try {
        const text = await getAIPlatformInsights({ totalRev, activeEvents: evts.filter(e => e.status === 'approved').length, totalUsers: userRes.count })
        setAiInsights(text)
      } catch (e) {
        setAiInsights("AI insights temporarily unavailable.")
      }
    }
    fetchData()
  }, [])

  // Chart Data Preparation
  const categoryData = events.reduce((acc, evt) => {
    if (evt.status !== 'approved') return acc;
    const cat = evt.category || 'Other'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})
  const pieData = Object.keys(categoryData).map(k => ({ name: k, value: categoryData[k] }))
  const COLORS = ['#0d9488', '#ea580c', '#3b82f6', '#7c3aed', '#10b981', '#f59e0b']

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Platform Overview</h1>
          <p className="page-subtitle">Real-time platform metrics and alerts</p>
        </div>
      </div>

      {/* Revenue Banner */}
      <div className="revenue-banner">
        <div className="revenue-banner-left">
          <div className="revenue-label">Total Platform Revenue (10% Fee)</div>
          <div className="revenue-amount">{formatCurrency(platformStats.revenue)}</div>
          <div className="revenue-note">Updated real-time from all successful bookings</div>
        </div>
        <DollarSign size={120} className="revenue-icon" />
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card red-top">
          <ShieldAlert size={20} style={{ color: 'var(--accent)' }} />
          <div className="stat-card-label">Pending Approvals</div>
          <div className="stat-card-value">{platformStats.pendingEvents}</div>
          <div className="stat-card-delta">Events requiring review</div>
        </div>
        <div className="stat-card green-top">
          <Activity size={20} style={{ color: 'var(--green)' }} />
          <div className="stat-card-label">Active Events</div>
          <div className="stat-card-value">{platformStats.activeEvents}</div>
          <div className="stat-card-delta">Live and selling tickets</div>
        </div>
        <div className="stat-card blue-top">
          <Users size={20} style={{ color: '#3b82f6' }} />
          <div className="stat-card-label">Total Users</div>
          <div className="stat-card-value">{platformStats.totalUsers}</div>
          <div className="stat-card-delta">Registered accounts</div>
        </div>
        <div className="stat-card orange-top">
          <Ticket size={20} style={{ color: 'var(--orange)' }} />
          <div className="stat-card-label">Total Bookings</div>
          <div className="stat-card-value">{platformStats.totalBookings}</div>
          <div className="stat-card-delta">All time ticket purchases</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #a855f7' }}>
          <Users size={20} style={{ color: '#a855f7' }} />
          <div className="stat-card-label">Unique Attendees</div>
          <div className="stat-card-value">{platformStats.uniqueAttendees}</div>
          <div className="stat-card-delta">Distinct ticket buyers</div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px',
        padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
        display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center'
      }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Platform Fees Collected</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f97316' }}>{`₹${Number(platformStats.totalFees || 0).toLocaleString('en-IN')}`}</div>
        </div>
        <div style={{ width: '1px', background: 'var(--border)', alignSelf: 'stretch' }} />
        <div style={{ flex: 1, minWidth: '150px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Organizer Payouts</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--green)' }}>{`₹${Number(platformStats.totalPayouts || 0).toLocaleString('en-IN')}`}</div>
        </div>
        <div style={{ width: '1px', background: 'var(--border)', alignSelf: 'stretch' }} />
        <div style={{ flex: 1, minWidth: '150px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Total Gross Revenue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--teal)' }}>{`₹${Number((platformStats.totalFees || 0) + (platformStats.totalPayouts || 0)).toLocaleString('en-IN')}`}</div>
        </div>
      </div>

      {/* Charts & AI */}
      <div className="charts-grid">
        {/* Category Distribution */}
        <div className="chart-card">
          <h3 className="chart-title">Active Events by Category</h3>
          <div style={{ height: '250px' }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <ReTooltip 
                    contentStyle={{ background: '#0f1729', border: '1px solid #1e3a5f', borderRadius: '8px' }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="loading-wrap" style={{ height: '100%', padding: 0 }}><div className="loading-text">No active events</div></div>
            )}
          </div>
        </div>

        {/* AI Platform Insights */}
        <div className="chart-card" style={{ background: 'rgba(225,29,72,0.04)', borderColor: 'rgba(225,29,72,0.2)' }}>
          <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} style={{ color: 'var(--accent)' }} /> System Diagnostics
          </h3>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {aiInsights || <div className="spinner" style={{ width: '24px', height: '24px', borderTopColor: 'var(--accent)', borderWidth: '2px' }} />}
          </div>
        </div>
      </div>

      {/* ── Admin Sign Out ──────────────────────────── */}
      <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>SuperAdmin</div>
          <span style={{ display: 'inline-block', background: 'rgba(225,29,72,0.12)', color: 'var(--accent)', borderRadius: '999px', padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: 600 }}>
            Administrator
          </span>
        </div>
        <button
          id="admin-signout-btn"
          onClick={() => { logout(); sessionStorage.clear(); navigate('/admin/login') }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.45rem',
            padding: '0.65rem 1.25rem', background: 'transparent',
            border: '1.5px solid var(--accent)', borderRadius: '10px',
            color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(225,29,72,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  )
}
