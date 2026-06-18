import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { categorizeEvent, detectSpam } from '../ai/aiModules'
import { getAIEventDescription } from '../ai/claudeAI'
import {
  Sparkles, CheckCircle, Gift, Tag, Layers, Upload, X, FileText,
  Eye, ToggleLeft, ToggleRight, AlertTriangle, CloudUpload, Clock, Calendar, Users, Settings
} from 'lucide-react'
import toast from 'react-hot-toast'
import TimePicker12Hour from '../components/TimePicker12Hour'

const CATEGORIES = ['Art', 'Tech', 'Fitness', 'Cultural', 'Community', 'Lifestyle']
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Goa']
const STEPS = ['Event Details', 'AI Categorize', 'Venue & Date', 'Pricing', 'Terms & Conditions']

const DEFAULT_TERMS = `TERMS AND CONDITIONS — EVENTSPHERE EVENT PARTICIPATION

SECTION 1 — GENERAL PARTICIPATION
Participation in this event is entirely voluntary. By attending, you agree to conduct yourself in a respectful, lawful, and responsible manner at all times.

SECTION 2 — RESPONSIBILITY FOR MINORS
Attendees below the age of eighteen (18) are strongly encouraged to attend in the company of a parent or legal guardian. Full responsibility for minors lies with their parent or guardian.

SECTION 3 — TRANSPORTATION AND PERSONAL RESPONSIBILITY
The event organiser and venue are not responsible for any travel-related issues, accidents, or incidents outside the venue premises.

SECTION 4 — PERSONAL BELONGINGS
Attendees are fully responsible for the safety and security of their personal belongings. The organiser and Tixque shall not be liable for loss, theft, or damage of personal property.

SECTION 5 — HEALTH AND SAFETY
Participation is at the attendee's own risk and discretion. The organiser and Tixque shall not be held liable for injuries, health incidents, or medical emergencies during the event.

SECTION 6 — VENUE RULES
All attendees must adhere to venue rules. Failure to comply may result in removal from the premises without a refund.

SECTION 7 — PHOTOGRAPHY AND MEDIA CONSENT
Photographs and video recordings may be captured during the event for promotional use. Attendance constitutes implied consent to appear in such media.

SECTION 8 — REFUND POLICY
All ticket purchases are final. Tickets are non-refundable and non-transferable unless the event is officially cancelled.

SECTION 9 — EVENT CHANGES
The organiser reserves the right to make changes to the event schedule, venue, or programme at any time.

SECTION 10 — ACCEPTANCE OF TERMS
By booking a ticket through Tixque, you confirm that you have read and agreed to all terms and conditions stated above.`

export default function CreateEvent() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [aiDescLoading, setAiDescLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [previewTermsOpen, setPreviewTermsOpen] = useState(false)

  // Banner upload state
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const [bannerUrl, setBannerUrl] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadState, setUploadState] = useState('idle') // idle | uploading | done | error
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    title: '', category: 'Tech', description: '',
    date: '', time: '', venue: '', city: 'Mumbai', capacity: '',
    pricingType: 'fixed', price: '', earlyBirdPrice: '', standardPrice: '',
    earlyBirdLimitType: 'date', earlyBirdEndDate: '', earlyBirdLimitPeople: '',
    useDefaultTerms: true,
    customTerms: '',
    // Custom date picker parts
    dateDay: '', dateMonth: '', dateYear: '',
    // Custom early bird date parts
    ebDay: '', ebMonth: '', ebYear: '',
  })
  const [aiCategories, setAiCategories] = useState([])

  function upd(field, val) { setForm((f) => ({ ...f, [field]: val })) }

  // Combine day/month/year into YYYY-MM-DD for the main event date
  function updateMainDate(day, month, year) {
    if (day && month && year) {
      const dd = String(day).padStart(2, '0')
      const mm = String(month).padStart(2, '0')
      upd('date', `${year}-${mm}-${dd}`)
    } else {
      upd('date', '')
    }
  }

  // Combine day/month/year into YYYY-MM-DD for early bird end date
  function updateEbDate(day, month, year) {
    if (day && month && year) {
      const dd = String(day).padStart(2, '0')
      const mm = String(month).padStart(2, '0')
      upd('earlyBirdEndDate', `${year}-${mm}-${dd}`)
    } else {
      upd('earlyBirdEndDate', '')
    }
  }

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const currentYear = new Date().getFullYear()
  const YEARS = Array.from({ length: 6 }, (_, i) => currentYear + i)

  const selectStyle = {
    background: 'var(--color-input-background)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '10px 12px',
    cursor: 'pointer',
    outline: 'none',
    fontSize: '14px',
    transition: 'border-color 0.2s',
  }

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
    if (step === 2) {
      if (!form.date || !form.venue) { toast.error('Fill in date and venue.'); return }
    }
    setStep((s) => Math.min(s + 1, 4))
  }

  // ── Banner Upload ─────────────────────────────────────────────────────────
  async function uploadBanner(file) {
    if (!file) return
    setUploadState('uploading')
    setUploadProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(p => Math.min(p + 15, 85))
    }, 200)

    try {
      const safeName = file.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')
      const path = `${currentUser.id}_${Date.now()}_${safeName}`

      const { data, error } = await supabase.storage
        .from('event-banners')
        .upload(path, file, {
          contentType: file.type,
          upsert: true,
        })

      clearInterval(progressInterval)

      if (error) {
        console.error('UPLOAD ERROR:', error)
        setUploadState('error')
        // Detect bucket-not-found specifically
        if (error.message?.toLowerCase().includes('bucket') || error.statusCode === '404' || error.error === 'Bucket not found') {
          toast.error('Storage not configured. Please paste a banner image URL in the field below.', { duration: 6000 })
        } else {
          toast.error(`Upload failed: ${error.message || 'Unknown error'}. Use the URL field below.`, { duration: 5000 })
        }
        return
      }

      const { data: urlData } = supabase.storage.from('event-banners').getPublicUrl(path)
      const publicUrl = urlData?.publicUrl
      if (!publicUrl) {
        clearInterval(progressInterval)
        setUploadState('error')
        toast.error('Could not get public URL. Please paste a URL in the field below.')
        return
      }
      setBannerUrl(publicUrl)
      setBannerPreview(publicUrl)
      setUploadProgress(100)
      setUploadState('done')
      toast.success('Banner uploaded successfully!')
    } catch (err) {
      clearInterval(progressInterval)
      console.error('UPLOAD ERROR:', err)
      setUploadState('error')
      toast.error(`Upload failed: ${err?.message || 'Network error'}. Use the URL field below.`, { duration: 5000 })
    }
  }

  function validateAndSetFile(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WEBP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5 MB.')
      return
    }
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
    uploadBanner(file)
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (file) validateAndSetFile(file)
  }

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragOver(false), [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndSetFile(file)
  }, [])

  function removeBanner() {
    setBannerFile(null)
    setBannerPreview(null)
    setBannerUrl('')
    setUploadState('idle')
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
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

    const termsText = form.useDefaultTerms ? DEFAULT_TERMS : (form.customTerms.trim() || DEFAULT_TERMS)

    const event = {
      id: nanoid(),
      title: form.title,
      description: form.description,
      category: form.category,
      organizer_id: currentUser.id,
      organizer_name: currentUser.name,
      date: form.date,
      event_time: form.time || null,
      venue: form.venue,
      city: form.city,
      capacity: Number(form.capacity) || 100,
      tickets_sold: 0,
      price,
      pricing_type: form.pricingType,
      banner_url: bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
      status: isDraft ? 'draft' : 'pending',
      spam_score: spamScore,
      ai_category: aiCategories[0]?.category || form.category,
      ai_confidence: aiCategories[0]?.confidence || 0,
      trending: 'Steady',
      booking_count: 0,
      tier1_price: Number(form.earlyBirdPrice) || 0,
      tier2_price: Number(form.standardPrice) || 0,
      early_bird_limit_type: form.earlyBirdLimitType,
      early_bird_limit_days: 0,
      early_bird_limit_people: Number(form.earlyBirdLimitPeople) || 0,
      early_bird_end_date: form.earlyBirdEndDate,
      early_bird_sold: 0,
      terms_and_conditions: termsText,
      has_custom_terms: !form.useDefaultTerms && form.customTerms.trim().length > 0,
    }

    const { error } = await supabase.from('events').insert([event])
    if (error) {
      console.error('Insert error:', error)
      toast.error('Failed to create event. Check console for details.')
      setSubmitting(false)
      return
    }

    if (!isDraft) {
      try {
        const { data: attendeeRows } = await supabase
          .from('bookings')
          .select('attendee_name, attendee_email, attendee_id')
          .eq('organizer_id', currentUser.id)
          .neq('attendee_email', '')

        if (attendeeRows && attendeeRows.length > 0) {
          const attendeeIds = [...new Set(attendeeRows.map(r => r.attendee_id).filter(Boolean))]
          const { data: userPrefs } = await supabase
            .from('users')
            .select('id, email_notifications')
            .in('id', attendeeIds)

          const notifMap = new Map((userPrefs || []).map(u => [u.id, u.email_notifications]))
          const deduped = new Map()
          for (const row of attendeeRows) {
            if (!row.attendee_email) continue
            if (notifMap.get(row.attendee_id) === false) continue
            if (!deduped.has(row.attendee_email)) {
              deduped.set(row.attendee_email, { name: row.attendee_name || 'Attendee', email: row.attendee_email })
            }
          }
          const attendeesToNotify = Array.from(deduped.values())
          if (attendeesToNotify.length > 0) {
            await supabase.functions.invoke('send-event-reminder', {
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
            }).catch(() => {})
            toast.success(`Event submitted for review! Reminder emails sent to ${attendeesToNotify.length} attendee${attendeesToNotify.length !== 1 ? 's' : ''} 📧`)
          } else {
            toast.success('Event submitted for review!')
          }
        } else {
          toast.success('Event submitted for review!')
        }
      } catch {
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

      {/* ── Step 1 — Event Details ─────────────────────────── */}
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

      {/* ── Step 2 — AI Categorizer ───────────────────────── */}
      {step === 1 && (
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} style={{ color: 'var(--teal)' }} /> AI Category Suggestions
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Based on your title and description, we suggest these categories.
          </p>

          <div className="ai-cat-cards">
            {aiCategories.length > 0 ? aiCategories.map((cat) => (
              <div key={cat.category} className="ai-cat-card"
                style={{ borderColor: form.category === cat.category ? 'var(--teal)' : undefined, background: form.category === cat.category ? 'var(--teal-dim)' : undefined }}>
                <div className="ai-cat-name">{cat.category}</div>
                <div className="ai-cat-bar-wrap"><div className="ai-cat-bar" style={{ width: `${cat.confidence}%` }} /></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="ai-cat-pct">{cat.confidence}% confidence</span>
                  <button className="btn-teal" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                    onClick={() => upd('category', cat.category)}>Select</button>
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

      {/* ── Step 3 — Venue & Date + Banner Upload ─────────── */}
      {step === 2 && (
        <div className="card">
          <div className="auth-form-stack">
            <div className="form-group">
              <label className="form-label">Event Date</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  style={selectStyle}
                  value={form.dateDay}
                  onChange={e => { upd('dateDay', e.target.value); updateMainDate(e.target.value, form.dateMonth, form.dateYear) }}
                >
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  style={{ ...selectStyle, flex: 1 }}
                  value={form.dateMonth}
                  onChange={e => { upd('dateMonth', e.target.value); updateMainDate(form.dateDay, e.target.value, form.dateYear) }}
                >
                  <option value="">Month</option>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  style={selectStyle}
                  value={form.dateYear}
                  onChange={e => { upd('dateYear', e.target.value); updateMainDate(form.dateDay, form.dateMonth, e.target.value) }}
                >
                  <option value="">Year</option>
                  {YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              {form.date && (
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>
                  📅 Selected: {new Date(form.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Event Time <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(optional)</span></label>
              <TimePicker12Hour id="event-time" value={form.time} onChange={(val) => upd('time', val)} />
              {form.time && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  🕔 Event starts at {new Date(`2000-01-01T${form.time}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
              )}
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

            {/* ── Banner Image Upload ──────────────────────── */}
            <div className="form-group">
              <label className="form-label">Banner Image</label>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              {/* Upload Box */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  height: '200px',
                  border: `2px dashed ${isDragOver ? 'var(--purple)' : uploadState === 'done' ? '#10b981' : uploadState === 'error' ? '#ef4444' : 'var(--border)'}`,
                  borderRadius: '0.875rem',
                  background: isDragOver ? 'rgba(124,58,237,0.06)' : 'rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s, background 0.2s',
                  cursor: uploadState === 'uploading' ? 'not-allowed' : 'pointer',
                }}
                onClick={() => uploadState !== 'uploading' && fileInputRef.current?.click()}
              >
                {/* Preview */}
                {bannerPreview && uploadState !== 'error' && (
                  <>
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.75rem' }}
                    />
                    {/* Remove button */}
                    {uploadState !== 'uploading' && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeBanner() }}
                        style={{
                          position: 'absolute', top: '8px', right: '8px',
                          background: 'rgba(0,0,0,0.7)', border: 'none',
                          borderRadius: '50%', width: '28px', height: '28px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: '#fff',
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                    {/* Done badge */}
                    {uploadState === 'done' && (
                      <div style={{
                        position: 'absolute', top: '8px', left: '8px',
                        background: 'rgba(16,185,129,0.9)', borderRadius: '999px',
                        padding: '0.2rem 0.6rem', fontSize: '0.72rem', color: '#fff',
                        display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600,
                      }}>
                        <CheckCircle size={11} /> Uploaded
                      </div>
                    )}
                  </>
                )}

                {/* Upload progress overlay */}
                {uploadState === 'uploading' && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                  }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '50%',
                      border: '4px solid rgba(124,58,237,0.3)',
                      borderTop: '4px solid var(--purple)',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.2rem' }}>
                      {uploadProgress}%
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Uploading…</div>
                  </div>
                )}

                {/* Error state */}
                {uploadState === 'error' && (
                  <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <AlertTriangle size={32} style={{ color: '#ef4444', marginBottom: '0.5rem' }} />
                    <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: '0.5rem' }}>Upload failed</div>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
                      onClick={(e) => { e.stopPropagation(); if (bannerFile) uploadBanner(bannerFile) }}
                    >
                      Retry Upload
                    </button>
                  </div>
                )}

                {/* Default idle state */}
                {uploadState === 'idle' && (
                  <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                    <CloudUpload size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.6rem' }} />
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                      Drag and drop your image here
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>or</div>
                    <div
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        border: '1px solid var(--purple)', borderRadius: '0.5rem',
                        padding: '0.4rem 1rem', fontSize: '0.85rem', color: 'var(--purple)',
                        pointerEvents: 'none',
                      }}
                    >
                      <Upload size={14} /> Choose Image
                    </div>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Accepted formats: JPG, PNG, WEBP · Max size: 5 MB
              </div>

              {/* URL fallback — always visible */}
              <div style={{ marginTop: '0.85rem', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: '0.75rem', padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--purple)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  📎 Or paste a banner image URL directly
                </div>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/banner.jpg  ← paste any image URL here"
                  value={bannerUrl && uploadState !== 'done' ? bannerUrl : uploadState !== 'done' ? bannerUrl : ''}
                  onChange={e => {
                    const val = e.target.value
                    setBannerUrl(val)
                    if (val) {
                      setBannerPreview(val)
                      setUploadState('done')
                    } else {
                      setBannerPreview(null)
                      setUploadState('idle')
                    }
                  }}
                  style={{ fontSize: '0.85rem', padding: '0.55rem 0.85rem' }}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  Use this if file upload is unavailable. Works with Unsplash, Google Photos, or any public image link.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" onClick={() => setStep(1)} type="button">← Back</button>
              <button className="btn-teal" onClick={handleNextStep} type="button">Next: Pricing →</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4 — Pricing ──────────────────────────────── */}
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

          {form.pricingType === 'tiered' && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
                <Clock size={18} style={{ color: 'var(--teal)' }} /> Early Bird Availability
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Option 1: By Date */}
                <div 
                  onClick={() => upd('earlyBirdLimitType', 'date')}
                  style={{
                    border: form.earlyBirdLimitType === 'date' ? '2px solid var(--color-organizer-accent)' : '1px solid var(--color-border)',
                    borderRadius: '8px', padding: '16px', cursor: 'pointer',
                    background: form.earlyBirdLimitType === 'date' ? 'var(--teal-dim)' : 'var(--color-bg-secondary)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <Calendar size={16} /> By Date
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Early bird price available until a specific date.
                  </div>
                  {form.earlyBirdLimitType === 'date' && (
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label className="form-label">Early Bird End Date</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select style={selectStyle} value={form.ebDay}
                          onChange={e => { upd('ebDay', e.target.value); updateEbDate(e.target.value, form.ebMonth, form.ebYear) }}>
                          <option value="">Day</option>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select style={{ ...selectStyle, flex: 1 }} value={form.ebMonth}
                          onChange={e => { upd('ebMonth', e.target.value); updateEbDate(form.ebDay, e.target.value, form.ebYear) }}>
                          <option value="">Month</option>
                          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                        </select>
                        <select style={selectStyle} value={form.ebYear}
                          onChange={e => { upd('ebYear', e.target.value); updateEbDate(form.ebDay, form.ebMonth, e.target.value) }}>
                          <option value="">Year</option>
                          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Option 2: By Number of People */}
                <div 
                  onClick={() => upd('earlyBirdLimitType', 'people')}
                  style={{
                    border: form.earlyBirdLimitType === 'people' ? '2px solid var(--color-organizer-accent)' : '1px solid var(--color-border)',
                    borderRadius: '8px', padding: '16px', cursor: 'pointer',
                    background: form.earlyBirdLimitType === 'people' ? 'var(--teal-dim)' : 'var(--color-bg-secondary)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <Users size={16} /> By Number of People
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    First N customers get the early bird price.
                  </div>
                  {form.earlyBirdLimitType === 'people' && (
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label className="form-label">Number of Early Bird Tickets</label>
                      <input type="number" className="form-input" min="1" placeholder="e.g. 50"
                        value={form.earlyBirdLimitPeople} onChange={(e) => upd('earlyBirdLimitPeople', e.target.value)} />
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        For example, if your event capacity is 100 and you enter 50, then the first 50 people to book get the early bird price. After 50 bookings, the price automatically switches to the standard price.
                      </div>
                    </div>
                  )}
                </div>

                {/* Option 3: Manual Control */}
                <div 
                  onClick={() => upd('earlyBirdLimitType', 'manual')}
                  style={{
                    border: form.earlyBirdLimitType === 'manual' ? '2px solid var(--color-organizer-accent)' : '1px solid var(--color-border)',
                    borderRadius: '8px', padding: '16px', cursor: 'pointer',
                    background: form.earlyBirdLimitType === 'manual' ? 'var(--teal-dim)' : 'var(--color-bg-secondary)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <Settings size={16} /> Manual Control
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    You decide when to switch from early bird to standard pricing.
                  </div>
                  {form.earlyBirdLimitType === 'manual' && (
                    <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-primary)', padding: '0.75rem', background: 'var(--color-bg-secondary)', borderRadius: '6px' }}>
                      Note: You can change the pricing from your event dashboard at any time.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button className="btn-secondary" onClick={() => setStep(2)} type="button">← Back</button>
            <button className="btn-teal" onClick={handleNextStep} type="button">Next: Terms & Conditions →</button>
          </div>
        </div>
      )}

      {/* ── Step 5 — Terms & Conditions ───────────────────── */}
      {step === 4 && (
        <div className="card">
          {/* Preview modal */}
          {previewTermsOpen && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            }}>
              <div style={{
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '1rem',
                width: '100%', maxWidth: '640px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>Preview — Attendee View</span>
                  <button type="button" onClick={() => setPreviewTermsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    <X size={20} />
                  </button>
                </div>
                <div style={{ overflowY: 'auto', padding: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  {(form.useDefaultTerms ? DEFAULT_TERMS : form.customTerms || DEFAULT_TERMS).split('\n').map((line, i) => (
                    line.startsWith('SECTION ') || line.startsWith('TERMS AND CONDITIONS')
                      ? <div key={i} style={{ color: 'var(--text-primary)', fontWeight: 700, marginTop: '1rem', marginBottom: '0.4rem' }}>{line}</div>
                      : line.trim() === '' ? <div key={i} style={{ height: '0.5rem' }} />
                      : <p key={i} style={{ margin: 0 }}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <FileText size={22} style={{ color: 'var(--purple)' }} />
            <h2 style={{ fontWeight: 700, margin: 0 }}>Event Terms & Conditions</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Every attendee must read and agree to these terms before booking a ticket for your event.
          </p>

          {/* Toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)',
            borderRadius: '0.75rem', marginBottom: '1.25rem', cursor: 'pointer',
          }} onClick={() => upd('useDefaultTerms', !form.useDefaultTerms)}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>Use default Tixque terms & conditions</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Covers general participation, safety, refund policy, and media consent
              </div>
            </div>
            <div style={{ color: form.useDefaultTerms ? 'var(--purple)' : 'var(--text-muted)', flexShrink: 0 }}>
              {form.useDefaultTerms ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </div>
          </div>

          {/* Default terms preview */}
          {form.useDefaultTerms && (
            <div>
              <div style={{
                height: '240px', overflowY: 'auto',
                background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                borderRadius: '0.75rem', padding: '1rem',
                fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.7,
                marginBottom: '0.75rem',
              }}>
                {DEFAULT_TERMS.split('\n').map((line, i) => (
                  line.startsWith('SECTION ') || line.startsWith('TERMS AND CONDITIONS')
                    ? <div key={i} style={{ color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.75rem', marginBottom: '0.25rem' }}>{line}</div>
                    : line.trim() === '' ? <div key={i} style={{ height: '0.4rem' }} />
                    : <p key={i} style={{ margin: 0 }}>{line}</p>
                ))}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
                📋 These are Tixque's standard terms. Toggle off above to write your own custom terms.
              </div>
            </div>
          )}

          {/* Custom terms textarea */}
          {!form.useDefaultTerms && (
            <div className="form-group">
              <div style={{
                background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)',
                borderRadius: '0.6rem', padding: '0.6rem 0.9rem', marginBottom: '0.75rem',
                fontSize: '0.8rem', color: 'var(--text-secondary)',
              }}>
                ✏️ Your custom terms will be shown to every attendee before they can book a ticket.
              </div>
              <textarea
                className="form-input"
                style={{ minHeight: '300px', fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.7 }}
                placeholder="Enter your event-specific terms and conditions here..."
                value={form.customTerms}
                onChange={(e) => upd('customTerms', e.target.value)}
              />
            </div>
          )}

          {/* Preview button */}
          <button
            type="button"
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}
            onClick={() => setPreviewTermsOpen(true)}
          >
            <Eye size={15} /> Preview Attendee View
          </button>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-secondary" onClick={() => setStep(3)} type="button" disabled={submitting}>← Back</button>
            <button id="save-draft-btn" className="btn-secondary" onClick={() => handleSubmit(true)} type="button" disabled={submitting}>
              {submitting ? <span className="btn-spinner" style={{ borderTopColor: 'var(--text-primary)' }} /> : 'Save as Draft'}
            </button>
            <button id="submit-event-btn" className="btn-teal" onClick={() => handleSubmit(false)} type="button" disabled={submitting}>
              {submitting ? <span className="btn-spinner" /> : '🚀 Submit for Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
