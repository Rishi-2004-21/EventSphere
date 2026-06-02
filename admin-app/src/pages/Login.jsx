import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function AdminLogin() {
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
      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', form.email.trim())
        .maybeSingle()

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

      if (data.role !== 'admin') {
        setError('unauthorized access')
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
      navigate('/admin')
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
        <div className="auth-portal-label">Admin Portal</div>

        <div className="auth-heading">Administrator Access</div>
        <div className="auth-subheading">Platform management and oversight</div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form-stack">
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <input id="login-email" type="email" className="form-input" placeholder="admin@eventsphere.com"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="login-password" type="password" className="form-input" placeholder="••••••••"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>

          <button id="login-submit-btn" type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Sign In'}
          </button>
        </form>

        <p className="auth-note" style={{ marginTop: '2rem' }}>
          Admin accounts are provisioned by the system.
        </p>
      </div>
    </div>
  )
}
