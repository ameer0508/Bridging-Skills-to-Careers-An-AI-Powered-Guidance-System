/**
 * InterviewPrep — Interview readiness section with confidence meter
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, Brain, Code2, MessageSquare, TrendingUp, Play } from 'lucide-react'

const CATEGORIES = [
  { label: 'Data Structures',  score: 72, icon: Code2,         color: '#818cf8' },
  { label: 'System Design',    score: 45, icon: Brain,         color: '#fbbf24' },
  { label: 'Behavioral',       score: 80, icon: MessageSquare, color: '#34d399' },
  { label: 'Problem Solving',  score: 63, icon: TrendingUp,    color: '#a78bfa' },
]

export default function InterviewPrep() {
  const [started, setStarted] = useState(false)
  const overall = Math.round(CATEGORIES.reduce((s, c) => s + c.score, 0) / CATEGORIES.length)

  return (
    <div className="space-y-4">
      {/* Confidence meter */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
            <motion.circle cx="30" cy="30" r="24" fill="none"
              stroke="#818cf8" strokeWidth="5" strokeLinecap="round"
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
          <p className="text-xs text-slate-500 mt-0.5">Based on your skill profile</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-xs text-amber-400">System Design needs work</span>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-2 gap-2">
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon
          return (
            <motion.div key={cat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl p-3"
              style={{ background: cat.color + '08', border: `1px solid ${cat.color}18` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={12} style={{ color: cat.color }} />
                <span className="text-xs text-slate-400 font-medium">{cat.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <motion.div className="h-full rounded-full" style={{ background: cat.color }}
                    initial={{ width: 0 }} animate={{ width: `${cat.score}%` }}
                    transition={{ duration: 1, delay: i * 0.1 + 0.5 }}
                  />
                </div>
                <span className="text-xs font-bold" style={{ color: cat.color }}>{cat.score}%</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Mock interview CTA */}
      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setStarted(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm cursor-pointer transition-all"
        style={{
          background: started ? 'rgba(52,211,153,0.1)' : 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
          border: started ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(99,102,241,0.3)',
          color: started ? '#34d399' : '#818cf8',
        }}
      >
        {started ? (
          <><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Session Active</>
        ) : (
          <><Play size={14} /> Start Mock Interview</>
        )}
      </motion.button>
    </div>
  )
}
