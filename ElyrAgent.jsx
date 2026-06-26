import { useState, useRef, useEffect } from 'react'
import api from '../utils/api'
import { Bot, Send, User, Sparkles, RefreshCw } from 'lucide-react'

export default function ElyrAgent() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm **Elyra**, your AI Finance Agent for Future Optima IT Solutions.\n\nI have real-time access to your financial data. Ask me anything:\n- \"What's today's collection?\"\n- \"Who hasn't paid this month?\"\n- \"Show me June P&L\"\n- \"Which course generates the most revenue?\"\n- \"How many overdue installments are there?\"" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const { data } = await api.post('/ai/chat', {
        messages: [...messages, userMsg].filter(m => m.role !== 'system')
      })
      setMessages(m => [...m, { role: 'assistant', content: data.response }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally { setLoading(false) }
  }

  const QUICK = [
    "What's today's total collection?",
    "Show me overdue installments",
    "Who has the highest outstanding balance?",
    "Give me this month's P&L summary",
    "Which course has the most students?",
  ]

  const renderContent = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <Bot size={22} className="text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Elyra AI</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <p className="text-dark-400 text-xs">Live financial data · Llama 3.1 70B</p>
            </div>
          </div>
        </div>
        <button onClick={() => setMessages([{ role: 'assistant', content: "Hi! I'm **Elyra**. How can I help with your finances today?" }])}
          className="btn-secondary text-xs">
          <RefreshCw size={13} /> Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-brand-500/20' : 'bg-dark-800 border border-dark-600'}`}>
              {msg.role === 'user' ? <User size={15} className="text-brand-400" /> : <Bot size={15} className="text-brand-400" />}
            </div>
            <div className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
              ? 'bg-brand-500/20 text-dark-100 border border-brand-500/30 rounded-tr-sm'
              : 'bg-dark-800 text-dark-200 border border-dark-700 rounded-tl-sm'}`}
              dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
            />
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-dark-800 border border-dark-600 flex items-center justify-center">
              <Bot size={15} className="text-brand-400" />
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK.map(q => (
            <button key={q} onClick={() => { setInput(q) }}
              className="text-xs px-3 py-1.5 bg-dark-800 border border-dark-600 rounded-lg text-dark-300 hover:text-brand-400 hover:border-brand-500/30 transition-all">
              <Sparkles size={11} className="inline mr-1" />{q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3">
        <input
          className="input flex-1"
          placeholder="Ask Elyra about your finances..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={loading}
        />
        <button onClick={send} disabled={loading || !input.trim()}
          className="btn-primary px-5">
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
