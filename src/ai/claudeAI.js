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

export async function getAIChatResponse(userMessage, userRole = 'attendee', userName = '') {
  try {
    const systemPrompt = userRole === 'organizer'
      ? `You are EventSphere's helpful AI assistant for event organizers. You help organizers create events, understand the platform features (4-step event wizard, AI description generator, AI category suggestions, AI insights), track their earnings (organizers receive 90% of each ticket instantly, 10% goes to EventSphere as platform fee), view bookings, manage their wallet, and understand the approval process (events are reviewed by admin team and can be approved, rejected, or sent back for changes). Keep all responses professional, concise, and under 100 words. The organizer's name is: ${userName || 'Organizer'}.`
      : `You are EventSphere's helpful AI assistant for event attendees. You help users discover events, book tickets (browse → click event → Book Now → pay via Razorpay → QR ticket generated), manage their bookings (My Tickets page), understand the payment breakdown (10% platform fee, 90% to organizer), navigate the platform, and use the wishlist (heart icon on event cards). Keep all responses friendly, concise, and under 100 words. The user is currently logged in and their name is: ${userName || 'User'}.`
    return await callClaude({ systemPrompt, userMessage, maxTokens: 200 })
  } catch (err) {
    console.error('getAIChatResponse error:', err)
    return "I'm having trouble connecting right now. Please try again in a moment!"
  }
}

