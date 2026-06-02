import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/dateUtils';
import { ShieldCheck, Percent, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Checkout() {
  const { id } = useParams();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const event = state.eventsStore.find((e) => e.id === id);
  const currentUser = state.auth.currentUser;

  if (!event || !currentUser) {
    navigate('/events');
    return null;
  }

  const platformFee = parseFloat((event.price * 0.1).toFixed(2));
  const organizerReceived = parseFloat((event.price * 0.9).toFixed(2));

  const handleConfirm = () => {
    dispatch({
      type: 'BOOK_TICKET',
      payload: {
        eventId: event.id,
        eventTitle: event.title,
        attendeeId: currentUser.id,
        attendeeName: currentUser.name,
        price: event.price,
        organizerId: event.organizerId,
      },
    });
    toast.success('🎉 Booking confirmed! Check your tickets.');
    navigate('/my-tickets');
  };

  return (
    <div className="page-container">
      <div className="checkout-wrap">
        <button className="btn-back-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back to Event
        </button>

        <h1 className="page-title">Confirm Booking</h1>

        <div className="checkout-grid">
          {/* Order Summary */}
          <div className="checkout-summary">
            <img
              src={event.banner}
              alt={event.title}
              className="checkout-banner"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&size=400&background=6366f1&color=fff`;
              }}
            />
            <div className="checkout-event-info">
              <h2 className="checkout-event-title">{event.title}</h2>
              <p className="checkout-meta">📅 {formatDate(event.date)} at {event.time}</p>
              <p className="checkout-meta">📍 {event.venue}, {event.city}</p>
              <p className="checkout-meta">👤 {currentUser.name}</p>
            </div>
          </div>

          {/* Payment Panel */}
          <div className="checkout-payment">
            <h3 className="checkout-section-title">Order Details</h3>

            <div className="order-rows">
              <div className="order-row">
                <span>1× Ticket</span>
                <span>{formatCurrency(event.price)}</span>
              </div>
              <div className="order-row order-subtotal">
                <span>Subtotal</span>
                <span>{formatCurrency(event.price)}</span>
              </div>
            </div>

            <div className="checkout-transparency">
              <h4 className="transparency-title">💳 Payment Breakdown</h4>
              <div className="transparency-row">
                <span>Ticket Price</span>
                <span>{formatCurrency(event.price)}</span>
              </div>
              <div className="transparency-row transparency-fee">
                <span><Percent size={12} /> Platform Fee (10%)</span>
                <span className="fee-amount">− {formatCurrency(platformFee)}</span>
              </div>
              <div className="transparency-divider" />
              <div className="transparency-row transparency-organizer">
                <span>🏆 Organizer Receives (90%)</span>
                <strong>{formatCurrency(organizerReceived)}</strong>
              </div>
            </div>

            <div className="checkout-total">
              <span>Total</span>
              <span className="total-amount">{formatCurrency(event.price)}</span>
            </div>

            <div className="checkout-trust">
              <ShieldCheck size={14} className="text-success" />
              <span>Secure payment · Instant ticket generation</span>
            </div>

            <button
              id="confirm-pay-btn"
              className="btn-primary w-full btn-lg"
              onClick={handleConfirm}
            >
              <CheckCircle size={18} /> Confirm & Pay {formatCurrency(event.price)}
            </button>

            <p className="checkout-note">
              By confirming, you agree to EventSphere's terms. Your QR ticket will be generated instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
