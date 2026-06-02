import React, { createContext, useContext, useReducer } from 'react';
import { nanoid } from 'nanoid';
import { supabase } from '../supabase';
import {
  SEED_USERS,
  SEED_EVENTS,
  SEED_BOOKINGS,
  SEED_SETTLEMENTS,
  SEED_PLATFORM_REVENUE,
} from './seedData';

const AppContext = createContext(null);

const initialState = {
  auth: {
    currentUser: null,
    isLoggedIn: false,
  },
  eventsStore: SEED_EVENTS,
  usersStore: SEED_USERS,
  bookingsStore: SEED_BOOKINGS,
  platformRevenueStore: SEED_PLATFORM_REVENUE,
  notificationsStore: [],
  settlementStore: SEED_SETTLEMENTS,
};

function appReducer(state, action) {
  switch (action.type) {
    // ── AUTH ──────────────────────────────────────────────────────────────────
    case 'LOGIN': {
      return {
        ...state,
        auth: { currentUser: action.payload, isLoggedIn: true },
      };
    }
    case 'LOGOUT': {
      return {
        ...state,
        auth: { currentUser: null, isLoggedIn: false },
      };
    }

    // ── EVENTS ────────────────────────────────────────────────────────────────
    case 'CREATE_EVENT': {
      const newEvent = {
        ...action.payload,
        id: action.payload.id || nanoid(),
        ticketsSold: 0,
        bookingCount: 0,
        status: 'pending',
        trending: 'Steady',
        createdAt: new Date().toISOString(),
      };
      return { ...state, eventsStore: [...state.eventsStore, newEvent] };
    }
    case 'UPDATE_EVENT_STATUS': {
      return {
        ...state,
        eventsStore: state.eventsStore.map((evt) =>
          evt.id === action.payload.eventId
            ? { ...evt, status: action.payload.status }
            : evt
        ),
      };
    }

    // ── BOOKINGS ──────────────────────────────────────────────────────────────
    case 'BOOK_TICKET': {
      const { eventId, attendeeId, attendeeName, price, eventTitle } = action.payload;
      const platformFee = parseFloat((price * 0.1).toFixed(2));
      const organizerReceived = parseFloat((price * 0.9).toFixed(2));

      const booking = {
        id: nanoid(),
        eventId,
        eventTitle,
        attendeeId,
        attendeeName,
        ticketQRCode: nanoid(),
        bookedAt: new Date().toISOString(),
        amountPaid: price,
        platformFee,
        organizerReceived,
        paymentStatus: 'confirmed',
        organizerId: action.payload.organizerId,
      };

      // Find the event to get the organizer
      const targetEvent = state.eventsStore.find((e) => e.id === eventId);
      const organizerId = targetEvent?.organizerId;

      const notification = {
        id: nanoid(),
        userId: organizerId,
        message: `New ticket sold for "${eventTitle}" — ₹${organizerReceived.toFixed(2)} credited to your wallet`,
        type: 'booking',
        createdAt: new Date().toISOString(),
        read: false,
      };

      return {
        ...state,
        bookingsStore: [...state.bookingsStore, booking],
        eventsStore: state.eventsStore.map((evt) =>
          evt.id === eventId
            ? { ...evt, ticketsSold: evt.ticketsSold + 1, bookingCount: evt.bookingCount + 1 }
            : evt
        ),
        usersStore: state.usersStore.map((user) =>
          user.id === organizerId
            ? { ...user, walletBalance: (user.walletBalance || 0) + organizerReceived }
            : user
        ),
        platformRevenueStore: parseFloat(
          (state.platformRevenueStore + platformFee).toFixed(2)
        ),
        notificationsStore: [...state.notificationsStore, notification],
      };
    }

    // ── WISHLIST ──────────────────────────────────────────────────────────────
    case 'ADD_TO_WISHLIST': {
      return {
        ...state,
        usersStore: state.usersStore.map((user) =>
          user.id === action.payload.userId
            ? {
                ...user,
                wishlist: [...(user.wishlist || []), action.payload.eventId],
              }
            : user
        ),
        auth: {
          ...state.auth,
          currentUser:
            state.auth.currentUser?.id === action.payload.userId
              ? {
                  ...state.auth.currentUser,
                  wishlist: [
                    ...(state.auth.currentUser.wishlist || []),
                    action.payload.eventId,
                  ],
                }
              : state.auth.currentUser,
        },
      };
    }
    case 'REMOVE_FROM_WISHLIST': {
      return {
        ...state,
        usersStore: state.usersStore.map((user) =>
          user.id === action.payload.userId
            ? {
                ...user,
                wishlist: (user.wishlist || []).filter(
                  (id) => id !== action.payload.eventId
                ),
              }
            : user
        ),
        auth: {
          ...state.auth,
          currentUser:
            state.auth.currentUser?.id === action.payload.userId
              ? {
                  ...state.auth.currentUser,
                  wishlist: (state.auth.currentUser.wishlist || []).filter(
                    (id) => id !== action.payload.eventId
                  ),
                }
              : state.auth.currentUser,
        },
      };
    }

    // ── INTERESTS ─────────────────────────────────────────────────────────────
    case 'SET_INTERESTS': {
      return {
        ...state,
        usersStore: state.usersStore.map((user) =>
          user.id === action.payload.userId
            ? { ...user, interests: action.payload.interests }
            : user
        ),
        auth: {
          ...state.auth,
          currentUser:
            state.auth.currentUser?.id === action.payload.userId
              ? { ...state.auth.currentUser, interests: action.payload.interests }
              : state.auth.currentUser,
        },
      };
    }

    // ── ADMIN ─────────────────────────────────────────────────────────────────
    case 'VERIFY_ORGANIZER': {
      return {
        ...state,
        usersStore: state.usersStore.map((user) =>
          user.id === action.payload.userId ? { ...user, isVerified: true } : user
        ),
      };
    }
    case 'SUSPEND_USER': {
      return {
        ...state,
        usersStore: state.usersStore.map((user) =>
          user.id === action.payload.userId
            ? { ...user, suspended: action.payload.suspended }
            : user
        ),
      };
    }

    // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
    case 'ADD_NOTIFICATION': {
      return {
        ...state,
        notificationsStore: [...state.notificationsStore, action.payload],
      };
    }

    // ── WALLET ────────────────────────────────────────────────────────────────
    case 'UPDATE_WALLET': {
      return {
        ...state,
        usersStore: state.usersStore.map((user) =>
          user.id === action.payload.userId
            ? { ...user, walletBalance: action.payload.amount }
            : user
        ),
      };
    }

    // ── SETTLEMENTS ───────────────────────────────────────────────────────────
    case 'REQUEST_SETTLEMENT': {
      const newSettlement = {
        id: nanoid(),
        ...action.payload,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      };
      return {
        ...state,
        settlementStore: [...state.settlementStore, newSettlement],
      };
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [authLoading, setAuthLoading] = React.useState(true);

  React.useEffect(() => {
    const savedUser = localStorage.getItem('eventsphere_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        dispatch({ type: 'LOGIN', payload: user });
      } catch (e) {
        localStorage.removeItem('eventsphere_user');
      }
    }
    setAuthLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !data) {
      console.log("Supabase login error:", error);
      return null;
    }

    console.log("LOGIN RETURN USER:", data);
    localStorage.setItem('eventsphere_user', JSON.stringify(data));
    dispatch({ type: 'LOGIN', payload: data });
    return data;
  };

  const logoutUser = () => {
    localStorage.removeItem('eventsphere_user');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AppContext.Provider value={{ state, dispatch, login, loginUser: login, logoutUser, authLoading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
