/**
 * CareerMatchRanking — uses real career match data from AI
 */
import { motion } from 'framer-motion'

const COLORS = ['#818cf8','#60a5fa','#34d399','#fbbf24','#a78bfa','#f87171']

const STATIC_MATCHES = [
  { role:'Full Stack Engineer', matchScore:0, color:'#818cf8' },
  { role:'Frontend Developer',  matchScore:0, color:'#60a5fa' },
  { role:'Backend Developer',   matchScore:0, color:'#34d399' },
  { role:'Data Analyst',        matchScore:0, color:'#fbbf24' },
  { role:'ML Engineer',         matchScore:0, color:'#a78bfa' },
  { role:'Cybersecurity',       matchScore:0, color:'#f87171' },
]

export default function CareerMatchRanking({ matches = [] }) {
  const display = matches.length
    ? matches.slice(0, 6).map((m, i) => ({ ...m, role: m.role || m.title, color: COLORS[i % COLORS.length] }))
    : STATIC_MATCHES

  return (
    <div className="space-y-3">
      {display.map((m, i) => (
        <motion.div key={m.role || i}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08, duration: 0.5 }}
          className="group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-4 font-mono">{i + 1}</span>
              <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">{m.role}</span>
            </div>
            <span className="text-sm font-bold" style={{ color: m.color }}>{m.matchScore}%</span>
          </div>
          <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <motion.div className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: `linear-gradient(to right, ${m.color}99, ${m.color})` }}
              initial={{ width: 0 }}
              animate={{ width: `${m.matchScore}%` }}
              transition={{ duration: 1.2, delay: i * 0.1 + 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          </div>
        </motion.div>
      ))}
      {matches.length === 0 && (
        <p className="text-xs text-slate-700 text-center py-2">Add skills to see career matches</p>
      )}
    </div>
  )
}
