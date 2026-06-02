import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Sparkles, Bot, Minus } from 'lucide-react'
import { getAIChatResponse } from '../ai/claudeAI'
import { useAuth } from '../context/AuthContext'

const QUICK_REPLIES = [
  { label: '🎟️ How to book', text: 'How do I book a ticket?' },
  { label: '📋 My tickets', text: 'Where can I see my tickets?' },
  { label: '💳 Payment info', text: 'What are the payment fees?' },
  { label: '🔍 Find events', text: 'How do I find events by category?' },
]

function matchAttendeeKeyword(msg) {
  const m = msg.toLowerCase()
  if (m.includes('how to book') || m.includes('book a ticket') || m.includes('how do i book') || m.includes('booking process')) {
    return `Here's how to book a ticket on EventSphere 🎟️\n\n1️⃣ Browse events on the **Discover** feed\n2️⃣ Click on an event you like\n3️⃣ Click the **Book Now** button\n4️⃣ Review the payment breakdown (10% platform fee, 90% to organizer)\n5️⃣ Click **Pay Now** and complete payment via Razorpay\n6️⃣ Your ticket with QR code is generated instantly and sent to your email!`
  }
  if (m.includes('my ticket') || m.includes('see my ticket') || m.includes('view ticket') || m.includes('where are my ticket')) {
    return `You can find all your tickets on the **My Tickets** page 🎫\n\nEach ticket shows a QR code you can use at the venue. You can also download or print any ticket from there!`
  }
  if (m.includes('payment fee') || m.includes('platform fee') || m.includes('how much fee') || m.includes('fee breakdown') || m.includes('payment info')) {
    return `EventSphere's payment breakdown 💳\n\n• **Platform Fee**: 10% of ticket price\n• **Organizer Receives**: 90% instantly\n\nFor example, on a ₹1,000 ticket:\n• EventSphere earns ₹100\n• Organizer earns ₹900`
  }
  if (m.includes('category') || m.includes('find event') || m.includes('filter') || m.includes('search') || m.includes('browse')) {
    return `Finding events is easy! 🔍\n\n• Use the **category tabs** (Tech, Art, Fitness, Cultural, etc.) on the Discover page\n• Use the **search bar** to search by event name\n• Use the **city filter** to find events near you\n• Scroll the **Trending** section for popular events!`
  }
  if (m.includes('cancel') || m.includes('refund') || m.includes('cancellation')) {
    return `For cancellations and refunds 📝\n\nCurrently, tickets are non-refundable once booked. If you have a special circumstance, please contact our support team at support@eventsphere.in and we'll do our best to help you!`
  }
  if (m.includes('wishlist') || m.includes('heart') || m.includes('save event') || m.includes('favourite') || m.includes('favorite')) {
    return `To save events to your wishlist ❤️\n\nClick the **heart icon** on any event card or event detail page. Visit your **Wishlist** from the navbar to see all saved events anytime!`
  }
  if (m.includes('qr') || m.includes('qr code') || m.includes('scan') || m.includes('entry')) {
    return `Your QR code is your entry pass! 📱\n\nAfter booking, find your QR code in **My Tickets**. Show it at the venue entrance for scanning. You can also download the ticket as a PNG image or print it!`
  }
  if (m.includes('organizer') || m.includes('contact organizer')) {
    return `Each event page shows the **Organizer Name**. For event-specific queries, look for contact details in the event description. For platform issues, reach us at support@eventsphere.in 📧`
  }
  if (m.includes('hello') || m.includes('hi') || m.includes('hey') || m.includes('help')) {
    return `Hello! I'm EventSphere's AI assistant 👋\n\nI can help you:\n• 🎟️ Book tickets step-by-step\n• 🔍 Find events by category or city\n• 💳 Understand payment fees\n• 📋 Manage your tickets & wishlist\n\nWhat would you like to know?`
  }
  return null
}

function formatTime(date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const { currentUser } = useAuth()
  const userName = currentUser?.name?.split(' ')[0] || 'there'
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hi ${userName}! 👋 I'm EventSphere's AI assistant.\n\nI can help you discover events, book tickets, check your bookings, and answer any platform questions. What's on your mind?`,
      time: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, isMinimized, messages])

  async function sendMessage(text) {
    const trimmed = (text || input).trim()
    if (!trimmed || isTyping) return

    const userMsg = { role: 'user', text: trimmed, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      // Try keyword match first (instant, no API call)
      const keywordReply = matchAttendeeKeyword(trimmed)
      if (keywordReply) {
        await new Promise(r => setTimeout(r, 600)) // natural delay
        setMessages(prev => [...prev, { role: 'assistant', text: keywordReply, time: new Date() }])
      } else {
        const reply = await getAIChatResponse(trimmed, 'attendee', userName)
        setMessages(prev => [...prev, { role: 'assistant', text: reply, time: new Date() }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I'm having trouble right now. Please try again in a moment!", time: new Date() }])
    } finally {
      setIsTyping(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function renderText(text) {
    // Bold markdown **text**
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={j}>{part.slice(2, -2)}</strong>
            : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  return (
    <>
      {/* FAB Button */}
      <button
        id="chatbot-toggle-btn"
        className="chatbot-fab smart-chatbot-fab"
        onClick={() => { setIsOpen(v => !v); setIsMinimized(false) }}
        title="Ask me anything"
        aria-label="Open AI Chat Assistant"
      >
        {isOpen ? <X size={22} /> : (
          <span className="chatbot-fab-icons">
            <Sparkles size={14} className="chatbot-fab-sparkle" />
            <MessageCircle size={20} />
          </span>
        )}
      </button>

      {/* Chat Panel */}
      <div className={`chatbot-panel smart-chatbot-panel ${isOpen && !isMinimized ? 'open' : ''}`}>
        {/* Header */}
        <div className="chatbot-header smart-chatbot-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="chatbot-avatar-icon">
              <Sparkles size={14} />
            </div>
            <div>
              <div className="chatbot-header-title">EventSphere AI Assistant</div>
              <div className="chatbot-online-status">
                <span className="chatbot-online-dot" />
                Online
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button className="chatbot-close-btn" onClick={() => setIsMinimized(v => !v)} title="Minimize">
              <Minus size={14} />
            </button>
            <button id="chatbot-close-btn" className="chatbot-close-btn" onClick={() => setIsOpen(false)} title="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chatbot-messages" id="chatbot-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`bubble-wrap ${msg.role === 'user' ? 'user' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="chatbot-bot-avatar">
                  <Bot size={12} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', maxWidth: '80%', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div className={`bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
                  {renderText(msg.text)}
                </div>
                <span className="bubble-time">{msg.time ? formatTime(msg.time) : ''}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="bubble-wrap">
              <div className="chatbot-bot-avatar"><Bot size={12} /></div>
              <div className="bubble ai">
                <div className="typing-dots"><span /><span /><span /></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        <div className="chat-quick-replies">
          {QUICK_REPLIES.map(qr => (
            <button
              key={qr.text}
              className="chat-quick-reply-btn"
              onClick={() => sendMessage(qr.text)}
              disabled={isTyping}
            >
              {qr.label}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="chatbot-input-area">
          <input
            ref={inputRef}
            id="chatbot-input"
            className="chatbot-input"
            placeholder="Type your message…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={isTyping}
          />
          <button
            id="chatbot-send-btn"
            className="chatbot-send-btn"
            onClick={() => sendMessage()}
            disabled={isTyping || !input.trim()}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </>
  )
}
