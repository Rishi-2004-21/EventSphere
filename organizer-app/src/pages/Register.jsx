import { useState } from 'react'
import { Link } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { supabase } from '../supabase'
import toast from 'react-hot-toast'
import { CheckCircle } from 'lucide-react'

export default function OrganizerRegister() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', city: '' })
  const [inlineErrors, setInlineErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setInlineErrors({})

    let errs = {}
    if (!form.name.trim()) errs.name = 'name is required'
    if (!form.email.trim()) errs.email = 'email is required'
    if (!form.password) errs.password = 'password is required'
    if (form.password && form.password.length < 6) errs.password = 'password must be at least 6 characters'
    if (!form.confirm) errs.confirm = 'confirm password is required'
    if (!form.city) errs.city = 'city is required'

    if (form.password && form.confirm && form.password !== form.confirm) {
      errs.confirm = 'passwords do not match'
    }

    if (Object.keys(errs).length > 0) {
      setInlineErrors(errs)
      return
    }

    setLoading(true)

    try {
      // Check if an organizer account already exists with this exact email + role combination
      const { data: existingOrganizer, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', form.email.trim().toLowerCase())
        .eq('role', 'organizer')
        .maybeSingle()

      if (checkError) {
        console.error(checkError)
        toast.error('registration failed. please try again.')
        setLoading(false)
        return
      }

      if (existingOrganizer) {
        setInlineErrors({ email: 'an organizer account with this email already exists. please sign in instead.' })
        setLoading(false)
        return
      }

      // No organizer row found — safe to proceed (attendee-only accounts are allowed)

      const newUser = {
        id: nanoid(),
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: 'organizer',
        is_verified: false,
        is_suspended: false,
        interests: "{}",
        wishlist: "{}",
        wallet_balance: 0,
        city: form.city.trim()
      }

      const { error: insertError } = await supabase.from('users').insert([newUser])

      if (insertError) {
        console.error(insertError)
        toast.error('registration failed. please try again.')
        setLoading(false)
        return
      }

      // DO NOT auto-login. Show pending approval screen.
      setSubmitted(true)

    } catch (err) {
      console.error(err)
      toast.error('registration failed. please try again.')
      setLoading(false)
    }
  }

  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Goa']

  // ── Success / Pending Approval Screen ─────────────────────────────────────
  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-bg-glow" />
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(13,148,136,0.15)', border: '2px solid var(--teal)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <CheckCircle size={30} style={{ color: 'var(--teal)' }} />
          </div>

          <div className="auth-logo-text">Tixque</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.75rem 0 0.5rem', color: 'var(--text-primary)' }}>
            Application Submitted!
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Your application has been submitted successfully. Our admin team will review and approve your account within <strong style={{ color: 'var(--text-primary)' }}>24 hours</strong>.<br /><br />
            You will be able to log in once your account is approved.
          </p>

          <div style={{
            background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.25)',
            borderRadius: '0.75rem', padding: '0.85rem 1rem', marginBottom: '1.5rem',
            fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5,
          }}>
            📧 We will notify you via email once your account has been verified.
          </div>

          <Link to="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-glow" />
      <div className="auth-card">
        <div className="auth-logo-text">Tixque</div>
        <div className="auth-portal-label">Organizer Portal</div>

        <div className="auth-heading">Become an Organizer</div>
        <div className="auth-subheading">Host your events and reach thousands</div>

        <form onSubmit={handleSubmit} className="auth-form-stack">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input id="reg-name" type="text" className="form-input" placeholder="Your full name"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {inlineErrors.name && <div style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{inlineErrors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input id="reg-email" type="email" className="form-input" placeholder="you@example.com"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {inlineErrors.email && <div style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{inlineErrors.email}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="reg-password" type="password" className="form-input" placeholder="Min 6 characters"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {inlineErrors.password && <div style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{inlineErrors.password}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input id="reg-confirm" type="password" className="form-input" placeholder="Repeat password"
              value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
            {inlineErrors.confirm && <div style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{inlineErrors.confirm}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">City</label>
            <select id="reg-city" className="form-select" value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}>
              <option value="">Select your city</option>
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
            {inlineErrors.city && <div style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{inlineErrors.city}</div>}
          </div>

          {/* Info note */}
          <div style={{
            background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)',
            borderRadius: '0.6rem', padding: '0.65rem 0.9rem',
            fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5,
          }}>
            ℹ️ After registration, your account will be reviewed by our admin team before you can access the organizer portal. This usually takes up to 24 hours.
          </div>

          <button id="reg-submit-btn" type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Apply'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.25rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        <p className="auth-footer-text">
          Already an organizer?{' '}
          <Link to="/login" className="auth-footer-link">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
