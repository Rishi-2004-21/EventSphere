import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function OrganizerLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Find the organizer account specifically (same email may exist for multiple roles)
      const { data: rows, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', form.email.trim())
        .eq('role', 'organizer')

      const data = rows && rows.length > 0 ? rows[0] : null

      if (dbError !== null) {
        console.error(dbError)
        setError('something went wrong please try again')
        setLoading(false)
        return
      }

      if (data === null) {
        setError('no organizer account found for this email. please register or check your credentials.')
        setLoading(false)
        return
      }

      if (data.password !== form.password.trim()) {
        setError('invalid email or password')
        setLoading(false)
        return
      }

      if (data.role !== 'organizer') {
        setError('this portal is for organizers only')
        setLoading(false)
        return
      }

      if (data.is_verified === false) {
        setError('your organizer account is pending admin approval. you will receive access once our team verifies your account. please check back later or contact support.')
        setLoading(false)
        return
      }

      if (data.is_suspended === true) {
        setError('your account has been suspended')
        setLoading(false)
        return
      }

      login(data)
      toast.success(`welcome back ${data.name}`)
      navigate('/organizer')
    } catch (err) {
      console.error(err)
      setError('an unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-glow" />
      <div className="auth-card">
        <div className="auth-logo-text">EventSphere</div>
        <div className="auth-portal-label">Organizer Portal</div>

        <div className="auth-heading">Welcome Back Organizer</div>
        <div className="auth-subheading">Manage your events and track your revenue</div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form-stack">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input id="login-email" type="email" className="form-input" placeholder="Enter your email"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="login-password" type="password" className="form-input" placeholder="Enter your password"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>

          <button id="login-submit-btn" type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.25rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        <p className="auth-footer-text">
          New organizer?{' '}
          <Link to="/register" className="auth-footer-link">Apply for an account</Link>
        </p>
      </div>
    </div>
  )
}
