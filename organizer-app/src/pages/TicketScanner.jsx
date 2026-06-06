import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import {
  QrCode, Camera, CheckCircle, XCircle, AlertCircle,
  Search, RotateCcw, StopCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function TicketScanner() {
  const { currentUser } = useAuth()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)   // null | { status, booking?, parsed? }
  const [manualId, setManualId] = useState('')
  const [manualLoading, setManualLoading] = useState(false)
  const html5QrRef = useRef(null)
  const didStartRef = useRef(false)

  // Stop camera cleanly when leaving page
  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {})
      }
    }
  }, [])

  /* ── verify helpers ─────────────────────────────────────────────── */

  async function verifyQrText(rawText) {
    // 1. Try to parse as EventSphere structured JSON
    let parsed
    try {
      parsed = JSON.parse(rawText)
      if (!parsed.booking_id) throw new Error('no booking_id field')
    } catch {
      setResult({ status: 'invalid' })
      return
    }

    // 2. Lookup in Supabase
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', parsed.booking_id)
      .single()

    if (error || !booking) {
      setResult({ status: 'not_found', parsed })
      return
    }

    // 3. Check organizer ownership
    if (currentUser && booking.organizer_id !== currentUser.id) {
      setResult({ status: 'wrong_event', booking, parsed })
      return
    }

    setResult({ status: 'valid', booking, parsed })
  }

  async function verifyManualId(bookingId) {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId.trim().toLowerCase())
      .single()

    if (error || !booking) {
      setResult({ status: 'not_found', parsed: { booking_id: bookingId } })
      return
    }

    if (currentUser && booking.organizer_id !== currentUser.id) {
      setResult({ status: 'wrong_event', booking })
      return
    }

    setResult({ status: 'valid', booking })
  }

  /* ── scanner lifecycle ──────────────────────────────────────────── */

  async function startScanner() {
    if (didStartRef.current) return
    didStartRef.current = true
    setScanning(true)
    setResult(null)

    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-camera-box')
      html5QrRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          // QR scanned — stop camera and verify
          await scanner.stop()
          html5QrRef.current = null
          didStartRef.current = false
          setScanning(false)
          await verifyQrText(decodedText)
        },
        () => {} // ignore per-frame decode errors (not real errors)
      )
    } catch (err) {
      didStartRef.current = false
      setScanning(false)
      if (err.toString().includes('NotAllowedError') || err.toString().includes('Permission')) {
        toast.error('Camera permission denied. Please allow camera access and try again.')
      } else {
        toast.error('Could not start camera. Check browser permissions.')
      }
    }
  }

  async function stopScanner() {
    if (html5QrRef.current) {
      await html5QrRef.current.stop().catch(() => {})
      html5QrRef.current = null
    }
    didStartRef.current = false
    setScanning(false)
  }

  function resetAll() {
    setResult(null)
    setManualId('')
  }

  async function handleManualVerify() {
    if (!manualId.trim()) return
    setManualLoading(true)
    try {
      await verifyManualId(manualId)
    } finally {
      setManualLoading(false)
    }
  }

  /* ── result card component ──────────────────────────────────────── */

  function ResultCard() {
    if (!result) return null

    if (result.status === 'valid') {
      const b = result.booking
      const p = result.parsed || {}
      return (
        <div style={{
          background: 'rgba(16,185,129,0.08)', border: '2px solid #10b981',
          borderRadius: 16, padding: '1.75rem', textAlign: 'center',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', boxShadow: '0 0 28px rgba(16,185,129,0.4)',
          }}>
            <CheckCircle size={38} color="white" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981', marginBottom: '0.25rem' }}>
            ✓ Ticket Verified
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            {b?.attendee_name || p.attendee_name}
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            {b?.event_title || p.event_title}
          </div>
          {p.event_date && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              📅 {p.event_date}
            </div>
          )}
          <div style={{
            fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)',
            background: 'rgba(0,0,0,0.2)', padding: '0.35rem 0.75rem',
            borderRadius: 6, display: 'inline-block', marginBottom: '1.25rem',
          }}>
            {(b?.id || p.booking_id)?.toUpperCase()}
          </div>
          <br />
          <button
            onClick={resetAll}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: '#10b981', border: 'none', borderRadius: 10,
              padding: '0.65rem 1.5rem', color: 'white', fontWeight: 700,
              fontSize: '0.9rem', cursor: 'pointer',
            }}
          >
            <RotateCcw size={15} /> Scan Next Ticket
          </button>
        </div>
      )
    }

    if (result.status === 'invalid') {
      return (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '2px solid #ef4444', borderRadius: 16, padding: '1.75rem', textAlign: 'center' }}>
          <XCircle size={52} color="#ef4444" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.35rem' }}>Invalid QR Code</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            This is not an EventSphere ticket. Please ask the attendee to open the My Tickets page.
          </p>
          <button onClick={resetAll} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#ef4444', border: 'none', borderRadius: 8, padding: '0.6rem 1.25rem', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
            <RotateCcw size={14} /> Try Again
          </button>
        </div>
      )
    }

    if (result.status === 'not_found') {
      return (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '2px solid #ef4444', borderRadius: 16, padding: '1.75rem', textAlign: 'center' }}>
          <AlertCircle size={52} color="#ef4444" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.35rem' }}>Booking Not Found</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            This ticket could not be verified. It may be invalid or the booking was not completed.
          </p>
          <button onClick={resetAll} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#ef4444', border: 'none', borderRadius: 8, padding: '0.6rem 1.25rem', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
            <RotateCcw size={14} /> Try Again
          </button>
        </div>
      )
    }

    if (result.status === 'wrong_event') {
      return (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '2px solid #f59e0b', borderRadius: 16, padding: '1.75rem', textAlign: 'center' }}>
          <AlertCircle size={52} color="#f59e0b" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.35rem' }}>Wrong Event</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            This ticket is for a different event:{' '}
            <strong>{result.booking?.event_title || result.parsed?.event_title}</strong>
          </p>
          <button onClick={resetAll} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#f59e0b', border: 'none', borderRadius: 8, padding: '0.6rem 1.25rem', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
            <RotateCcw size={14} /> Try Again
          </button>
        </div>
      )
    }

    return null
  }

  /* ── render ─────────────────────────────────────────────────────── */

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'rgba(8,145,178,0.12)', border: '1px solid rgba(8,145,178,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <QrCode size={24} style={{ color: '#0891b2' }} />
          </div>
          <div>
            <h1 className="page-title" style={{ marginBottom: 0 }}>Ticket Scanner</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
              Scan attendee QR tickets to verify entry
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* ── Camera scanner card ── */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>

          {/* Camera preview area */}
          <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', marginBottom: scanning ? '1rem' : 0 }}>
            <div
              id="qr-camera-box"
              style={{
                width: '100%',
                minHeight: scanning ? 300 : 0,
                background: scanning ? '#000' : 'transparent',
              }}
            />
            {/* Scanning line animation */}
            {scanning && (
              <div style={{
                position: 'absolute', left: 0, right: 0, height: 3,
                background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
                animation: 'scanLine 1.8s ease-in-out infinite',
                pointerEvents: 'none',
              }} />
            )}
          </div>

          {/* Start camera state */}
          {!scanning && !result && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>📷</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Point your camera at an attendee's ticket QR code to verify entry
              </p>
              <button
                id="start-scanner-btn"
                onClick={startScanner}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                  border: 'none', borderRadius: 12, padding: '0.8rem 1.75rem',
                  color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(8,145,178,0.35)',
                }}
              >
                <Camera size={18} /> Start Camera
              </button>
            </div>
          )}

          {/* Stop camera button */}
          {scanning && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                🟢 Scanning… Hold the QR code steady in front of the camera
              </p>
              <button
                onClick={stopScanner}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  background: 'none', border: '1px solid var(--border)', borderRadius: 8,
                  padding: '0.5rem 1rem', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem',
                }}
              >
                <StopCircle size={14} /> Stop Camera
              </button>
            </div>
          )}

          {/* Scan again button after result */}
          {result && (
            <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
              <button
                onClick={() => { resetAll(); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                  border: 'none', borderRadius: 10, padding: '0.65rem 1.25rem',
                  color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                }}
              >
                <Camera size={15} /> Scan Another Ticket
              </button>
            </div>
          )}
        </div>

        {/* ── Result card ── */}
        {result && (
          <div style={{ marginBottom: '1.25rem' }}>
            <ResultCard />
          </div>
        )}

        {/* ── Manual lookup ── */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Or enter Booking ID manually
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Useful if the camera is unavailable or the QR code is damaged.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              id="manual-booking-id"
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="Paste booking ID here…"
              onKeyDown={(e) => e.key === 'Enter' && handleManualVerify()}
              style={{
                flex: 1, background: 'var(--bg-dark)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '0.6rem 0.875rem',
                color: 'var(--text-primary)', fontSize: '0.85rem',
                fontFamily: 'monospace', outline: 'none',
              }}
            />
            <button
              id="manual-verify-btn"
              onClick={handleManualVerify}
              disabled={!manualId.trim() || manualLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: '#0891b2', border: 'none', borderRadius: 8,
                padding: '0.6rem 1rem', color: 'white', fontWeight: 700,
                fontSize: '0.85rem', cursor: 'pointer',
                opacity: (!manualId.trim() || manualLoading) ? 0.5 : 1,
              }}
            >
              {manualLoading
                ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                : <Search size={14} />}
              Verify
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0%   { top: 5%; }
          50%  { top: 90%; }
          100% { top: 5%; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  )
}
