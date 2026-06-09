import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import {
  ArrowLeft, Info, CreditCard, CheckCircle,
  Mail, Calendar, MapPin, Ticket, Copy, Check, X,
} from 'lucide-react'
import QRCode from 'react-qr-code'
import toast from 'react-hot-toast'
import { formatCurrency } from '../utils/formatCurrency'

// UPI payment config
// TODO: Replace with Razorpay modal when VITE_RAZORPAY_KEY_ID is configured
// Fallbacks if organizer hasn't set them up (should be blocked by UI anyway)
const FALLBACK_UPI_QR_URL = import.meta.env.VITE_UPI_QR_URL || 'https://foexoyakzskviskmkqqn.supabase.co/storage/v1/object/public/assets/upi%20id.jpeg'
const FALLBACK_UPI_ID = import.meta.env.VITE_UPI_ID || '8125432020@pthdfc'


/* ══════════════════════════════════════════════════════════════
   SHARED BOOKING CREATION FUNCTION
   Called by BOTH free-ticket flow and UPI success handler.
   Pass paymentId = '' for free tickets.
   Throws on insert error so caller can handle it.
══════════════════════════════════════════════════════════════ */
async function createBookingRecord(event, currentUser, paymentId = '') {
  const bookingId = `ES-${nanoid(8).toUpperCase()}`

  // Structured QR payload — scannable by the organizer portal
  const ticketQrCode = JSON.stringify({
    booking_id: bookingId,
    event_id: event.id,
    event_title: event.title,
    attendee_name: currentUser.name,
    attendee_email: currentUser.email || '',
    event_date: event.date,
    event_venue: event.venue,
    event_city: event.city,
    amount_paid: Number(event.price) || 0,
    payment_status: 'confirmed',
    upi_transaction_id: paymentId || null,
    verified: false,
    platform: 'EventSphere',
  })

  const rawPrice = Number(event.price) || 0
  let amountPaid = 0
  let platformFee = 0
  let organizerReceived = 0

  if (rawPrice > 0) {
    platformFee = Math.round(rawPrice * 0.10 * 100) / 100
    organizerReceived = Math.round((rawPrice - platformFee) * 100) / 100
    amountPaid = rawPrice
  }

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
    payment_id: paymentId || '',
    payment_method: rawPrice > 0 ? 'upi' : 'free',
    upi_transaction_id: rawPrice > 0 ? (paymentId || null) : null,
    event_title: event.title,
    event_date: event.date,
    event_city: event.city,
    organizer_id: event.organizer_id || '',
    organizer_name: event.organizer_name || '',
  }

  const { error: insertError } = await supabase.from('bookings').insert([insertRow])
  if (insertError) {
    console.error('BOOKING INSERT ERROR', insertError)
    throw new Error(insertError.message)
  }

  // Update event ticket count (non-critical)
  try {
    await supabase
      .from('events')
      .update({
        tickets_sold: (event.tickets_sold || 0) + 1,
        booking_count: (event.booking_count || 0) + 1,
      })
      .eq('id', event.id)
  } catch (e) { console.warn('tickets_sold update failed:', e) }

  // Update organizer wallet (non-critical)
  if (event.organizer_id && organizerReceived > 0) {
    try {
      const { data: org } = await supabase
        .from('users').select('wallet_balance').eq('id', event.organizer_id).single()
      if (org) {
        await supabase
          .from('users')
          .update({ wallet_balance: +((org.wallet_balance || 0) + organizerReceived).toFixed(2) })
          .eq('id', event.organizer_id)
      }
    } catch (e) { console.warn('wallet update failed:', e) }
  }

  // Update platform revenue (non-critical)
  if (platformFee > 0) {
    try {
      const { data: rev } = await supabase
        .from('platform_revenue').select('total_revenue').eq('id', 1).single()
      if (rev) {
        await supabase
          .from('platform_revenue')
          .update({ total_revenue: +((rev.total_revenue || 0) + platformFee).toFixed(2) })
          .eq('id', 1)
      }
    } catch (e) { console.warn('platform_revenue update failed:', e) }
  }

  // Notify organizer (non-critical)
  if (event.organizer_id) {
    try {
      await supabase.from('notifications').insert([{
        id: nanoid(),
        user_id: event.organizer_id,
        message: `🎟️ New booking received for "${event.title}"!`,
        is_read: false,
        created_at: new Date().toISOString(),
      }])
    } catch (e) { console.warn('organizer notification failed:', e) }
  }

  // Send confirmation email (non-critical)
  try {
    await supabase.functions.invoke('send-booking-confirmation', {
      body: {
        attendee_name: currentUser.name,
        attendee_email: currentUser.email,
        event_title: event.title,
        event_date: event.date,
        event_venue: event.venue,
        event_city: event.city,
        booking_id: bookingId,
        organizer_name: event.organizer_name || 'EventSphere',
        amount_paid: amountPaid,
        ticket_qr_code: ticketQrCode,
      },
    })
  } catch (e) { console.warn('confirmation email failed:', e.message) }

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
        <div className="success-checkmark-wrap">
          <svg className="success-checkmark-svg" viewBox="0 0 52 52">
            <circle className="success-circle" cx="26" cy="26" r="25" fill="none" />
            <path className="success-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>

        <h2 className="success-title">Booking Confirmed!</h2>
        <p className="success-subtitle">Your ticket is on its way 🎉</p>

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

        <div className="success-btn-row">
          <button className="btn-purple" onClick={onViewTicket} disabled={!ready} style={{ flex: 1, opacity: ready ? 1 : 0.5 }}>
            <Ticket size={16} />
            {ready ? 'View My Ticket' : `View Ticket (${countdown})`}
          </button>
          <button className="btn-secondary" onClick={onMyTickets} disabled={!ready} style={{ flex: 1, opacity: ready ? 1 : 0.5 }}>
            My Tickets
          </button>
        </div>

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
  const [organizer, setOrganizer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [successData, setSuccessData] = useState(null)

  // UPI payment state
  const [transactionId, setTransactionId] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [upiCopied, setUpiCopied] = useState(false)
  const [qrImageLoaded, setQrImageLoaded] = useState(false)
  const [qrImageError, setQrImageError] = useState(false)

  useEffect(() => {
    async function fetchCheckoutData() {
      const { data: eventData } = await supabase.from('events').select('*').eq('id', id).single()
      if (eventData) {
        setEvent(eventData)
        if (eventData.organizer_id) {
          const { data: orgData } = await supabase
            .from('users')
            .select('id, name, upi_id, upi_qr_url')
            .eq('id', eventData.organizer_id)
            .single()
          if (orgData) setOrganizer(orgData)
        }
      }
      setLoading(false)
    }
    fetchCheckoutData()
  }, [id])

  function handleCopyUpiId() {
    const upiIdToCopy = organizer?.upi_id || FALLBACK_UPI_ID
    navigator.clipboard.writeText(upiIdToCopy).then(() => {
      setUpiCopied(true)
      toast.success('UPI ID copied to clipboard!')
      setTimeout(() => setUpiCopied(false), 2500)
    })
  }

  async function handleClaimFreeTicket() {
    if (!event || !currentUser) return
    setProcessing(true)
    try {
      const bookingId = await createBookingRecord(event, currentUser, '')
      toast.success('🎟️ Your free ticket has been claimed!')
      setSuccessData({ bookingId, amountPaid: 0 })
    } catch (err) {
      toast.error(err.message || 'Booking failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  async function handleConfirmPayment() {
    if (!event || !currentUser) return
    setShowConfirmModal(false)
    setProcessing(true)
    try {
      const bookingId = await createBookingRecord(event, currentUser, transactionId.trim())
      toast.success('🎉 Booking confirmed! Check your email for ticket details.')
      setSuccessData({ bookingId, amountPaid: Number(event.price) })
    } catch (err) {
      toast.error(err.message || 'Booking failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>
  if (!event) return (
    <div className="page-wrapper">
      <div className="empty-state"><div className="empty-title">Event not found</div></div>
    </div>
  )

  const price = Number(event.price) || 0
  const isFreeEvent = price === 0 || event.pricing_type === 'free'
  const txnValid = transactionId.trim().length >= 8

  return (
    <>
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

          {/* ── Left: Order Summary ── */}
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

          {/* ── Right: Payment Section ── */}
          <div className="checkout-card">
            <div className="checkout-card-title">{isFreeEvent ? 'Free Ticket' : 'Pay with UPI'}</div>

            {isFreeEvent ? (
              /* ── Free Event ── */
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
              /* ── Paid Event — UPI QR Flow ──
                 TODO: Replace with Razorpay modal when VITE_RAZORPAY_KEY_ID is configured */
              <div>
                
                {(!organizer?.upi_id || !organizer?.upi_qr_url) ? (
                  <div style={{
                    background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.25rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                    <div style={{ fontWeight: 700, color: '#f59e0b', marginBottom: '0.5rem' }}>Payment Not Configured</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      This organizer has not set up UPI payment yet. Please contact the organizer directly or check back later.
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Blue info box */}
                <div style={{
                  display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                  background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)',
                  borderRadius: '0.75rem', padding: '0.85rem 1rem', marginBottom: '1.25rem',
                }}>
                  <Info size={15} style={{ color: '#60a5fa', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: '0.82rem', color: '#93c5fd', lineHeight: 1.6, margin: 0 }}>
                    Scan the QR code below using any UPI app like <strong>GPay</strong>, <strong>PhonePe</strong>, <strong>Paytm</strong>, or your bank app. Pay the exact amount shown and then enter your transaction ID to confirm your booking.
                  </p>
                </div>

                {/* ── UPI Deep Link QR (auto-fills amount in GPay/PhonePe/Paytm) ── */}
                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                    Pay directly to {organizer?.name}
                  </div>
                  {/* Primary: Dynamic QR with amount pre-filled */}
                  <div style={{ display: 'inline-block', background: 'white', padding: 14, borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.35)' }}>
                    <QRCode
                      value={`upi://pay?pa=${organizer?.upi_id}&pn=${encodeURIComponent(organizer?.name || 'Organizer')}&am=${price.toFixed(2)}&cu=INR&tn=EventSphere+Booking`}
                      size={220}
                      level="H"
                      fgColor="#0a0f1e"
                      bgColor="#ffffff"
                      style={{ display: 'block' }}
                    />
                  </div>
                  <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                    ✅ Amount ₹{price.toFixed(2)} is pre-filled — just scan and pay
                  </div>
                  {/* Tap to save: link to static Supabase QR image as fallback */}
                  <div style={{ marginTop: '0.35rem' }}>
                    <a
                      href={organizer?.upi_qr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}
                    >
                      📥 Tap here if QR doesn't scan
                    </a>
                  </div>
                </div>


                {/* UPI ID */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>UPI ID</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
                      {organizer?.upi_id}
                    </span>
                    <button
                      onClick={handleCopyUpiId}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        background: upiCopied ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.15)',
                        border: `1px solid ${upiCopied ? 'rgba(16,185,129,0.35)' : 'rgba(139,92,246,0.35)'}`,
                        borderRadius: 6, padding: '0.25rem 0.65rem', cursor: 'pointer',
                        color: upiCopied ? '#10b981' : 'var(--purple-light)',
                        fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.2s',
                      }}
                    >
                      {upiCopied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount to Pay</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--purple)', letterSpacing: '-0.5px' }}>
                    {formatCurrency(price)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.2rem' }}>
                    ⚠ Please pay the exact amount shown above
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', marginBottom: '1.25rem' }} />

                {/* Transaction ID input */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    Enter Transaction ID <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="upi-transaction-id"
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Paste your UPI transaction ID here (e.g. TXN123456789)"
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'var(--bg-dark)',
                        border: `1px solid ${transactionId && !txnValid ? '#ef4444' : 'var(--border)'}`,
                        borderRadius: 8, padding: '0.75rem 2.5rem 0.75rem 0.875rem',
                        color: 'var(--text-primary)', fontSize: '0.9rem',
                        fontFamily: 'monospace', outline: 'none',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--purple)' }}
                      onBlur={(e) => { e.target.style.borderColor = transactionId && !txnValid ? '#ef4444' : 'var(--border)' }}
                    />
                    {txnValid && (
                      <Check size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#10b981' }} />
                    )}
                  </div>
                  <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                    After paying, open your UPI app → go to transaction history → copy the transaction ID and paste it here.
                  </p>
                </div>

                {/* Confirm button */}
                <button
                  id="confirm-upi-payment-btn"
                  className="btn-purple"
                  style={{
                    width: '100%', fontSize: '1rem', padding: '0.9rem', gap: '0.6rem',
                    opacity: (!txnValid || processing) ? 0.4 : 1,
                    cursor: (!txnValid || processing) ? 'not-allowed' : 'pointer',
                  }}
                  onClick={() => { if (txnValid && !processing) setShowConfirmModal(true) }}
                  disabled={!txnValid || processing}
                >
                  {processing ? <span className="btn-spinner" /> : <><CheckCircle size={18} /> Confirm Payment &amp; Book Ticket</>}
                </button>

                {!txnValid && (
                  <p style={{ textAlign: 'center', fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    Enter your transaction ID above to enable this button
                  </p>
                )}

                <div className="lock-note" style={{ marginTop: '0.75rem' }}>
                  <span>🔒 Your ticket is generated immediately after confirming payment</span>
                </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── UPI Confirmation Modal ─────────────────────────── */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 18, padding: '2rem', maxWidth: 420, width: '100%',
            boxShadow: '0 12px 50px rgba(0,0,0,0.6)', position: 'relative',
          }}>
            <button
              onClick={() => setShowConfirmModal(false)}
              style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💳</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Confirm Payment
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Please confirm that you have paid{' '}
                <strong style={{ color: 'var(--purple)' }}>{formatCurrency(price)}</strong>{' '}
                to UPI ID{' '}
                <strong style={{ fontFamily: 'monospace' }}>{organizer?.upi_id}</strong>.
              </p>
            </div>

            <div style={{ background: 'var(--bg-dark)', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                Transaction ID
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 700, wordBreak: 'break-all' }}>
                {transactionId}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  flex: 1, padding: '0.75rem', background: 'none',
                  border: '1px solid var(--border)', borderRadius: 10,
                  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                id="yes-i-have-paid-btn"
                onClick={handleConfirmPayment}
                style={{
                  flex: 2, padding: '0.75rem', background: '#10b981',
                  border: 'none', borderRadius: 10, color: 'white',
                  cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                }}
              >
                <CheckCircle size={16} /> Yes, I Have Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
