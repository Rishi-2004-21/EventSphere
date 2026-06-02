import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Zap, Mail, Lock, User, MapPin } from 'lucide-react';
import { nanoid } from 'nanoid';
import toast from 'react-hot-toast';

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Goa'];
const ROLES = ['attendee', 'organizer'];
const CATEGORIES = ['Art', 'Tech', 'Fitness', 'Cultural', 'Community', 'Lifestyle'];

export default function Register() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'attendee', city: 'Mumbai',
  });
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (cat) =>
    setInterests((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const handleSubmit = (e) => {
    e.preventDefault();
    const exists = state.usersStore.find((u) => u.email === form.email);
    if (exists) { toast.error('Email already registered'); return; }

    setLoading(true);
    const newUser = {
      id: nanoid(),
      ...form,
      interests,
      wishlist: [],
      bookings: [],
      walletBalance: 0,
      isVerified: false,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(form.name)}`,
      createdAt: new Date().toISOString(),
    };

    setTimeout(() => {
      dispatch({ type: 'LOGIN', payload: newUser });
      toast.success(`Welcome to EventSphere, ${form.name.split(' ')[0]}!`);
      if (form.role === 'organizer') navigate('/organizer');
      else navigate('/events');
    }, 600);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card auth-card-lg">
        <div className="auth-logo">
          <div className="logo-icon"><Zap size={20} fill="currentColor" /></div>
          <span className="logo-text">EventSphere</span>
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Join India's AI-powered event platform</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-icon-wrap">
                <User size={16} className="input-icon" />
                <input id="reg-name" type="text" className="form-input input-with-icon"
                  placeholder="Rohit Verma" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select id="reg-role" className="form-input"
                value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input id="reg-email" type="email" className="form-input input-with-icon"
                placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-icon-wrap">
                <Lock size={16} className="input-icon" />
                <input id="reg-password" type="password" className="form-input input-with-icon"
                  placeholder="••••••••" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <div className="input-icon-wrap">
                <MapPin size={16} className="input-icon" />
                <select id="reg-city" className="form-input input-with-icon"
                  value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {form.role === 'attendee' && (
            <div className="form-group">
              <label className="form-label">Interests (select your favourites)</label>
              <div className="interest-grid">
                {CATEGORIES.map((cat) => (
                  <button key={cat} type="button"
                    className={`interest-chip ${interests.includes(cat) ? 'interest-chip-active' : ''}`}
                    onClick={() => toggleInterest(cat)}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button id="reg-submit-btn" type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
