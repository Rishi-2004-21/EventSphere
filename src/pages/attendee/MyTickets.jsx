import { useApp } from '../../context/AppContext';
import TicketCard from '../../components/TicketCard';
import { Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyTickets() {
  const { state } = useApp();
  const currentUser = state.auth.currentUser;

  const myBookings = state.bookingsStore.filter(
    (b) => b.attendeeId === currentUser?.id
  );

  const getEvent = (eventId) => state.eventsStore.find((e) => e.id === eventId);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Tickets</h1>
        <p className="page-sub">Your booked events and QR codes</p>
      </div>

      {myBookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Ticket size={48} /></div>
          <h3>No tickets yet</h3>
          <p>Book your first event and your tickets will appear here.</p>
          <Link to="/events" className="btn-primary">Browse Events</Link>
        </div>
      ) : (
        <div className="tickets-list">
          {myBookings.map((booking) => {
            const event = getEvent(booking.eventId);
            return (
              <TicketCard key={booking.id} booking={booking} event={event} />
            );
          })}
        </div>
      )}
    </div>
  );
}
