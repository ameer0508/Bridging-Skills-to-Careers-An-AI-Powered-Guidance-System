/**
 * AIAssistant — context-aware AI career mentor
 * Reads real user profile, skillGap, readiness, roadmap, jobs data
 * and generates personalized, dynamic responses.
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Minimize2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const QUICK_PROMPTS = [
  'What skills am I missing?',
  'What should I learn next?',
  'How do I improve my readiness?',
  'What jobs match my skills?',
  'Show my skill gaps',
]

function buildContext(profile, skillGap, readiness, roadmap, careerMatches, jobRecs) {
  return {
    name:         profile?.fullName || 'there',
    skills:       profile?.skills || [],
    targetRole:   profile?.targetJobRole || 'your target role',
    matchScore:   skillGap?.matchScore ?? readiness?.breakdown?.skillMatch ?? null,
    readiness:    readiness?.score ?? null,
    missingReq:   skillGap?.missingSkills?.required || skillGap?.skillGap?.missingRequired || [],
    missingOpt:   skillGap?.missingSkills?.preferred || skillGap?.skillGap?.missingOptional || [],
    nextTopic:    roadmap?.roadmap?.[0]?.topic || null,
    topJob:       careerMatches?.[0]?.role || careerMatches?.[0]?.title || null,
    topJobScore:  careerMatches?.[0]?.matchScore ?? null,
    topRec:       jobRecs?.[0]?.title || null,
    totalWeeks:   roadmap?.totalWeeks ?? null,
  }
}

function generateResponse(input, ctx) {
  const q = input.toLowerCase()

  // Missing skills
  if (q.includes('missing') && (q.includes('skill') || q.includes('gap'))) {
    if (!ctx.missingReq.length && !ctx.missingOpt.length)
      return `Great news — based on your profile, you have no critical skill gaps for ${ctx.targetRole}! Consider adding more skills to your profile for a deeper analysis.`
    const reqStr  = ctx.missingReq.slice(0, 3).join(', ')
    const optStr  = ctx.missingOpt.slice(0, 2).join(', ')
    const parts   = [`For **${ctx.targetRole}**, your critical missing skills are: **${reqStr}**`]
    if (optStr) parts.push(`Optional but valuable: ${optStr}`)
    parts.push(`Closing these gaps would bring your match score from ${ctx.matchScore ?? '?'}% to significantly higher.`)
    return parts.join('\n\n')
  }

  // What to learn next
  if (q.includes('learn next') || q.includes('what should i') || q.includes('start with')) {
    if (ctx.nextTopic)
      return `Based on your roadmap, your next focus should be **${ctx.nextTopic}**.\n\nThis is week 1 of your ${ctx.totalWeeks}-week plan for ${ctx.targetRole}. Master this before moving on — it builds the foundation for everything else.`
    if (ctx.missingReq[0])
      return `Start with **${ctx.missingReq[0]}** — it's the highest-priority missing skill for ${ctx.targetRole}. Generate your roadmap on the Roadmap page for a full week-by-week plan.`
    return `Complete your profile and run a skill gap analysis first, then I can give you a precise learning path.`
  }

  // Readiness
  if (q.includes('readiness') || q.includes('improve') || q.includes('ready')) {
    if (ctx.readiness === null)
      return `Run a skill gap analysis first to get your readiness score. Go to Skill Gap Analysis and click "Analyze Now".`
    const score = ctx.readiness
    const bd    = []
    if (score < 50) bd.push(`Your readiness is **${score}%** — there's significant room to grow.`)
    else if (score < 75) bd.push(`Your readiness is **${score}%** — you're making good progress!`)
    else bd.push(`Your readiness is **${score}%** — you're nearly ready for ${ctx.targetRole}!`)
    bd.push(`The fastest way to improve: focus on **${ctx.missingReq[0] || 'your top missing skill'}** which has the highest impact on your score.`)
    if (ctx.nextTopic) bd.push(`Your roadmap says: start with **${ctx.nextTopic}** this week.`)
    return bd.join('\n\n')
  }

  // Job matches
  if (q.includes('job') || q.includes('match') || q.includes('opport')) {
    if (ctx.topJob) {
      const lines = [`Your top career match is **${ctx.topJob}** at ${ctx.topJobScore ?? '?'}% compatibility.`]
      if (ctx.topRec) lines.push(`A real job opening that matches your profile: **${ctx.topRec}**`)
      lines.push(`Add more skills to increase your match score. Check the Job Recommendations tab for the full list.`)
      return lines.join('\n\n')
    }
    return `Add your skills on the Profile page to get personalized job matches. I'll rank every career path by your skill compatibility.`
  }

  // Skills query
  if (q.includes('my skills') || q.includes('what skills')) {
    if (!ctx.skills.length) return `I don't see any skills on your profile yet. Add them on the Profile page for personalized guidance.`
    return `You have **${ctx.skills.length} skills** on your profile:\n\n${ctx.skills.slice(0, 8).join(', ')}${ctx.skills.length > 8 ? `, and ${ctx.skills.length - 8} more` : ''}.\n\nFor ${ctx.targetRole}, you're at **${ctx.matchScore ?? '?'}% match**. Run the Skill Gap Analysis to see exactly what's missing.`
  }

  // Roadmap
  if (q.includes('roadmap') || q.includes('plan') || q.includes('weeks')) {
    if (ctx.totalWeeks)
      return `Your personalized roadmap has **${ctx.totalWeeks} weeks** of content for ${ctx.targetRole}.\n\nWeek 1 starts with **${ctx.nextTopic}**. Each week builds on the previous — follow the sequence on the Roadmap page for best results.`
    return `Generate your roadmap on the Roadmap page. Based on your skills, I'll create a week-by-week learning plan targeting ${ctx.targetRole}.`
  }

  // Greeting
  if (q.includes('hello') || q.includes('hi') || q.includes('hey'))
    return `Hi ${ctx.name}! I'm your AI career mentor with full access to your profile data.\n\nYou're targeting **${ctx.targetRole}** and currently at **${ctx.readiness ?? '?'}% readiness**. Ask me anything about your skills, gaps, roadmap, or job matches.`

  // Default — contextual
  return `Based on your profile, here's my assessment:\n\n` +
    `• **Target role:** ${ctx.targetRole}\n` +
    `• **Skills:** ${ctx.skills.length} added\n` +
    `• **Match score:** ${ctx.matchScore ?? 'Not analyzed'}%\n` +
    `• **Readiness:** ${ctx.readiness ?? 'Not analyzed'}%\n` +
    (ctx.missingReq[0] ? `• **Top priority:** Learn ${ctx.missingReq[0]}\n` : '') +
    `\nTry asking: "What skills am I missing?" or "What should I learn next?"`
}

function formatMessage(text) {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-1.5" />
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (
      <p key={i} className="text-xs text-slate-300 leading-relaxed">
        {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part)}
      </p>
    )
  })
}

export default function AIAssistant({ collapsed, onToggle }) {
  const { profile, skillGap, readiness, roadmap, careerMatches, jobRecs } = useApp()
  const ctx = buildContext(profile, skillGap, readiness, roadmap, careerMatches, jobRecs)

  const [messages, setMessages] = useState([{
    id: 1, role: 'ai',
    text: `Hi ${ctx.name || 'there'}! I'm your AI career mentor with access to your real profile data.\n\nAsk me about your skill gaps, learning path, job matches, or readiness score.`,
  }])
  const [input, setInput]     = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef()

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = useCallback((text) => {
    const msg = (text || input).trim()
    if (!msg) return
    setInput('')
    setMessages(m => [...m, { id: Date.now(), role: 'user', text: msg }])
    setThinking(true)
    // Slight delay to feel natural
    setTimeout(() => {
      const response = generateResponse(msg, ctx)
      setMessages(m => [...m, { id: Date.now() + 1, role: 'ai', text: response }])
      setThinking(false)
    }, 500 + Math.random() * 400)
  }, [input, ctx])

  if (collapsed) {
    return (
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}
      >
        <Sparkles size={22} className="text-white" />
        <motion.div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#0a0a0f]"
          animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.button>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }}
      className="flex flex-col h-full"
      style={{ background: 'rgba(8,8,18,0.98)', borderLeft: '1px solid rgba(99,102,241,0.15)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Sparkles size={14} className="text-white" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#080812]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">AI Career Mentor</p>
            <p className="text-xs text-emerald-400">
              {ctx.readiness !== null ? `${ctx.readiness}% readiness · Live` : 'Analyzing your profile'}
            </p>
          </div>
        </div>
        <button onClick={onToggle} className="text-slate-600 hover:text-slate-300 cursor-pointer p-1">
          <Minimize2 size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map(msg => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'ai' && (
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mr-2 mt-0.5"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                <Sparkles size={10} className="text-white" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-3 py-2.5 ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
              style={msg.role === 'user'
                ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }
              }
            >
              {msg.role === 'ai'
                ? <div className="space-y-1">{formatMessage(msg.text)}</div>
                : <p className="text-xs text-white">{msg.text}</p>
              }
            </div>
          </motion.div>
        ))}

        {thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Sparkles size={10} className="text-white" />
            </div>
            <div className="flex gap-1 px-3 py-2.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                  animate={{ opacity: [0.3,1,0.3], y: [0,-3,0] }}
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
          >{p}</button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask your AI mentor..."
            className="flex-1 text-xs text-slate-200 placeholder-slate-700 px-3 py-2.5 rounded-xl focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => send()}
            disabled={!input.trim() || thinking}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Send size={13} className="text-white" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
