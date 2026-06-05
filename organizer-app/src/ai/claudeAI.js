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

function getOrganizerFallback(userMessage) {
  const msg = userMessage.toLowerCase()
  if (msg.includes('create') || msg.includes('event') || msg.includes('wizard')) {
    return `__LIMITED__Use the **Create Event** button to start the 5-step wizard: Title → AI Suggestions → Date & Venue → Pricing → Terms. Your event will be submitted for admin review after creation. 🎪`
  }
  if (msg.includes('approval') || msg.includes('pending') || msg.includes('status') || msg.includes('rejected')) {
    return `__LIMITED__Events go through four statuses: **Pending** (awaiting review), **Approved** (live & selling), **Changes Requested** (edit and resubmit), or **Rejected**. Check the Dashboard for current status. ✅`
  }
  if (msg.includes('wallet') || msg.includes('earning') || msg.includes('revenue') || msg.includes('payout')) {
    return `__LIMITED__Your wallet balance is shown on the **Dashboard**. Earnings from ticket sales are credited automatically. Visit the **Wallet** page for detailed transaction history. 💰`
  }
  if (msg.includes('booking') || msg.includes('ticket') || msg.includes('attendee')) {
    return `__LIMITED__View all bookings for your events on the **Dashboard** (recent) or the **Bookings** page (full history). You can search by attendee name or event title. 🎫`
  }
  if (msg.includes('ai') || msg.includes('insight') || msg.includes('description')) {
    return `__LIMITED__Use **AI Insights** on the Dashboard to get smart performance recommendations. The **Create Event** wizard also has an AI description generator and category suggester. ✨`
  }
  return `__LIMITED__I can help with creating events, understanding approvals, managing bookings, and using AI features. What do you need help with? 🎪`
}

export async function getAIChatResponse(userMessage, userRole = 'organizer', userName = '') {
  try {
    const systemPrompt = userRole === 'organizer'
      ? `You are EventSphere's helpful AI assistant for event organizers. You help organizers create events (5-step wizard: title/category → AI suggestions → date/venue/capacity → pricing → terms), understand the approval process (events reviewed by admin: pending, approved, changes-requested, or rejected), view bookings, manage their wallet balance, and use AI features (AI description generator, AI category suggestions, AI insights panel). Keep all responses professional, concise, and under 100 words. The organizer's name is: ${userName || 'Organizer'}.`
      : `You are EventSphere's helpful AI assistant for event attendees. Help users discover events, book tickets, manage bookings, and use platform features. Keep responses friendly and concise, under 100 words.`
    return await callClaude({ systemPrompt, userMessage, maxTokens: 200 })
  } catch (err) {
    console.error('getAIChatResponse error:', err)
    return getOrganizerFallback(userMessage)
  }
}

