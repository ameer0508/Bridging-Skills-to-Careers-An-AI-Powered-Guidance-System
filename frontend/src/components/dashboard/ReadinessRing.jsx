/**
 * ReadinessRing — Animated multi-ring career readiness visualization
 * Five concentric rings, each representing a career dimension.
 */
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const METRICS = [
  { label: 'Career Readiness',    value: 73, color: '#818cf8', r: 80 },
  { label: 'Resume Strength',     value: 61, color: '#34d399', r: 65 },
  { label: 'Skill Match',         value: 78, color: '#a78bfa', r: 50 },
  { label: 'Learning Progress',   value: 45, color: '#fbbf24', r: 35 },
  { label: 'Interview Readiness', value: 38, color: '#f87171', r: 20 },
]

function Ring({ cx, cy, r, value, color, delay }) {
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - value / 100)
  return (
    <g>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
      {/* Fill */}
      <motion.circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
      />
      {/* Glow dot at end */}
      <motion.circle
        r="4" fill={color}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 1.4 }}
        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
      >
        <animateMotion
          dur="0.01s" fill="freeze"
          path={`M ${cx + r * Math.cos(-Math.PI / 2 + (value / 100) * 2 * Math.PI - 0.01)},${cy + r * Math.sin(-Math.PI / 2 + (value / 100) * 2 * Math.PI - 0.01)}`}
        />
      </motion.circle>
    </g>
  )
}

export default function ReadinessRing() {
  const [hovered, setHovered] = useState(null)
  const cx = 110, cy = 110

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="220" height="220" className="-rotate-90">
          {METRICS.map((m, i) => (
            <Ring key={m.label} cx={cx} cy={cy} r={m.r} value={m.value} color={m.color} delay={i * 0.15} />
          ))}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-center"
          >
            <p className="text-4xl font-display font-bold text-white leading-none">73%</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">Career Ready</p>
          </motion.div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2 w-full">
        {METRICS.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.08 }}
            className="flex items-center justify-between group cursor-default"
            onMouseEnter={() => setHovered(m.label)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color, boxShadow: `0 0 6px ${m.color}` }} />
              <span className={`text-xs transition-colors ${hovered === m.label ? 'text-white' : 'text-slate-500'}`}>{m.label}</span>
            </div>
            <span className="text-xs font-bold" style={{ color: m.color }}>{m.value}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
