import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Zap, Search, ArrowRight, CheckCircle, Ticket, CreditCard } from 'lucide-react';
import EventCard from '../../components/EventCard';
import CategoryBadge from '../../components/CategoryBadge';
import './LandingPage.css';

const CATEGORIES = [
  { name: 'Art', emoji: '🎨', desc: 'Galleries, concerts, exhibitions' },
  { name: 'Tech', emoji: '💻', desc: 'Hackathons, conferences, workshops' },
  { name: 'Fitness', emoji: '🏃', desc: 'Marathons, yoga, sports' },
  { name: 'Cultural', emoji: '🎭', desc: 'Dance, music, heritage' },
  { name: 'Community', emoji: '🤝', desc: 'Meetups, volunteering, networking' },
  { name: 'Lifestyle', emoji: '✨', desc: 'Food, fashion, travel' },
];

export default function LandingPage() {
  const { state } = useApp();
  const approvedEvents = state.eventsStore.filter((e) => e.status === 'approved');
  const hotEvents = approvedEvents.filter((e) => e.trending === 'Hot');
  const featuredEvents = approvedEvents.slice(0, 6);

  return (
    <div className="landing-page">
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-bg-orbs">
          <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
        </div>
        <div className="hero-content">
          <div className="hero-pill">
            <Zap size={14} fill="currentColor" /> India's #1 AI-Powered Event Platform
          </div>
          <h1 className="hero-heading">
            Discover Amazing<br />
            <span className="gradient-text">Events Near You</span>
          </h1>
          <p className="hero-sub">
            From AI-curated recommendations to instant booking. 90% of every ticket goes directly to organizers — powered by transparency.
          </p>
          <div className="hero-search">
            <div className="search-wrap">
              <Search size={18} className="search-icon" />
              <input
                id="hero-search-input"
                className="hero-search-input"
                placeholder="Search events, artists, venues…"
                readOnly
              />
            </div>
            <Link to="/events" id="hero-find-btn" className="btn-primary hero-btn">
              Find Events <ArrowRight size={18} />
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><span className="stat-num">22+</span><span className="stat-label">Events</span></div>
            <div className="hero-stat"><span className="stat-num">6</span><span className="stat-label">Categories</span></div>
            <div className="hero-stat"><span className="stat-num">90%</span><span className="stat-label">To Organizers</span></div>
          </div>
        </div>
      </section>

      {/* ── TRENDING STRIP ───────────────────────────────────────────────── */}
      {hotEvents.length > 0 && (
        <section className="section trending-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">🔥 Trending Now</h2>
              <Link to="/events" className="see-all-link">See all <ArrowRight size={14} /></Link>
            </div>
            <div className="trending-scroll">
              {hotEvents.map((evt) => (
                <div key={evt.id} className="trending-card-wrap">
                  <EventCard event={evt} showActions={false} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CATEGORIES ───────────────────────────────────────────────────── */}
      <section className="section categories-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Browse by Category</h2>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/events?category=${cat.name}`}
                className="category-card"
                id={`cat-${cat.name.toLowerCase()}`}
              >
                <div className="category-emoji">{cat.emoji}</div>
                <div className="category-name">{cat.name}</div>
                <div className="category-desc">{cat.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED EVENTS ──────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Events</h2>
            <Link to="/events" className="see-all-link">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="events-grid">
            {featuredEvents.map((evt) => (
              <EventCard key={evt.id} event={evt} showActions={false} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="section how-it-works">
        <div className="container">
          <h2 className="section-title text-center">How EventSphere Works</h2>
          <p className="section-sub text-center">Transparent, instant, and fair for everyone.</p>
          <div className="hiw-grid">
            {[
              { icon: <Search size={28} />, step: '01', title: 'Browse Events', desc: 'Discover AI-recommended events curated just for you based on your interests and location.' },
              { icon: <Ticket size={28} />, step: '02', title: 'Book Instantly', desc: 'Secure your spot in seconds. Your QR-code ticket is generated immediately after payment.' },
            ].map((item) => (
              <div key={item.step} className="hiw-card">
                <div className="hiw-icon">{item.icon}</div>
                <div className="hiw-step">{item.step}</div>
                <h3 className="hiw-title">{item.title}</h3>
                <p className="hiw-desc">{item.desc}</p>
                {item.step === '03' && (
                  <div className="fee-split-box">
                    <div className="fee-row">
                      <span>Platform Fee</span>
                      <span className="fee-pct">10%</span>
                    </div>
                    <div className="fee-row fee-organizer">
                      <span>Organizer Receives</span>
                      <span className="fee-pct-big">90%</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-logo">
            <Zap size={18} fill="currentColor" />
            <span>EventSphere</span>
          </div>
          <p className="footer-copy">© 2025 EventSphere. Built with AI for India.</p>
        </div>
      </footer>
    </div>
  );
}
