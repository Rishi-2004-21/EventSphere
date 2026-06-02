import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatCurrency';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];

export default function Analytics() {
  const { state } = useApp();

  // 1. Bookings per day
  const bookingsByDay = {};
  state.bookingsStore.forEach((b) => {
    const day = formatDate(b.bookedAt);
    bookingsByDay[day] = (bookingsByDay[day] || 0) + 1;
  });
  const bookingsData = Object.entries(bookingsByDay).map(([date, count]) => ({ date, count }));

  // 2. Events per category
  const eventsByCat = {};
  state.eventsStore.forEach((e) => {
    eventsByCat[e.category] = (eventsByCat[e.category] || 0) + 1;
  });
  const categoryData = Object.entries(eventsByCat).map(([category, count]) => ({ category, count }));

  // 3. Top organizers by revenue
  const orgRevenue = {};
  state.bookingsStore.forEach((b) => {
    const org = state.usersStore.find((u) => u.id === b.organizerId);
    const name = org?.name?.split(' ')[0] || 'Unknown';
    orgRevenue[name] = (orgRevenue[name] || 0) + b.organizerReceived;
  });
  const orgData = Object.entries(orgRevenue)
    .map(([name, revenue]) => ({ name, revenue: parseFloat(revenue.toFixed(2)) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  // 4. Platform fee trend by day
  const feeTrend = {};
  state.bookingsStore.forEach((b) => {
    const day = formatDate(b.bookedAt);
    feeTrend[day] = (feeTrend[day] || 0) + b.platformFee;
  });
  const feeData = Object.entries(feeTrend).map(([date, fee]) => ({
    date,
    fee: parseFloat(fee.toFixed(2)),
  }));

  const tooltipStyle = {
    contentStyle: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' },
    labelStyle: { color: 'var(--color-text)' },
    itemStyle: { color: 'var(--color-text-muted)' },
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-sub">Platform performance insights</p>
      </div>

      <div className="charts-grid">
        {/* Chart 1: Bookings per day */}
        <div className="chart-card">
          <h3 className="chart-title">Bookings Per Day</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={bookingsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2}
                dot={{ fill: '#6366f1', r: 4 }} name="Bookings" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Events per category */}
        <div className="chart-card">
          <h3 className="chart-title">Events Per Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="category" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" name="Events" radius={[4, 4, 0, 0]}>
                {categoryData.map((_, i) => (
                  <rect key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3: Top organizers by revenue */}
        <div className="chart-card">
          <h3 className="chart-title">Top Organizers by Revenue</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={orgData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}K`} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 4: Platform fee trend */}
        <div className="chart-card">
          <h3 className="chart-title">Platform Fee Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={feeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                tickFormatter={(v) => `₹${v}`} />
              <Tooltip {...tooltipStyle} formatter={(v) => formatCurrency(v)} />
              <Line type="monotone" dataKey="fee" stroke="#f59e0b" strokeWidth={2}
                dot={{ fill: '#f59e0b', r: 4 }} name="Fee" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
