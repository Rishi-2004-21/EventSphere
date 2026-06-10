import React, { useEffect, useRef } from 'react';
import { X, Calendar, Clock, MapPin, Building, Download, Share2, User } from 'lucide-react';
import QRCode from 'react-qr-code';
import { formatDateReadable, formatTimeTo12Hour } from '../utils/dateUtils';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

export default function ExpandedTicketModal({ booking, event, onClose }) {
  const ticketRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const eventTitle = event?.title || booking.event_title;
  const eventDate = event?.date || booking.event_date;
  const eventCity = event?.city || booking.event_city;
  const venue = event?.venue || 'TBA';
  const time = event?.event_time || event?.time || booking?.event_time || '';
  const banner = event?.banner_url || null;
  const category = event?.category || 'General';

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    try {
      const toastId = toast.loading('Preparing ticket...');
      const canvas = await html2canvas(ticketRef.current, { scale: 2, useCORS: true, backgroundColor: null });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `EventSphere-Ticket-${booking.id}.png`;
      link.click();
      toast.success('Ticket downloaded!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to download ticket');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'My EventSphere Ticket',
      text: `I am going to ${eventTitle} on ${formatDateReadable(eventDate)}!`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast.success('Ticket details copied to clipboard!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error('Failed to share');
      }
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: '1rem',
      animation: 'fadeIn 0.2s ease'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      
      <div style={{ width: '100%', maxWidth: '480px', animation: 'slideUp 0.3s ease' }}>
        
        {/* Ticket Container */}
        <div 
          ref={ticketRef}
          style={{ 
            background: 'var(--bg-card)', 
            borderRadius: '16px', 
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            border: '1px solid var(--border)',
            position: 'relative'
          }}
        >
          {/* Header Section */}
          <div style={{ 
            position: 'relative', 
            minHeight: '150px', 
            width: '100%', 
            backgroundColor: '#7c3aed',
            backgroundImage: banner ? `url(${banner})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}>
            <div style={{ 
              position: 'absolute', inset: 0, 
              background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))' 
            }} />
            <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px' }}>
              <span className={`badge cat-${category}`}>{category}</span>
            </div>
            <div style={{ position: 'absolute', bottom: '16px', left: '20px', right: '20px' }}>
              <h2 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                {eventTitle}
              </h2>
            </div>
          </div>

          {/* Details Section */}
          <div style={{ padding: '24px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ color: 'var(--purple)' }}><Calendar size={18} /></div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>DATE</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>{formatDateReadable(eventDate)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ color: 'var(--purple)' }}><Clock size={18} /></div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>TIME</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>{time ? formatTimeTo12Hour(time) : 'TBA'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ color: 'var(--purple)' }}><MapPin size={18} /></div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>VENUE</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>{venue}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ color: 'var(--purple)' }}><Building size={18} /></div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>CITY</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>{eventCity}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ color: 'var(--purple)' }}><User size={18} /></div>
                <div>
                  <div style={{ fontSize: '10px', color: 'grey', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>ORGANIZER</div>
                  <div style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>{event?.organizer_name || booking.organizer_name || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Perforated Divider */}
          <div style={{ position: 'relative', height: '0', borderBottom: '2px dashed var(--border)', margin: '0 16px' }}>
            <div style={{ 
              position: 'absolute', left: '-26px', top: '-10px', width: '20px', height: '20px', 
              borderRadius: '50%', background: 'var(--bg-dark)' 
            }}></div>
            <div style={{ 
              position: 'absolute', right: '-26px', top: '-10px', width: '20px', height: '20px', 
              borderRadius: '50%', background: 'var(--bg-dark)' 
            }}></div>
          </div>

          {/* Stub / QR Section */}
          <div style={{ padding: '24px 20px', background: 'var(--bg-card-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1, paddingRight: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>ATTENDEE</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>{booking.attendee_name}</div>
              
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>BOOKING REF</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--purple)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{booking.id.toUpperCase()}</div>
            </div>
            
            <div style={{ background: 'white', padding: '10px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <QRCode value={booking.ticket_qr_code || booking.id} size={110} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button 
            onClick={handleDownload}
            style={{ 
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '14px', background: 'var(--purple)', color: 'white', border: 'none', 
              borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            <Download size={18} /> Download
          </button>
          <button 
            onClick={handleShare}
            style={{ 
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '14px', background: 'var(--bg-card-2)', color: 'var(--text-primary)', border: '1px solid var(--border)', 
              borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            <Share2 size={18} /> Share
          </button>
          <button 
            onClick={onClose}
            style={{ 
              width: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-card-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', 
              borderRadius: '12px', cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

      </div>
    </div>
  );
}
