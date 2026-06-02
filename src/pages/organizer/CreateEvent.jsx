import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { categorizeEvent, detectSpam } from '../../ai/aiModules';
import { getAIEventDescription } from '../../ai/claudeAI';
import { nanoid } from 'nanoid';
import { Sparkles, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

const CATEGORIES = ['Art', 'Tech', 'Fitness', 'Cultural', 'Community', 'Lifestyle'];
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Goa'];

const STEPS = ['Details & Description', 'Category & AI', 'Event Info', 'Pricing & Review'];

export default function CreateEvent() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const currentUser = state.auth.currentUser;
  const [step, setStep] = useState(0);
  const [aiDescLoading, setAiDescLoading] = useState(false);
  const [suggestedCats, setSuggestedCats] = useState([]);
  const [spamScore, setSpamScore] = useState(null);

  const [form, setForm] = useState({
    title: '', description: '', category: 'Tech',
    date: '', time: '10:00', venue: '', city: 'Mumbai',
    capacity: 100, price: 999,
    banner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    tags: '',
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // ── Step 0: AI Description ──────────────────────────────────────────────────
  const handleGenerateDesc = async () => {
    if (!form.title) { toast.error('Please enter a title first'); return; }
    setAiDescLoading(true);
    try {
      const desc = await getAIEventDescription(form.title, form.category);
      update('description', desc);
      toast.success('✨ AI description generated!');
    } catch {
      toast.error('AI generation failed. Try again!');
    } finally {
      setAiDescLoading(false);
    }
  };

  // ── Step 1: Auto-categorize ─────────────────────────────────────────────────
  const handleStep1 = () => {
    const suggestions = categorizeEvent(form.title, form.description);
    setSuggestedCats(suggestions);
    if (suggestions.length > 0) {
      update('category', suggestions[0].category);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    const spam = detectSpam(form.title, form.description, Number(form.price));
    setSpamScore(spam);

    if (spam > 70) {
      toast.error(`⚠️ Spam score ${spam}%. Please improve your listing.`);
      return;
    }

    dispatch({
      type: 'CREATE_EVENT',
      payload: {
        id: nanoid(),
        ...form,
        capacity: Number(form.capacity),
        price: Number(form.price),
        organizerId: currentUser.id,
        organizerName: currentUser.name,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      },
    });

    toast.success('🎉 Event submitted for review!');
    navigate('/organizer');
  };

  const nextStep = () => {
    if (step === 1) handleStep1();
    setStep((s) => Math.min(s + 1, 3));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Create New Event</h1>
        <p className="page-sub">Fill in the details to list your event</p>
      </div>

      {/* Step Indicator */}
      <div className="step-indicator">
        {STEPS.map((label, i) => (
          <div key={i} className={`step-item ${i <= step ? 'step-done' : ''} ${i === step ? 'step-active' : ''}`}>
            <div className="step-dot">
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <span className="step-label">{label}</span>
            {i < STEPS.length - 1 && <div className="step-line" />}
          </div>
        ))}
      </div>

      <div className="wizard-card">
        {/* ── STEP 0: Details & Description ─────────────────────────────── */}
        {step === 0 && (
          <div className="wizard-step">
            <h2 className="wizard-step-title">Event Details</h2>
            <div className="form-group">
              <label className="form-label">Event Title *</label>
              <input id="create-title" className="form-input" placeholder="Mumbai AI Summit 2025"
                value={form.title} onChange={(e) => update('title', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <div className="desc-wrap">
                <textarea id="create-desc" className="form-input form-textarea" rows={5}
                  placeholder="Tell attendees what makes this event special…"
                  value={form.description} onChange={(e) => update('description', e.target.value)} />
                <button
                  id="generate-ai-desc-btn"
                  type="button"
                  className="btn-ai desc-ai-btn"
                  onClick={handleGenerateDesc}
                  disabled={aiDescLoading}
                >
                  {aiDescLoading
                    ? <><span className="btn-spinner" /> Generating…</>
                    : <><Sparkles size={15} /> Generate AI Description</>
                  }
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Banner Image URL</label>
              <input className="form-input" placeholder="https://…"
                value={form.banner} onChange={(e) => update('banner', e.target.value)} />
              {form.banner && (
                <img src={form.banner} alt="banner preview" className="banner-preview"
                  onError={(e) => { e.target.style.display = 'none'; }} />
              )}
            </div>
          </div>
        )}

        {/* ── STEP 1: Category & AI ─────────────────────────────────────── */}
        {step === 1 && (
          <div className="wizard-step">
            <h2 className="wizard-step-title">Category</h2>
            <p className="wizard-step-sub">AI will suggest categories based on your title and description.</p>

            {suggestedCats.length > 0 && (
              <div className="ai-suggestions">
                <div className="ai-badge"><Sparkles size={12} /> AI Suggestions</div>
                {suggestedCats.map((s) => (
                  <button key={s.category} type="button"
                    className={`suggestion-chip ${form.category === s.category ? 'suggestion-active' : ''}`}
                    onClick={() => update('category', s.category)}>
                    {s.category} <span className="confidence">{s.confidence}%</span>
                  </button>
                ))}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Category *</label>
              <div className="category-selector">
                {CATEGORIES.map((cat) => (
                  <button key={cat} type="button"
                    className={`category-chip ${form.category === cat ? 'category-chip-active' : ''}`}
                    onClick={() => update('category', cat)}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input className="form-input" placeholder="AI, Technology, Innovation"
                value={form.tags} onChange={(e) => update('tags', e.target.value)} />
            </div>
          </div>
        )}

        {/* ── STEP 2: Event Info ────────────────────────────────────────── */}
        {step === 2 && (
          <div className="wizard-step">
            <h2 className="wizard-step-title">Event Information</h2>
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input id="create-date" type="date" className="form-input"
                  value={form.date} onChange={(e) => update('date', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Time *</label>
                <input id="create-time" type="time" className="form-input"
                  value={form.time} onChange={(e) => update('time', e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Venue *</label>
              <input id="create-venue" className="form-input" placeholder="Bombay Exhibition Centre"
                value={form.venue} onChange={(e) => update('venue', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">City *</label>
              <select className="form-input" value={form.city} onChange={(e) => update('city', e.target.value)}>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ── STEP 3: Pricing & Review ──────────────────────────────────── */}
        {step === 3 && (
          <div className="wizard-step">
            <h2 className="wizard-step-title">Pricing & Review</h2>
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Ticket Price (₹) *</label>
                <input id="create-price" type="number" className="form-input" min={0}
                  value={form.price} onChange={(e) => update('price', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Capacity *</label>
                <input id="create-capacity" type="number" className="form-input" min={1}
                  value={form.capacity} onChange={(e) => update('capacity', e.target.value)} />
              </div>
            </div>

            {/* Fee preview */}
            <div className="transparency-box">
              <h4 className="transparency-title">Revenue Breakdown (per ticket)</h4>
              <div className="transparency-row">
                <span>Ticket Price</span>
                <span>₹{Number(form.price).toLocaleString('en-IN')}</span>
              </div>
              <div className="transparency-row transparency-fee">
                <span>Platform Fee (10%)</span>
                <span className="fee-amount">− ₹{(form.price * 0.1).toFixed(2)}</span>
              </div>
              <div className="transparency-divider" />
              <div className="transparency-row transparency-organizer">
                <span>You Receive (90%)</span>
                <strong>₹{(form.price * 0.9).toFixed(2)}</strong>
              </div>
              <div className="transparency-row">
                <span>Max Revenue (full capacity)</span>
                <strong>₹{(form.price * 0.9 * form.capacity).toLocaleString('en-IN')}</strong>
              </div>
            </div>

            {/* Spam check result */}
            {spamScore !== null && (
              <div className={`spam-score ${spamScore > 50 ? 'spam-high' : 'spam-low'}`}>
                Spam Score: {spamScore}% {spamScore > 50 ? '⚠️ Improve description' : '✅ Looks good'}
              </div>
            )}

            {/* Summary */}
            <div className="review-summary">
              <h4>Review Summary</h4>
              <div className="review-row"><span>Title</span><span>{form.title || '—'}</span></div>
              <div className="review-row"><span>Category</span><span>{form.category}</span></div>
              <div className="review-row"><span>Date</span><span>{form.date || '—'} at {form.time}</span></div>
              <div className="review-row"><span>City</span><span>{form.city}</span></div>
              <div className="review-row"><span>Venue</span><span>{form.venue || '—'}</span></div>
              <div className="review-row"><span>Price</span><span>₹{Number(form.price).toLocaleString('en-IN')}</span></div>
              <div className="review-row"><span>Capacity</span><span>{form.capacity}</span></div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="wizard-nav">
          {step > 0 && (
            <button className="btn-outline" onClick={prevStep}>
              <ChevronLeft size={16} /> Previous
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < 3 ? (
            <button id="wizard-next-btn" className="btn-primary" onClick={nextStep}>
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button id="wizard-submit-btn" className="btn-primary" onClick={handleSubmit}>
              <Check size={16} /> Submit Event
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
