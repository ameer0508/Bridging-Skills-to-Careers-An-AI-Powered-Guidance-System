/**
 * AIAssistant — Floating AI copilot chat panel
 * Premium chat interface with pre-built career Q&A responses.
 */
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, X, Minimize2, Maximize2 } from 'lucide-react'

const QUICK_PROMPTS = [
  'What should I learn next?',
  'How do I improve my resume?',
  'What jobs match my skills?',
  'Show my skill gaps',
]

const AI_RESPONSES = {
  'what should i learn next': 'Based on your profile, **System Design** is your highest-impact next skill. It appears in 94% of Senior Full Stack Engineer job descriptions and will boost your match score by ~15%. I recommend starting with "Grokking System Design" on Educative.',
  'how do i improve my resume': 'Your resume is missing **project evidence**. Employers want to see real-world impact. Add 2–3 portfolio projects with measurable outcomes (e.g., "Built a React app serving 500+ users"). This alone increases interview callbacks by 3x.',
  'what jobs match my skills': 'Your top career matches right now:\n\n• **Full Stack Engineer** — 87% match\n• **Frontend Developer** — 82% match\n• **Backend Developer** — 79% match\n\nFocus on closing the TypeScript and System Design gaps to push Full Stack to 95%+.',
  'show my skill gaps': 'Your critical skill gaps for Senior Full Stack Engineer:\n\n1. **TypeScript** — Gap: 40% (High priority)\n2. **System Design** — Gap: 55% (High priority)\n3. **Machine Learning** — Gap: 70% (Medium)\n4. **AWS/Cloud** — Gap: 65% (Medium)\n\nClosing gaps 1 & 2 alone will increase your readiness from 73% to ~88%.',
  default: 'Great question! Based on your current profile and career goals, I\'d recommend focusing on your top skill gaps first. Your readiness score is 73% — you\'re closer than you think. Would you like me to generate a specific action plan?',
}

function getResponse(input) {
  const lower = input.toLowerCase()
  for (const [key, val] of Object.entries(AI_RESPONSES)) {
    if (key !== 'default' && lower.includes(key.split(' ')[0])) return val
  }
  return AI_RESPONSES.default
}

function formatMessage(text) {
  return text.split('\n').map((line, i) => {
    const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
    return <p key={i} className={line === '' ? 'h-2' : 'text-xs text-slate-300 leading-relaxed'} dangerouslySetInnerHTML={{ __html: formatted }} />
  })
}

export default function AIAssistant({ collapsed, onToggle }) {
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', text: "Hi! I'm your AI career mentor. I have full visibility into your profile, skills, and goals. Ask me anything about your career journey." }
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setMessages(m => [...m, { id: Date.now(), role: 'user', text: msg }])
    setThinking(true)
    setTimeout(() => {
      setMessages(m => [...m, { id: Date.now() + 1, role: 'ai', text: getResponse(msg) }])
      setThinking(false)
    }, 900 + Math.random() * 600)
  }

  if (collapsed) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}
      >
        <Sparkles size={22} className="text-white" />
        <motion.div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#0a0a0f] flex items-center justify-center"
          animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      className="flex flex-col h-full"
      style={{ background: 'rgba(8,8,18,0.98)', borderLeft: '1px solid rgba(99,102,241,0.15)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Sparkles size={14} className="text-white" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#080812]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">AI Career Mentor</p>
            <p className="text-xs text-emerald-400">Online · Analyzing your profile</p>
          </div>
        </div>
        <button onClick={onToggle} className="text-slate-600 hover:text-slate-300 transition-colors cursor-pointer p-1">
          <Minimize2 size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((msg) => (
          <motion.div key={msg.id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'ai' && (
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mr-2 mt-0.5"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                <Sparkles size={10} className="text-white" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-3 py-2.5 ${
              msg.role === 'user'
                ? 'rounded-tr-sm text-white text-xs'
                : 'rounded-tl-sm'
            }`}
              style={msg.role === 'user'
                ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }
              }
            >
              {msg.role === 'ai' ? formatMessage(msg.text) : <p className="text-xs">{msg.text}</p>}
            </div>
          </motion.div>
        ))}

        {thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <Sparkles size={10} className="text-white" />
            </div>
            <div className="flex gap-1 px-3 py-2.5 rounded-2xl rounded-tl-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                  transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto">
        {QUICK_PROMPTS.map(p => (
          <button key={p} onClick={() => send(p)}
            className="flex-shrink-0 text-xs px-2.5 py-1.5 rounded-xl cursor-pointer transition-all whitespace-nowrap"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
          >{p}</button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask your AI mentor..."
            className="flex-1 text-xs text-slate-200 placeholder-slate-700 px-3 py-2.5 rounded-xl focus:outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => send()}
            disabled={!input.trim() || thinking}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-40 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Send size={13} className="text-white" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
