import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'

// Always show ₹ symbol, never return "Free"
function fmt(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function Revenue() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState({ platformFee: 0, grossVolume: 0, organizerPayout: 0 })
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    async function fetchRevenueData() {
      // Fetch bookings joined with event data
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booked_at,
          amount_paid,
          platform_fee,
          organizer_received,
          events (
            title,
            organizer_name
          )
        `)
        .order('booked_at', { ascending: false })

      if (error || !data) {
        setLoading(false)
        return
      }

      setBookings(data)

      // Calculate totals
      let tPF = 0, tGV = 0, tOP = 0
      const dailyMap = {}

      data.forEach(b => {
        tPF += Number(b.platform_fee || 0)
        tGV += Number(b.amount_paid || 0)
        tOP += Number(b.organizer_received || 0)

        const dateStr = b.booked_at ? format(parseISO(b.booked_at), 'MMM dd') : 'Unknown'
        if (!dailyMap[dateStr]) dailyMap[dateStr] = 0
        dailyMap[dateStr] += Number(b.platform_fee || 0)
      })

      setTotals({ platformFee: tPF, grossVolume: tGV, organizerPayout: tOP })

      // Convert dailyMap to chartData array, preserving order
      const dates = Object.keys(dailyMap).reverse()
      const cData = dates.map(d => ({ date: d, revenue: dailyMap[d] }))
      setChartData(cData)

      setLoading(false)
    }

    fetchRevenueData()
  }, [])

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Revenue</h1>
        <p className="page-subtitle">Platform financials and booking history</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card orange-top">
          <div className="stat-card-label">Total Platform Earnings</div>
          <div className="stat-card-value" style={{ color: 'var(--orange)' }}>
            {fmt(totals.platformFee)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total Gross Volume</div>
          <div className="stat-card-value" style={{ color: '#fff' }}>
            {fmt(totals.grossVolume)}
          </div>
        </div>
        <div className="stat-card green-top">
          <div className="stat-card-label">Total Organizer Payouts</div>
          <div className="stat-card-value" style={{ color: 'var(--green)' }}>
            {fmt(totals.organizerPayout)}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>Daily Platform Fee Revenue</h3>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3a55" vertical={false} />
              <XAxis dataKey="date" stroke="#8899bb" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#8899bb" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip 
                contentStyle={{ background: '#1a2235', border: '1px solid #2a3a55', borderRadius: '8px', color: '#f0f4ff' }}
                itemStyle={{ color: '#ea580c' }}
                formatter={(val) => [`₹${val}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="var(--orange)" strokeWidth={3} dot={{ fill: 'var(--bg-card)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="table-wrap">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>All Bookings</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Organizer Name</th>
                <th>Ticket Price</th>
                <th>Platform Fee Collected</th>
                <th>Organizer Amount Credited</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td className="font-bold">{b.events?.title || 'Unknown Event'}</td>
                  <td>{b.events?.organizer_name || 'Unknown Organizer'}</td>
                  <td>{fmt(b.amount_paid)}</td>
                  <td style={{ color: 'var(--red)', fontWeight: 600 }}>{fmt(b.platform_fee)}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 600 }}>{fmt(b.organizer_received)}</td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
