import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function OrganizerRegister() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', city: '' })
  const [inlineErrors, setInlineErrors] = useState({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setInlineErrors({})

    let errs = {}
    if (!form.name.trim()) errs.name = 'name is required'
    if (!form.email.trim()) errs.email = 'email is required'
    if (!form.password) errs.password = 'password is required'
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
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', form.email.trim())
        .maybeSingle()

      if (existing) {
        setInlineErrors({ email: 'an account with this email already exists' })
        setLoading(false)
        return
      }

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
        toast.error('registration failed please try again')
        setLoading(false)
        return
      }

      login(newUser)
      toast.success('your account is pending verification by our admin team')
      navigate('/organizer')

    } catch (err) {
      console.error(err)
      toast.error('registration failed please try again')
      setLoading(false)
    }
  }

  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Goa']

  return (
    <div className="auth-page">
      <div className="auth-bg-glow" />
      <div className="auth-card">
        <div className="auth-logo-text">EventSphere</div>
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
