import { Link } from 'react-router-dom';
import { MapPin, Calendar, Users, Heart, Zap } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import CategoryBadge from './CategoryBadge';
import TrendingBadge from './TrendingBadge';
import { useApp } from '../context/AppContext';

export default function EventCard({ event, showActions = true }) {
  const { state, dispatch } = useApp();
  const currentUser = state.auth.currentUser;
  const isWishlisted = (currentUser?.wishlist || []).includes(event.id);
  const capacityLeft = event.capacity - event.ticketsSold;
  const capacityPct = Math.round((event.ticketsSold / event.capacity) * 100);

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;
    dispatch({
      type: isWishlisted ? 'REMOVE_FROM_WISHLIST' : 'ADD_TO_WISHLIST',
      payload: { userId: currentUser.id, eventId: event.id },
    });
  };

  return (
    <Link to={`/events/${event.id}`} className="event-card" style={{ textDecoration: 'none' }}>
      {/* Banner */}
      <div className="event-card-banner">
        <img
          src={event.banner}
          alt={event.title}
          className="event-card-img"
          loading="lazy"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&size=400&background=6366f1&color=fff`;
          }}
        />
        <div className="event-card-overlay">
          <div className="event-card-badges">
            <CategoryBadge category={event.category} />
            <TrendingBadge trending={event.trending} />
          </div>
          {showActions && currentUser?.role === 'attendee' && (
            <button
              className={`wishlist-btn ${isWishlisted ? 'wishlisted' : ''}`}
              onClick={toggleWishlist}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="event-card-body">
        <h3 className="event-card-title">{event.title}</h3>

        <div className="event-card-meta">
          <span className="meta-item">
            <Calendar size={13} />
            {formatDate(event.date)}
          </span>
          <span className="meta-item">
            <MapPin size={13} />
            {event.city}
          </span>
        </div>

        <p className="event-card-venue">{event.venue}</p>

        {/* Capacity bar */}
        <div className="capacity-bar-wrap">
          <div className="capacity-bar">
            <div
              className="capacity-fill"
              style={{
                width: `${capacityPct}%`,
                background:
                  capacityPct > 80
                    ? 'var(--red)'
                    : capacityPct > 50
                    ? 'var(--amber)'
                    : 'linear-gradient(135deg, var(--purple), var(--purple-light))',
              }}
            />
          </div>
          <span className="capacity-text">
            {capacityLeft > 0 ? `${capacityLeft} left` : 'Sold Out'}
          </span>
        </div>

        {/* Footer */}
        <div className="event-card-footer">
          <div className="event-price">
            <span className="price-label">From</span>
            <span className="price-value">{formatCurrency(event.price)}</span>
          </div>
          <div className="event-sold">
            <Users size={13} />
            <span>{event.ticketsSold.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
