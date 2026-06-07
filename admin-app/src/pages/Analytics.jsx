import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { format, parseISO, subDays } from 'date-fns'
import { TrendingUp, BarChart2, Users, DollarSign } from 'lucide-react'

const COLORS = ['#0d9488', '#ea580c', '#3b82f6', '#7c3aed', '#10b981', '#f59e0b', '#e11d48', '#06b6d4']

function fmt(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function EmptyChart({ label }) {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
      color: 'var(--text-muted)', opacity: 0.5
    }}>
      <BarChart2 size={32} />
      <span style={{ fontSize: '0.8rem' }}>{label || 'No data yet'}</span>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1a2235', border: '1px solid #2a3a55',
        padding: '10px 14px', borderRadius: '8px', color: '#f0f4ff'
      }}>
        <p style={{ margin: 0, fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.8rem', color: '#8899bb' }}>{label}</p>
        <p style={{ margin: 0, color: payload[0].color, fontWeight: 600 }}>
          {payload[0].name}: {typeof payload[0].value === 'number' && payload[0].name.includes('₹')
            ? fmt(payload[0].value) : payload[0].value}
        </p>
      </div>
    )
  }
  return null
}

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [bookingsByDay, setBookingsByDay] = useState([])
  const [eventsByCategory, setEventsByCategory] = useState([])
  const [topOrganizers, setTopOrganizers] = useState([])
  const [revenueByDay, setRevenueByDay] = useState([])
  const [summary, setSummary] = useState({ totalBookings: 0, totalRevenue: 0, totalOrganizers: 0, avgTicketPrice: 0 })

  useEffect(() => {
    async function fetchAnalytics() {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString()

      // ── 1. Bookings from last 30 days (use direct columns, no join needed) ──
      const { data: bookingsData, error: bErr } = await supabase
        .from('bookings')
        .select('id, amount_paid, platform_fee, organizer_received, organizer_name, event_title, booked_at')
        .gte('booked_at', thirtyDaysAgo)
        .order('booked_at', { ascending: true })

      if (bErr) console.error('Bookings query error:', bErr)

      // ── 2. All events for category breakdown ──
      const { data: eventsData, error: eErr } = await supabase
        .from('events')
        .select('category, status')

      if (eErr) console.error('Events query error:', eErr)

      // ── Process bookings data independently ──
      if (bookingsData && bookingsData.length > 0) {
        const dailyBks = {}
        const dailyRev = {}
        const orgRev = {}

        bookingsData.forEach(b => {
          // Bookings & Revenue by day
          const dateStr = b.booked_at ? format(parseISO(b.booked_at), 'MMM dd') : 'Unknown'
          dailyBks[dateStr] = (dailyBks[dateStr] || 0) + 1
          dailyRev[dateStr] = (dailyRev[dateStr] || 0) + Number(b.platform_fee || 0)

          // Top organizers by payout
          const orgName = b.organizer_name || 'Unknown Organizer'
          orgRev[orgName] = (orgRev[orgName] || 0) + Number(b.organizer_received || 0)
        })

        setBookingsByDay(Object.keys(dailyBks).map(k => ({ date: k, count: dailyBks[k] })))
        setRevenueByDay(Object.keys(dailyRev).map(k => ({ date: k, revenue: dailyRev[k] })))

        const sortedOrgs = Object.keys(orgRev)
          .map(k => ({ name: k, 'Payout (₹)': Math.round(orgRev[k]) }))
          .sort((a, b) => b['Payout (₹)'] - a['Payout (₹)'])
          .slice(0, 5)
        setTopOrganizers(sortedOrgs)

        const totalRevenue = bookingsData.reduce((s, b) => s + Number(b.platform_fee || 0), 0)
        const totalAmount = bookingsData.reduce((s, b) => s + Number(b.amount_paid || 0), 0)
        setSummary(prev => ({
          ...prev,
          totalBookings: bookingsData.length,
          totalRevenue,
          avgTicketPrice: bookingsData.length > 0 ? Math.round(totalAmount / bookingsData.length) : 0,
        }))
      }

      // ── Process events data independently ──
      if (eventsData && eventsData.length > 0) {
        const catMap = {}
        eventsData.forEach(e => {
          const cat = e.category || 'Uncategorized'
          catMap[cat] = (catMap[cat] || 0) + 1
        })
        const catArr = Object.keys(catMap).map(k => ({ category: k, count: catMap[k] }))
        setEventsByCategory(catArr)

        const uniqueOrganizers = new Set(eventsData.map(e => e.organizer_id)).size
        setSummary(prev => ({ ...prev, totalOrganizers: uniqueOrganizers }))
      }

      setLoading(false)
    }
    fetchAnalytics()
  }, [])

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Platform performance metrics</p>
      </div>

      {/* Summary KPI Row */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Bookings (30d)', value: summary.totalBookings, color: '#3b82f6', icon: <TrendingUp size={15} /> },
          { label: 'Platform Revenue (30d)', value: fmt(summary.totalRevenue), color: '#ea580c', icon: <DollarSign size={15} /> },
          { label: 'Avg Ticket Price (30d)', value: fmt(summary.avgTicketPrice), color: '#10b981', icon: <BarChart2 size={15} /> },
          { label: 'Total Event Categories', value: eventsByCategory.length, color: '#a855f7', icon: <Users size={15} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '0.9rem 1.25rem', flex: '1', minWidth: '160px',
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

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>

        {/* 1. Bookings per day */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Bookings (Last 30 Days)
          </h3>
          <div style={{ height: '260px' }}>
            {bookingsByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bookingsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3a55" vertical={false} />
                  <XAxis dataKey="date" stroke="#8899bb" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8899bb" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#1a2235', border: '1px solid #2a3a55', borderRadius: '8px', color: '#f0f4ff' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Line type="monotone" name="Bookings" dataKey="count" stroke="#3b82f6" strokeWidth={3}
                    dot={{ fill: '#1a2235', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyChart label="No bookings in last 30 days" />}
          </div>
        </div>

        {/* 2. Events per category */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Events by Category
          </h3>
          <div style={{ height: '260px' }}>
            {eventsByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventsByCategory} margin={{ bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3a55" vertical={false} />
                  <XAxis dataKey="category" stroke="#8899bb" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8899bb" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#1a2235', border: '1px solid #2a3a55', borderRadius: '8px', color: '#f0f4ff' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Bar dataKey="count" name="Events" radius={[4, 4, 0, 0]}>
                    {eventsByCategory.map((entry, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart label="No events found" />}
          </div>
        </div>

        {/* 3. Top 5 organizers */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Top 5 Organizers (by payout)
          </h3>
          <div style={{ height: '260px' }}>
            {topOrganizers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topOrganizers} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3a55" horizontal={false} />
                  <XAxis type="number" stroke="#8899bb" fontSize={11} tickLine={false} axisLine={false}
                    tickFormatter={v => `₹${Number(v).toLocaleString('en-IN')}`} />
                  <YAxis type="category" dataKey="name" stroke="#8899bb" fontSize={11}
                    tickLine={false} axisLine={false} width={110} />
                  <Tooltip
                    contentStyle={{ background: '#1a2235', border: '1px solid #2a3a55', borderRadius: '8px', color: '#f0f4ff' }}
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Payout']}
                    itemStyle={{ color: '#8b5cf6' }}
                  />
                  <Bar dataKey="Payout (₹)" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                    {topOrganizers.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart label="No booking payouts in last 30 days" />}
          </div>
        </div>

        {/* 4. Platform fee revenue */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Platform Revenue (Last 30 Days)
          </h3>
          <div style={{ height: '260px' }}>
            {revenueByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3a55" vertical={false} />
                  <XAxis dataKey="date" stroke="#8899bb" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8899bb" fontSize={11} tickLine={false} axisLine={false}
                    tickFormatter={v => `₹${v}`} />
                  <Tooltip
                    contentStyle={{ background: '#1a2235', border: '1px solid #2a3a55', borderRadius: '8px', color: '#f0f4ff' }}
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                    itemStyle={{ color: '#ea580c' }}
                  />
                  <Line type="monotone" name="Revenue (₹)" dataKey="revenue" stroke="#ea580c" strokeWidth={3}
                    dot={{ fill: '#1a2235', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyChart label="No revenue in last 30 days" />}
          </div>
        </div>

      </div>
    </div>
  )
}
