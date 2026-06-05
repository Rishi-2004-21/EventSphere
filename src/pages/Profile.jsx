import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { User, Save, Heart, Calendar, MapPin, Bell, BellOff, Sparkles, SlidersHorizontal, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

const INTEREST_OPTIONS = ['Art', 'Tech', 'Fitness', 'Cultural', 'Community', 'Lifestyle']

function formatCurrency(amount) {
  if (!amount || amount === 0) return 'Free'
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

const CATEGORY_COLORS = {
  Art: '#a855f7', Tech: '#3b82f6', Fitness: '#10b981',
  Cultural: '#f59e0b', Community: '#0d9488', Lifestyle: '#ec4899',
}

export default function Profile() {
  const { currentUser, updateUser } = useAuth()
  const navigate = useNavigate()
  const [interests, setInterests] = useState(currentUser?.interests || [])
  const [wishlistEvents, setWishlistEvents] = useState([])
  const [savingInterests, setSavingInterests] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(
    currentUser?.email_notifications !== false
  )
  const [savingNotif, setSavingNotif] = useState(false)

  // Taste Profile
  const [categoryScores, setCategoryScores] = useState([])
  const [scoresLoading, setScoresLoading] = useState(true)

  // Recommendation Preferences
  const defaultPrefs = { showPersonalized: true, includeOtherCities: true, showTrendingBoost: true }
  const [recPrefs, setRecPrefs] = useState({
    ...defaultPrefs,
    ...(currentUser?.recommendation_preferences || {}),
  })
  const [savingPrefs, setSavingPrefs] = useState(false)

  useEffect(() => {
    async function fetchWishlist() {
      if (!currentUser?.wishlist?.length) return
      const { data } = await supabase
        .from('events')
        .select('id, title, date, venue, city, price, banner_url, category')
        .in('id', currentUser.wishlist)
      if (data) setWishlistEvents(data)
    }
    async function fetchCategoryScores() {
      if (!currentUser?.id) return
      const { data } = await supabase
        .from('user_category_scores')
        .select('category, score')
        .eq('attendee_id', currentUser.id)
        .order('score', { ascending: false })
      if (data) setCategoryScores(data)
      setScoresLoading(false)
    }
    fetchWishlist()
    fetchCategoryScores()
  }, [currentUser?.wishlist, currentUser?.id])

  function toggleInterest(cat) {
    setInterests((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  async function saveInterests() {
    setSavingInterests(true)
    const { error } = await supabase
      .from('users')
      .update({ interests })
      .eq('id', currentUser.id)

    if (!error) {
      updateUser({ interests })
      toast.success('Interests saved!')
    } else {
      toast.error('Failed to save interests.')
    }
    setSavingInterests(false)
  }

  async function saveRecPrefs(newPrefs) {
    setSavingPrefs(true)
    const { error } = await supabase
      .from('users')
      .update({ recommendation_preferences: newPrefs })
      .eq('id', currentUser.id)
    if (!error) {
      updateUser({ recommendation_preferences: newPrefs })
      toast.success('Preferences saved!')
    }
    setSavingPrefs(false)
  }

  function toggleRecPref(key) {
    const newPrefs = { ...recPrefs, [key]: !recPrefs[key] }
    setRecPrefs(newPrefs)
    saveRecPrefs(newPrefs)
  }

  async function toggleEmailNotifications() {
    const newVal = !emailNotifications
    setSavingNotif(true)
    const { error } = await supabase
      .from('users')
      .update({ email_notifications: newVal })
      .eq('id', currentUser.id)
    if (!error) {
      setEmailNotifications(newVal)
      updateUser({ email_notifications: newVal })
      toast.success(newVal ? 'Email reminders enabled' : 'Email reminders disabled')
    } else {
      toast.error('Failed to update preference.')
    }
    setSavingNotif(false)
  }

  async function removeFromWishlist(eventId) {
    const newWishlist = (currentUser.wishlist || []).filter((w) => w !== eventId)
    const { error } = await supabase.from('users').update({ wishlist: newWishlist }).eq('id', currentUser.id)
    if (!error) {
      updateUser({ wishlist: newWishlist })
      setWishlistEvents((prev) => prev.filter((e) => e.id !== eventId))
      toast.success('Removed from wishlist')
    }
  }

  if (!currentUser) return null

  return (
    <div className="page-wrapper">
      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>My Profile</h1>

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          <User size={24} />
        </div>
        <div>
          <div className="profile-name">{currentUser.name}</div>
          <div className="profile-meta">{currentUser.email}</div>
          {currentUser.city && <div className="profile-meta">📍 {currentUser.city}</div>}
        </div>
      </div>

      {/* Interests */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>My Interests</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Select categories you enjoy for personalized recommendations
        </p>
        <div className="interests-grid">
          {INTEREST_OPTIONS.map((cat) => (
            <button
              key={cat}
              id={`interest-${cat.toLowerCase()}`}
              className={`interest-pill ${interests.includes(cat) ? 'active' : ''}`}
              onClick={() => toggleInterest(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          id="save-interests-btn"
          className="btn-purple"
          style={{ marginTop: '1rem', gap: '0.4rem' }}
          onClick={saveInterests}
          disabled={savingInterests}
        >
          {savingInterests ? <span className="btn-spinner" /> : <Save size={14} />}
          Save Interests
        </button>
      </div>

      {/* Recommendation Preferences */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SlidersHorizontal size={16} style={{ color: 'var(--purple)' }} /> Recommendation Preferences
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Control how EventSphere personalizes your discovery feed
        </p>

        {[
          { key: 'showPersonalized', label: 'Show personalized recommendations', desc: 'Use your interests and booking history to rank events' },
          { key: 'includeOtherCities', label: 'Include events from other cities', desc: 'Show events outside your home city in the feed' },
          { key: 'showTrendingBoost', label: 'Show trending events boost', desc: 'Give extra ranking to Hot and Rising events' },
        ].map(({ key, label, desc }) => (
          <div key={key} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '0.9rem 1.1rem', marginBottom: '0.75rem',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.15rem' }}>{label}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{desc}</div>
            </div>
            <button
              onClick={() => toggleRecPref(key)}
              disabled={savingPrefs}
              style={{
                width: '48px', height: '26px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                background: recPrefs[key] ? 'var(--purple)' : 'var(--border)',
                position: 'relative', transition: 'background 0.2s ease', flexShrink: 0, marginLeft: '1rem',
                outline: 'none', opacity: savingPrefs ? 0.7 : 1,
              }}
            >
              <span style={{
                position: 'absolute', top: '3px',
                left: recPrefs[key] ? '24px' : '3px',
                width: '20px', height: '20px',
                background: '#fff', borderRadius: '50%',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
              }} />
            </button>
          </div>
        ))}
      </div>

      {/* Taste Profile */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} style={{ color: '#a78bfa' }} /> Your Taste Profile
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Based on your browsing, wishlisting, and booking history
        </p>

        {scoresLoading ? (
          <div className="spinner" style={{ width: 20, height: 20 }} />
        ) : categoryScores.length === 0 ? (
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🌱</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              We're still learning your preferences. Browse or book events to help us personalize your feed!
            </div>
          </div>
        ) : (
          <>
            {(() => {
              const maxScore = Math.max(...categoryScores.map((s) => s.score), 1)
              return categoryScores.map((s) => (
                <div key={s.category} className="taste-bar-wrap">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{s.category}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{Math.round(s.score)} pts</span>
                  </div>
                  <div className="taste-bar">
                    <div
                      className="taste-bar-fill"
                      style={{
                        width: `${Math.round((s.score / maxScore) * 100)}%`,
                        background: CATEGORY_COLORS[s.category] || 'var(--purple)',
                      }}
                    />
                  </div>
                </div>
              ))
            })()}
            {categoryScores.length > 0 && (() => {
              const top = categoryScores[0]?.category
              const second = categoryScores[1]?.category
              const third = categoryScores[2]?.category
              return (
                <p style={{ marginTop: '1rem', fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  ✨ Your top interest is <strong style={{ color: 'var(--text-primary)' }}>{top}</strong>
                  {second && <>, and you enjoy <strong style={{ color: 'var(--text-primary)' }}>{second}</strong></>}
                  {third && <> and <strong style={{ color: 'var(--text-primary)' }}>{third}</strong></>} as well.
                </p>
              )
            })()}
          </>
        )}
      </div>

      {/* Wishlist */}
      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Heart size={16} style={{ color: 'var(--red)' }} /> My Wishlist
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          {wishlistEvents.length} saved event{wishlistEvents.length !== 1 ? 's' : ''}
        </p>

        {wishlistEvents.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-icon">💝</div>
            <div className="empty-sub">No wishlisted events yet. Browse events and heart your favorites!</div>
          </div>
        ) : (
          <div className="events-grid">
            {wishlistEvents.map((evt) => (
              <div key={evt.id} className="event-card" style={{ cursor: 'default' }}>
                <img
                  src={evt.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'}
                  alt={evt.title}
                  className="event-card-banner"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80' }}
                />
                <div className="event-card-body">
                  <div className="event-card-title">{evt.title}</div>
                  <div className="event-card-meta"><Calendar size={12} />{evt.date}</div>
                  <div className="event-card-meta"><MapPin size={12} />{evt.venue}, {evt.city}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span className="event-card-price">{formatCurrency(evt.price)}</span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn-ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => navigate(`/events/${evt.id}`)}>View</button>
                      <button className="btn-ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: 'var(--red)' }}
                        onClick={() => removeFromWishlist(evt.id)}>Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {emailNotifications ? <Bell size={16} style={{ color: 'var(--teal)' }} /> : <BellOff size={16} style={{ color: 'var(--text-muted)' }} />}
          Notification Preferences
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Control which automated emails you receive from EventSphere
        </p>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '1rem 1.25rem'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
              Receive event reminders from organizers I've booked with
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Get notified when an organizer you've attended creates a new event
            </div>
          </div>
          <button
            id="email-notif-toggle"
            onClick={toggleEmailNotifications}
            disabled={savingNotif}
            style={{
              width: '52px', height: '28px', borderRadius: '999px', border: 'none', cursor: 'pointer',
              background: emailNotifications ? 'var(--teal)' : 'var(--border)',
              position: 'relative', transition: 'background 0.2s ease', flexShrink: 0, marginLeft: '1.25rem',
              outline: 'none'
            }}
            aria-label={emailNotifications ? 'Disable email reminders' : 'Enable email reminders'}
          >
            <span style={{
              position: 'absolute', top: '3px',
              left: emailNotifications ? '27px' : '3px',
              width: '22px', height: '22px',
              background: '#fff', borderRadius: '50%',
              transition: 'left 0.2s ease',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
            }} />
          </button>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
          {emailNotifications
            ? '✅ You will receive reminder emails when organizers you have  booked with create new events.'
            : '🔕 You have opted out of event reminder emails from organizers.'}
        </p>
      </div>

      {/* ── Account & Sign Out ──────────────────────────── */}
      <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
          Account Settings
        </h2>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            {currentUser.email}
          </div>
          <span style={{
            display: 'inline-block', background: 'var(--purple-dim)', color: 'var(--purple)',
            borderRadius: '999px', padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: 600,
          }}>
            Attendee
          </span>
        </div>
        <button
          id="profile-signout-btn"
          onClick={() => {
            if (typeof logout === 'function') logout()
            sessionStorage.clear()
            toast.success('You have been signed out successfully.')
            navigate('/login')
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            width: '100%', padding: '0.75rem 1.25rem',
            background: 'transparent', border: '1.5px solid #ef4444',
            borderRadius: '10px', color: '#ef4444', fontSize: '0.9rem',
            fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
