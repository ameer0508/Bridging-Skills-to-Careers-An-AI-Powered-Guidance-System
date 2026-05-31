/**
 * AIInsightsPanel — Dynamic AI recommendation cards
 * Each insight is actionable and animated.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, TrendingUp, AlertTriangle, BookOpen, Target, X, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const INSIGHTS = [
  {
    id: 1, type: 'opportunity', icon: TrendingUp, color: '#34d399',
    title: 'React boosts your match by 12%',
    body: 'Adding React to your profile unlocks 14 additional job opportunities in your target role.',
    action: 'Start Learning', route: '/resources',
  },
  {
    id: 2, type: 'gap', icon: AlertTriangle, color: '#fbbf24',
    title: 'Resume lacks project evidence',
    body: 'Employers want to see real projects. Adding 2–3 portfolio projects increases interview callbacks by 3x.',
    action: 'Update Resume', route: '/resume',
  },
  {
    id: 3, type: 'skill', icon: BookOpen, color: '#818cf8',
    title: 'SQL fundamentals unlock 8 roles',
    body: 'Completing SQL basics opens Data Analyst, Backend Dev, and BI Analyst career paths.',
    action: 'View Roadmap', route: '/roadmap',
  },
  {
    id: 4, type: 'goal', icon: Target, color: '#a78bfa',
    title: 'You\'re 27% from your target role',
    body: 'Focus on System Design this week. It\'s the highest-impact skill gap for Senior Full Stack Engineer.',
    action: 'Analyze Gap', route: '/skill-gap',
  },
]

export default function AIInsightsPanel() {
  const [dismissed, setDismissed] = useState([])
  const navigate = useNavigate()
  const visible = INSIGHTS.filter(i => !dismissed.includes(i.id))

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <Sparkles size={14} className="text-indigo-400" />
        </motion.div>
        <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">AI Insights</span>
        <div className="ml-auto flex items-center gap-1.5">
          <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-xs text-emerald-500">Live</span>
        </div>
      </div>

      <AnimatePresence>
        {visible.map((insight, i) => {
          const Icon = insight.icon
          return (
            <motion.div key={insight.id}
              layout
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="relative rounded-2xl p-4 group"
              style={{ background: insight.color + '08', border: `1px solid ${insight.color}20` }}
            >
              {/* Dismiss */}
              <button
                onClick={() => setDismissed(d => [...d, insight.id])}
                className="absolute top-3 right-3 text-slate-700 hover:text-slate-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
              >
                <X size={12} />
              </button>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: insight.color + '15' }}
                >
                  <Icon size={14} style={{ color: insight.color }} />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-semibold text-slate-200 mb-1">{insight.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{insight.body}</p>
                  <button
                    onClick={() => navigate(insight.route)}
                    className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
                    style={{ color: insight.color }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    {insight.action} <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {visible.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-8 text-slate-700 text-sm"
        >
          All insights reviewed ✓
        </motion.div>
      )}
    </div>
  )
}
