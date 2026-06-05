import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Sparkles, Bot, Minus } from 'lucide-react'
import { getAIChatResponse } from '../ai/claudeAI'
import { useAuth } from '../context/AuthContext'

const QUICK_REPLIES = [
  { label: '🎪 Create event', text: 'How do I create an event?' },
  { label: '💰 View earnings', text: 'How can I view my earnings and wallet?' },
  { label: '📋 Booking status', text: 'How do I view my bookings?' },
  { label: '🤖 AI features', text: 'What AI features are available?' },
]

function matchOrganizerKeyword(msg) {
  const m = msg.toLowerCase()
  if (m.includes('create event') || m.includes('how to create') || m.includes('new event') || m.includes('publish event') || m.includes('add event')) {
    return `Here's how to create an event 🎪\n\n**Step 1** — Enter your event title and category\n**Step 2** — Review the AI category suggestions and scores\n**Step 3** — Add date, venue, city, and capacity\n**Step 4** — Set your pricing and submit for admin review\n\nTip: Use the **AI Description Generator** in Step 1 to create a compelling description automatically!`
  }
  if (m.includes('approval') || m.includes('review process') || m.includes('pending') || m.includes('how long') || m.includes('admin')) {
    return `Event Approval Process 📋\n\nAfter submitting, your event goes to the admin team for review:\n\n• **Pending** — Under review\n• **Approved** — Live and bookable 🎉\n• **Changes Requested** — Admin has feedback for you\n• **Rejected** — With reason provided\n\nYou'll receive a notification at each stage. Most events are reviewed within 24 hours!`
  }
  if (m.includes('earning') || m.includes('revenue') || m.includes('money') || m.includes('payment') || m.includes('income') || m.includes('how much do i get')) {
    return `Check your **Wallet** page from the navbar to see your current balance, transaction history, and all earnings from ticket sales. 💰`
  }
  if (m.includes('booking') || m.includes('view booking') || m.includes('see booking') || m.includes('my booking') || m.includes('attendee list')) {
    return `Viewing Your Bookings 📊\n\nGo to the **Bookings** section in your dashboard or click **Bookings** in the navbar.\n\nYou'll see:\n• All attendees who booked your events\n• Booking dates and amounts\n• Attendee contact details\n• Real-time updates as new bookings come in!`
  }
  if (m.includes('wallet') || m.includes('balance') || m.includes('withdraw') || m.includes('credit')) {
    return `Your Wallet 💳\n\nAll earnings are credited **instantly** to your wallet when a ticket is sold!\n\n• Visit the **Wallet** page from the navbar\n• See your total balance and transaction history\n• Every transaction shows the event, amount, and timestamp\n\nWithdrawals can be processed to your bank account from the Wallet page.`
  }
  if (m.includes('ai') || m.includes('artificial intelligence') || m.includes('smart') || m.includes('description generator') || m.includes('insights')) {
    return `AI Features on EventSphere 🤖\n\n**1. AI Description Generator** — In Step 1 of event creation, click "Generate with AI" to auto-create a compelling event description\n\n**2. AI Category Suggestions** — Step 2 shows AI-powered category fit scores for your event\n\n**3. AI Insights Panel** — On your Dashboard, get personalized marketing tips based on your event performance data!`
  }
  if (m.includes('hello') || m.includes('hi') || m.includes('hey') || m.includes('help')) {
    return `Hello! I'm your EventSphere organizer assistant 👋\n\nI can help you:\n• 🎪 Create events step-by-step\n• 📋 Understand the approval process\n• 💰 Track earnings and wallet\n• 🤖 Use AI features effectively\n\nWhat would you like to know?`
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
      text: `Hi ${userName}! 👋 I'm your EventSphere organizer assistant.\n\nI can help you create events, understand the approval process, track your earnings, and use AI features. What would you like to know?`,
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
      const keywordReply = matchOrganizerKeyword(trimmed)
      if (keywordReply) {
        await new Promise(r => setTimeout(r, 600))
        setMessages(prev => [...prev, { role: 'assistant', text: keywordReply, time: new Date() }])
      } else {
        const reply = await getAIChatResponse(trimmed, 'organizer', userName)
        const isLimited = reply.startsWith('__LIMITED__')
        const cleanText = isLimited ? reply.replace('__LIMITED__', '') : reply
        setMessages(prev => [...prev, { role: 'assistant', text: cleanText, limited: isLimited, time: new Date() }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I'm having trouble right now. Please try again!", time: new Date() }])
    } finally {
      setIsTyping(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function renderText(text) {
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
      <button
        id="chatbot-toggle-btn"
        className="chatbot-fab smart-chatbot-fab"
        onClick={() => { setIsOpen(v => !v); setIsMinimized(false) }}
        aria-label="Open AI Chat"
        title="Ask me anything"
      >
        {isOpen ? <X size={22} /> : (
          <span className="chatbot-fab-icons">
            <Sparkles size={14} className="chatbot-fab-sparkle" />
            <MessageCircle size={20} />
          </span>
        )}
      </button>

      <div className={`chatbot-panel smart-chatbot-panel ${isOpen && !isMinimized ? 'open' : ''}`}>
        <div className="chatbot-header smart-chatbot-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="chatbot-avatar-icon chatbot-avatar-teal">
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
            <button id="chatbot-close-btn" className="chatbot-close-btn" onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="chatbot-messages" id="chatbot-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`bubble-wrap ${msg.role === 'user' ? 'user' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="chatbot-bot-avatar chatbot-bot-avatar-teal"><Bot size={12} /></div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', maxWidth: '80%', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div className={`bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
                  {renderText(msg.text)}
                </div>
                {msg.limited && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    ⚡ AI assistant is in limited mode
                  </span>
                )}
                <span className="bubble-time">{msg.time ? formatTime(msg.time) : ''}</span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="bubble-wrap">
              <div className="chatbot-bot-avatar chatbot-bot-avatar-teal"><Bot size={12} /></div>
              <div className="bubble ai"><div className="typing-dots"><span /><span /><span /></div></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-quick-replies">
          {QUICK_REPLIES.map(qr => (
            <button key={qr.text} className="chat-quick-reply-btn chat-quick-reply-teal"
              onClick={() => sendMessage(qr.text)} disabled={isTyping}>
              {qr.label}
            </button>
          ))}
        </div>

        <div className="chatbot-input-area">
          <input ref={inputRef} id="chatbot-input" className="chatbot-input"
            placeholder="Ask me anything…" value={input}
            onChange={e => setInput(e.target.value)} onKeyDown={handleKey} disabled={isTyping} />
          <button id="chatbot-send-btn" className="chatbot-send-btn" onClick={() => sendMessage()} disabled={isTyping || !input.trim()}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </>
  )
}
