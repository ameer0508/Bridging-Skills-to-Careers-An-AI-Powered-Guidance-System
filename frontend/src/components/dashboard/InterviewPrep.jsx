/**
 * InterviewPrep — uses real interview questions from AI
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, Brain, Code2, MessageSquare, TrendingUp, Play, ChevronDown, ChevronUp } from 'lucide-react'

const CAT_COLORS = { Easy:'#34d399', Medium:'#fbbf24', Hard:'#f87171' }

export default function InterviewPrep({ questions = [], targetRole = '' }) {
  const [started, setStarted] = useState(false)
  const [expanded, setExpanded] = useState(null)

  const overall = questions.length
    ? Math.round(40 + (questions.length / 10) * 60)
    : 0

  return (
    <div className="space-y-4">
      {/* Confidence meter */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
            <motion.circle cx="30" cy="30" r="24" fill="none" stroke="#818cf8" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 24}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - overall / 100) }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
              style={{ filter: 'drop-shadow(0 0 4px #818cf8)' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-white">{overall}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200">Interview Confidence</p>
          <p className="text-xs text-slate-500 mt-0.5">{targetRole || 'Set target role'}</p>
          <p className="text-xs text-slate-600 mt-1">{questions.length} questions ready</p>
        </div>
      </div>

      {/* Questions list */}
      {questions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">Sample Questions</p>
          {questions.slice(0, 3).map((q, i) => {
            const color = CAT_COLORS[q.difficulty] || '#818cf8'
            const isOpen = expanded === i
            return (
              <div key={q.id || i} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <button className="w-full flex items-center gap-2 p-3 text-left cursor-pointer" onClick={() => setExpanded(isOpen ? null : i)}>
                  <span className="text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0" style={{ background: color + '15', color }}>{q.difficulty}</span>
                  <span className="text-xs text-slate-400 flex-1 truncate">{q.question}</span>
                  {isOpen ? <ChevronUp size={11} className="text-slate-600 flex-shrink-0" /> : <ChevronDown size={11} className="text-slate-600 flex-shrink-0" />}
                </button>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    className="px-3 pb-3 border-t text-xs text-slate-300 leading-relaxed"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <p className="pt-2">{q.question}</p>
                  </motion.div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
        onClick={() => setStarted(s => !s)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm cursor-pointer transition-all"
        style={started
          ? { background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }
          : { background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }
        }
      >
        {started ? <><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />Session Active</> : <><Play size={14} />Start Mock Interview</>}
      </motion.button>
    </div>
  )
}
