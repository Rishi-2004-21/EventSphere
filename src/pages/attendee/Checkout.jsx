import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/dateUtils';
import { supabase } from '../../supabase';
import { nanoid } from 'nanoid';
import {
  ShieldCheck, Percent, CheckCircle, ArrowLeft,
  Copy, Info, AlertCircle, Mail, Check, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

// UPI payment config — when VITE_RAZORPAY_KEY_ID is added to .env,
// replace the UPI section below with the Razorpay payment modal instead.
const UPI_QR_URL =
  import.meta.env.VITE_UPI_QR_URL ||
  'https://foexoyakzskviskmkqqn.supabase.co/storage/v1/object/public/assets/upi%20id.jpeg';
const UPI_ID = import.meta.env.VITE_UPI_ID || '8125432020@pthdfc';

export default function Checkout() {
  const { id } = useParams();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const [txnId, setTxnId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(null); // { bookingId, emailOk }

  const event = state.eventsStore.find((e) => e.id === id);
  const currentUser = state.auth.currentUser;

  if (!event || !currentUser) {
    navigate('/discover');
    return null;
  }

  const isFree = !event.price || Number(event.price) === 0;
  const platformFee = parseFloat((event.price * 0.1).toFixed(2));
  const organizerReceived = parseFloat((event.price * 0.9).toFixed(2));
  const txnValid = txnId.trim().length >= 8;

  /* ─── helpers ──────────────────────────────────────────────────── */

  function copyUpiId() {
    navigator.clipboard.writeText(UPI_ID).then(() => toast.success('UPI ID copied!'));
  }

  async function insertBooking(transactionId) {
    const bookingId = nanoid();

    // Structured QR payload — parseable by organizer scanner
    const qrData = JSON.stringify({
      booking_id: bookingId,
      event_id: event.id,
      event_title: event.title,
      attendee_name: currentUser.name,
      attendee_email: currentUser.email,
      event_date: formatDate(event.date),
      event_venue: event.venue,
      event_city: event.city,
      amount_paid: event.price,
      payment_status: 'confirmed',
      upi_transaction_id: transactionId || null,
      verified: false,
    });

    // Write booking to Supabase
    const { error: dbError } = await supabase.from('bookings').insert({
      id: bookingId,
      event_id: event.id,
      attendee_id: currentUser.id,
      attendee_name: currentUser.name,
      attendee_email: currentUser.email,
      amount_paid: event.price,
      platform_fee: platformFee,
      organizer_received: organizerReceived,
      payment_status: 'confirmed',
      payment_method: isFree ? 'free' : 'upi',
      upi_transaction_id: transactionId || null,
      ticket_qr_code: qrData,
      organizer_id: event.organizerId,
      event_title: event.title,
      booked_at: new Date().toISOString(),
    });

    if (dbError) throw dbError;

    // Also update the local in-memory store so My Tickets updates immediately
    dispatch({
      type: 'BOOK_TICKET',
      payload: {
        eventId: event.id,
        eventTitle: event.title,
        attendeeId: currentUser.id,
        attendeeName: currentUser.name,
        price: event.price,
        organizerId: event.organizerId,
      },
    });

    // Send confirmation email — non-blocking; booking already saved if this fails
    let emailOk = false;
    try {
      const { error: emailError } = await supabase.functions.invoke(
        'send-booking-confirmation',
        {
          body: {
            attendee_name: currentUser.name,
            attendee_email: currentUser.email,
            event_title: event.title,
            event_date: formatDate(event.date),
            event_venue: event.venue,
            event_city: event.city,
            booking_id: bookingId.toUpperCase(),
            organizer_name: event.organizerName || 'Tixque',
            amount_paid: event.price,
            ticket_qr_code: qrData,
          },
        }
      );
      if (!emailError) emailOk = true;
    } catch (e) {
      console.warn('Email non-critical failure:', e.message);
    }

    return { bookingId, emailOk };
  }

  /* ─── handlers ─────────────────────────────────────────────────── */

  async function handleFreeTicket() {
    setProcessing(true);
    try {
      const result = await insertBooking(null);
      setSuccess(result);
      toast.success('🎉 Free ticket confirmed!');
    } catch (e) {
      console.error('Booking error:', e);
      toast.error('Booking failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleConfirmUpi() {
    setShowModal(false);
    setProcessing(true);
    try {
      const result = await insertBooking(txnId.trim());
      setSuccess(result);
      toast.success('🎉 Booking confirmed!');
    } catch (e) {
      console.error('Booking error:', e);
      toast.error('Booking failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  /* ─── success screen ────────────────────────────────────────────── */

  if (success) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="booking-success-card" style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
          {/* Big green tick */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: '0 0 30px rgba(16,185,129,0.4)',
          }}>
            <CheckCircle size={40} color="white" />
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
            Booking Confirmed!
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            See you at <strong>{event.title}</strong>!
          </p>

          {/* Booking reference */}
          <div style={{
            background: 'var(--bg-dark)', borderRadius: 10, padding: '1rem',
            marginBottom: '1rem', border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              Booking Reference
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, color: 'var(--purple)', letterSpacing: '2px' }}>
              {success.bookingId?.toUpperCase()}
            </div>
          </div>

          {/* Event summary */}
          <div style={{ background: 'var(--bg-card-2)', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem', border: '1px solid var(--border)', textAlign: 'left' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>📅 {formatDate(event.date)} at {event.time}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {event.venue}, {event.city}</div>
          </div>

          {/* Email status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Mail size={14} color={success.emailOk ? '#10b981' : '#556080'} />
            <span style={{ fontSize: '0.82rem', color: success.emailOk ? '#10b981' : 'var(--text-muted)' }}>
              {success.emailOk
                ? `Confirmation email sent to ${currentUser.email}`
                : 'Email confirmation will be sent shortly'}
            </span>
          </div>

          <div className="success-btn-row" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={() => navigate('/my-tickets')}>
              View My Tickets
            </button>
            <button
              className="btn-ghost"
              onClick={() => navigate('/discover')}
              style={{ padding: '0.65rem 1.25rem' }}
            >
              Browse More Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── main checkout UI ──────────────────────────────────────────── */

  return (
    <div className="page-container">
      <div className="checkout-wrap">
        <button className="btn-back-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back to Event
        </button>

        <h1 className="page-title">Confirm Booking</h1>

        <div className="checkout-grid">

          {/* ── LEFT: Order Summary ── */}
          <div className="checkout-summary">
            <img
              src={event.banner}
              alt={event.title}
              className="checkout-banner"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title)}&size=400&background=6366f1&color=fff`;
              }}
            />
            <div className="checkout-event-info">
              <h2 className="checkout-event-title">{event.title}</h2>
              <p className="checkout-meta">📅 {formatDate(event.date)} at {event.time}</p>
              <p className="checkout-meta">📍 {event.venue}, {event.city}</p>
              <p className="checkout-meta">👤 {currentUser.name}</p>
            </div>
          </div>

          {/* ── RIGHT: Payment Panel ── */}
          <div className="checkout-payment">
            <h3 className="checkout-section-title">Order Details</h3>

            <div className="order-rows">
              <div className="order-row">
                <span>1× Ticket</span>
                <span>{isFree ? 'FREE' : formatCurrency(event.price)}</span>
              </div>
              {!isFree && (
                <div className="order-row order-subtotal">
                  <span>Subtotal</span>
                  <span>{formatCurrency(event.price)}</span>
                </div>
              )}
            </div>

            {!isFree && (
              <div className="checkout-transparency">
                <h4 className="transparency-title">💳 Payment Breakdown</h4>
                <div className="transparency-row">
                  <span>Ticket Price</span>
                  <span>{formatCurrency(event.price)}</span>
                </div>
                <div className="transparency-row transparency-fee">
                  <span><Percent size={12} /> Platform Fee (10%)</span>
                  <span className="fee-amount">− {formatCurrency(platformFee)}</span>
                </div>
                <div className="transparency-divider" />
                <div className="transparency-row transparency-organizer">
                  <span>🏆 Organizer Receives (90%)</span>
                  <strong>{formatCurrency(organizerReceived)}</strong>
                </div>
              </div>
            )}

            <div className="checkout-total">
              <span>Total</span>
              <span className="total-amount">{isFree ? 'FREE' : formatCurrency(event.price)}</span>
            </div>

            {/* ════ PAYMENT SECTION ════════════════════════════════════ */}

            {isFree ? (
              /* ── Free event ── */
              <>
                <div className="checkout-trust">
                  <ShieldCheck size={14} style={{ color: '#10b981' }} />
                  <span>Free ticket · Instant QR generation</span>
                </div>
                <button
                  id="confirm-free-btn"
                  className="btn-primary w-full btn-lg"
                  onClick={handleFreeTicket}
                  disabled={processing}
                >
                  {processing
                    ? <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    : <CheckCircle size={18} />}
                  {processing ? 'Processing…' : 'Claim Free Ticket'}
                </button>
              </>
            ) : (
              /* ── Paid event — UPI QR flow ──
                 TODO: When VITE_RAZORPAY_KEY_ID is added to .env,
                 replace this entire block with the Razorpay payment modal. */
              <>
                {/* Blue info banner */}
                <div style={{
                  display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                  background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)',
                  borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem',
                }}>
                  <Info size={15} style={{ color: '#60a5fa', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: '0.82rem', color: '#93c5fd', lineHeight: 1.5, margin: 0 }}>
                    <strong>Manual UPI Payment</strong> — Pay the exact amount shown below, then enter your UPI transaction ID to confirm. Your ticket QR code is generated after confirmation.
                  </p>
                </div>

                {/* ── Step 1: Scan & Pay ── */}
                <div style={{
                  background: 'var(--bg-dark)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '1.25rem', marginBottom: '1rem', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>
                    Step 1 — Scan &amp; Pay
                  </div>

                  {/* QR image */}
                  <div style={{
                    display: 'inline-block', background: 'white',
                    padding: 10, borderRadius: 12, marginBottom: '0.85rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  }}>
                    <img
                      src={UPI_QR_URL}
                      alt="UPI QR Code — scan with any UPI app"
                      style={{ width: 210, height: 210, display: 'block', objectFit: 'contain' }}
                      onError={(e) => {
                        e.target.parentElement.innerHTML = `<div style="width:210px;height:210px;display:flex;align-items:center;justify-content:center;color:#999;font-size:0.8rem;padding:1rem">QR image not available</div>`;
                      }}
                    />
                  </div>

                  {/* UPI ID row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                      {UPI_ID}
                    </span>
                    <button
                      onClick={copyUpiId}
                      title="Copy UPI ID"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                        borderRadius: 6, padding: '0.2rem 0.6rem', cursor: 'pointer',
                        color: 'var(--purple-light)', fontSize: '0.75rem', fontWeight: 600,
                      }}
                    >
                      <Copy size={11} /> Copy
                    </button>
                  </div>

                  {/* Amount */}
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--purple)', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
                    {formatCurrency(event.price)}
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                    Open <strong>GPay</strong>, <strong>PhonePe</strong>, or <strong>Paytm</strong> · Scan the QR or enter the UPI ID · Pay the exact amount shown above
                  </p>
                </div>

                {/* ── Step 2: Transaction ID ── */}
                <div style={{
                  background: 'var(--bg-dark)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '1.25rem', marginBottom: '1rem',
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>
                    Step 2 — Enter Transaction ID
                  </div>

                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
                    UPI Transaction ID
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="upi-txn-input"
                      type="text"
                      value={txnId}
                      onChange={(e) => setTxnId(e.target.value)}
                      placeholder="e.g. TXN123456789"
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'var(--bg-card)', border: `1px solid ${txnId && !txnValid ? '#ef4444' : 'var(--border)'}`,
                        borderRadius: 8, padding: '0.65rem 2.5rem 0.65rem 1rem',
                        color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'monospace',
                        outline: 'none', transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--purple)'; }}
                      onBlur={(e) => { e.target.style.borderColor = txnId && !txnValid ? '#ef4444' : 'var(--border)'; }}
                    />
                    {txnValid && (
                      <Check size={16} style={{
                        position: 'absolute', right: 10, top: '50%',
                        transform: 'translateY(-50%)', color: '#10b981',
                      }} />
                    )}
                    {txnId && !txnValid && (
                      <AlertCircle size={16} style={{
                        position: 'absolute', right: 10, top: '50%',
                        transform: 'translateY(-50%)', color: '#ef4444',
                      }} />
                    )}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    After paying, copy the 12-digit transaction ID from your UPI app and paste it here.
                  </p>
                </div>

                {/* ── Step 3: Confirm ── */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.6rem' }}>
                    Step 3 — Confirm Booking
                  </div>
                  <button
                    id="confirm-pay-btn"
                    className="btn-primary w-full btn-lg"
                    onClick={() => setShowModal(true)}
                    disabled={!txnValid || processing}
                    style={{ opacity: (!txnValid || processing) ? 0.45 : 1, cursor: (!txnValid || processing) ? 'not-allowed' : 'pointer' }}
                  >
                    {processing
                      ? <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      : <CheckCircle size={18} />}
                    {processing ? 'Processing…' : 'I Have Paid — Confirm Booking'}
                  </button>
                  {!txnValid && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.4rem' }}>
                      Enter your transaction ID above to enable this button
                    </p>
                  )}
                </div>

                <div className="checkout-trust">
                  <ShieldCheck size={14} style={{ color: '#10b981' }} />
                  <span>Your ticket QR code is generated after payment confirmation</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Confirmation Modal ──────────────────────────────────────── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 18, padding: '2rem', maxWidth: 420, width: '100%',
            boxShadow: '0 12px 50px rgba(0,0,0,0.6)', position: 'relative',
          }}>
            {/* Close X */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute', top: 14, right: 14, background: 'none',
                border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4,
              }}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💳</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Confirm Payment
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Please confirm you have successfully paid{' '}
                <strong style={{ color: 'var(--purple)' }}>{formatCurrency(event.price)}</strong>{' '}
                to UPI ID{' '}
                <strong style={{ fontFamily: 'monospace' }}>{UPI_ID}</strong>.
              </p>
            </div>

            {/* TX ID preview */}
            <div style={{
              background: 'var(--bg-dark)', borderRadius: 8, padding: '0.85rem 1rem',
              marginBottom: '1.25rem', border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                Transaction ID
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                {txnId}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: '0.7rem', background: 'none',
                  border: '1px solid var(--border)', borderRadius: 10,
                  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpi}
                style={{
                  flex: 2, padding: '0.7rem', background: 'var(--purple)',
                  border: 'none', borderRadius: 10, color: 'white',
                  cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                }}
              >
                <CheckCircle size={16} /> Yes, Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
