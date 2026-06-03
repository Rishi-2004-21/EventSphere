import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { FileText, ChevronDown, ArrowLeft, CheckCircle, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { DEFAULT_TERMS, DEFAULT_TERMS_VERSION } from '../utils/defaultTerms'

export default function ConsentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scrollPct, setScrollPct] = useState(0)
  const [checked, setChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const termsBoxRef = useRef(null)

  const hasScrolledEnough = scrollPct >= 90
  const canProceed = hasScrolledEnough && checked

  useEffect(() => {
    async function load() {
      const { data: evt } = await supabase.from('events').select('*').eq('id', id).single()
      setEvent(evt)
      setLoading(false)

      // Check if current user already consented to this event
      if (currentUser?.id && evt) {
        const { data: existing } = await supabase
          .from('consent_records')
          .select('id')
          .eq('event_id', id)
          .eq('attendee_id', currentUser.id)
          .maybeSingle()
        if (existing) {
          // Already agreed — skip to checkout
          navigate(`/checkout/${id}`, { replace: true })
        }
      }
    }
    load()
  }, [id, currentUser?.id])

  function handleScroll(e) {
    const el = e.target
    const pct = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100)
    setScrollPct(Math.min(pct, 100))
  }

  async function handleAgree() {
    if (!canProceed || !currentUser || !event) return
    setSubmitting(true)
    try {
      const termsText = event.terms_and_conditions || DEFAULT_TERMS
      const termsVersion = event.has_custom_terms ? `custom-${event.id}` : DEFAULT_TERMS_VERSION

      const { error } = await supabase.from('consent_records').insert([{
        id: nanoid(),
        event_id: id,
        attendee_id: currentUser.id,
        agreed_at: new Date().toISOString(),
        ip_address: '',
        terms_version: termsVersion,
      }])

      if (error) {
        console.error('Consent insert error:', error)
        toast.error('Could not record your agreement. Please try again.')
        setSubmitting(false)
        return
      }

      toast.success('Terms agreed! Proceeding to checkout…')
      navigate(`/checkout/${id}`)
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="loading-wrap">
      <div className="spinner" />
      <div className="loading-text">Loading terms…</div>
    </div>
  )

  if (!event) return (
    <div className="page-wrapper">
      <div className="empty-state">
        <div className="empty-icon">📄</div>
        <div className="empty-title">Event not found</div>
        <button className="btn-purple" onClick={() => navigate('/discover')}>Back to Events</button>
      </div>
    </div>
  )

  const termsText = (event.terms_and_conditions && event.terms_and_conditions.trim())
    ? event.terms_and_conditions
    : DEFAULT_TERMS

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem' }}>
      <div style={{
        width: '100%',
        maxWidth: '700px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '1.25rem',
        padding: '2rem',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '60px', height: '60px', background: 'var(--purple-dim)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            border: '2px solid var(--purple)',
          }}>
            <FileText size={28} style={{ color: 'var(--purple)' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
            Terms & Conditions
          </h1>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {event.title}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Organised by {event.organizer_name}
          </div>
        </div>

        {/* Info Banner */}
        <div style={{
          background: 'rgba(124,58,237,0.1)',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: '0.75rem',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          marginBottom: '1.25rem',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
        }}>
          <Shield size={16} style={{ color: 'var(--purple)', flexShrink: 0 }} />
          Please read all terms carefully before proceeding. You must scroll to the bottom and tick the checkbox to continue.
        </div>

        {/* Scrollable Terms Box */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <div
            ref={termsBoxRef}
            onScroll={handleScroll}
            style={{
              height: '380px',
              overflowY: 'auto',
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              fontSize: '0.83rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              scrollBehavior: 'smooth',
            }}
          >
            {termsText.split('\n').map((line, i) => {
              // Section headings
              if (line.startsWith('SECTION ') || line === 'TERMS AND CONDITIONS — EVENTSPHERE EVENT PARTICIPATION') {
                return (
                  <div key={i} style={{
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    marginTop: i === 0 ? 0 : '1.5rem',
                    marginBottom: '0.5rem',
                    paddingBottom: '0.25rem',
                    borderBottom: '1px solid var(--border)',
                  }}>{line}</div>
                )
              }
              if (line === '---') {
                return <div key={i} style={{ height: '0.5rem' }} />
              }
              if (line.trim() === '') {
                return <div key={i} style={{ height: '0.6rem' }} />
              }
              return <p key={i} style={{ margin: 0 }}>{line}</p>
            })}
          </div>

          {/* Scroll Indicator */}
          <div style={{
            position: 'absolute',
            bottom: '0.6rem',
            right: '0.75rem',
            background: hasScrolledEnough ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.6)',
            border: `1px solid ${hasScrolledEnough ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
            borderRadius: '999px',
            padding: '0.2rem 0.6rem',
            fontSize: '0.7rem',
            color: hasScrolledEnough ? '#10b981' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            userSelect: 'none',
            transition: 'all 0.3s',
          }}>
            {hasScrolledEnough ? (
              <><CheckCircle size={11} /> Read</>
            ) : (
              <><ChevronDown size={11} /> {scrollPct}% read</>
            )}
          </div>
        </div>

        {/* Scroll progress bar */}
        <div style={{
          height: '3px',
          background: 'var(--border)',
          borderRadius: '999px',
          marginBottom: '1.25rem',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${scrollPct}%`,
            background: hasScrolledEnough ? '#10b981' : 'var(--purple)',
            borderRadius: '999px',
            transition: 'width 0.2s ease',
          }} />
        </div>

        {/* Checkbox */}
        <label style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          cursor: 'pointer',
          marginBottom: '1.5rem',
          padding: '1rem',
          background: checked ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${checked ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
          borderRadius: '0.75rem',
          transition: 'all 0.2s',
        }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              accentColor: 'var(--purple)',
              flexShrink: 0,
              marginTop: '2px',
              cursor: 'pointer',
            }}
          />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            I have read and fully understand the terms and conditions for this event. I agree to comply with all requirements stated above.
          </span>
        </label>

        {/* Validation hints */}
        {!hasScrolledEnough && (
          <div style={{
            fontSize: '0.8rem', color: 'var(--text-muted)',
            textAlign: 'center', marginBottom: '0.75rem',
          }}>
            ⬇️ Scroll to the bottom of the terms to enable the button
          </div>
        )}
        {hasScrolledEnough && !checked && (
          <div style={{
            fontSize: '0.8rem', color: 'var(--text-muted)',
            textAlign: 'center', marginBottom: '0.75rem',
          }}>
            ☑️ Please tick the checkbox above to continue
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className="btn-secondary"
            style={{ flex: 1 }}
            onClick={() => navigate(`/events/${id}`)}
          >
            <ArrowLeft size={16} /> Go Back
          </button>
          <button
            className="btn-purple"
            style={{
              flex: 2,
              opacity: canProceed ? 1 : 0.45,
              cursor: canProceed ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
            disabled={!canProceed || submitting}
            onClick={handleAgree}
          >
            {submitting ? (
              <span className="btn-spinner" />
            ) : (
              <><CheckCircle size={16} /> I Agree &amp; Continue to Booking</>
            )}
          </button>
        </div>

        {/* Footer note */}
        <div style={{
          marginTop: '1.25rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}>
          🔒 Your consent is securely recorded. You will not need to agree again for this event.
        </div>
      </div>
    </div>
  )
}
