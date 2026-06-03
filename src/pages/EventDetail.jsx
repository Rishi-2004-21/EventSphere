import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { Calendar, MapPin, Users, Heart, Ticket, CreditCard, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, calculatePaymentSplit } from '../utils/formatCurrency'

function PaymentBreakdown({ price }) {
  const { ticketPrice, platformFee } = calculatePaymentSplit(price)

  return (
    <div className="payment-box">
      <div className="payment-box-title">
        <CreditCard size={16} style={{ color: '#7c3aed' }} />
        Payment Breakdown
      </div>
      <div className="payment-row">
        <span className="payment-row-label">Ticket Price</span>
        <span className="payment-row-value">{formatCurrency(ticketPrice)}</span>
      </div>
      <div className="payment-row">
        <span className="payment-row-label" style={{ color: 'var(--text-secondary)' }}>Platform Fee (10%)</span>
        <span className="payment-row-value red">- {formatCurrency(platformFee)}</span>
      </div>
      <div className="payment-row" style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Total</span>
        <span className="payment-row-value purple" style={{ fontSize: '1.05rem', fontWeight: 800 }}>{formatCurrency(ticketPrice)}</span>
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        EventSphere charges a 10% service fee, which is included in the ticket price.
      </div>
    </div>
  )
}

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser, updateUser } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const sessionIdRef = useRef(nanoid())
  const isWishlisted = currentUser?.wishlist?.includes(id)

  useEffect(() => {
    async function fetchEvent() {
      const { data } = await supabase.from('events').select('*').eq('id', id).single()
      setEvent(data)
      setLoading(false)

      // ── Behavior Tracking: record this view ────────────────────────────────
      if (currentUser?.id && data) {
        // 1. Insert into event_views
        supabase.from('event_views').insert([{
          id: nanoid(),
          attendee_id: currentUser.id,
          event_id: id,
          session_id: sessionIdRef.current,
          viewed_at: new Date().toISOString(),
          duration_seconds: 0,
        }]).then(() => {}).catch(() => {})

        // 2. Update view_history on users (keep last 20)
        const existingHistory = currentUser.view_history || []
        const updatedHistory = [id, ...existingHistory.filter((x) => x !== id)].slice(0, 20)
        supabase.from('users').update({ view_history: updatedHistory, last_active: new Date().toISOString() })
          .eq('id', currentUser.id).then(() => updateUser({ view_history: updatedHistory })).catch(() => {})

        // 3. Upsert user_category_scores — +3 pts for this category
        if (data.category) {
          supabase.rpc('upsert_category_score', {
            p_attendee_id: currentUser.id,
            p_category: data.category,
            p_delta: 3,
          }).catch(() => {
            // Fallback if RPC not available: manual upsert
            supabase.from('user_category_scores')
              .select('score')
              .eq('attendee_id', currentUser.id)
              .eq('category', data.category)
              .single()
              .then(({ data: row }) => {
                if (row) {
                  supabase.from('user_category_scores')
                    .update({ score: (row.score || 0) + 3, last_updated: new Date().toISOString() })
                    .eq('attendee_id', currentUser.id).eq('category', data.category).then(() => {})
                } else {
                  supabase.from('user_category_scores')
                    .insert([{ id: nanoid(), attendee_id: currentUser.id, category: data.category, score: 3, last_updated: new Date().toISOString() }])
                    .then(() => {})
                }
              })
          })
        }
      }
    }
    fetchEvent()
  }, [id, currentUser?.id])

  async function handleWishlist() {
    if (!currentUser) return
    const newWishlist = isWishlisted
      ? currentUser.wishlist.filter((w) => w !== id)
      : [...(currentUser.wishlist || []), id]

    const { error } = await supabase
      .from('users')
      .update({ wishlist: newWishlist })
      .eq('id', currentUser.id)

    if (!error) {
      updateUser({ wishlist: newWishlist })
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist!')

      // ── Behavior Tracking: wishlist score update ───────────────────────────
      if (event?.category) {
        const delta = isWishlisted ? -5 : 10
        supabase.from('user_category_scores')
          .select('score')
          .eq('attendee_id', currentUser.id)
          .eq('category', event.category)
          .single()
          .then(({ data: row }) => {
            if (row) {
              const newScore = Math.max(0, (row.score || 0) + delta)
              supabase.from('user_category_scores')
                .update({ score: newScore, last_updated: new Date().toISOString() })
                .eq('attendee_id', currentUser.id).eq('category', event.category).then(() => {})
            } else if (delta > 0) {
              supabase.from('user_category_scores')
                .insert([{ id: nanoid(), attendee_id: currentUser.id, category: event.category, score: delta, last_updated: new Date().toISOString() }])
                .then(() => {})
            }
          }).catch(() => {})
      }
    }
  }

  if (loading) return (
    <div className="loading-wrap">
      <div className="spinner" />
      <div className="loading-text">Loading event…</div>
    </div>
  )

  if (!event) return (
    <div className="page-wrapper">
      <div className="empty-state">
        <div className="empty-icon">🎪</div>
        <div className="empty-title">Event not found</div>
        <button className="btn-purple" onClick={() => navigate('/discover')}>Back to Events</button>
      </div>
    </div>
  )

  const remaining = (event.capacity || 0) - (event.tickets_sold || 0)

  return (
    <div className="page-wrapper">
      <button className="btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <img
        src={event.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'}
        alt={event.title}
        className="event-detail-banner"
        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80' }}
      />

      <div className="event-detail-grid">
        <div>
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span className={`badge cat-${event.category}`}>{event.category}</span>
              {event.trending === 'Hot' && <span className="badge badge-hot">🔥 Hot</span>}
              {event.trending === 'Rising' && <span className="badge badge-rising">📈 Rising</span>}
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.2 }}>{event.title}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              by {event.organizer_name}
            </p>
          </div>

          <div className="info-chips">
            <span className="info-chip"><Calendar size={13} />{event.date}</span>
            <span className="info-chip"><MapPin size={13} />{event.venue}, {event.city}</span>
            <span className="info-chip"><Users size={13} />{remaining} spots left</span>
          </div>

          <PaymentBreakdown price={event.price} />

          <div style={{ marginTop: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>About this event</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem' }}>
              {event.description}
            </p>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <div className="card" style={{ position: 'sticky', top: '80px' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--purple)', marginBottom: '0.25rem' }}>
              {formatCurrency(event.price)}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
              per ticket
            </div>

            <button
              id="book-now-btn"
              className="btn-purple"
              style={{ width: '100%', marginBottom: '0.75rem', gap: '0.5rem' }}
              onClick={() => navigate(`/consent/${event.id}`)}
            >
              <Ticket size={16} /> Book Now
            </button>

            <button
              id="wishlist-btn"
              className="btn-secondary"
              style={{ width: '100%', gap: '0.5rem', color: isWishlisted ? 'var(--red)' : undefined, borderColor: isWishlisted ? 'var(--red)' : undefined }}
              onClick={handleWishlist}
            >
              <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
              {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>

            <div className="divider" />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <div>📍 {event.venue}</div>
              <div>{event.city}</div>
              <div style={{ marginTop: '0.5rem' }}>🎟 {event.capacity} total capacity</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
