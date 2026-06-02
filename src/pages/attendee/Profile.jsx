import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/dateUtils';
import EventCard from '../../components/EventCard';
import { User, MapPin, Mail, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

const ALL_CATEGORIES = ['Art', 'Tech', 'Fitness', 'Cultural', 'Community', 'Lifestyle'];

export default function Profile() {
  const { state, dispatch } = useApp();
  const currentUser = state.auth.currentUser;
  const [interests, setInterests] = useState(currentUser?.interests || []);

  const wishlistEvents = state.eventsStore.filter((e) =>
    (currentUser?.wishlist || []).includes(e.id)
  );

  const toggleInterest = (cat) => {
    setInterests((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const saveInterests = () => {
    dispatch({ type: 'SET_INTERESTS', payload: { userId: currentUser.id, interests } });
    toast.success('Interests updated!');
  };

  return (
    <div className="page-container">
      {/* Profile Header */}
      <div className="profile-header">
        <img src={currentUser?.avatar} alt={currentUser?.name} className="profile-avatar" />
        <div className="profile-info">
          <h1 className="profile-name">{currentUser?.name}</h1>
          <p className="profile-email"><Mail size={14} /> {currentUser?.email}</p>
          {currentUser?.city && (
            <p className="profile-city"><MapPin size={14} /> {currentUser.city}</p>
          )}
          <p className="profile-since">Member since {formatDate(currentUser?.createdAt)}</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Interests */}
        <div className="profile-card">
          <h2 className="profile-card-title">My Interests</h2>
          <div className="interest-grid">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`interest-chip ${interests.includes(cat) ? 'interest-chip-active' : ''}`}
                onClick={() => toggleInterest(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={saveInterests}>
            Save Interests
          </button>
        </div>

        {/* Wishlist */}
        <div className="profile-card">
          <h2 className="profile-card-title">
            <Heart size={18} className="text-danger" /> Wishlist
            <span className="count-badge">{wishlistEvents.length}</span>
          </h2>
          {wishlistEvents.length === 0 ? (
            <p className="empty-text">No events in your wishlist yet.</p>
          ) : (
            <div className="events-grid events-grid-sm">
              {wishlistEvents.map((evt) => (
                <EventCard key={evt.id} event={evt} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
