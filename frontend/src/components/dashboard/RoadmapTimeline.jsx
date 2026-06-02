/**
 * RoadmapTimeline — uses real roadmap data from API
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, Lock, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'

export default function RoadmapTimeline({ roadmap }) {
  const [expanded, setExpanded] = useState(0)

  const steps = roadmap?.roadmap || []

  if (!steps.length) return (
    <div className="text-center py-6 text-slate-600 text-xs">
      Generate a roadmap from the Roadmap page to see your journey here.
    </div>
  )

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-px hidden sm:block" style={{ background:'linear-gradient(to bottom, #818cf8, rgba(99,102,241,0.1))' }} />
      <div className="space-y-3">
        {steps.slice(0, 5).map((step, i) => {
          const status = i === 0 ? 'active' : i < (roadmap.completedWeeks || 0) ? 'completed' : 'upcoming'
          const color = status === 'active' ? '#818cf8' : status === 'completed' ? '#34d399' : '#334155'
          const isOpen = expanded === i
          return (
            <motion.div key={step.week} initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }}
              transition={{ delay:i*0.08 }} className="relative sm:pl-12"
            >
              <div className="absolute left-2.5 top-4 w-5 h-5 rounded-full flex items-center justify-center -translate-x-1/2 z-10 hidden sm:flex"
                style={{ background: color+'20', border:`1.5px solid ${color}` }}
              >
                {status === 'completed' ? <CheckCircle2 size={10} style={{ color }} />
                  : status === 'active' ? <motion.div className="w-2 h-2 rounded-full" style={{ background:color }} animate={{ scale:[1,1.3,1] }} transition={{ duration:1.5, repeat:Infinity }} />
                  : <Circle size={10} style={{ color }} />}
              </div>

              <div className="rounded-2xl overflow-hidden" style={{ background:`${color}08`, border:`1px solid ${color}20` }}>
                <button onClick={() => setExpanded(isOpen ? null : i)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-white/[0.02] transition-all"
                >
                  <span className="text-xs font-mono text-slate-600">W{step.week}</span>
                  <span className="text-sm font-semibold text-slate-200 flex-1">{step.topic}</span>
                  {status === 'active' && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:color+'20', color }}>Active</span>}
                  {isOpen ? <ChevronUp size={13} className="text-slate-600" /> : <ChevronDown size={13} className="text-slate-600" />}
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
                      exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }} className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t space-y-2" style={{ borderColor:'rgba(255,255,255,0.05)' }}>
                        {step.description && <p className="text-xs text-slate-400 leading-relaxed pt-2">{step.description}</p>}
                        {step.resources?.length > 0 && (
                          <div className="space-y-1">
                            {step.resources.slice(0, 2).map(r => (
                              <a key={r} href={r} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors truncate"
                              >
                                <BookOpen size={10} className="flex-shrink-0" />{r.replace('https://','').split('/')[0]}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
        {steps.length > 5 && (
          <p className="text-xs text-slate-700 text-center">{steps.length - 5} more weeks on full roadmap</p>
        )}
      </div>
    </div>
  )
}
