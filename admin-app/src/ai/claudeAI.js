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
      'X-Title': 'Tixque',
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

export async function getAIPlatformInsights({ totalRev, activeEvents, totalUsers }) {
  try {
    return await callClaude({
      maxTokens: 400,
      userMessage: `You are an expert platform analyst for an event ticketing platform. Here are the current platform metrics:\n- Total Platform Revenue (10% fee collected): ₹${totalRev?.toLocaleString('en-IN') || 0}\n- Active Events (approved & live): ${activeEvents}\n- Total Registered Users: ${totalUsers}\n\nProvide exactly 3 specific, actionable admin insights as numbered points with bold titles. Focus on platform health, growth opportunities, and risk signals.`,
    })
  } catch (err) {
    console.error('getAIPlatformInsights error:', err)
    return `**1. Platform Revenue Health**\nReview the 10% fee collection rate against active events to ensure healthy margins.\n\n**2. Event Approval Bottleneck**\nFast-track pending event approvals to keep organizers engaged and reduce churn.\n\n**3. User Growth Opportunity**\nConsider referral incentives or city-specific campaigns to increase user acquisition.`
  }
}

export async function getAIChatResponse(userMessage, userRole = 'attendee') {
  try {
    const systemPrompt = `You are Tixque's helpful AI assistant. Answer questions about events, booking, and the platform. Keep responses concise. The user's role is: ${userRole}.`
    return await callClaude({ systemPrompt, userMessage, maxTokens: 200 })
  } catch (err) {
    console.error('getAIChatResponse error:', err)
    return "I'm having trouble connecting right now. Please try again in a moment!"
  }
}
