import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/dateUtils';
import { DollarSign, TrendingUp, Percent } from 'lucide-react';

export default function RevenuePage() {
  const { state } = useApp();

  const allBookings = [...state.bookingsStore].sort(
    (a, b) => new Date(b.bookedAt) - new Date(a.bookedAt)
  );

  const grossVolume = allBookings.reduce((s, b) => s + b.amountPaid, 0);
  const totalPlatformFees = allBookings.reduce((s, b) => s + b.platformFee, 0);
  const totalOrgPayouts = allBookings.reduce((s, b) => s + b.organizerReceived, 0);

  const getEventTitle = (id) =>
    state.eventsStore.find((e) => e.id === id)?.title || 'Unknown';

  const getOrganizerName = (orgId) =>
    state.usersStore.find((u) => u.id === orgId)?.name || 'Unknown';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Revenue</h1>
        <p className="page-sub">Complete booking and revenue records</p>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#6366f120', color: '#6366f1' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{formatCurrency(grossVolume)}</div>
            <div className="stat-label">Gross Volume</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#10b98120', color: '#10b981' }}>
            <Percent size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{formatCurrency(totalPlatformFees)}</div>
            <div className="stat-label">Platform Revenue (10%)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b20', color: '#f59e0b' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{formatCurrency(totalOrgPayouts)}</div>
            <div className="stat-label">Organizer Payouts (90%)</div>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="dashboard-section">
        <h2 className="section-label">All Bookings</h2>
        <div className="events-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Organizer</th>
                <th>Attendee</th>
                <th>Date</th>
                <th>Ticket Price</th>
                <th>Platform Fee (10%)</th>
                <th>Organizer Credited (90%)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {allBookings.map((b) => (
                <tr key={b.id}>
                  <td className="table-event-title">{b.eventTitle || getEventTitle(b.eventId)}</td>
                  <td>{getOrganizerName(b.organizerId)}</td>
                  <td>{b.attendeeName}</td>
                  <td>{formatDate(b.bookedAt)}</td>
                  <td>{formatCurrency(b.amountPaid)}</td>
                  <td className="text-danger">{formatCurrency(b.platformFee)}</td>
                  <td className="text-success">{formatCurrency(b.organizerReceived)}</td>
                  <td>
                    <span className="status-badge status-approved">{b.paymentStatus}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
