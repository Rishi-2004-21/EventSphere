import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getAIInsights } from '../../ai/claudeAI';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/dateUtils';
import WalletCard from '../../components/WalletCard';
import AIInsightsPanel from '../../components/AIInsightsPanel';
import StatusBadge from '../../components/StatusBadge';
import { Link } from 'react-router-dom';
import { Plus, BarChart2, Ticket, DollarSign, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrganizerDashboard() {
  const { state } = useApp();
  const currentUser = state.auth.currentUser;
  const [aiInsights, setAiInsights] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const myEvents = state.eventsStore.filter((e) => e.organizerId === currentUser?.id);
  const myBookings = state.bookingsStore.filter((b) => b.organizerId === currentUser?.id);

  const totalTickets = myEvents.reduce((s, e) => s + e.ticketsSold, 0);
  const totalRevenue = myBookings.reduce((s, b) => s + b.organizerReceived, 0);
  const totalPlatformFees = myBookings.reduce((s, b) => s + b.platformFee, 0);

  const orgUser = state.usersStore.find((u) => u.id === currentUser?.id);
  const walletBalance = orgUser?.walletBalance || 0;

  const handleGetInsights = async () => {
    if (!myEvents.length) { toast.error('No events to analyze yet.'); return; }
    setAiLoading(true);
    try {
      const insights = await getAIInsights(myEvents);
      setAiInsights(insights);
    } catch {
      toast.error('Failed to load AI insights');
    } finally {
      setAiLoading(false);
    }
  };

  const stats = [
    { label: 'Total Events', value: myEvents.length, icon: <BarChart2 size={22} />, color: '#6366f1' },
    { label: 'Tickets Sold', value: totalTickets.toLocaleString('en-IN'), icon: <Ticket size={22} />, color: '#10b981' },
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: <DollarSign size={22} />, color: '#f59e0b' },
    { label: 'Platform Fees', value: formatCurrency(totalPlatformFees), icon: <TrendingUp size={22} />, color: '#ec4899' },
  ];

  return (
    <div className="page-container">
      <div className="page-header dashboard-header">
        <div>
          <h1 className="page-title">Organizer Dashboard</h1>
          <p className="page-sub">Welcome back, {currentUser?.name?.split(' ')[0]}!</p>
        </div>
        <Link to="/organizer/create" className="btn-primary" id="create-event-btn">
          <Plus size={18} /> Create Event
        </Link>
      </div>

      {/* Wallet Card */}
      <WalletCard
        balance={walletBalance}
        totalEarned={totalRevenue}
        totalEvents={myEvents.length}
      />

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.color + '20', color: s.color }}>
              {s.icon}
            </div>
            <div className="stat-info">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights Panel */}
      <AIInsightsPanel
        insights={aiInsights}
        isLoading={aiLoading}
        onFetch={handleGetInsights}
      />

      {/* Events List */}
      <div className="dashboard-section">
        <h2 className="section-label">My Events</h2>
        {myEvents.length === 0 ? (
          <div className="empty-state">
            <p>You haven't created any events yet.</p>
            <Link to="/organizer/create" className="btn-primary">Create Your First Event</Link>
          </div>
        ) : (
          <div className="events-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>City</th>
                  <th>Tickets</th>
                  <th>Revenue</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {myEvents.map((evt) => (
                  <tr key={evt.id}>
                    <td className="table-event-title">{evt.title}</td>
                    <td>{formatDate(evt.date)}</td>
                    <td>{evt.city}</td>
                    <td>{evt.ticketsSold} / {evt.capacity}</td>
                    <td>{formatCurrency(evt.ticketsSold * evt.price * 0.9)}</td>
                    <td><StatusBadge status={evt.status} /></td>
                    <td>
                      <Link
                        to={`/organizer/events/${evt.id}`}
                        className="btn-ghost-sm"
                      >View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
