import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import {
  ArrowLeft, Info, CreditCard, CheckCircle,
  Mail, Calendar, MapPin, Ticket, Clock, AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, calculatePaymentSplit } from '../utils/formatCurrency'

/* ══════════════════════════════════════════════════════════════
   SHARED BOOKING CREATION FUNCTION
   Called by BOTH free-ticket flow and Razorpay success handler.
   Pass paymentId = '' for free tickets.
   Throws on insert error so caller can handle it.
══════════════════════════════════════════════════════════════ */
async function createBookingRecord(event, currentUser, paymentId = '') {
  // ── 1. Generate IDs ────────────────────────────────────────
  const bookingId = `ES-${nanoid(8).toUpperCase()}`

  // Structured QR code with real booking details so scanning gives useful info
  const ticketQrCode = JSON.stringify({
    bookingId,
    eventId: event.id,
    eventTitle: event.title,
    attendeeName: currentUser.name,
    eventDate: event.date,
    eventVenue: event.venue,
    platform: 'EventSphere',
  })

  // ── 2. Calculate payment values ────────────────────────────
  const rawPrice = Number(event.price) || 0
  let amountPaid = 0
  let platformFee = 0
  let organizerReceived = 0

  if (rawPrice > 0) {
    platformFee = Math.round(rawPrice * 0.10 * 100) / 100        // 10%, 2dp
    organizerReceived = Math.round((rawPrice - platformFee) * 100) / 100
    amountPaid = rawPrice
  }

  // ── 3. Build complete insert object (only confirmed columns) ─
  const insertRow = {
    id: bookingId,
    event_id: event.id,
    attendee_id: currentUser.id,
    attendee_name: currentUser.name,
    attendee_email: currentUser.email || '',
    ticket_qr_code: ticketQrCode,
    amount_paid: amountPaid,
    platform_fee: platformFee,
    organizer_received: organizerReceived,
    payment_status: 'confirmed',
    payment_id: paymentId || '',          // '' for free, Razorpay ID for paid
    event_title: event.title,
    event_date: event.date,
    event_city: event.city,
    organizer_id: event.organizer_id || '',
    organizer_name: event.organizer_name || '',
  }

  // ── 4. Primary insert ──────────────────────────────────────
  const { data, error: insertError } = await supabase
    .from('bookings')
    .insert([insertRow])

  if (insertError) {
    console.error('BOOKING INSERT ERROR', insertError)
    throw new Error(insertError.message)
  }

  // ── 5. Update event ticket count (non-critical) ────────────
  try {
    await supabase
      .from('events')
      .update({
        tickets_sold: (event.tickets_sold || 0) + 1,
        booking_count: (event.booking_count || 0) + 1,
      })
      .eq('id', event.id)
  } catch (err) {
    console.warn('tickets_sold update failed (non-critical):', err)
  }

  // ── 6. Update organizer wallet (non-critical) ──────────────
  if (event.organizer_id && organizerReceived > 0) {
    try {
      const { data: org } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', event.organizer_id)
        .single()
      if (org) {
        await supabase
          .from('users')
          .update({ wallet_balance: +((org.wallet_balance || 0) + organizerReceived).toFixed(2) })
          .eq('id', event.organizer_id)
      }
    } catch (err) {
      console.warn('wallet update failed (non-critical):', err)
    }
  }

  // ── 7. Update platform revenue (non-critical) ──────────────
  if (platformFee > 0) {
    try {
      const { data: rev } = await supabase
        .from('platform_revenue')
        .select('total_revenue')
        .eq('id', 1)
        .single()
      if (rev) {
        await supabase
          .from('platform_revenue')
          .update({ total_revenue: +((rev.total_revenue || 0) + platformFee).toFixed(2) })
          .eq('id', 1)
      }
    } catch (err) {
      console.warn('platform_revenue update failed (non-critical):', err)
    }
  }

  // ── 8. Notify organizer (non-critical) ─────────────────────
  if (event.organizer_id) {
    try {
      await supabase.from('notifications').insert([{
        id: nanoid(),
        user_id: event.organizer_id,
        message: `🎟️ New booking received for "${event.title}"!`,
        is_read: false,
        created_at: new Date().toISOString(),
      }])
    } catch (err) {
      console.warn('organizer notification failed (non-critical):', err)
    }
  }

  // Return booking id for navigation
  return bookingId
}

/* ── Booking Success Overlay ─────────────────────────── */
function BookingSuccessOverlay({ event, bookingId, amountPaid, attendeeEmail, onViewTicket, onMyTickets }) {
  const [countdown, setCountdown] = useState(3)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); setReady(true); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const isFree = !amountPaid || Number(amountPaid) === 0

  return (
    <div className="booking-success-overlay">
      <div className="booking-success-card">
        {/* Animated Checkmark */}
        <div className="success-checkmark-wrap">
          <svg className="success-checkmark-svg" viewBox="0 0 52 52">
            <circle className="success-circle" cx="26" cy="26" r="25" fill="none" />
            <path className="success-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>

        <h2 className="success-title">Booking Confirmed!</h2>
        <p className="success-subtitle">Your ticket is on its way 🎉</p>

        {/* Summary */}
        <div className="success-summary-box">
          <div className="success-summary-row">
            <span className="success-summary-label">Event</span>
            <span className="success-summary-value">{event?.title}</span>
          </div>
          <div className="success-summary-row">
            <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
            <span className="success-summary-value">{event?.date}</span>
          </div>
          <div className="success-summary-row">
            <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
            <span className="success-summary-value">{event?.venue}, {event?.city}</span>
          </div>
          <div className="success-divider" />
          <div className="success-summary-row" style={{ marginBottom: '1rem' }}>
            <span className="success-summary-label">Booking Ref</span>
            <span className="success-summary-value success-mono">{bookingId?.slice(0, 12).toUpperCase()}</span>
          </div>

          <div className="payment-box" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="payment-box-title">
              <CreditCard size={16} style={{ color: 'var(--purple)' }} />
              Amount Paid
            </div>
            <div className="payment-row" style={{ marginTop: '0.25rem', paddingTop: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Total Paid</span>
              <span className="payment-row-value purple" style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                {isFree ? 'Free' : formatCurrency(amountPaid)}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="success-btn-row">
          <button
            className="btn-purple"
            onClick={onViewTicket}
            disabled={!ready}
            style={{ flex: 1, opacity: ready ? 1 : 0.5 }}
          >
            <Ticket size={16} />
            {ready ? 'View My Ticket' : `View Ticket (${countdown})`}
          </button>
          <button
            className="btn-secondary"
            onClick={onMyTickets}
            disabled={!ready}
            style={{ flex: 1, opacity: ready ? 1 : 0.5 }}
          >
            My Tickets
          </button>
        </div>

        {/* Email note */}
        <div className="success-email-note">
          <Mail size={12} />
          <span>Confirmation sent to <strong>{attendeeEmail}</strong></span>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN CHECKOUT PAGE
══════════════════════════════════════════════════════════════ */
export default function Checkout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [successData, setSuccessData] = useState(null)

  useEffect(() => {
    supabase.from('events').select('*').eq('id', id).single()
      .then(({ data }) => { setEvent(data); setLoading(false) })
  }, [id])

  // ── Check Razorpay key configuration ──────────────────────
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID
  const isRazorpayConfigured = (
    razorpayKey &&
    razorpayKey.trim() !== '' &&
    !razorpayKey.startsWith('your_key') &&
    !razorpayKey.startsWith('YOUR_KEY') &&
    !razorpayKey.includes('YOUR_') &&
    razorpayKey !== 'rzp_test_YOUR_KEY_HERE'
  )

  /* ── FREE TICKET HANDLER ──────────────────────────────── */
  async function handleClaimFreeTicket() {
    if (!event || !currentUser) return
    setProcessing(true)
    try {
      const bookingId = await createBookingRecord(event, currentUser, '')
      toast.success('🎟️ Your free ticket has been claimed!')
      navigate('/my-tickets')
    } catch (err) {
      console.error('FREE TICKET CLAIM ERROR:', err)
      toast.error(err.message || 'Booking failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  /* ── RAZORPAY BYPASS (when key is not set) ────────────── */
  async function handleBypassPay() {
    if (!event || !currentUser) return
    setProcessing(true)
    try {
      const bookingId = await createBookingRecord(event, currentUser, `TEST-${nanoid(8)}`)
      toast.success('🎟️ Test booking created successfully!')
      setSuccessData({ bookingId, amountPaid: Number(event.price) })
    } catch (err) {
      console.error('BYPASS PAY ERROR:', err)
      toast.error(err.message || 'Booking failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  /* ── RAZORPAY PAY NOW HANDLER ─────────────────────────── */
  function handlePayNow() {
    if (!event || !currentUser) return

    // Guard: Razorpay key not configured
    if (!isRazorpayConfigured) {
      toast.error('Payment gateway not configured. Please contact support.')
      return
    }

    if (!window.Razorpay) {
      toast.error('Razorpay not loaded. Please refresh the page.')
      return
    }

    setProcessing(true)
    const price = Number(event.price)

    const options = {
      key: razorpayKey,
      amount: Math.round(price * 100), // paise
      currency: 'INR',
      name: 'EventSphere',
      description: event.title,
      image: 'https://eventsphere.in/logo.png',
      prefill: {
        name: currentUser.name || '',
        email: currentUser.email || '',
        contact: currentUser.phone || '',
      },
      theme: { color: '#8b5cf6' },
      modal: {
        ondismiss: () => {
          setProcessing(false)
          toast('Payment cancelled', { icon: '❌' })
        },
      },
      handler: async (response) => {
        // Razorpay payment succeeded — now create the booking
        try {
          const razorpayPaymentId = response.razorpay_payment_id
          const bookingId = await createBookingRecord(event, currentUser, razorpayPaymentId)
          toast.success('🎟️ Booking confirmed!')
          setSuccessData({ bookingId, amountPaid: price })
        } catch (err) {
          console.error('POST-PAYMENT BOOKING ERROR:', err)
          toast.error(
            `Payment received but booking failed: ${err.message}. ` +
            `Please contact support with your payment ID: ${response.razorpay_payment_id}`
          )
        } finally {
          setProcessing(false)
        }
      },
    }

    try {
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => {
        setProcessing(false)
        toast.error(`Payment failed: ${response.error?.description || 'Please try again.'}`)
      })
      rzp.open()
    } catch (err) {
      setProcessing(false)
      toast.error('Could not open payment window. Please try again.')
    }
  }

  /* ── Render ───────────────────────────────────────────── */
  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>
  if (!event) return (
    <div className="page-wrapper">
      <div className="empty-state">
        <div className="empty-title">Event not found</div>
      </div>
    </div>
  )

  const price = Number(event.price) || 0
  const isFreeEvent = price === 0 || event.pricing_type === 'free'

  return (
    <>
      {/* Booking Success Overlay */}
      {successData && (
        <BookingSuccessOverlay
          event={event}
          bookingId={successData.bookingId}
          amountPaid={successData.amountPaid}
          attendeeEmail={currentUser?.email}
          onViewTicket={() => navigate(`/my-tickets/${successData.bookingId}`)}
          onMyTickets={() => navigate('/my-tickets')}
        />
      )}

      <div className="page-wrapper">
        <button className="btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="page-title">Checkout</h1>

        <div className="checkout-grid">
          {/* ── Order Summary ──────────────────────────────── */}
          <div className="checkout-card">
            <div className="checkout-card-title">Order Summary</div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{event.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📅 {event.date}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📍 {event.venue}, {event.city}</div>
            </div>

            <div className="payment-box">
              <div className="payment-box-title">
                <CreditCard size={16} style={{ color: 'var(--purple)' }} />
                Payment Breakdown
              </div>
              {isFreeEvent ? (
                <>
                  <div className="payment-row">
                    <span className="payment-row-label">Ticket Price</span>
                    <span className="payment-row-value" style={{ color: '#10b981', fontWeight: 700 }}>Free</span>
                  </div>
                  <div className="payment-row" style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Total</span>
                    <span className="payment-row-value purple" style={{ fontSize: '1.1rem', fontWeight: 900 }}>Free</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="payment-row">
                    <span className="payment-row-label">Ticket Price</span>
                    <span className="payment-row-value">{formatCurrency(price)}</span>
                  </div>
                  <div className="payment-row" style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Total</span>
                    <span className="payment-row-value purple" style={{ fontSize: '1.05rem', fontWeight: 800 }}>{formatCurrency(price)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Payment Section ────────────────────────────── */}
          <div className="checkout-card">
            <div className="checkout-card-title">{isFreeEvent ? 'Free Ticket' : 'Payment Details'}</div>

            {isFreeEvent ? (
              /* ── Free Event Flow ─── */
              <div>
                <div style={{
                  background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                  <span style={{ fontSize: '2rem' }}>🎟️</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '0.2rem' }}>This is a free event!</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>No payment required. Claim your ticket instantly.</div>
                  </div>
                </div>

                <button
                  id="claim-free-ticket-btn"
                  className="btn-purple"
                  style={{ width: '100%', fontSize: '1rem', padding: '0.9rem', gap: '0.6rem' }}
                  onClick={handleClaimFreeTicket}
                  disabled={processing}
                >
                  {processing ? <span className="btn-spinner" /> : <><Ticket size={18} /> Claim Free Ticket</>}
                </button>
                <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  No payment required · Your ticket will be generated instantly
                </div>
              </div>
            ) : (
              /* ── Paid Event Flow ─── */
              <div>
                {/* Test Credentials Box */}
                <div className="razorpay-test-box">
                  <div className="razorpay-test-header">
                    <Info size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
                    <span>Test Payment Credentials</span>
                  </div>
                  <div className="razorpay-test-grid">
                    <div className="razorpay-test-section">
                      <div className="razorpay-test-label">💳 Test Card</div>
                      <div className="razorpay-test-mono">4111 1111 1111 1111</div>
                      <div className="razorpay-test-sub">Expiry: Any future date (e.g., 12/26) · CVV: Any 3 digits</div>
                    </div>
                    <div className="razorpay-test-section">
                      <div className="razorpay-test-label">📱 Test UPI</div>
                      <div className="razorpay-test-mono">success@razorpay</div>
                    </div>
                    <div className="razorpay-test-section">
                      <div className="razorpay-test-label">🏦 Net Banking</div>
                      <div className="razorpay-test-sub">Select any bank and use test credentials shown in modal</div>
                    </div>
                  </div>
                </div>

                {/* Pay Now Button — shown when Razorpay IS configured */}
                {isRazorpayConfigured && (
                  <button
                    id="razorpay-pay-btn"
                    className="razorpay-pay-btn"
                    onClick={handlePayNow}
                    disabled={processing}
                    style={{ width: '100%', marginTop: '1rem' }}
                  >
                    {processing ? (
                      <span className="btn-spinner" />
                    ) : (
                      <>
                        <span className="razorpay-logo-text">₹</span>
                        Pay {formatCurrency(price)} — Secure via Razorpay
                      </>
                    )}
                  </button>
                )}

                {/* Bypass Button — only shown when Razorpay is NOT configured */}
                {!isRazorpayConfigured && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                      borderRadius: '8px', padding: '0.65rem 0.85rem', marginBottom: '0.75rem',
                      fontSize: '0.8rem', color: '#f59e0b',
                    }}>
                      <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                      Payment gateway not configured. Using test booking mode.
                    </div>
                    <button
                      id="bypass-pay-btn"
                      className="btn-purple"
                      onClick={handleBypassPay}
                      disabled={processing}
                      style={{ width: '100%', fontSize: '1rem', padding: '0.9rem', gap: '0.6rem' }}
                    >
                      {processing ? <span className="btn-spinner" /> : <><CreditCard size={18} /> Pay and Book (Test Mode)</>}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="lock-note" style={{ marginTop: '0.75rem' }}>
              <span>{isFreeEvent
                ? '✅ Your ticket is completely free — no card details needed'
                : isRazorpayConfigured
                  ? '🔒 Your payment is secured with 256-bit SSL encryption'
                  : '⚠️ Add VITE_RAZORPAY_KEY_ID to .env to enable live payments'
              }</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
