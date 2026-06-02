import { useApp } from '../../context/AppContext';
import { detectSpam } from '../../ai/aiModules';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatCurrency';
import StatusBadge from '../../components/StatusBadge';
import { CheckCircle, XCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { nanoid } from 'nanoid';

export default function Moderation() {
  const { state, dispatch } = useApp();

  const pendingEvents = state.eventsStore.filter(
    (e) => e.status === 'pending' || e.status === 'changes-requested'
  );

  const getSpam = (evt) => detectSpam(evt.title, evt.description, evt.price);

  const handleAction = (eventId, status, organizerId, eventTitle) => {
    dispatch({ type: 'UPDATE_EVENT_STATUS', payload: { eventId, status } });

    const messages = {
      approved: `✅ Your event "${eventTitle}" has been approved!`,
      rejected: `❌ Your event "${eventTitle}" was rejected.`,
      'changes-requested': `📝 Changes requested for your event "${eventTitle}". Please update and resubmit.`,
    };

    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: nanoid(),
        userId: organizerId,
        message: messages[status],
        type: 'moderation',
        createdAt: new Date().toISOString(),
        read: false,
      },
    });

    const toastMsg = {
      approved: 'Event approved!',
      rejected: 'Event rejected.',
      'changes-requested': 'Changes requested.',
    };
    toast.success(toastMsg[status]);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Moderation Queue</h1>
        <p className="page-sub">{pendingEvents.length} event(s) awaiting review</p>
      </div>

      {pendingEvents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <h3>All clear!</h3>
          <p>No events pending review.</p>
        </div>
      ) : (
        <div className="moderation-list">
          {pendingEvents.map((evt) => {
            const spam = getSpam(evt);
            const spamHigh = spam > 60;

            return (
              <div key={evt.id} className="moderation-card">
                <div className="mod-card-header">
                  <div className="mod-card-left">
                    <img
                      src={evt.banner}
                      alt={evt.title}
                      className="mod-banner"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80?text=Event'; }}
                    />
                    <div>
                      <h3 className="mod-title">{evt.title}</h3>
                      <p className="mod-meta">
                        by {evt.organizerName} · {evt.city} · {formatDate(evt.date)}
                      </p>
                      <p className="mod-meta">
                        {formatCurrency(evt.price)} · {evt.capacity} capacity
                      </p>
                      <StatusBadge status={evt.status} />
                    </div>
                  </div>

                  {/* Spam Score */}
                  <div className={`spam-meter ${spamHigh ? 'spam-danger' : spam > 30 ? 'spam-warning' : 'spam-ok'}`}>
                    <ShieldAlert size={16} />
                    <span>Spam: {spam}%</span>
                  </div>
                </div>

                <p className="mod-desc">{evt.description?.slice(0, 200)}{evt.description?.length > 200 ? '…' : ''}</p>

                <div className="mod-actions">
                  <button
                    id={`approve-${evt.id}`}
                    className="btn-success"
                    onClick={() => handleAction(evt.id, 'approved', evt.organizerId, evt.title)}
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button
                    id={`changes-${evt.id}`}
                    className="btn-warning"
                    onClick={() => handleAction(evt.id, 'changes-requested', evt.organizerId, evt.title)}
                  >
                    <AlertCircle size={16} /> Request Changes
                  </button>
                  <button
                    id={`reject-${evt.id}`}
                    className="btn-danger"
                    onClick={() => handleAction(evt.id, 'rejected', evt.organizerId, evt.title)}
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
