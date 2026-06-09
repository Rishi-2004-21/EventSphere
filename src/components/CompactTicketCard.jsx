import React, { useState } from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';
import QRCode from 'react-qr-code';
import { formatDateReadable, formatTimeReadable } from '../utils/dateUtils';
import ExpandedTicketModal from './ExpandedTicketModal';

export default function CompactTicketCard({ booking, event }) {
  const [showModal, setShowModal] = useState(false);

  // Fallback gradient colors for different categories
  const getCategoryGradient = (category) => {
    switch (category) {
      case 'Tech': return 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
      case 'Fitness': return 'linear-gradient(135deg, #10b981, #047857)';
      case 'Art': return 'linear-gradient(135deg, #ec4899, #be185d)';
      case 'Cultural': return 'linear-gradient(135deg, #f59e0b, #b45309)';
      case 'Community': return 'linear-gradient(135deg, #8b5cf6, #6d28d9)';
      case 'Lifestyle': return 'linear-gradient(135deg, #ef4444, #b91c1c)';
      default: return 'linear-gradient(135deg, #6b7280, #374151)';
    }
  };

  const getCategoryBorderColor = (category) => {
    switch (category) {
      case 'Tech': return '#3b82f6';
      case 'Fitness': return '#10b981';
      case 'Art': return '#ec4899';
      case 'Cultural': return '#f59e0b';
      case 'Community': return '#8b5cf6';
      case 'Lifestyle': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const eventTitle = event?.title || booking.event_title;
  const eventDate = event?.date || booking.event_date;
  const eventCity = event?.city || booking.event_city;
  const venue = event?.venue || 'TBA';
  const time = event?.time || '';
  const banner = event?.banner_url || null;
  const category = event?.category || 'General';

  return (
    <>
      <div 
        onClick={() => setShowModal(true)}
        style={{
          display: 'flex',
          height: '100px',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          borderLeft: `4px solid ${getCategoryBorderColor(category)}`,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
          e.currentTarget.style.borderColor = 'var(--purple)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        {/* Left Section: Banner */}
        <div style={{ width: '80px', height: '100px', flexShrink: 0 }}>
          {banner ? (
            <img src={banner} alt={eventTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: getCategoryGradient(category) }}></div>
          )}
        </div>

        {/* Middle Section: Details */}
        <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
          <div style={{ 
            color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px', 
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '6px'
          }}>
            {eventTitle}
          </div>
          
          <div style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)', fontSize: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} />
              <span>{formatDateReadable(eventDate)}</span>
            </div>
            
            {time && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} />
                <span>{time}</span>
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={12} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                {venue}, {eventCity}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Tiny QR */}
        <div style={{ 
          width: '70px', background: 'var(--bg-card-2)', display: 'flex', 
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          padding: '8px', borderLeft: '1px solid var(--border)', flexShrink: 0
        }}>
          <div style={{ background: 'white', padding: '2px', borderRadius: '4px', marginBottom: '4px' }}>
            <QRCode value={booking.ticket_qr_code || booking.id} size={36} />
          </div>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Tap to view
          </span>
        </div>
      </div>

      {showModal && (
        <ExpandedTicketModal 
          booking={booking} 
          event={event} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
}
