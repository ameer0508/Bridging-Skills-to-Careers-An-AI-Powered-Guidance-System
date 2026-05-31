/**
 * CareerUniverse — Interactive career galaxy visualization
 * Each career is a glowing planet. Skills orbit around them.
 * User can hover to explore each career world.
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CAREERS = [
  {
    id: 'frontend',
    label: 'Frontend Developer',
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.4)',
    size: 52,
    x: 50, y: 50,
    skills: ['React', 'CSS', 'TypeScript', 'Vite'],
    demand: 'High',
    salary: '$95K–$145K',
  },
  {
    id: 'backend',
    label: 'Backend Developer',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.4)',
    size: 48,
    x: 20, y: 30,
    skills: ['Node.js', 'Python', 'SQL', 'APIs'],
    demand: 'Very High',
    salary: '$100K–$160K',
  },
  {
    id: 'ml',
    label: 'ML Engineer',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.4)',
    size: 56,
    x: 78, y: 25,
    skills: ['Python', 'TensorFlow', 'Math', 'Data'],
    demand: 'Explosive',
    salary: '$130K–$200K',
  },
  {
    id: 'data',
    label: 'Data Analyst',
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.4)',
    size: 44,
    x: 15, y: 68,
    skills: ['SQL', 'Python', 'Tableau', 'Stats'],
    demand: 'High',
    salary: '$75K–$120K',
  },
  {
    id: 'cyber',
    label: 'Cybersecurity',
    color: '#f87171',
    glow: 'rgba(248,113,113,0.4)',
    size: 46,
    x: 82, y: 70,
    skills: ['Linux', 'Networks', 'Crypto', 'SIEM'],
    demand: 'Critical',
    salary: '$95K–$155K',
  },
  {
    id: 'cloud',
    label: 'Cloud Engineer',
    color: '#38bdf8',
    glow: 'rgba(56,189,248,0.4)',
    size: 42,
    x: 50, y: 82,
    skills: ['AWS', 'Docker', 'K8s', 'IaC'],
    demand: 'Very High',
    salary: '$110K–$170K',
  },
]

function OrbitRing({ career, isActive }) {
  return (
    <motion.div
      className="absolute rounded-full border pointer-events-none"
      style={{
        width: career.size * 3.2,
        height: career.size * 3.2,
        left: '50%',
        top: '50%',
        marginLeft: -(career.size * 1.6),
        marginTop: -(career.size * 1.6),
        borderColor: career.color + '20',
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
    >
      {/* Orbiting skill dot */}
      <div
        className="absolute w-2 h-2 rounded-full -top-1 left-1/2 -translate-x-1/2"
        style={{ background: career.color, boxShadow: `0 0 6px ${career.color}` }}
      />
    </motion.div>
  )
}

export default function CareerUniverse() {
  const [active, setActive] = useState(null)
  const [hovered, setHovered] = useState(null)

  return (
    <div className="relative w-full" style={{ paddingBottom: '56%' }}>
      {/* Star field background */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        {Array.from({ length: 60 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 0.5,
              height: Math.random() * 2 + 0.5,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.4 + 0.1,
            }}
            animate={{ opacity: [0.1, 0.5, 0.1] }}
            transition={{
              duration: Math.random() * 3 + 2,
              delay: Math.random() * 3,
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      {/* Career planets */}
      {CAREERS.map((career) => (
        <div
          key={career.id}
          className="absolute"
          style={{ left: `${career.x}%`, top: `${career.y}%`, transform: 'translate(-50%,-50%)' }}
        >
          {/* Orbit ring */}
          {(hovered === career.id || active === career.id) && (
            <OrbitRing career={career} isActive={active === career.id} />
          )}

          {/* Planet */}
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => setHovered(career.id)}
            onHoverEnd={() => setHovered(null)}
            onClick={() => setActive(active === career.id ? null : career.id)}
            className="relative rounded-full cursor-pointer flex items-center justify-center"
            style={{ width: career.size, height: career.size }}
            animate={{
              y: [0, -6, 0],
              boxShadow: [
                `0 0 20px ${career.glow}`,
                `0 0 40px ${career.glow}`,
                `0 0 20px ${career.glow}`,
              ],
            }}
            transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Planet body */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${career.color}dd, ${career.color}44)`,
                boxShadow: `0 0 30px ${career.glow}, inset 0 0 20px rgba(0,0,0,0.3)`,
              }}
            />
            {/* Planet shine */}
            <div
              className="absolute rounded-full"
              style={{
                width: '40%',
                height: '30%',
                top: '15%',
                left: '20%',
                background: 'rgba(255,255,255,0.25)',
                filter: 'blur(4px)',
              }}
            />
          </motion.button>

          {/* Label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered === career.id || active === career.id ? 1 : 0.5 }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-center pointer-events-none"
          >
            <p className="text-xs font-semibold text-white/80" style={{ textShadow: `0 0 10px ${career.color}` }}>
              {career.label}
            </p>
          </motion.div>
        </div>
      ))}

      {/* Detail panel */}
      <AnimatePresence>
        {active && (() => {
          const c = CAREERS.find((c) => c.id === active)
          return (
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-72 glass-strong rounded-2xl border p-4 z-20"
              style={{ borderColor: c.color + '30' }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-white">{c.label}</h4>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: c.color + '20', color: c.color }}
                >
                  {c.demand}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">Salary: <span className="text-white font-medium">{c.salary}</span></p>
              <div className="flex flex-wrap gap-1.5">
                {c.skills.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2 py-0.5 rounded-lg"
                    style={{ background: c.color + '15', color: c.color + 'cc', border: `1px solid ${c.color}25` }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* Instruction */}
      <div className="absolute top-4 right-4 text-xs text-slate-600">
        Click a planet to explore →
      </div>
    </div>
  )
}
