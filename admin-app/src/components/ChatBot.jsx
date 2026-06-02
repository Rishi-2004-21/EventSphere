import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, ShieldAlert } from 'lucide-react'
import { getAIChatResponse } from '../ai/claudeAI'
import { useAuth } from '../context/AuthContext'

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const { currentUser } = useAuth()
  const userRole = currentUser?.role || 'admin'
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "System initialized. I'm your Admin AI Assistant. I can help with moderation policies, data querying, and platform management. How can I assist you today?" },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, messages])

  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed || isTyping) return
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }])
    setInput('')
    setIsTyping(true)
    try {
      const reply = await getAIChatResponse(trimmed, userRole)
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: "System diagnostic error. Cannot connect to intelligence node." }])
    } finally {
      setIsTyping(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <>
      <button id="chatbot-toggle-btn" className="chatbot-fab" onClick={() => setIsOpen((v) => !v)} aria-label="Open AI Chat">
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
      <div className={`chatbot-panel ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={16} style={{ color: 'var(--accent)' }} />
            <span className="chatbot-header-title">Admin AI Assistant</span>
          </div>
          <button id="chatbot-close-btn" className="chatbot-close-btn" onClick={() => setIsOpen(false)}><X size={16} /></button>
        </div>
        <div className="chatbot-messages" id="chatbot-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`bubble-wrap ${msg.role === 'user' ? 'user' : ''}`}>
              <div className={`bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>{msg.text}</div>
            </div>
          ))}
          {isTyping && (
            <div className="bubble-wrap">
              <div className="bubble ai"><div className="typing-dots"><span /><span /><span /></div></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chatbot-input-area">
          <input ref={inputRef} id="chatbot-input" className="chatbot-input" placeholder="Query system..."
            value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} disabled={isTyping} />
          <button id="chatbot-send-btn" className="chatbot-send-btn" onClick={sendMessage} disabled={isTyping || !input.trim()}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </>
  )
}
