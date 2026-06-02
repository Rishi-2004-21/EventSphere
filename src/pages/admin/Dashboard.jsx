import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatCurrency';
import { BarChart2, Users, DollarSign, Calendar, TrendingUp } from 'lucide-react';

const CATEGORY_COLORS = {
  Tech: '#6366f1', Art: '#f59e0b', Fitness: '#10b981',
  Cultural: '#ec4899', Community: '#3b82f6', Lifestyle: '#8b5cf6',
};

export default function AdminDashboard() {
  const { state } = useApp();

  const totalEvents = state.eventsStore.length;
  const totalUsers = state.usersStore.length;
  const totalBookings = state.bookingsStore.length;
  const grossVolume = state.bookingsStore.reduce((s, b) => s + b.amountPaid, 0);
  const totalOrgPayouts = state.bookingsStore.reduce((s, b) => s + b.organizerReceived, 0);
  const platformRevenue = state.platformRevenueStore;

  // Revenue by category for pie chart
  const revByCategory = {};
  state.bookingsStore.forEach((b) => {
    const evt = state.eventsStore.find((e) => e.id === b.eventId);
    const cat = evt?.category || 'Other';
    revByCategory[cat] = (revByCategory[cat] || 0) + b.platformFee;
  });
  const pieData = Object.entries(revByCategory).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));

  const stats = [
    { label: 'Platform Revenue', value: formatCurrencyCompact(platformRevenue), icon: <DollarSign size={22} />, color: '#6366f1', sub: 'All time' },
    { label: 'Gross Volume', value: formatCurrencyCompact(grossVolume), icon: <TrendingUp size={22} />, color: '#10b981', sub: `${totalBookings} bookings` },
    { label: 'Organizer Payouts', value: formatCurrencyCompact(totalOrgPayouts), icon: <BarChart2 size={22} />, color: '#f59e0b', sub: '90% per ticket' },
    { label: 'Total Events', value: totalEvents, icon: <Calendar size={22} />, color: '#ec4899', sub: 'All categories' },
    { label: 'Total Users', value: totalUsers, icon: <Users size={22} />, color: '#3b82f6', sub: 'Across all roles' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-sub">Platform overview and revenue summary</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid stats-grid-5">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.color + '20', color: s.color }}>
              {s.icon}
            </div>
            <div className="stat-info">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Platform Revenue highlight */}
      <div className="revenue-highlight">
        <div className="revenue-highlight-left">
          <h3>Platform Revenue</h3>
          <div className="revenue-big">{formatCurrency(platformRevenue)}</div>
          <p>Collected as 10% from every ticket sold across the platform.</p>
        </div>
        <div className="revenue-highlight-right">
          <div className="revenue-split">
            <div className="split-item">
              <span className="split-pct split-platform">10%</span>
              <span>Platform</span>
            </div>
            <div className="split-divider">vs</div>
            <div className="split-item">
              <span className="split-pct split-organizer">90%</span>
              <span>Organizer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue by Category Pie Chart */}
      {pieData.length > 0 && (
        <div className="chart-card">
          <h3 className="chart-title">Platform Fee by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={110}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: 'rgba(255,255,255,0.3)' }}
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={CATEGORY_COLORS[entry.name] || '#64748b'}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => formatCurrency(v)}
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                labelStyle={{ color: 'var(--color-text)' }}
              />
              <Legend wrapperStyle={{ color: 'var(--color-text-muted)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
