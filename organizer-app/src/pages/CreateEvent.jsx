import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { categorizeEvent, detectSpam } from '../ai/aiModules'
import { getAIEventDescription } from '../ai/claudeAI'
import { Sparkles, CheckCircle, Gift, Tag, Layers } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = ['Art', 'Tech', 'Fitness', 'Cultural', 'Community', 'Lifestyle']
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Goa']

const STEPS = ['Event Details', 'AI Categorize', 'Venue & Date', 'Pricing & Submit']

export default function CreateEvent() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [aiDescLoading, setAiDescLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    title: '', category: 'Tech', description: '',
    date: '', venue: '', city: 'Mumbai', capacity: '',
    pricingType: 'fixed', price: '', earlyBirdPrice: '', standardPrice: '',
    bannerUrl: '',
  })
  const [aiCategories, setAiCategories] = useState([])

  function upd(field, val) { setForm((f) => ({ ...f, [field]: val })) }

  async function generateAIDescription() {
    if (!form.title) { toast.error('Enter a title first.'); return }
    setAiDescLoading(true)
    const desc = await getAIEventDescription(form.title, form.category)
    upd('description', desc)
    setAiDescLoading(false)
    toast.success('AI description generated!')
  }

  function handleNextStep() {
    if (step === 0) {
      if (!form.title || !form.description) { toast.error('Fill in title and description.'); return }
      const cats = categorizeEvent(form.title, form.description)
      setAiCategories(cats)
    }
    if (step === 1) {
      // categorize step done
    }
    if (step === 2) {
      if (!form.date || !form.venue) { toast.error('Fill in date and venue.'); return }
    }
    setStep((s) => Math.min(s + 1, 3))
  }

  async function handleSubmit(isDraft) {
    setSubmitting(true)
    const price = form.pricingType === 'free' ? 0
      : form.pricingType === 'fixed' ? Number(form.price) || 0
      : Number(form.earlyBirdPrice) || 0

    const spamScore = detectSpam(form.title, form.description, price)

    if (!isDraft && spamScore > 80) {
      toast.error(`Spam score too high (${spamScore}%). Please review your event content.`)
      setSubmitting(false)
      return
    }

    const event = {
      id: nanoid(),
      title: form.title,
      description: form.description,
      category: form.category,
      organizer_id: currentUser.id,
      organizer_name: currentUser.name,
      date: form.date,
      venue: form.venue,
      city: form.city,
      capacity: Number(form.capacity) || 100,
      tickets_sold: 0,
      price,
      pricing_type: form.pricingType,
      banner_url: form.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
      status: isDraft ? 'draft' : 'pending',
      spam_score: spamScore,
      ai_category: aiCategories[0]?.category || form.category,
      ai_confidence: aiCategories[0]?.confidence || 0,
      trending: 'Steady',
      booking_count: 0,
      created_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('events').insert([event])
    if (error) {
      console.error('Insert error:', error)
      toast.error('Failed to create event. Check console for details.')
      setSubmitting(false)
      return
    }

    // Only send emails for non-draft submissions
    if (!isDraft) {
      try {
        // Fetch all previous attendees of this organizer who have email_notifications enabled
        const { data: attendeeRows } = await supabase
          .from('bookings')
          .select('attendee_name, attendee_email, attendee_id')
          .eq('organizer_id', currentUser.id)
          .neq('attendee_email', '')

        if (attendeeRows && attendeeRows.length > 0) {
          // Join with users table to check email_notifications preference
          const attendeeIds = [...new Set(attendeeRows.map(r => r.attendee_id).filter(Boolean))]
          const { data: userPrefs } = await supabase
            .from('users')
            .select('id, email_notifications')
            .in('id', attendeeIds)

          const notifMap = new Map((userPrefs || []).map(u => [u.id, u.email_notifications]))

          // Deduplicate by email and filter out opted-out attendees
          const deduped = new Map()
          for (const row of attendeeRows) {
            if (!row.attendee_email) continue
            const notifEnabled = notifMap.get(row.attendee_id)
            // Default to true if preference not found
            if (notifEnabled === false) continue
            if (!deduped.has(row.attendee_email)) {
              deduped.set(row.attendee_email, { name: row.attendee_name || 'Attendee', email: row.attendee_email })
            }
          }

          const attendeesToNotify = Array.from(deduped.values())

          if (attendeesToNotify.length > 0) {
            const { error: fnErr } = await supabase.functions.invoke('send-event-reminder', {
              body: {
                organizer_id: currentUser.id,
                organizer_name: currentUser.name,
                event_id: event.id,
                new_event_title: event.title,
                new_event_date: event.date,
                new_event_city: event.city,
                new_event_price: event.price,
                new_event_category: event.category,
                attendees: attendeesToNotify,
              },
            })
            if (fnErr) {
              console.warn('Email function error (non-blocking):', fnErr)
              toast.success('Event submitted for review!')
            } else {
              toast.success(`Event submitted for review! Reminder emails sent to ${attendeesToNotify.length} previous attendee${attendeesToNotify.length !== 1 ? 's' : ''} 📧`)
            }
          } else {
            toast.success('Event submitted for review!')
          }
        } else {
          toast.success('Event submitted for review!')
        }
      } catch (emailErr) {
        console.warn('Email step failed (non-blocking):', emailErr)
        toast.success('Event submitted for review!')
      }
    } else {
      toast.success('Event saved as draft!')
    }

    navigate('/dashboard')
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Create Event</h1>
        <p className="page-subtitle">Step {step + 1} of {STEPS.length}</p>
      </div>

      {/* Step Indicator */}
      <div className="wizard-steps" style={{ marginBottom: '2rem' }}>
        {STEPS.map((label, i) => (
          <div key={i} className={`wizard-step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
            <span className="wizard-step-num">
              {i < step ? <CheckCircle size={14} /> : i + 1}
            </span>
            <span style={{ fontSize: '0.8rem' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Step 1 — Event Details */}
      {step === 0 && (
        <div className="card">
          <div className="auth-form-stack">
            <div className="form-group">
              <label className="form-label">Event Title <span style={{ color: 'var(--text-muted)', marginLeft: '0.25rem' }}>({100 - form.title.length} chars remaining)</span></label>
              <input id="event-title" type="text" className="form-input" placeholder="Enter event title" maxLength={100}
                value={form.title} onChange={(e) => upd('title', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select id="event-category" className="form-select" value={form.category} onChange={(e) => upd('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Description</label>
                <button id="ai-desc-btn" className="btn-ai" onClick={generateAIDescription} disabled={aiDescLoading} type="button">
                  {aiDescLoading ? <span className="btn-spinner" style={{ borderTopColor: 'var(--teal-light)' }} /> : <><Sparkles size={13} /> Generate AI Description</>}
                </button>
              </div>
              <textarea id="event-description" className="form-input form-textarea" placeholder="Describe your event…"
                value={form.description} onChange={(e) => upd('description', e.target.value)} />
            </div>

            <button className="btn-teal" onClick={handleNextStep} type="button">Next: AI Categorize →</button>
          </div>
        </div>
      )}

      {/* Step 2 — AI Categorizer */}
      {step === 1 && (
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} style={{ color: 'var(--teal)' }} /> AI Category Suggestions
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Based on your title and description, we suggest these categories. Select one or keep your manual choice.
          </p>

          <div className="ai-cat-cards">
            {aiCategories.length > 0 ? aiCategories.map((cat) => (
              <div key={cat.category} className="ai-cat-card"
                style={{ borderColor: form.category === cat.category ? 'var(--teal)' : undefined, background: form.category === cat.category ? 'var(--teal-dim)' : undefined }}>
                <div className="ai-cat-name">{cat.category}</div>
                <div className="ai-cat-bar-wrap">
                  <div className="ai-cat-bar" style={{ width: `${cat.confidence}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="ai-cat-pct">{cat.confidence}% confidence</span>
                  <button className="btn-teal" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                    onClick={() => upd('category', cat.category)}>
                    Select
                  </button>
                </div>
              </div>
            )) : (
              <p style={{ color: 'var(--text-secondary)' }}>No AI suggestions. Using your manual selection: <strong>{form.category}</strong></p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button className="btn-secondary" onClick={() => setStep(0)} type="button">← Back</button>
            <button className="btn-teal" onClick={handleNextStep} type="button">Next: Venue & Date →</button>
          </div>
        </div>
      )}

      {/* Step 3 — Venue & Date */}
      {step === 2 && (
        <div className="card">
          <div className="auth-form-stack">
            <div className="form-group">
              <label className="form-label">Event Date</label>
              <input id="event-date" type="date" className="form-input" value={form.date} onChange={(e) => upd('date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Venue Name</label>
              <input id="event-venue" type="text" className="form-input" placeholder="Venue name"
                value={form.venue} onChange={(e) => upd('venue', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <select id="event-city" className="form-select" value={form.city} onChange={(e) => upd('city', e.target.value)}>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Capacity</label>
              <input id="event-capacity" type="number" className="form-input" placeholder="Number of attendees"
                value={form.capacity} onChange={(e) => upd('capacity', e.target.value)} min="1" />
            </div>
            <div className="form-group">
              <label className="form-label">Banner Image URL</label>
              <input id="event-banner" type="url" className="form-input" placeholder="https://..."
                value={form.bannerUrl} onChange={(e) => upd('bannerUrl', e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" onClick={() => setStep(1)} type="button">← Back</button>
              <button className="btn-teal" onClick={handleNextStep} type="button">Next: Pricing →</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4 — Pricing & Submit */}
      {step === 3 && (
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Choose Pricing Type</h2>
          <div className="pricing-cards">
            <div className={`pricing-card ${form.pricingType === 'free' ? 'selected' : ''}`} onClick={() => upd('pricingType', 'free')}>
              <div className="pricing-card-icon"><Gift /></div>
              <div className="pricing-card-label">Free</div>
              <div className="pricing-card-desc">No ticket cost</div>
            </div>
            <div className={`pricing-card ${form.pricingType === 'fixed' ? 'selected' : ''}`} onClick={() => upd('pricingType', 'fixed')}>
              <div className="pricing-card-icon"><Tag /></div>
              <div className="pricing-card-label">Fixed Price</div>
              <div className="pricing-card-desc">Single ticket price</div>
            </div>
            <div className={`pricing-card ${form.pricingType === 'tiered' ? 'selected' : ''}`} onClick={() => upd('pricingType', 'tiered')}>
              <div className="pricing-card-icon"><Layers /></div>
              <div className="pricing-card-label">Tiered Pricing</div>
              <div className="pricing-card-desc">Early bird + standard</div>
            </div>
          </div>

          {form.pricingType === 'fixed' && (
            <div className="form-group" style={{ marginTop: '1.25rem' }}>
              <label className="form-label">Ticket Price (₹)</label>
              <input id="event-price" type="number" className="form-input" placeholder="e.g. 999" min="0"
                value={form.price} onChange={(e) => upd('price', e.target.value)} />
            </div>
          )}

          {form.pricingType === 'tiered' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Early Bird Price (₹)</label>
                <input id="early-bird-price" type="number" className="form-input" placeholder="e.g. 699" min="0"
                  value={form.earlyBirdPrice} onChange={(e) => upd('earlyBirdPrice', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Standard Price (₹)</label>
                <input id="standard-price" type="number" className="form-input" placeholder="e.g. 999" min="0"
                  value={form.standardPrice} onChange={(e) => upd('standardPrice', e.target.value)} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button className="btn-secondary" onClick={() => setStep(2)} type="button" disabled={submitting}>← Back</button>
            <button id="save-draft-btn" className="btn-secondary" onClick={() => handleSubmit(true)} type="button" disabled={submitting}>
              {submitting ? <span className="btn-spinner" style={{ borderTopColor: 'var(--text-primary)' }} /> : 'Save as Draft'}
            </button>
            <button id="submit-event-btn" className="btn-teal" onClick={() => handleSubmit(false)} type="button" disabled={submitting}>
              {submitting ? <span className="btn-spinner" /> : 'Submit for Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
