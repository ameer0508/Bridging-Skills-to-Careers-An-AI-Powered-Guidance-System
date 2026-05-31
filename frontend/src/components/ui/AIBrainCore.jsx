/**
 * AIBrainCore — Animated AI processing visualization
 * Shows inputs flowing into a central AI core, outputs emerging.
 */
import { motion } from 'framer-motion'

const INPUTS = [
  { label: 'Skills', icon: '⚡', color: '#818cf8', angle: -120 },
  { label: 'Experience', icon: '📋', color: '#34d399', angle: -60 },
  { label: 'Interests', icon: '🎯', color: '#fbbf24', angle: 0 },
  { label: 'Goals', icon: '🚀', color: '#f87171', angle: 60 },
  { label: 'Market Data', icon: '📊', color: '#38bdf8', angle: 120 },
]

const OUTPUTS = [
  { label: 'Career Insights', color: '#a78bfa' },
  { label: 'Skill Gaps', color: '#f87171' },
  { label: 'Learning Paths', color: '#34d399' },
  { label: 'Recommendations', color: '#fbbf24' },
]

function FlowLine({ angle, color, delay }) {
  const rad = (angle * Math.PI) / 180
  const r = 110
  const x2 = 50 + (r * Math.cos(rad)) / 2.5
  const y2 = 50 + (r * Math.sin(rad)) / 2.5

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={`lg-${angle}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.line
          x1={`${50 + (r * Math.cos(rad)) / 1.8}%`}
          y1={`${50 + (r * Math.sin(rad)) / 1.8}%`}
          x2="50%"
          y2="50%"
          stroke={color}
          strokeWidth="0.4"
          strokeOpacity="0.4"
          strokeDasharray="2 2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay, ease: 'easeInOut' }}
        />
        {/* Traveling dot */}
        <motion.circle
          r="0.8"
          fill={color}
          animate={{
            cx: [`${50 + (r * Math.cos(rad)) / 1.8}%`, '50%'],
            cy: [`${50 + (r * Math.sin(rad)) / 1.8}%`, '50%'],
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 2, delay: delay + 0.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    </motion.div>
  )
}

export default function AIBrainCore() {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative" style={{ paddingBottom: '80%' }}>

        {/* Input nodes */}
        {INPUTS.map((inp, i) => {
          const rad = ((inp.angle - 90) * Math.PI) / 180
          const r = 42
          const x = 50 + r * Math.cos(rad)
          const y = 50 + r * Math.sin(rad)
          return (
            <motion.div
              key={inp.label}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5, type: 'spring' }}
              className="absolute flex flex-col items-center gap-1"
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }}
            >
              <motion.div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-lg"
                style={{
                  background: inp.color + '18',
                  border: `1px solid ${inp.color}35`,
                  boxShadow: `0 0 20px ${inp.color}20`,
                }}
                animate={{ boxShadow: [`0 0 10px ${inp.color}20`, `0 0 25px ${inp.color}40`, `0 0 10px ${inp.color}20`] }}
                transition={{ duration: 2.5, delay: i * 0.3, repeat: Infinity }}
              >
                {inp.icon}
              </motion.div>
              <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">{inp.label}</span>
            </motion.div>
          )
        })}

        {/* Flow lines */}
        {INPUTS.map((inp, i) => (
          <FlowLine key={inp.label} angle={inp.angle - 90} color={inp.color} delay={i * 0.2 + 0.5} />
        ))}

        {/* Central AI Core */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3, type: 'spring', stiffness: 100 }}
          className="absolute"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}
        >
          {/* Outer pulse rings */}
          {[1, 2, 3].map((ring) => (
            <motion.div
              key={ring}
              className="absolute rounded-full border border-brand-500/20"
              style={{
                width: 80 + ring * 28,
                height: 80 + ring * 28,
                left: '50%',
                top: '50%',
                marginLeft: -(40 + ring * 14),
                marginTop: -(40 + ring * 14),
              }}
              animate={{ opacity: [0.4, 0.1, 0.4], scale: [1, 1.05, 1] }}
              transition={{ duration: 2.5, delay: ring * 0.4, repeat: Infinity }}
            />
          ))}

          {/* Core */}
          <div className="relative w-20 h-20 rounded-full flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 opacity-90" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 blur-xl opacity-50" />
            <motion.div
              className="relative z-10 text-2xl"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              🧠
            </motion.div>
          </div>
        </motion.div>

        {/* Output labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-3 flex-wrap px-4">
          {OUTPUTS.map((out, i) => (
            <motion.div
              key={out.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.2 + i * 0.15 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
              style={{
                background: out.color + '12',
                border: `1px solid ${out.color}25`,
                color: out.color,
              }}
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: out.color }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
              />
              {out.label}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
