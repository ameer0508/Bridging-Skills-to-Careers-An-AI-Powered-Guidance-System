/**
 * RoadmapTimeline — Animated visual journey from current to career-ready
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, Lock, Trophy, ChevronDown, ChevronUp, BookOpen, Clock } from 'lucide-react'

const MILESTONES = [
  {
    id: 1, week: 'Week 1', title: 'TypeScript Mastery',
    status: 'completed', progress: 100,
    skills: ['TypeScript', 'Type System', 'Generics'],
    badge: '🏆', color: '#34d399',
    resources: ['TypeScript Deep Dive', 'Official TS Docs'],
  },
  {
    id: 2, week: 'Week 2', title: 'System Design',
    status: 'active', progress: 60,
    skills: ['Scalability', 'Load Balancing', 'Caching'],
    badge: '🏗️', color: '#818cf8',
    resources: ['Grokking System Design', 'System Design Interview'],
  },
  {
    id: 3, week: 'Week 3', title: 'Machine Learning Basics',
    status: 'upcoming', progress: 0,
    skills: ['Python ML', 'Scikit-learn', 'Model Eval'],
    badge: '🤖', color: '#a78bfa',
    resources: ['ML A-Z Udemy', 'Fast.ai'],
  },
  {
    id: 4, week: 'Week 4', title: 'AWS Cloud Essentials',
    status: 'locked', progress: 0,
    skills: ['EC2', 'S3', 'Lambda', 'RDS'],
    badge: '☁️', color: '#60a5fa',
    resources: ['AWS Solutions Architect', 'A Cloud Guru'],
  },
  {
    id: 5, week: 'Goal', title: 'Career Ready 🎯',
    status: 'locked', progress: 0,
    skills: [], badge: '🚀', color: '#fbbf24',
    resources: [],
  },
]

const STATUS_CONFIG = {
  completed: { icon: CheckCircle2, bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.3)', text: '#34d399' },
  active:    { icon: Circle,       bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', text: '#818cf8' },
  upcoming:  { icon: Circle,       bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', text: '#475569' },
  locked:    { icon: Lock,         bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.06)', text: '#334155' },
}

export default function RoadmapTimeline() {
  const [expanded, setExpanded] = useState(2)

  return (
    <div className="relative">
      {/* Vertical spine */}
      <div className="absolute left-5 top-5 bottom-5 w-px" style={{ background: 'linear-gradient(to bottom, #818cf8, rgba(99,102,241,0.1))' }} />

      <div className="space-y-3">
        {MILESTONES.map((m, i) => {
          const cfg = STATUS_CONFIG[m.status]
          const Icon = cfg.icon
          const isOpen = expanded === m.id
          const isLocked = m.status === 'locked'

          return (
            <motion.div key={m.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="relative pl-12"
            >
              {/* Node */}
              <motion.div
                className="absolute left-2.5 top-4 w-5 h-5 rounded-full flex items-center justify-center -translate-x-1/2 z-10"
                style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}` }}
                animate={m.status === 'active' ? { boxShadow: [`0 0 0px ${m.color}`, `0 0 12px ${m.color}60`, `0 0 0px ${m.color}`] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Icon size={10} style={{ color: cfg.text }} />
              </motion.div>

              {/* Card */}
              <div className="rounded-2xl overflow-hidden" style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, opacity: isLocked ? 0.5 : 1 }}>
                <button
                  onClick={() => !isLocked && setExpanded(isOpen ? null : m.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left ${!isLocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                >
                  <span className="text-xl">{m.badge}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-200">{m.title}</p>
                      {m.status === 'active' && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>Active</span>
                      )}
                      {m.status === 'completed' && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>✓ Done</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{m.week}</p>
                  </div>
                  {m.progress > 0 && (
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <motion.div className="h-full rounded-full" style={{ background: m.color, width: `${m.progress}%` }}
                          initial={{ width: 0 }} animate={{ width: `${m.progress}%` }}
                          transition={{ duration: 1, delay: i * 0.1 + 0.5 }}
                        />
                      </div>
                      <span className="text-xs font-bold" style={{ color: m.color }}>{m.progress}%</span>
                    </div>
                  )}
                  {!isLocked && (isOpen ? <ChevronUp size={14} className="text-slate-600 flex-shrink-0" /> : <ChevronDown size={14} className="text-slate-600 flex-shrink-0" />)}
                </button>

                <AnimatePresence>
                  {isOpen && !isLocked && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t space-y-3" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <div className="flex flex-wrap gap-1.5">
                          {m.skills.map(s => (
                            <span key={s} className="text-xs px-2 py-0.5 rounded-lg" style={{ background: m.color + '15', color: m.color, border: `1px solid ${m.color}25` }}>{s}</span>
                          ))}
                        </div>
                        <div className="space-y-1">
                          {m.resources.map(r => (
                            <div key={r} className="flex items-center gap-2 text-xs text-slate-500">
                              <BookOpen size={10} className="text-indigo-400 flex-shrink-0" />{r}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
