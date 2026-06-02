import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { Search, RefreshCw, X, Calendar, MapPin, Flame } from 'lucide-react'

const CATEGORIES = ['All', 'Art', 'Tech', 'Fitness', 'Cultural', 'Community', 'Lifestyle']
const CITIES = ['All Cities', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Goa']

function formatCurrency(amount) {
  if (amount === 0 || !amount) return 'Free'
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

function CategoryBadge({ category }) {
  return <span className={`badge cat-${category}`}>{category}</span>
}

function TrendingBadge({ trending }) {
  if (trending === 'Hot') return <span className="badge badge-hot">🔥 Hot</span>
  if (trending === 'Rising') return <span className="badge badge-rising">📈 Rising</span>
  return null
}

function EventCard({ event, onClick }) {
  return (
    <div className="event-card" onClick={() => onClick(event.id)}>
      <img
        src={event.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'}
        alt={event.title}
        className="event-card-banner"
        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80' }}
      />
      <div className="event-card-body">
        <div className="event-card-badges">
          <CategoryBadge category={event.category} />
          <TrendingBadge trending={event.trending} />
        </div>
        <div className="event-card-title">{event.title}</div>
        <div className="event-card-meta"><Calendar size={12} />{event.date}</div>
        <div className="event-card-meta"><MapPin size={12} />{event.venue}, {event.city}</div>
        <div className="event-card-price">{formatCurrency(event.price)}</div>
      </div>
    </div>
  )
}

export default function DiscoveryFeed() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('All Cities')
  const [activeCategory, setActiveCategory] = useState('All')
  const [refreshing, setRefreshing] = useState(false)
  const [userBookings, setUserBookings] = useState([])

  const fetchEventsAndBookings = useCallback(async () => {
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
      
      if (!eventsError && eventsData) {
        setEvents(eventsData)
      }

      if (currentUser?.id) {
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('*')
          .eq('attendee_id', currentUser.id)
        if (bookingsData) {
          setUserBookings(bookingsData)
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [currentUser?.id])

  useEffect(() => {
    fetchEventsAndBookings()
    const channel = supabase
      .channel('events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchEventsAndBookings())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchEventsAndBookings])

  function handleRefresh() {
    setRefreshing(true)
    fetchEventsAndBookings()
  }

  // AI Recommender scoring function (Simplified to match prompt requirements)
  const scoredEvents = useMemo(() => {
    return events.map(event => {
      let score = 0
      
      // Interest match
      if (currentUser?.interests?.includes(event.category)) score += 40
      
      // Booking match
      const bookedInCategory = userBookings.filter(b => b.event_category === event.category).length
      score += Math.min(bookedInCategory * 15, 60)
      
      // Location match
      const userCity = currentUser?.city || currentUser?.preferred_city
      if (userCity && event.city?.toLowerCase() === userCity.toLowerCase()) score += 30
      
      // Trending boost
      if (event.trending === 'Hot') score += 20
      else if (event.trending === 'Rising') score += 10
      
      return { ...event, _score: score }
    }).sort((a, b) => b._score - a._score)
  }, [events, currentUser, userBookings])

  // Cold Start logic: top three events per category sorted by bookingCount
  const isColdStart = !currentUser || (userBookings.length === 0 && (!currentUser.interests || currentUser.interests.length === 0))
  
  const recommendedEvents = useMemo(() => {
    if (isColdStart) {
      const coldStartEvents = []
      const realCategories = CATEGORIES.filter(c => c !== 'All')
      realCategories.forEach(cat => {
        const catEvents = events
          .filter(e => e.category === cat)
          .sort((a, b) => (b.tickets_sold || 0) - (a.tickets_sold || 0))
          .slice(0, 3)
        coldStartEvents.push(...catEvents)
      })
      return coldStartEvents.sort((a, b) => (b.tickets_sold || 0) - (a.tickets_sold || 0))
    }
    return scoredEvents
  }, [events, scoredEvents, isColdStart])

  // Apply filters to recommended events
  const filteredEvents = useMemo(() => {
    return recommendedEvents.filter(evt => {
      const matchCat = activeCategory === 'All' || evt.category === activeCategory
      const matchCity = city === 'All Cities' || evt.city === city
      const matchSearch = !search || 
        evt.title.toLowerCase().includes(search.toLowerCase()) ||
        (evt.city && evt.city.toLowerCase().includes(search.toLowerCase())) ||
        (evt.venue && evt.venue.toLowerCase().includes(search.toLowerCase()))
      return matchCat && matchCity && matchSearch
    })
  }, [recommendedEvents, activeCategory, city, search])

  // Trending Strip of the top five Hot events
  const topTrending = useMemo(() => {
    return events
      .filter(e => e.trending === 'Hot')
      .sort((a, b) => (b.tickets_sold || 0) - (a.tickets_sold || 0))
      .slice(0, 5)
  }, [events])

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Discover Events</h1>
          <p className="page-subtitle">AI-curated picks just for you</p>
        </div>
        <button id="refresh-btn" className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? 'spin-anim' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-wrap">
          <div className="spinner" />
          <div className="loading-text">Loading events…</div>
        </div>
      ) : (
        <>
          {/* Trending Strip */}
          {topTrending.length > 0 && (
            <section style={{ marginBottom: '2.5rem' }}>
              <div className="section-heading">
                <Flame size={16} style={{ color: '#fb7185' }} />
                Trending Hot
              </div>
              <div className="trending-strip">
                {topTrending.map((evt) => (
                  <div key={evt.id} className="trending-card" onClick={() => navigate(`/events/${evt.id}`)}>
                    <img
                      src={evt.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'}
                      alt={evt.title}
                      className="trending-card-banner"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80' }}
                    />
                    <div className="trending-card-body">
                      <div className="trending-card-title">{evt.title}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="trending-card-price">{formatCurrency(evt.price)}</span>
                        <span className="badge badge-hot">🔥</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Category Tabs */}
          <div className="category-tabs" style={{ marginBottom: '1.5rem' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                id={`tab-${cat.toLowerCase()}`}
                className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="filters-bar" style={{ marginBottom: '2rem' }}>
            <div className="search-wrap">
              <Search size={16} className="search-icon" />
              <input
                id="discovery-search"
                className="search-input"
                placeholder="Search events, cities, venues…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="search-clear" onClick={() => setSearch('')}>
                  <X size={14} />
                </button>
              )}
            </div>
            <select id="city-filter" className="city-select" value={city} onChange={(e) => setCity(e.target.value)}>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Main Grid */}
          {filteredEvents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎪</div>
              <div className="empty-title">No events found</div>
              <div className="empty-sub">Try adjusting your filters or search term.</div>
              <button className="btn-purple" style={{ marginTop: '1rem' }}
                onClick={() => { setSearch(''); setActiveCategory('All'); setCity('All Cities') }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <section>
              <div className="section-heading">
                {activeCategory === 'All' ? 'All Events' : activeCategory}
                <span className="count-pill">{filteredEvents.length}</span>
              </div>
              <div className="events-grid">
                {filteredEvents.map((evt) => (
                  <EventCard
                    key={evt.id}
                    event={evt}
                    onClick={(id) => navigate(`/events/${id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
      <style>{`.spin-anim { animation: spin 0.6s linear infinite; }`}</style>
    </div>
  )
}
