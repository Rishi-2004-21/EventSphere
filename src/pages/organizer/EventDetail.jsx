import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/dateUtils';
import StatusBadge from '../../components/StatusBadge';
import { ArrowLeft, Users, DollarSign, Calendar, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrganizerEventDetail() {
  const { id } = useParams();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const event = state.eventsStore.find((e) => e.id === id);
  const currentUser = state.auth.currentUser;

  if (!event || event.organizerId !== currentUser?.id) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h3>Event not found</h3>
          <button className="btn-primary" onClick={() => navigate('/organizer')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const revenue = event.ticketsSold * event.price * 0.9;
  const platformFees = event.ticketsSold * event.price * 0.1;
  const fillPct = Math.round((event.ticketsSold / event.capacity) * 100);

  const handleResubmit = () => {
    dispatch({ type: 'UPDATE_EVENT_STATUS', payload: { eventId: id, status: 'pending' } });
    toast.success('Event resubmitted for review!');
    navigate('/organizer');
  };

  return (
    <div className="page-container">
      <button className="btn-back-link" onClick={() => navigate('/organizer')}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="event-detail-header">
        <div>
          <h1 className="page-title">{event.title}</h1>
          <StatusBadge status={event.status} />
        </div>
        {event.status === 'changes-requested' && (
          <button className="btn-primary" onClick={handleResubmit}>
            Resubmit for Review
          </button>
        )}
      </div>

      <div className="organizer-event-grid">
        {/* Analytics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#6366f120', color: '#6366f1' }}>
              <Users size={22} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{event.ticketsSold} / {event.capacity}</div>
              <div className="stat-label">Tickets Sold</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#10b98120', color: '#10b981' }}>
              <DollarSign size={22} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{formatCurrency(revenue)}</div>
              <div className="stat-label">Your Earnings</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f59e0b20', color: '#f59e0b' }}>
              <DollarSign size={22} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{formatCurrency(platformFees)}</div>
              <div className="stat-label">Platform Fees</div>
            </div>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="detail-capacity">
          <div className="capacity-header">
            <span>Capacity Fill Rate</span>
            <span>{fillPct}%</span>
          </div>
          <div className="capacity-bar">
            <div className="capacity-fill"
              style={{ width: `${fillPct}%`, background: 'var(--gradient-primary)' }} />
          </div>
        </div>

        {/* Event Info */}
        <div className="org-event-info">
          <div className="event-meta-item"><Calendar size={16} /> {formatDate(event.date)} at {event.time}</div>
          <div className="event-meta-item"><MapPin size={16} /> {event.venue}, {event.city}</div>
          <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>{event.description}</p>
        </div>

        {/* Moderation message for changes-requested */}
        {event.status === 'changes-requested' && (
          <div className="moderation-notice">
            <h4>📝 Changes Requested</h4>
            <p>The admin has requested changes to your event listing. Please update your event details and resubmit for review.</p>
          </div>
        )}
        {event.status === 'rejected' && (
          <div className="moderation-notice moderation-rejected">
            <h4>❌ Event Rejected</h4>
            <p>This event was rejected by the admin. Please review the guidelines and create a new event.</p>
          </div>
        )}
      </div>
    </div>
  );
}
