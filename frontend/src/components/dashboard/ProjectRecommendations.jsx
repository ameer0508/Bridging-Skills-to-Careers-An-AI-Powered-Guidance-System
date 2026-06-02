/**
 * ProjectRecommendations — real API-powered project suggestions
 */
import { motion } from 'framer-motion'
import { Code2, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const DIFF_COLORS = { Beginner:'#34d399', Intermediate:'#fbbf24', Advanced:'#f87171' }

export default function ProjectRecommendations({ projects = [] }) {
  const [expanded, setExpanded] = useState(null)

  if (!projects.length) return (
    <div className="text-center py-8 text-slate-600 text-sm">
      <Code2 size={24} className="mx-auto mb-2 opacity-30" />
      Complete your profile to see project recommendations.
    </div>
  )

  return (
    <div className="space-y-3">
      {projects.slice(0, 5).map((p, i) => {
        const color = DIFF_COLORS[p.difficulty] || '#818cf8'
        const isOpen = expanded === i
        return (
          <motion.div key={p.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}20` }}
          >
            <button className="w-full flex items-center gap-3 p-4 text-left cursor-pointer hover:bg-white/[0.02] transition-all"
              onClick={() => setExpanded(isOpen ? null : i)}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '15' }}>
                <Code2 size={14} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200">{p.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-medium" style={{ color }}>{p.difficulty}</span>
                  <span className="text-xs text-slate-600 flex items-center gap-1"><Clock size={9} />{p.timeWeeks}w</span>
                </div>
              </div>
              {isOpen ? <ChevronUp size={13} className="text-slate-600" /> : <ChevronDown size={13} className="text-slate-600" />}
            </button>
            {isOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0 }}
                className="px-4 pb-4 border-t space-y-3" style={{ borderColor: 'rgba(255,255,255,0.05)' }}
              >
                <div>
                  <p className="text-xs text-slate-600 mb-2">Technologies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.technologies.map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-lg" style={{ background: color + '12', color, border: `1px solid ${color}25` }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-2">Learning Outcomes</p>
                  <ul className="space-y-1">
                    {p.outcomes.map(o => (
                      <li key={o} className="flex items-center gap-2 text-xs text-slate-400">
                        <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: color }} />{o}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
