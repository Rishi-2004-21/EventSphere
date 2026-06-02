import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Zap, LogOut, User, LayoutDashboard, Ticket, Heart, Wallet,
  ShieldCheck, BarChart2, Users, Star, Bell
} from 'lucide-react';

export default function Navbar() {
  const { state, dispatch } = useApp();
  const { currentUser, isLoggedIn } = state.auth;
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  const userNotifications = state.notificationsStore.filter(
    (n) => n.userId === currentUser?.id && !n.read
  );

  const attendeeLinks = [
    { to: '/events', label: 'Discover', icon: <Star size={15} /> },
    { to: '/my-tickets', label: 'My Tickets', icon: <Ticket size={15} /> },
    { to: '/profile', label: 'Profile', icon: <User size={15} /> },
  ];

  const organizerLinks = [
    { to: '/organizer', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { to: '/organizer/create', label: 'Create Event', icon: <Zap size={15} /> },
    { to: '/organizer/wallet', label: 'Wallet', icon: <Wallet size={15} /> },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { to: '/admin/moderation', label: 'Moderation', icon: <ShieldCheck size={15} /> },
    { to: '/admin/users', label: 'Users', icon: <Users size={15} /> },
    { to: '/admin/revenue', label: 'Revenue', icon: <Wallet size={15} /> },
    { to: '/admin/analytics', label: 'Analytics', icon: <BarChart2 size={15} /> },
  ];

  const links =
    currentUser?.role === 'admin'
      ? adminLinks
      : currentUser?.role === 'organizer'
      ? organizerLinks
      : attendeeLinks;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <Zap size={18} fill="currentColor" />
          </div>
          <span className="logo-text">EventSphere</span>
        </Link>

        {/* Nav Links */}
        {isLoggedIn && (
          <div className="navbar-links">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="navbar-right">
          {isLoggedIn ? (
            <>
              {userNotifications.length > 0 && (
                <div className="notif-badge">
                  <Bell size={18} />
                  <span className="notif-count">{userNotifications.length}</span>
                </div>
              )}
              <div className="user-pill">
                <img
                  src={currentUser?.avatar}
                  alt={currentUser?.name}
                  className="user-avatar"
                />
                <span className="user-name">{currentUser?.name?.split(' ')[0]}</span>
                <span className={`role-badge role-${currentUser?.role}`}>
                  {currentUser?.role}
                </span>
              </div>
              <button onClick={handleLogout} className="btn-ghost-sm">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn-outline-sm">Login</Link>
              <Link to="/register" className="btn-primary-sm">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
