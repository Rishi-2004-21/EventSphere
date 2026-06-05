// claudeAI.js — OpenRouter API Integration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'openrouter/free' // Using OpenRouter auto-routed free model

function getApiKey() {
  return import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_ANTHROPIC_API_KEY || ''
}

async function callClaude({ systemPrompt, userMessage, maxTokens = 200 }) {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured.')
  }

  const messages = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  messages.push({ role: 'user', content: userMessage })

  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    messages: messages,
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'EventSphere',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenRouter API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

export async function getAIEventDescription(eventTitle, category) {
  try {
    return await callClaude({
      maxTokens: 200,
      userMessage: `Write a compelling 3-sentence event description for an event titled "${eventTitle}" in the "${category}" category for an Indian audience. Be concise, vivid, and persuasive.`,
    })
  } catch (err) {
    console.error('getAIEventDescription error:', err)
    return `Join us for an unforgettable ${category} experience at ${eventTitle}. This event brings together passionate enthusiasts from across India for a day of learning, networking, and inspiration. Don't miss your chance to be part of something extraordinary!`
  }
}

export async function getAIInsights(organizerEvents) {
  try {
    const summary = organizerEvents
      .map((e) => `- "${e.title}" (${e.category}): ${e.tickets_sold} tickets sold, status: ${e.status}`)
      .join('\n')

    return await callClaude({
      maxTokens: 400,
      userMessage: `You are an expert event marketing consultant. Here are my event performance metrics:\n\n${summary}\n\nProvide exactly 3 specific, actionable insights as numbered points with bold titles. Focus on pricing strategy, marketing timing, and category trends.`,
    })
  } catch (err) {
    console.error('getAIInsights error:', err)
    return `**1. Optimize Your Ticket Pricing**\nConsider early-bird pricing tiers to boost initial ticket sales.\n\n**2. Leverage Social Proof**\nHighlight sold-out events and attendee testimonials in your listings.\n\n**3. Post on Weekends**\nEvents listed on Friday–Sunday receive 40% more visibility.`
  }
}

// Keyword-based fallback responses (used when API is unavailable)
function getFallbackResponse(userMessage) {
  const msg = userMessage.toLowerCase()
  if (msg.includes('book') || msg.includes('ticket') || msg.includes('checkout')) {
    return { text: "To book a ticket, find an event you like on the Discover page, click on it, then click **Book Now** and follow the steps. Free events show a **Claim Free Ticket** button instead! 🎟️", limited: true }
  }
  if (msg.includes('event') || msg.includes('find') || msg.includes('discover') || msg.includes('search')) {
    return { text: "Use the **Discover** page to browse events. Use the category tabs (Art, Tech, Fitness…) and the search bar to filter events by name or city. 🔍", limited: true }
  }
  if (msg.includes('profile') || msg.includes('account') || msg.includes('interest') || msg.includes('setting')) {
    return { text: "Visit your **Profile** page to update your interests, manage your wishlist, and control notification preferences. Your interests help us personalize your discovery feed! ✨", limited: true }
  }
  if (msg.includes('ticket') || msg.includes('my ticket') || msg.includes('qr')) {
    return { text: "Find all your booked tickets on the **My Tickets** page. Each ticket shows a QR code that you can use for entry at the event venue. 🎫", limited: true }
  }
  if (msg.includes('wishlist') || msg.includes('save') || msg.includes('favourite') || msg.includes('favorite')) {
    return { text: "Click the ❤️ heart icon on any event to add it to your **Wishlist**. You can view all saved events on your Profile page.", limited: true }
  }
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey') || msg.includes('help')) {
    return { text: "Hi there! 👋 I'm your EventSphere assistant. I can help you **discover events**, **book tickets**, manage your **wishlist**, or navigate the app. What would you like to do?", limited: true }
  }
  return { text: "I'm here to help you discover and book events on EventSphere. Try browsing the **Discover** page, or ask me about booking tickets, your wishlist, or your profile! 🎉", limited: true }
}

export async function getAIChatResponse(userMessage, userRole = 'attendee', userName = '') {
  // ── Pre-filter: block any financial/pricing question before calling API ────
  const pricingKeywords = [
    'price', 'cost', 'fee', 'how much', 'rupee', '₹', 'inr',
    'organizer earn', 'organizer receiv', 'organizer get',
    'revenue', 'split', 'percent', '%',
    'platform fee', 'service fee', 'breakdown',
    '90%', '10%', '90 percent', '10 percent',
    'ticket cost', 'ticket price',
    'how much does', 'how much is', 'what does it cost',
    'charge', 'amount paid', 'payment breakdown', 'payment split',
    'earns', 'earning', 'commission', 'payout', 'wallet',
    'what do organizer', 'how much do organizer',
  ]
  const lower = userMessage.toLowerCase()
  const isPricingQuestion = pricingKeywords.some(kw => lower.includes(kw))
  if (isPricingQuestion && userRole === 'attendee') {
    return "To see the ticket price for any event, please visit the Event Detail page. The price shown is the total amount you pay — no hidden costs. I can help you discover events, manage bookings, or use the wishlist! 🎟️"
  }

  try {
    const systemPrompt = userRole === 'organizer'
      ? `You are EventSphere's helpful AI assistant for event organizers. You help organizers create events (5-step wizard: title/category → AI suggestions → date/venue/capacity → pricing → terms), understand the approval process (events reviewed by admin: pending, approved, changes-requested, or rejected), view bookings, manage wallet, and use AI features (AI description generator, AI category suggestions, AI insights panel). Keep all responses professional, concise, and under 100 words. The organizer's name is: ${userName || 'Organizer'}.`
      : `You are EventSphere's helpful AI assistant for event attendees. You help users discover events, book tickets (browse → click event → read T&C → proceed to checkout → get QR ticket), manage bookings on the My Tickets page, and use the wishlist. You must NEVER mention, reveal, calculate, or discuss ticket prices, event costs, fees, organizer earnings, revenue splits, platform fees, payment breakdowns, percentages, wallet amounts, or any financial figures whatsoever. If asked anything related to money, fees, costs or pricing — respond with: "To see the ticket price for any event, please visit the Event Detail page." Keep all responses friendly, concise, and under 100 words. The attendee's name is: ${userName || 'there'}.`
    return await callClaude({ systemPrompt, userMessage, maxTokens: 200 })
  } catch (err) {
    console.error('getAIChatResponse error:', err)
    // Return keyword-based fallback — never show raw error to user
    const fallback = getFallbackResponse(userMessage)
    return `__LIMITED__${fallback.text}`
  }
}
