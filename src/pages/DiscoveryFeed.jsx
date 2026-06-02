import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import {
  getPersonalizedRecommendations,
  getBecauseYouBooked,
} from '../ai/recommendationEngine'
import { Search, RefreshCw, X, Calendar, MapPin, Flame, Sparkles, Clock } from 'lucide-react'

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

/* ── Regular Event Card (used in main grid) ─────────────────────────────── */
function EventCard({ event, onClick, recommendationReason }) {
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
        {recommendationReason && (
          <div className="rec-reason-tag">
            <Sparkles size={10} /> {recommendationReason}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── For You Card (slightly larger, shown in horizontal strip) ──────────── */
function ForYouCard({ event, onClick, reason }) {
  return (
    <div className="rec-card" onClick={() => onClick(event.id)}>
      <img
        src={event.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'}
        alt={event.title}
        className="rec-card-banner"
        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80' }}
      />
      <div className="rec-card-body">
        <div className="event-card-badges">
          <CategoryBadge category={event.category} />
          <TrendingBadge trending={event.trending} />
        </div>
        <div className="rec-card-title">{event.title}</div>
        <div className="event-card-meta"><Calendar size={11} />{event.date}</div>
        <div className="event-card-meta"><MapPin size={11} />{event.city}</div>
        <div className="rec-card-price">{formatCurrency(event.price)}</div>
        <div className="rec-reason-tag"><Sparkles size={10} /> {reason || 'Picked for you'}</div>
      </div>
    </div>
  )
}

/* ── Skeleton loader for recommendation strip ───────────────────────────── */
function RecSkeleton() {
  return (
    <div className="rec-strip">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rec-skeleton" />
      ))}
    </div>
  )
}

/* ── Main Discovery Feed ─────────────────────────────────────────────────── */
export default function DiscoveryFeed() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('All Cities')
  const [activeCategory, setActiveCategory] = useState('All')
  const [refreshing, setRefreshing] = useState(false)

  // Recommendation state
  const [recommendations, setRecommendations] = useState([])
  const [recLoading, setRecLoading] = useState(true)
  const [userBookings, setUserBookings] = useState([])
  const [categoryScores, setCategoryScores] = useState({})
  const [userViews, setUserViews] = useState([])
  const [becauseYouBooked, setBecauseYouBooked] = useState({ events: [], sourceTitle: '' })

  /* ── Fetch all events ──────────────────────────────────────────────────── */
  const fetchEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
      if (!error && data) setEvents(data)
    } catch (err) {
      console.error('fetchEvents error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  /* ── Fetch recommendation data ─────────────────────────────────────────── */
  const fetchRecommendationData = useCallback(async () => {
    if (!currentUser?.id) {
      setRecLoading(false)
      return
    }
    setRecLoading(true)
    try {
      const [bookingsRes, scoresRes, viewsRes] = await Promise.all([
        supabase.from('bookings').select('*').eq('attendee_id', currentUser.id),
        supabase.from('user_category_scores').select('category, score').eq('attendee_id', currentUser.id),
        supabase.from('event_views').select('event_id').eq('attendee_id', currentUser.id),
      ])
      setUserBookings(bookingsRes.data || [])
      const scoresMap = {}
      ;(scoresRes.data || []).forEach((s) => { scoresMap[s.category] = s.score })
      setCategoryScores(scoresMap)
      setUserViews((viewsRes.data || []).map((v) => v.event_id))
    } catch (err) {
      console.error('fetchRecommendationData error:', err)
    } finally {
      setRecLoading(false)
    }
  }, [currentUser?.id])

  useEffect(() => {
    fetchEvents()
    fetchRecommendationData()
    const channel = supabase
      .channel('events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchEvents())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchEvents, fetchRecommendationData])

  /* ── Calculate recommendations when data is ready ─────────────────────── */
  useEffect(() => {
    if (loading || recLoading || !events.length) return
    const recs = getPersonalizedRecommendations(currentUser, events, userBookings, categoryScores)
    setRecommendations(recs)
    const byb = getBecauseYouBooked(currentUser, events, userBookings)
    setBecauseYouBooked(byb)
  }, [loading, recLoading, events, currentUser, userBookings, categoryScores])

  function handleRefresh() {
    setRefreshing(true)
    fetchEvents()
    fetchRecommendationData()
  }

  /* ── Filter events for main grid ──────────────────────────────────────── */
  const filtered = useMemo(() => {
    if (activeCategory === 'Recommended') {
      return recommendations.slice(0, 18)
    }
    return events.filter((evt) => {
      const matchCat = activeCategory === 'All' || evt.category === activeCategory
      const matchCity = city === 'All Cities' || evt.city === city
      const matchSearch = !search ||
        evt.title.toLowerCase().includes(search.toLowerCase()) ||
        (evt.city && evt.city.toLowerCase().includes(search.toLowerCase())) ||
        (evt.venue && evt.venue.toLowerCase().includes(search.toLowerCase()))
      return matchCat && matchCity && matchSearch
    })
  }, [events, recommendations, activeCategory, city, search])

  const trending = useMemo(() =>
    activeCategory !== 'Recommended' ? filtered.filter((e) => e.trending === 'Hot') : [],
    [filtered, activeCategory]
  )
  const rest = useMemo(() =>
    activeCategory === 'Recommended'
      ? filtered
      : filtered.filter((e) => e.trending !== 'Hot'),
    [filtered, activeCategory]
  )

  /* ── Popular Near You ─────────────────────────────────────────────────── */
  const popularNearYou = useMemo(() => {
    const userCity = currentUser?.city || currentUser?.preferred_city || ''
    if (!userCity) {
      return events.sort((a, b) => (b.tickets_sold || 0) - (a.tickets_sold || 0)).slice(0, 4)
    }
    return events
      .filter((e) => e.city?.toLowerCase() === userCity.toLowerCase())
      .sort((a, b) => (b.tickets_sold || 0) - (a.tickets_sold || 0))
      .slice(0, 4)
  }, [events, currentUser])

  const userCity = currentUser?.city || currentUser?.preferred_city || ''

  /* ── You Might Have Missed ─────────────────────────────────────────────── */
  const mightHaveMissed = useMemo(() => {
    const viewedIds = new Set(userViews)
    return events
      .filter((e) => {
        const createdDaysAgo = e.created_at
          ? Math.floor((Date.now() - new Date(e.created_at)) / (1000 * 60 * 60 * 24))
          : 999
        return createdDaysAgo > 7 && !viewedIds.has(e.id)
      })
      .sort((a, b) => (b.tickets_sold || 0) - (a.tickets_sold || 0))
      .slice(0, 3)
  }, [events, userViews])

  /* ── Top 6 For You picks ────────────────────────────────────────────────── */
  const forYouEvents = recommendations.slice(0, 6)
  const isColdStart = !currentUser || (userBookings.length === 0 && (currentUser?.interests || []).length === 0)
  const firstName = currentUser?.name?.split(' ')[0] || ''

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

      {/* Filters */}
      <div className="filters-bar" style={{ marginBottom: '1rem' }}>
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

      {/* ── ✨ For You Section ─────────────────────────────────────────────── */}
      {!loading && (
        <section style={{ marginBottom: '2rem' }}>
          <div className="section-heading">
            <Sparkles size={16} style={{ color: '#a78bfa' }} />
            {isColdStart
              ? 'Trending Events ✨'
              : `Recommended for ${firstName} ✨`}
          </div>
          {recLoading ? (
            <RecSkeleton />
          ) : forYouEvents.length > 0 ? (
            <div className="rec-strip">
              {forYouEvents.map((evt) => (
                <ForYouCard
                  key={evt.id}
                  event={evt}
                  onClick={(id) => navigate(`/events/${id}`)}
                  reason={evt._reason}
                />
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Browse more events to get personalized picks!
            </p>
          )}
        </section>
      )}

      {/* ── Because You Booked ─────────────────────────────────────────────── */}
      {!recLoading && becauseYouBooked.events.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <div className="section-heading">
            <Clock size={15} style={{ color: '#60a5fa' }} />
            <span>
              Because you booked{' '}
              <span style={{ color: 'var(--purple-light)', fontStyle: 'italic' }}>
                "{becauseYouBooked.sourceTitle}"
              </span>
              {' '}— You might also like
            </span>
          </div>
          <div className="rec-strip">
            {becauseYouBooked.events.map((evt) => (
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
                    <CategoryBadge category={evt.category} />
                  </div>
                  <div className="rec-reason-tag" style={{ marginTop: '0.35rem' }}>
                    <Sparkles size={9} /> Similar to your recent booking
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Category Tabs — Recommended first, then categories */}
      <div className="category-tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          id="tab-recommended"
          className={`cat-tab rec-tab ${activeCategory === 'Recommended' ? 'active' : ''}`}
          onClick={() => setActiveCategory('Recommended')}
        >
          <Sparkles size={12} /> Recommended
        </button>
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

      {/* ── Popular Near You (shown only when category is All or Recommended) ── */}
      {!loading && (activeCategory === 'All' || activeCategory === 'Recommended') && popularNearYou.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <div className="section-heading">
            <MapPin size={15} style={{ color: '#34d399' }} />
            {userCity ? `Popular in ${userCity}` : 'Popular Events in India'}
          </div>
          <div className="rec-strip">
            {popularNearYou.map((evt) => (
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
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {evt.tickets_sold || 0} booked
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="loading-wrap">
          <div className="spinner" />
          <div className="loading-text">Loading events…</div>
        </div>
      ) : filtered.length === 0 ? (
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
        <>
          {/* Trending Strip (not shown on Recommended tab) */}
          {trending.length > 0 && (
            <section style={{ marginBottom: '2rem' }}>
              <div className="section-heading">
                <Flame size={16} style={{ color: '#fb7185' }} />
                Hot Right Now
              </div>
              <div className="trending-strip">
                {trending.map((evt) => (
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

          {/* Main Grid */}
          {rest.length > 0 && (
            <section>
              <div className="section-heading">
                {activeCategory === 'Recommended' ? (
                  <><Sparkles size={15} style={{ color: '#a78bfa' }} /> Your Personalized Feed</>
                ) : activeCategory === 'All' ? 'All Events' : activeCategory}
                <span className="count-pill">{rest.length}</span>
              </div>
              <div className="events-grid">
                {rest.map((evt) => (
                  <EventCard
                    key={evt.id}
                    event={evt}
                    onClick={(id) => navigate(`/events/${id}`)}
                    recommendationReason={activeCategory === 'Recommended' ? evt._reason : undefined}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── You Might Have Missed ─────────────────────────────────────────── */}
      {!loading && mightHaveMissed.length > 0 && activeCategory === 'All' && (
        <section style={{ marginTop: '3rem' }}>
          <div className="section-heading" style={{ marginBottom: '0.5rem' }}>
            <span>🔍</span> Discover Something New
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            You Might Have Missed
          </p>
          <div className="events-grid">
            {mightHaveMissed.map((evt) => (
              <EventCard
                key={evt.id}
                event={evt}
                onClick={(id) => navigate(`/events/${id}`)}
              />
            ))}
          </div>
        </section>
      )}

      <style>{`.spin-anim { animation: spin 0.6s linear infinite; }`}</style>
    </div>
  )
}
