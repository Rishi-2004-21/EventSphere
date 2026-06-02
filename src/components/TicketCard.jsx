import QRCode from 'react-qr-code';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { CheckCircle, MapPin, Calendar } from 'lucide-react';

export default function TicketCard({ booking, event }) {
  if (!event) return null;

  return (
    <div className="ticket-card">
      {/* Left strip */}
      <div className="ticket-strip">
        <span className="ticket-strip-text">TICKET</span>
      </div>

      {/* Content */}
      <div className="ticket-content">
        <div className="ticket-header">
          <div>
            <h3 className="ticket-title">{event.title}</h3>
            <div className="ticket-meta">
              <span><Calendar size={13} /> {formatDate(event.date)} at {event.time}</span>
              <span><MapPin size={13} /> {event.venue}, {event.city}</span>
            </div>
          </div>
          <div className="ticket-status">
            <CheckCircle size={18} className="text-success" />
            <span>Confirmed</span>
          </div>
        </div>

        <div className="ticket-body">
          {/* Attendee info */}
          <div className="ticket-info">
            <div className="ticket-info-row">
              <span className="info-label">Attendee</span>
              <span className="info-value">{booking.attendeeName}</span>
            </div>
            <div className="ticket-info-row">
              <span className="info-label">Booking ID</span>
              <span className="info-value info-mono">{booking.id}</span>
            </div>
            <div className="ticket-info-row">
              <span className="info-label">Amount Paid</span>
              <span className="info-value text-primary">{formatCurrency(booking.amountPaid)}</span>
            </div>
            <div className="ticket-info-row">
              <span className="info-label">Booked On</span>
              <span className="info-value">{formatDate(booking.bookedAt)}</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="ticket-qr">
            <div className="qr-wrapper">
              <QRCode
                value={booking.ticketQRCode}
                size={96}
                fgColor="#1a1a2e"
                bgColor="transparent"
              />
            </div>
            <p className="qr-label">Scan at venue</p>
          </div>
        </div>

        {/* Dotted divider */}
        <div className="ticket-divider" />

        {/* Fee breakdown */}
        <div className="ticket-fees">
          <span>Platform Fee (10%): {formatCurrency(booking.platformFee)}</span>
          <span>Organizer Received (90%): {formatCurrency(booking.organizerReceived)}</span>
        </div>
      </div>
    </div>
  );
}
