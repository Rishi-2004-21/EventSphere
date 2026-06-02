import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO, subDays } from 'date-fns'

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [bookingsByDay, setBookingsByDay] = useState([])
  const [eventsByCategory, setEventsByCategory] = useState([])
  const [topOrganizers, setTopOrganizers] = useState([])
  const [revenueByDay, setRevenueByDay] = useState([])

  useEffect(() => {
    async function fetchAnalytics() {
      // Fetch bookings for last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString()
      
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          amount_paid,
          platform_fee,
          booked_at,
          events ( title, organizer_name )
        `)
        .gte('booked_at', thirtyDaysAgo)
        .order('booked_at', { ascending: true })

      // Fetch all events
      const { data: eventsData } = await supabase
        .from('events')
        .select('category')

      if (bookingsData && eventsData) {
        // 1. Bookings by Day & 4. Revenue by Day
        const dailyBks = {}
        const dailyRev = {}
        const orgRev = {}

        bookingsData.forEach(b => {
          const dateStr = b.booked_at ? format(parseISO(b.booked_at), 'MMM dd') : 'Unknown'
          
          if (!dailyBks[dateStr]) dailyBks[dateStr] = 0
          dailyBks[dateStr] += 1

          if (!dailyRev[dateStr]) dailyRev[dateStr] = 0
          dailyRev[dateStr] += Number(b.platform_fee || 0)

          const orgName = b.events?.organizer_name || 'Unknown'
          if (!orgRev[orgName]) orgRev[orgName] = 0
          orgRev[orgName] += Number(b.amount_paid || 0) * 0.9 // organizer payout
        })

        setBookingsByDay(Object.keys(dailyBks).map(k => ({ date: k, count: dailyBks[k] })))
        setRevenueByDay(Object.keys(dailyRev).map(k => ({ date: k, revenue: dailyRev[k] })))

        // 2. Events by Category
        const catMap = {}
        eventsData.forEach(e => {
          if (!catMap[e.category]) catMap[e.category] = 0
          catMap[e.category] += 1
        })
        setEventsByCategory(Object.keys(catMap).map(k => ({ category: k, count: catMap[k] })))

        // 3. Top Organizers by Revenue
        const sortedOrgs = Object.keys(orgRev)
          .map(k => ({ name: k, revenue: orgRev[k] }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
        setTopOrganizers(sortedOrgs)
      }

      setLoading(false)
    }
    fetchAnalytics()
  }, [])

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#1a2235', border: '1px solid #2a3a55', padding: '10px', borderRadius: '8px', color: '#f0f4ff' }}>
          <p style={{ margin: 0, fontWeight: 700, marginBottom: '0.25rem' }}>{label}</p>
          <p style={{ margin: 0, color: payload[0].color }}>{payload[0].name}: {payload[0].value}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Platform performance metrics</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Top Left: Bookings per day */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Bookings (Last 30 Days)</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bookingsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3a55" vertical={false} />
                <XAxis dataKey="date" stroke="#8899bb" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8899bb" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" name="Bookings" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#1a2235', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Right: Events per category */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Events by Category</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventsByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3a55" vertical={false} />
                <XAxis dataKey="category" stroke="#8899bb" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8899bb" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Events" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Left: Top 5 organizers */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Top 5 Organizers (by payout)</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topOrganizers} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3a55" horizontal={false} />
                <XAxis type="number" stroke="#8899bb" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="#8899bb" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Payout (₹)" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Right: Platform fee revenue */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Platform Revenue (Last 30 Days)</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3a55" vertical={false} />
                <XAxis dataKey="date" stroke="#8899bb" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8899bb" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" name="Revenue (₹)" dataKey="revenue" stroke="#ea580c" strokeWidth={3} dot={{ fill: '#1a2235', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}
