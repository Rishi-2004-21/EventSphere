import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/dateUtils';
import WalletCard from '../../components/WalletCard';
import { TrendingUp, ArrowDownLeft } from 'lucide-react';

export default function WalletPage() {
  const { state } = useApp();
  const currentUser = state.auth.currentUser;

  const orgUser = state.usersStore.find((u) => u.id === currentUser?.id);
  const walletBalance = orgUser?.walletBalance || 0;

  const myBookings = state.bookingsStore
    .filter((b) => b.organizerId === currentUser?.id)
    .sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));

  const totalEarned = myBookings.reduce((s, b) => s + b.organizerReceived, 0);
  const totalFees = myBookings.reduce((s, b) => s + b.platformFee, 0);

  const getEventTitle = (id) =>
    state.eventsStore.find((e) => e.id === id)?.title || 'Unknown Event';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Wallet</h1>
        <p className="page-sub">Your earnings and transaction history</p>
      </div>

      <WalletCard balance={walletBalance} totalEarned={totalEarned} totalEvents={myBookings.length} />

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#10b98120', color: '#10b981' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{formatCurrency(totalEarned)}</div>
            <div className="stat-label">Lifetime Earnings</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ef444420', color: '#ef4444' }}>
            <ArrowDownLeft size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{formatCurrency(totalFees)}</div>
            <div className="stat-label">Platform Fees Paid</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#6366f120', color: '#6366f1' }}>
            <span style={{ fontSize: '1.2rem' }}>🎟️</span>
          </div>
          <div className="stat-info">
            <div className="stat-value">{myBookings.length}</div>
            <div className="stat-label">Total Transactions</div>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="dashboard-section">
        <h2 className="section-label">Transaction History</h2>
        {myBookings.length === 0 ? (
          <div className="empty-state"><p>No transactions yet.</p></div>
        ) : (
          <div className="events-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Ticket Price</th>
                  <th>Platform Fee</th>
                  <th>Amount Credited</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="table-event-title">{b.eventTitle || getEventTitle(b.eventId)}</td>
                    <td>{formatDate(b.bookedAt)}</td>
                    <td>{formatCurrency(b.amountPaid)}</td>
                    <td className="text-danger">− {formatCurrency(b.platformFee)}</td>
                    <td className="text-success">+ {formatCurrency(b.organizerReceived)}</td>
                    <td>
                      <span className="status-badge status-approved">{b.paymentStatus}</span>
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
