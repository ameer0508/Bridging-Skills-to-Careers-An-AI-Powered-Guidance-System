/**
 * ReadinessRing — uses real readiness data from API
 */
import { useState } from 'react'
import { motion } from 'framer-motion'

const DEFAULT_METRICS = [
  { label: 'Career Readiness',    value: 0,  color: '#818cf8', r: 80 },
  { label: 'Resume Strength',     value: 0,  color: '#34d399', r: 65 },
  { label: 'Skill Match',         value: 0,  color: '#a78bfa', r: 50 },
  { label: 'Learning Progress',   value: 0,  color: '#fbbf24', r: 35 },
  { label: 'Interview Readiness', value: 0,  color: '#f87171', r: 20 },
]

function Ring({ cx, cy, r, value, color, delay }) {
  const circ = 2 * Math.PI * r
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
      <motion.circle cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - value / 100) }}
        transition={{ duration: 1.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
      />
    </g>
  )
}

export default function ReadinessRing({ readiness }) {
  const [hovered, setHovered] = useState(null)

  // Build metrics from real readiness data or defaults
  const breakdown = readiness?.breakdown || {}
  const overallScore = readiness?.score ?? 0

  const metrics = [
    { label: 'Career Readiness',    value: overallScore,                    color: '#818cf8', r: 80 },
    { label: 'Resume Strength',     value: breakdown.resumeStrength ?? 0,   color: '#34d399', r: 65 },
    { label: 'Skill Match',         value: breakdown.skillMatch ?? 0,       color: '#a78bfa', r: 50 },
    { label: 'Learning Progress',   value: breakdown.roadmapProgress ?? 0,  color: '#fbbf24', r: 35 },
    { label: 'Profile Complete',    value: breakdown.profileCompleteness ?? 0, color: '#f87171', r: 20 },
  ]

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="220" height="220" className="-rotate-90">
          {metrics.map((m, i) => (
            <Ring key={m.label} cx={110} cy={110} r={m.r} value={m.value} color={m.color} delay={i * 0.15} />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1 }} className="text-center">
            <p className="text-4xl font-display font-bold text-white leading-none">{overallScore}%</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">Career Ready</p>
          </motion.div>
        </div>
      </div>
      <div className="mt-4 space-y-2 w-full">
        {metrics.map((m, i) => (
          <motion.div key={m.label}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.08 }}
            className="flex items-center justify-between group cursor-default"
            onMouseEnter={() => setHovered(m.label)} onMouseLeave={() => setHovered(null)}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color, boxShadow: `0 0 6px ${m.color}` }} />
              <span className={`text-xs transition-colors ${hovered === m.label ? 'text-white' : 'text-slate-500'}`}>{m.label}</span>
            </div>
            <span className="text-xs font-bold" style={{ color: m.color }}>{Math.round(m.value)}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
