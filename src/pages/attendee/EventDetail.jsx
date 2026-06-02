import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { MapPin, Calendar, Users, Heart, ArrowLeft, Clock, Tag, Percent } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate, formatEventDateTime } from '../../utils/dateUtils';
import CategoryBadge from '../../components/CategoryBadge';
import TrendingBadge from '../../components/TrendingBadge';
import toast from 'react-hot-toast';

export default function EventDetail() {
  const { id } = useParams();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const event = state.eventsStore.find((e) => e.id === id);
  const currentUser = state.auth.currentUser;
  const isWishlisted = (currentUser?.wishlist || []).includes(id);

  if (!event) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Event not found</h3>
          <Link to="/events" className="btn-primary">Browse Events</Link>
        </div>
      </div>
    );
  }

  const capacityLeft = event.capacity - event.ticketsSold;
  const capacityPct = Math.round((event.ticketsSold / event.capacity) * 100);
  const platformFee = event.price * 0.1;
  const organizerReceived = event.price * 0.9;

  const toggleWishlist = () => {
    if (!currentUser) { navigate('/login'); return; }
    dispatch({
      type: isWishlisted ? 'REMOVE_FROM_WISHLIST' : 'ADD_TO_WISHLIST',
      payload: { userId: currentUser.id, eventId: id },
    });
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️');
  };

  const handleBook = () => {
    if (!currentUser) { navigate('/login'); return; }
    if (capacityLeft <= 0) { toast.error('This event is sold out!'); return; }
    navigate(`/checkout/${id}`);
  };

  return (
    <div className="event-detail-page">
      {/* Banner */}
      <div className="event-detail-banner">
        <img
          src={event.banner}
          alt={event.title}
          className="event-detail-img"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&size=800&background=6366f1&color=fff`;
          }}
        />
        <div className="event-detail-banner-overlay" />
        <div className="event-detail-banner-content">
          <button className="btn-back" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
          <div className="event-detail-badges">
            <CategoryBadge category={event.category} />
            <TrendingBadge trending={event.trending} />
          </div>
          <h1 className="event-detail-title">{event.title}</h1>
          <p className="event-detail-organizer">by {event.organizerName}</p>
        </div>
      </div>

      <div className="event-detail-body container">
        <div className="event-detail-grid">
          {/* Main info */}
          <div className="event-detail-main">
            <div className="event-meta-row">
              <div className="event-meta-item">
                <Calendar size={16} /> <span>{formatEventDateTime(event.date, event.time)}</span>
              </div>
              <div className="event-meta-item">
                <MapPin size={16} /> <span>{event.venue}, {event.city}</span>
              </div>
              <div className="event-meta-item">
                <Users size={16} /> <span>{event.ticketsSold.toLocaleString('en-IN')} attending</span>
              </div>
            </div>

            <h2 className="detail-section-title">About This Event</h2>
            <p className="event-description">{event.description}</p>

            {event.tags?.length > 0 && (
              <div className="event-tags">
                {event.tags.map((tag) => (
                  <span key={tag} className="event-tag"><Tag size={11} /> {tag}</span>
                ))}
              </div>
            )}

            {/* Capacity bar */}
            <div className="detail-capacity">
              <div className="capacity-header">
                <span>Seats Remaining</span>
                <span className={capacityLeft < 50 ? 'text-danger' : ''}>
                  {capacityLeft} / {event.capacity}
                </span>
              </div>
              <div className="capacity-bar">
                <div
                  className="capacity-fill"
                  style={{
                    width: `${capacityPct}%`,
                    background: capacityPct > 80 ? 'var(--color-danger)' : 'var(--gradient-primary)',
                  }}
                />
              </div>
              {capacityPct > 80 && (
                <p className="capacity-warning">⚡ Almost sold out — book now!</p>
              )}
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="event-detail-sidebar">
            {/* Price & Booking */}
            <div className="booking-card">
              <div className="booking-price">
                <span className="price-from">Per ticket</span>
                <span className="price-big">{formatCurrency(event.price)}</span>
              </div>

              {/* Payment Transparency Box */}
              <div className="transparency-box">
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

              <div className="booking-actions">
                {currentUser?.role === 'attendee' && (
                  <>
                    <button
                      id="book-now-btn"
                      className="btn-primary w-full btn-lg"
                      onClick={handleBook}
                      disabled={capacityLeft <= 0}
                    >
                      {capacityLeft > 0 ? '🎟️ Book Now' : '😔 Sold Out'}
                    </button>
                    <button
                      id="wishlist-btn"
                      className={`btn-outline w-full ${isWishlisted ? 'btn-wishlisted' : ''}`}
                      onClick={toggleWishlist}
                    >
                      <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
                      {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    </button>
                  </>
                )}
                {!currentUser && (
                  <Link to="/login" className="btn-primary w-full btn-lg text-center">
                    Login to Book
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
