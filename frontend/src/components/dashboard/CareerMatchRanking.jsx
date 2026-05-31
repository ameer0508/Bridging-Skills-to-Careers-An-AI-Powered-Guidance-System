/**
 * CareerMatchRanking — Animated live career probability ranking
 */
import { motion } from 'framer-motion'

const MATCHES = [
  { role: 'Full Stack Engineer',    score: 87, color: '#818cf8', delta: '+3%' },
  { role: 'Frontend Developer',     score: 82, color: '#60a5fa', delta: '+1%' },
  { role: 'Backend Developer',      score: 79, color: '#34d399', delta: '+5%' },
  { role: 'Data Analyst',           score: 71, color: '#fbbf24', delta: '+2%' },
  { role: 'ML Engineer',            score: 64, color: '#a78bfa', delta: '+8%' },
  { role: 'Cybersecurity Analyst',  score: 58, color: '#f87171', delta: '+1%' },
]

export default function CareerMatchRanking() {
  return (
    <div className="space-y-3">
      {MATCHES.map((m, i) => (
        <motion.div key={m.role}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08, duration: 0.5 }}
          className="group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-4 font-mono">{i + 1}</span>
              <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">{m.role}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400 font-medium">{m.delta}</span>
              <span className="text-sm font-bold" style={{ color: m.color }}>{m.score}%</span>
            </div>
          </div>
          <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: `linear-gradient(to right, ${m.color}99, ${m.color})` }}
              initial={{ width: 0 }}
              animate={{ width: `${m.score}%` }}
              transition={{ duration: 1.2, delay: i * 0.1 + 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
            {/* Shimmer */}
            <motion.div
              className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ left: '-10%' }}
              animate={{ left: '110%' }}
              transition={{ duration: 1.5, delay: i * 0.1 + 1, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  )
}
