import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import {
  ArrowLeft, Info, CreditCard, CheckCircle,
  Mail, Calendar, MapPin, Ticket, Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, calculatePaymentSplit } from '../utils/formatCurrency'

/* ── Booking Success Overlay ─────────────────────────── */
function BookingSuccessOverlay({ event, bookingId, amountPaid, attendeeEmail, onViewTicket, onMyTickets }) {
  const [countdown, setCountdown] = useState(3)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setReady(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

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

          {(() => {
            const { ticketPrice } = calculatePaymentSplit(amountPaid)
            return (
              <div className="payment-box" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="payment-box-title">
                  <CreditCard size={16} style={{ color: '#7c3aed' }} />
                  Amount Paid
                </div>
                <div className="payment-row" style={{ marginTop: '0.25rem', paddingTop: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Total Paid</span>
                  <span className="payment-row-value purple" style={{ fontSize: '1.1rem', fontWeight: 800 }}>{formatCurrency(ticketPrice)}</span>
                </div>
                <div style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  EventSphere charges a 10% service fee, included in the ticket price.
                </div>
              </div>
            )
          })()}
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
          <span>Confirmation email sent to <strong>{attendeeEmail}</strong></span>
        </div>
        <div className="success-email-note" style={{ marginTop: '0.25rem' }}>
          <span>📱 SMS notification will be sent to your registered phone number</span>
        </div>
      </div>
    </div>
  )
}

/* ── Main Checkout Page ───────────────────────────────── */
export default function Checkout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [successData, setSuccessData] = useState(null)
  const bookingRef = useRef(null) // store created booking details

  useEffect(() => {
    supabase.from('events').select('*').eq('id', id).single()
      .then(({ data }) => { setEvent(data); setLoading(false) })
  }, [id])

  async function createBookingRecord(razorpayPaymentId) {
    if (!event || !currentUser) return null
    const { ticketPrice: price, platformFee, organizerReceived } = calculatePaymentSplit(Number(event.price))
    const bookingId = `ES-${nanoid(8).toUpperCase()}`
    const qrCode = `EVENTSPHERE-${bookingId}-${event.id}`

    // Insert booking
    const { error: bookingErr } = await supabase.from('bookings').insert([{
      id: bookingId,
      event_id: event.id,
      attendee_id: currentUser.id,
      attendee_name: currentUser.name,
      attendee_email: currentUser.email || '',
      attendee_phone: currentUser.phone || '',
      ticket_qr_code: qrCode,
      booked_at: new Date().toISOString(),
      amount_paid: price,
      platform_fee: platformFee,
      organizer_received: organizerReceived,
      payment_status: 'confirmed',
      payment_id: razorpayPaymentId || `MANUAL-${nanoid(8)}`,
      event_title: event.title,
      event_date: event.date,
      event_city: event.city,
      organizer_id: event.organizer_id || '',
      organizer_name: event.organizer_name || '',
    }])

    if (bookingErr) {
      console.error('Booking insert error:', bookingErr)
      throw new Error('Booking insert failed')
    }

    // Update tickets_sold on event
    await supabase.from('events')
      .update({ tickets_sold: (event.tickets_sold || 0) + 1, booking_count: (event.booking_count || 0) + 1 })
      .eq('id', event.id)

    // Update organizer wallet
    if (event.organizer_id) {
      const { data: org } = await supabase.from('users').select('wallet_balance').eq('id', event.organizer_id).single()
      if (org) {
        await supabase.from('users')
          .update({ wallet_balance: +(org.wallet_balance + organizerReceived).toFixed(2) })
          .eq('id', event.organizer_id)
      }
    }

    // Update platform revenue
    const { data: rev } = await supabase.from('platform_revenue').select('total_revenue').eq('id', 1).single()
    if (rev) {
      await supabase.from('platform_revenue')
        .update({ total_revenue: +(rev.total_revenue + platformFee).toFixed(2) })
        .eq('id', 1)
    }

    // Insert organizer notification
    if (event.organizer_id) {
      await supabase.from('notifications').insert([{
        id: nanoid(),
        user_id: event.organizer_id,
        message: `New booking for "${event.title}" — ${formatCurrency(organizerReceived)} credited to your wallet`,
        is_read: false,
        created_at: new Date().toISOString(),
      }])
    }

    // Insert attendee notification
    await supabase.from('notifications').insert([{
      id: nanoid(),
      user_id: currentUser.id,
      message: `Your booking for "${event.title}" is confirmed! Your ticket QR code is ready. 🎟️`,
      is_read: false,
      created_at: new Date().toISOString(),
    }])

    // Call Edge Function for email (fire-and-forget, never blocks flow)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      fetch(`${supabaseUrl}/functions/v1/send-booking-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          attendee_name: currentUser.name,
          attendee_email: currentUser.email,
          event_title: event.title,
          event_date: event.date,
          event_venue: event.venue,
          event_city: event.city,
          booking_id: bookingId,
          ticket_qr_code: qrCode,
          amount_paid: price,
          organizer_name: event.organizer_name || 'EventSphere',
        }),
      }).catch(() => {}) // silently ignore errors
    } catch (_) {}

    // ── Behavior Tracking: booking score +25 for this category ────────────────
    try {
      if (event.category) {
        const { data: catRow } = await supabase.from('user_category_scores')
          .select('score').eq('attendee_id', currentUser.id).eq('category', event.category).single()
        if (catRow) {
          await supabase.from('user_category_scores')
            .update({ score: (catRow.score || 0) + 25, last_updated: new Date().toISOString() })
            .eq('attendee_id', currentUser.id).eq('category', event.category)
        } else {
          await supabase.from('user_category_scores')
            .insert([{ id: nanoid(), attendee_id: currentUser.id, category: event.category, score: 25, last_updated: new Date().toISOString() }])
        }
      }
      await supabase.from('users').update({ last_active: new Date().toISOString() }).eq('id', currentUser.id)
    } catch (_) {}

    return { bookingId, qrCode, price }
  }

  function handlePayNow() {
    if (!event || !currentUser) return

    const price = Number(event.price)
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID

    if (!razorpayKey || razorpayKey === 'rzp_test_YOUR_KEY_HERE') {
      toast.error('Razorpay key not configured. Add VITE_RAZORPAY_KEY_ID to your .env file.')
      return
    }

    if (!window.Razorpay) {
      toast.error('Razorpay not loaded. Please refresh the page.')
      return
    }

    setProcessing(true)

    const options = {
      key: razorpayKey,
      amount: Math.round(price * 100), // in paise
      currency: 'INR',
      name: 'EventSphere',
      description: event.title,
      image: 'https://eventsphere.in/logo.png',
      prefill: {
        name: currentUser.name || '',
        email: currentUser.email || '',
        contact: currentUser.phone || '',
      },
      theme: { color: '#7c3aed' },
      modal: {
        ondismiss: () => {
          setProcessing(false)
          toast('Payment cancelled', { icon: '❌' })
        },
      },
      handler: async (response) => {
        // Payment succeeded — now create booking
        try {
          const result = await createBookingRecord(response.razorpay_payment_id)
          if (result) {
            bookingRef.current = result
            setSuccessData({
              bookingId: result.bookingId,
              amountPaid: result.price,
            })
          }
        } catch (err) {
          console.error('Post-payment booking error:', err)
          toast.error('Payment succeeded but booking failed. Contact support with payment ID: ' + response.razorpay_payment_id)
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

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>
  if (!event) return <div className="page-wrapper"><div className="empty-state"><div className="empty-title">Event not found</div></div></div>

  const { ticketPrice: price, platformFee } = calculatePaymentSplit(Number(event.price))

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
          {/* Order Summary */}
          <div className="checkout-card">
            <div className="checkout-card-title">Order Summary</div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{event.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📅 {event.date}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📍 {event.venue}, {event.city}</div>
            </div>

            <div className="payment-box">
              <div className="payment-box-title"><CreditCard size={16} style={{ color: 'var(--purple)' }} />Payment Breakdown</div>
              <div className="payment-row">
                <span className="payment-row-label">Ticket Price</span>
                <span className="payment-row-value">{formatCurrency(price)}</span>
              </div>
              <div className="payment-row">
                <span className="payment-row-label" style={{ color: 'var(--text-secondary)' }}>Platform Fee (10%)</span>
                <span className="payment-row-value red">- {formatCurrency(platformFee)}</span>
              </div>
              <div className="payment-row" style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Total</span>
                <span className="payment-row-value purple" style={{ fontSize: '1.05rem', fontWeight: 800 }}>{formatCurrency(price)}</span>
              </div>
              <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                EventSphere charges a 10% service fee, which is included in the ticket price shown above.
              </div>
            </div>

            <div className="payment-row" style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span className="payment-row-value purple">{formatCurrency(price)}</span>
            </div>
          </div>

          {/* Payment Section */}
          <div className="checkout-card">
            <div className="checkout-card-title">Payment Details</div>

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

            {/* Pay Now Button */}
            <button
              id="razorpay-pay-btn"
              className="razorpay-pay-btn"
              onClick={handlePayNow}
              disabled={processing || price === 0}
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

            {price === 0 && (
              <button
                id="confirm-pay-btn"
                className="btn-primary"
                style={{ marginTop: '1rem' }}
                onClick={async () => {
                  setProcessing(true)
                  try {
                    const result = await createBookingRecord(null)
                    if (result) {
                      setSuccessData({ bookingId: result.bookingId, amountPaid: 0 })
                    }
                  } catch {
                    toast.error('Booking failed. Please try again.')
                  } finally {
                    setProcessing(false)
                  }
                }}
                disabled={processing}
              >
                {processing ? <span className="btn-spinner" /> : '🎟️ Claim Free Ticket'}
              </button>
            )}

            <div className="lock-note" style={{ marginTop: '0.75rem' }}>
              <span>🔒 Your payment is secured with 256-bit SSL encryption</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
