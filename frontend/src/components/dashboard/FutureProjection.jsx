/**
 * FutureProjection — Animated career growth timeline
 * Shows skill count, job matches, and readiness evolving over time.
 */
import { useState } from 'react'
import { motion } from 'framer-motion'

const STAGES = [
  { label: 'Today',     months: 0,  skills: 6,  jobs: 3,  readiness: 45, color: '#6366f1' },
  { label: '3 Months',  months: 3,  skills: 10, jobs: 12, readiness: 62, color: '#8b5cf6' },
  { label: '6 Months',  months: 6,  skills: 15, jobs: 28, readiness: 78, color: '#a78bfa' },
  { label: '12 Months', months: 12, skills: 22, jobs: 55, readiness: 94, color: '#34d399' },
]

export default function FutureProjection() {
  const [active, setActive] = useState(0)
  const stage = STAGES[active]

  return (
    <div className="space-y-5">
      {/* Stage selector */}
      <div className="relative flex items-center">
        {/* Track */}
        <div className="absolute left-0 right-0 h-px" style={{ background: 'rgba(255,255,255,0.06)', top: '50%' }} />
        {/* Progress fill */}
        <motion.div
          className="absolute left-0 h-px"
          style={{ background: `linear-gradient(to right, #6366f1, ${stage.color})`, top: '50%' }}
          animate={{ width: `${(active / (STAGES.length - 1)) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
        <div className="relative flex justify-between w-full">
          {STAGES.map((s, i) => (
            <button key={s.label} onClick={() => setActive(i)}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <motion.div
                className="w-4 h-4 rounded-full border-2 flex items-center justify-center z-10"
                style={{
                  borderColor: i <= active ? s.color : 'rgba(255,255,255,0.1)',
                  background: i <= active ? s.color + '30' : 'rgba(10,10,20,1)',
                  boxShadow: i === active ? `0 0 12px ${s.color}80` : 'none',
                }}
                animate={{ scale: i === active ? 1.3 : 1 }}
                transition={{ duration: 0.2 }}
              >
                {i < active && <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />}
                {i === active && (
                  <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }}
                    animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
              </motion.div>
              <span className="text-xs font-medium whitespace-nowrap" style={{ color: i <= active ? s.color : '#334155' }}>
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <motion.div key={active}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: 'Skills',     value: stage.skills,    suffix: '',   color: stage.color },
          { label: 'Job Matches', value: stage.jobs,     suffix: '+',  color: stage.color },
          { label: 'Readiness',  value: stage.readiness, suffix: '%',  color: stage.color },
        ].map(({ label, value, suffix, color }) => (
          <div key={label} className="rounded-2xl p-4 text-center"
            style={{ background: color + '08', border: `1px solid ${color}20` }}
          >
            <motion.p className="text-2xl font-display font-bold"
              style={{ color }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {value}{suffix}
            </motion.p>
            <p className="text-xs text-slate-600 mt-1">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* Growth bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-600 mb-2">
          <span>Career Readiness</span>
          <span style={{ color: stage.color }}>{stage.readiness}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <motion.div className="h-full rounded-full"
            style={{ background: `linear-gradient(to right, #6366f1, ${stage.color})` }}
            animate={{ width: `${stage.readiness}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}
