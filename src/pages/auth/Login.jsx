import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    const user = state.usersStore.find(
      (u) => u.email === form.email && u.password === form.password
    );
    setTimeout(() => {
      if (user) {
        dispatch({ type: 'LOGIN', payload: user });
        toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
        if (user.role === 'admin') navigate('/admin');
        else if (user.role === 'organizer') navigate('/organizer');
        else navigate('/events');
      } else {
        toast.error('Invalid email or password');
        setLoading(false);
      }
    }, 600);
  };

  // Demo credentials
  const demoLogins = [
    { label: 'Attendee', email: 'rohit@eventsphere.com', password: 'user123', color: '#10b981' },
    { label: 'Organizer', email: 'priya@eventsphere.com', password: 'org123', color: '#6366f1' },
    { label: 'Admin', email: 'admin@eventsphere.com', password: 'admin123', color: '#f59e0b' },
  ];

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-icon"><Zap size={20} fill="currentColor" /></div>
          <span className="logo-text">EventSphere</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your account</p>

        {/* Demo Login Buttons */}
        <div className="demo-logins">
          <p className="demo-label">Quick Demo Login:</p>
          <div className="demo-btns">
            {demoLogins.map((d) => (
              <button
                key={d.label}
                className="demo-btn"
                style={{ borderColor: d.color, color: d.color }}
                onClick={() => setForm({ email: d.email, password: d.password })}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input
                id="login-email"
                type="email"
                className="form-input input-with-icon"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="login-password"
                type={showPwd ? 'text' : 'password'}
                className="form-input input-with-icon"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="input-eye"
                onClick={() => setShowPwd((v) => !v)}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? <span className="btn-spinner" /> : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">Create one</Link>
        </p>
      </div>
    </div>
  );
}
