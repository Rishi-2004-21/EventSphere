import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Check, Edit, X, ShieldAlert } from 'lucide-react'
import { nanoid } from 'nanoid'
import toast from 'react-hot-toast'

function SpamProgressBar({ score }) {
  const numScore = Number(score) || 0
  let color = '#10b981' // green
  if (numScore >= 30 && numScore <= 60) color = '#f59e0b' // amber
  if (numScore > 60) color = '#ef4444' // red

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
        <span>Spam Score</span>
        <span style={{ color, fontWeight: 700 }}>{numScore}%</span>
      </div>
      <div style={{ height: '6px', background: 'var(--bg-card-2)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${numScore}%`, background: color, transition: 'width 0.3s ease' }} />
      </div>
    </div>
  )
}

export default function EventModeration() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modals state
  const [changesModalOpen, setChangesModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [approveWarningModalOpen, setApproveWarningModalOpen] = useState(false)
  const [activeEvent, setActiveEvent] = useState(null)
  const [adminNote, setAdminNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (data) setEvents(data)
    setLoading(false)
  }

  async function initiateApprove(event) {
    if (!event.organizer_id) {
      executeApprove(event)
      return
    }

    const { data: org } = await supabase
      .from('users')
      .select('upi_qr_url')
      .eq('id', event.organizer_id)
      .single()

    if (!org?.upi_qr_url) {
      setActiveEvent(event)
      setApproveWarningModalOpen(true)
    } else {
      executeApprove(event)
    }
  }

  async function executeApprove(event) {
    const { error } = await supabase
      .from('events')
      .update({ status: 'approved' })
      .eq('id', event.id)

    if (error) {
      toast.error('Failed to approve event')
    } else {
      toast.success('Event approved')
      setApproveWarningModalOpen(false)
      setActiveEvent(null)
      fetchEvents()
    }
  }

  async function handleRequestChanges() {
    if (!adminNote.trim()) {
      toast.error('Please enter a note for the organizer')
      return
    }

    const { error } = await supabase
      .from('events')
      .update({ status: 'changes-requested', admin_note: adminNote, reviewed_by: 'SuperAdmin', reviewed_at: new Date().toISOString() })
      .eq('id', activeEvent.id)

    if (error) {
      toast.error('Failed to request changes')
    } else {
      const { error: notifError } = await supabase.from('notifications').insert([{
        id: nanoid(),
        user_id: activeEvent.organizer_id,
        message: `Your event "${activeEvent.title}" requires changes. Admin note: ${adminNote}`,
        is_read: false,
        event_id: activeEvent.id,
        action_url: `/events/${activeEvent.id}`,
        created_at: new Date().toISOString()
      }])
      
      if (notifError) console.error('Notification error:', notifError);

      toast.success('Changes requested')
      setChangesModalOpen(false)
      setAdminNote('')
      setActiveEvent(null)
      fetchEvents()
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      toast.error('Please enter a reason for rejection')
      return
    }

    const { error } = await supabase
      .from('events')
      .update({ status: 'rejected', rejection_reason: rejectReason, reviewed_by: 'SuperAdmin', reviewed_at: new Date().toISOString() })
      .eq('id', activeEvent.id)

    if (error) {
      toast.error('Failed to reject event')
    } else {
      const { error: notifError } = await supabase.from('notifications').insert([{
        id: nanoid(),
        user_id: activeEvent.organizer_id,
        message: `Your event "${activeEvent.title}" has been rejected. Reason: ${rejectReason}`,
        is_read: false,
        event_id: activeEvent.id,
        action_url: `/events/${activeEvent.id}`,
        created_at: new Date().toISOString()
      }])

      if (notifError) console.error('Notification error:', notifError);

      toast.success('Event rejected')
      setRejectReason('')
      setRejectModalOpen(false)
      setActiveEvent(null)
      fetchEvents()
    }
  }

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Pending Events</h1>
        <span className="badge badge-accent" style={{ fontSize: '1rem', padding: '0.2rem 0.75rem' }}>
          {events.length}
        </span>
      </div>

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <ShieldAlert className="empty-icon" />
          <div className="empty-title">Queue is empty</div>
          <div className="empty-sub">No pending events to moderate</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {events.map((evt) => (
            <div key={evt.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span className={`badge cat-${evt.category}`}>{evt.category}</span>
                    {evt.ai_category && (
                      <span className="badge badge-blue">AI Suggests: {evt.ai_category}</span>
                    )}
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {evt.title}
                  </h2>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    by {evt.organizer_name}
                  </div>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                {evt.description?.substring(0, 150)}{evt.description?.length > 150 ? '...' : ''}
              </p>

              <SpamProgressBar score={evt.spam_score} />

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  className="btn-approve" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => initiateApprove(evt)}
                >
                  <Check size={16} /> Approve
                </button>
                <button 
                  className="btn-changes" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => { setActiveEvent(evt); setChangesModalOpen(true); }}
                >
                  <Edit size={16} /> Request Changes
                </button>
                <button 
                  className="btn-reject" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => { setActiveEvent(evt); setRejectModalOpen(true); }}
                >
                  <X size={16} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Changes Modal */}
      {changesModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>Request Changes</h3>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Explain what needs to be changed..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              style={{ marginBottom: '1rem', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => { setChangesModalOpen(false); setAdminNote(''); }}>Cancel</button>
              <button className="btn-accent" onClick={handleRequestChanges}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--red)' }}>Reject Event</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Are you sure you want to reject "{activeEvent?.title}"? This action cannot be easily undone.
            </p>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Explain why the event is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ marginBottom: '1rem', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => { setRejectModalOpen(false); setRejectReason(''); }}>Cancel</button>
              <button className="btn-accent" style={{ background: 'var(--red)' }} onClick={handleReject}>Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Warning Modal (Missing UPI) */}
      {approveWarningModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#f59e0b' }}>Missing Payment Details</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              This organizer has not set up payment details (UPI QR code). Approving this event means attendees cannot complete payment. Do you want to approve anyway?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setApproveWarningModalOpen(false)}>Cancel</button>
              <button className="btn-accent" style={{ background: '#f59e0b', color: '#1a2235' }} onClick={() => executeApprove(activeEvent)}>Approve Anyway</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
