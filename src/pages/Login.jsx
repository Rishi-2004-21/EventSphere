import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
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
      // Filter by both email AND role so dual-account users (attendee + organizer same email) work correctly
      const { data: rows, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', form.email.trim())
        .eq('role', 'attendee')

      const data = rows && rows.length > 0 ? rows[0] : null

      if (dbError !== null) {
        console.error(dbError)
        setError('something went wrong please try again')
        setLoading(false)
        return
      }

      if (data === null) {
        setError('invalid email or password')
        setLoading(false)
        return
      }

      if (data.password !== form.password.trim()) {
        setError('invalid email or password')
        setLoading(false)
        return
      }

      if (data.is_suspended === true) {
        setError('your account has been suspended')
        setLoading(false)
        return
      }

      login(data) // Updates AuthContext
      
      // Update AppContext so route guards work instantly
      const storedUser = JSON.parse(localStorage.getItem('eventsphere_user') || 'null')
      if (!storedUser) {
        localStorage.setItem('eventsphere_user', JSON.stringify(data))
      }
      // Force AppContext reload hack: not needed if we just redirect, wait...
      // AttendeeRoute reads from AppContext. Since we don't have dispatch from AppContext,
      // we can just force a window.location.href to reload the app with the new localStorage!
      
      toast.success(`welcome back ${data.name}`)
      
      if (data.role === "attendee") {
        window.location.href = "/discover"
      } else if (data.role === "organizer") {
        window.location.href = "/organizer"
      } else if (data.role === "admin") {
        window.location.href = "/admin"
      }
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
        <div className="auth-portal-label">Attendee Portal</div>

        <div className="auth-heading">Welcome Back</div>
        <div className="auth-subheading">Discover and book amazing events near you</div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form-stack">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button id="login-submit-btn" type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-text">OR</span>
          <div className="auth-divider-line" />
        </div>

        <p className="auth-footer-text">
          New to EventSphere?{' '}
          <Link to="/register" className="auth-footer-link">Create an account</Link>
        </p>
      </div>
    </div>
  )
}
