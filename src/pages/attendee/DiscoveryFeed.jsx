import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { recommendEvents } from '../../ai/aiModules';
import EventCard from '../../components/EventCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const CATEGORIES = ['All', 'Art', 'Tech', 'Fitness', 'Cultural', 'Community', 'Lifestyle'];
const CITIES = ['All Cities', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Goa'];

export default function DiscoveryFeed() {
  const { state } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('All Cities');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');

  useEffect(() => {
    setLoading(true);
    const result = recommendEvents(state.auth.currentUser, state.eventsStore);
    setRecommended(result);
    setLoading(false);
  }, [state.auth.currentUser, state.eventsStore]);

  const filtered = useMemo(() => {
    return recommended.filter((evt) => {
      const matchCat = activeCategory === 'All' || evt.category === activeCategory;
      const matchCity = city === 'All Cities' || evt.city === city;
      const matchSearch =
        !search ||
        evt.title.toLowerCase().includes(search.toLowerCase()) ||
        evt.city.toLowerCase().includes(search.toLowerCase()) ||
        evt.venue.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchCity && matchSearch;
    });
  }, [recommended, activeCategory, city, search]);

  const trending = filtered.filter((e) => e.trending === 'Hot');
  const rest = filtered.filter((e) => e.trending !== 'Hot');

  const clearSearch = () => setSearch('');

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Discover Events</h1>
        <p className="page-sub">AI-curated picks just for you</p>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        {/* Search */}
        <div className="search-input-wrap">
          <Search size={16} className="search-input-icon" />
          <input
            id="discovery-search"
            className="filter-search"
            placeholder="Search events, cities, venues…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={clearSearch}><X size={14} /></button>
          )}
        </div>

        {/* City filter */}
        <select
          id="city-filter"
          className="filter-select"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        >
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            id={`tab-${cat.toLowerCase()}`}
            className={`category-tab ${activeCategory === cat ? 'tab-active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading events…" />
      ) : recommended.length === 0 ? (
        /* Fresh platform — no events exist at all */
        <div className="empty-state">
          <div className="empty-icon">🎪</div>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No events yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            This is a fresh platform — no events have been published yet.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '320px', margin: '0 auto', lineHeight: 1.6 }}>
            New events will appear here once an organizer creates one and the admin approves it.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        /* Events exist but none match the current filters */
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No events found</h3>
          <p>Try adjusting your filters or search term.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
            New events appear here once organizers create and admin approves them.
          </p>
          <button className="btn-primary" style={{ marginTop: '1rem', maxWidth: '200px' }} onClick={() => { setSearch(''); setActiveCategory('All'); setCity('All Cities'); }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {trending.length > 0 && (
            <section style={{ marginBottom: '2rem' }}>
              <h2 className="section-label">🔥 Trending</h2>
              <div className="events-grid">
                {trending.map((evt) => <EventCard key={evt.id} event={evt} />)}
              </div>
            </section>
          )}
          {rest.length > 0 && (
            <section>
              <h2 className="section-label">
                {activeCategory === 'All' ? 'All Events' : activeCategory}
                <span className="count-badge">{rest.length}</span>
              </h2>
              <div className="events-grid">
                {rest.map((evt) => <EventCard key={evt.id} event={evt} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
