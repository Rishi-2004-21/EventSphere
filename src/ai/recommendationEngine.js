// recommendationEngine.js — Tixque AI Recommendation Engine
// Pure local scoring — no external API calls.
// Scores each event for a given attendee based on 4 layers:
// 1. Interest matching   2. Behavior (views/bookings/wishlist)
// 3. Location proximity  4. Collaborative filtering

const CATEGORY_COLORS = {
  Tech: '#3b82f6',
  Art: '#a855f7',
  Fitness: '#10b981',
  Cultural: '#f59e0b',
  Community: '#0d9488',
  Lifestyle: '#ec4899',
}

export const CATEGORY_COLOR_MAP = CATEGORY_COLORS

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysUntil(dateStr) {
  if (!dateStr) return 999
  try {
    const eventDate = new Date(dateStr)
    const today = new Date()
    return Math.floor((eventDate - today) / (1000 * 60 * 60 * 24))
  } catch {
    return 999
  }
}

function daysSince(dateStr) {
  if (!dateStr) return 999
  try {
    const d = new Date(dateStr)
    const today = new Date()
    return Math.floor((today - d) / (1000 * 60 * 60 * 24))
  } catch {
    return 999
  }
}

// ─── Layer 1 + 2 + 3 + 4 Combined Scorer ───────────────────────────────────

/**
 * Calculates a recommendation score for a single event.
 * @param {object} event
 * @param {object} user
 * @param {object[]} bookingHistory — array of booking records for this user
 * @param {object} categoryScores — { Tech: 45, Art: 10, ... }
 * @param {object} preferences — { showPersonalized, includeOtherCities, showTrendingBoost }
 * @returns {{ eventId, score, reason, type }}
 */
export function calculateEventScore(event, user, bookingHistory = [], categoryScores = {}, preferences = {}) {
  const {
    showPersonalized = true,
    includeOtherCities = true,
    showTrendingBoost = true,
  } = preferences

  let score = 0
  let reason = 'Popular on Tixque'
  let type = 'trending'

  const userInterests = user?.interests || []
  const userCity = user?.city || user?.preferred_city || ''
  const userWishlist = user?.wishlist || []

  // Skip non-approved events
  if (event.status !== 'approved') return { eventId: event.id, score: -1, reason, type }

  // ── LAYER 1: Interest Matching ─────────────────────────────────────────────
  if (showPersonalized) {
    if (userInterests.includes(event.category)) {
      score += 40
      reason = `Based on your interest in ${event.category}`
      type = 'interest_based'
    } else if ((categoryScores[event.category] || 0) > 5) {
      score += 20
      reason = `You've been exploring ${event.category}`
      type = 'behavior_based'
    }
  }

  // ── LAYER 2a: Booking History ──────────────────────────────────────────────
  if (showPersonalized) {
    const categoryBookings = bookingHistory.filter(
      (b) => (b.event_category || b.category) === event.category
    ).length
    const bookingBonus = Math.min(categoryBookings * 15, 60)
    score += bookingBonus
    if (bookingBonus >= 30 && !userInterests.includes(event.category)) {
      reason = `You love ${event.category} events`
      type = 'behavior_based'
    }
  }

  // ── LAYER 2b: Behavior Score (views/wishlist) ──────────────────────────────
  if (showPersonalized) {
    const behaviorScore = Math.min(categoryScores[event.category] || 0, 30) * 0.5
    score += behaviorScore

    // Wishlist matching: any event in same category wishlisted?
    if (userWishlist.length > 0 && userInterests.includes(event.category)) {
      score += 25
    }
  }

  // ── LAYER 3: Location Matching ─────────────────────────────────────────────
  if (userCity && event.city) {
    if (event.city.toLowerCase() === userCity.toLowerCase()) {
      score += 30
      if (score < 50) {
        reason = `Popular in ${event.city}`
        type = 'location_based'
      }
    } else if (!includeOtherCities) {
      return { eventId: event.id, score: -1, reason, type } // filter out other cities
    }
    // Same-state heuristic (simplified: first word of city name match)
    else {
      score += 0 // different city — no penalty but no bonus
    }
  }

  // ── Trending Bonus ─────────────────────────────────────────────────────────
  if (showTrendingBoost) {
    if (event.trending === 'Hot') {
      score += 20
      if (score < 30) { reason = '🔥 Trending right now'; type = 'trending' }
    } else if (event.trending === 'Rising') {
      score += 10
      if (score < 20) { reason = '📈 Rising in popularity'; type = 'trending' }
    }
  }

  // ── Recency Bonus (upcoming events) ───────────────────────────────────────
  const days = daysUntil(event.date)
  if (days >= 0 && days <= 7) score += 15
  else if (days >= 0 && days <= 30) score += 10
  else if (days >= 0 && days <= 90) score += 5
  // Past events get 0 recency bonus

  // ── Popularity Bonus (fill percentage) ────────────────────────────────────
  const capacity = event.capacity || 1
  const sold = event.tickets_sold || event.booking_count || 0
  const fillPct = (sold / capacity) * 100
  if (fillPct > 70) score += 10
  if (fillPct > 90) score += 5

  // ── New Event Boost ────────────────────────────────────────────────────────
  if (daysSince(event.created_at) <= 7) score += 8

  // ── Personalization Multiplier ─────────────────────────────────────────────
  const totalBookings = bookingHistory.length
  const multiplier = totalBookings >= 10 ? 1.2 : totalBookings >= 5 ? 1.1 : 1.0
  score = Math.round(score * multiplier)

  return { eventId: event.id, score, reason, type }
}

// ─── Cold Start Recommendations ──────────────────────────────────────────────

/**
 * For brand-new users: returns the most popular events balanced across all categories.
 */
export function getColdStartRecommendations(events) {
  const CATEGORIES = ['Art', 'Tech', 'Fitness', 'Cultural', 'Community', 'Lifestyle']
  const approved = events.filter((e) => e.status === 'approved')

  const result = []
  CATEGORIES.forEach((cat) => {
    const catEvents = approved
      .filter((e) => e.category === cat)
      .sort((a, b) => (b.tickets_sold || 0) - (a.tickets_sold || 0))
      .slice(0, 2)
      .map((e) => ({ ...e, _score: (e.tickets_sold || 0), _reason: `Popular in ${cat}`, _type: 'cold_start' }))
    result.push(...catEvents)
  })

  return result
    .sort((a, b) => b._score - a._score)
}

// ─── Collaborative Filtering ─────────────────────────────────────────────────

/**
 * Finds events booked by users with similar taste that this user hasn't booked.
 */
export function getCollaborativeRecommendations(userId, allBookings, allEvents) {
  if (!userId || !allBookings?.length) return []

  // My booked event ids
  const myBookings = allBookings.filter((b) => b.attendee_id === userId)
  const myEventIds = new Set(myBookings.map((b) => b.event_id))

  if (myEventIds.size < 2) return []

  // Find similar users (booked >= 2 of the same events as me)
  const otherUserBookings = allBookings.filter((b) => b.attendee_id !== userId)
  const userEventMap = {}
  otherUserBookings.forEach((b) => {
    if (!userEventMap[b.attendee_id]) userEventMap[b.attendee_id] = new Set()
    userEventMap[b.attendee_id].add(b.event_id)
  })

  const similarUsers = Object.entries(userEventMap)
    .filter(([, eventSet]) => {
      const overlap = [...eventSet].filter((id) => myEventIds.has(id)).length
      return overlap >= 2
    })
    .map(([uid]) => uid)

  if (!similarUsers.length) return []

  // Events booked by similar users but not by me
  const candidateEventCounts = {}
  allBookings
    .filter((b) => similarUsers.includes(b.attendee_id) && !myEventIds.has(b.event_id))
    .forEach((b) => {
      candidateEventCounts[b.event_id] = (candidateEventCounts[b.event_id] || 0) + 1
    })

  const eventMap = {}
  allEvents.forEach((e) => { eventMap[e.id] = e })

  return Object.entries(candidateEventCounts)
    .filter(([id]) => eventMap[id]?.status === 'approved')
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, count]) => ({
      ...eventMap[id],
      _score: count * 30,
      _reason: 'Attendees with similar taste booked this',
      _type: 'collaborative',
    }))
}

// ─── Main Orchestrator ───────────────────────────────────────────────────────

/**
 * Main function called from the UI.
 * Returns a sorted, de-duped list of recommended events with scores and reasons.
 */
export function getPersonalizedRecommendations(user, events, allBookings = [], categoryScores = {}) {
  if (!user || !events?.length) return getColdStartRecommendations(events || [])

  const preferences = user?.recommendation_preferences || {}
  const myBookings = allBookings.filter((b) => b.attendee_id === user.id)
  const myBookedEventIds = new Set(myBookings.map((b) => b.event_id))

  const hasData = myBookings.length > 0 || (user.interests || []).length > 0

  if (!hasData) {
    return getColdStartRecommendations(events).map((e) => ({
      ...e,
      _score: e._score || 0,
      _reason: e._reason || 'Trending on Tixque',
      _type: 'cold_start',
    }))
  }

  // Score all approved events
  const scored = events
    .filter((e) => e.status === 'approved' && !myBookedEventIds.has(e.id))
    .map((event) => {
      const result = calculateEventScore(event, user, myBookings, categoryScores, preferences)
      return { ...event, _score: result.score, _reason: result.reason, _type: result.type }
    })
    .filter((e) => e._score >= 0)

  // Merge collaborative recommendations with bonus
  const collaborative = getCollaborativeRecommendations(user.id, allBookings, events)
  const collabIds = new Set(collaborative.map((e) => e.id))
  collaborative.forEach((collab) => {
    const existing = scored.find((e) => e.id === collab.id)
    if (existing) {
      existing._score += 30
      existing._reason = collab._reason
      existing._type = 'collaborative'
    }
  })

  // Add new collaborative events not already in scored list
  collaborative
    .filter((c) => !scored.find((s) => s.id === c.id) && !myBookedEventIds.has(c.id))
    .forEach((c) => scored.push(c))

  return scored.sort((a, b) => b._score - a._score)
}

// ─── "Because You Booked" Section ───────────────────────────────────────────

/**
 * Returns events in the same category as the user's most recent booking.
 */
export function getBecauseYouBooked(user, events, allBookings) {
  const myBookings = (allBookings || [])
    .filter((b) => b.attendee_id === user?.id)
    .sort((a, b) => new Date(b.booked_at) - new Date(a.booked_at))

  if (!myBookings.length) return { events: [], sourceTitle: '' }

  const mostRecent = myBookings[0]
  const sourceTitle = mostRecent.event_title || 'your recent booking'
  const category = mostRecent.event_category || mostRecent.category

  const myBookedIds = new Set(myBookings.map((b) => b.event_id))
  const similar = events
    .filter((e) =>
      e.status === 'approved' &&
      e.category === category &&
      !myBookedIds.has(e.id)
    )
    .sort((a, b) => (b.tickets_sold || 0) - (a.tickets_sold || 0))
    .slice(0, 6)

  return { events: similar, sourceTitle }
}
