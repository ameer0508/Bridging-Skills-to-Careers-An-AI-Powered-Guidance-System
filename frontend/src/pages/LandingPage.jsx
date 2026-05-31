/**
 * LandingPage — Cinematic AI Career Intelligence Experience
 *
 * Architecture:
 *   Phase 0: VOID       — Black screen, particles, 3 sentences, pulse
 *   Phase 1: AWAKENING  — Neural network explosion, system boot
 *   Phase 2: UNIVERSE   — Interactive career galaxy (centerpiece)
 *   Phase 3: CONSOLE    — Live AI skill matcher
 *   Phase 4: FUTURE     — Draggable timeline machine
 *   Phase 5: AI CORE    — Animated intelligence engine
 *   Phase 6: ENTER      — Final CTA
 *
 * No navbar. No footer. No cards. No stats. No testimonials.
 * Pure experience.
 */

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const VOID_LINES = [
  'Every skill tells a story.',
  'Every career begins with a decision.',
  "Let's discover yours.",
]

const CAREERS = [
  { id: 'fe',  label: 'Frontend Dev',       color: '#60a5fa', glow: '#3b82f6', r: 22, cx: 50, cy: 38, skills: ['React','CSS','TypeScript','Vite'],        salary: '$90K–$145K', demand: 'High'      },
  { id: 'be',  label: 'Backend Dev',        color: '#34d399', glow: '#10b981', r: 20, cx: 22, cy: 55, skills: ['Node.js','Python','SQL','APIs'],           salary: '$100K–$160K', demand: 'Very High' },
  { id: 'ml',  label: 'ML Engineer',        color: '#a78bfa', glow: '#8b5cf6', r: 26, cx: 78, cy: 30, skills: ['Python','TensorFlow','Math','Data'],       salary: '$130K–$200K', demand: 'Explosive' },
  { id: 'da',  label: 'Data Analyst',       color: '#fbbf24', glow: '#f59e0b', r: 18, cx: 18, cy: 28, skills: ['SQL','Pandas','Tableau','Stats'],          salary: '$75K–$120K',  demand: 'High'      },
  { id: 'cy',  label: 'Cybersecurity',      color: '#f87171', glow: '#ef4444', r: 20, cx: 82, cy: 68, skills: ['Linux','Networks','SIEM','Crypto'],        salary: '$95K–$155K',  demand: 'Critical'  },
  { id: 'cl',  label: 'Cloud Engineer',     color: '#38bdf8', glow: '#0ea5e9', r: 19, cx: 50, cy: 78, skills: ['AWS','Docker','K8s','Terraform'],          salary: '$110K–$170K', demand: 'Very High' },
  { id: 'ai',  label: 'AI Engineer',        color: '#c084fc', glow: '#a855f7', r: 24, cx: 30, cy: 75, skills: ['LLMs','PyTorch','MLOps','APIs'],           salary: '$140K–$220K', demand: 'Explosive' },
  { id: 'sa',  label: 'Software Architect', color: '#fb923c', glow: '#f97316', r: 17, cx: 72, cy: 55, skills: ['Design','Systems','Leadership','Cloud'],   salary: '$150K–$230K', demand: 'High'      },
]

const SKILL_MAP = {
  python:     [{ role:'AI Engineer',     score:92 },{ role:'ML Engineer',    score:89 },{ role:'Data Analyst',   score:84 },{ role:'Backend Dev',    score:76 }],
  javascript: [{ role:'Frontend Dev',    score:96 },{ role:'Full Stack',     score:88 },{ role:'React Dev',      score:93 },{ role:'Backend Dev',    score:79 }],
  react:      [{ role:'Frontend Dev',    score:97 },{ role:'UI Engineer',    score:91 },{ role:'Full Stack',     score:84 },{ role:'React Native',   score:78 }],
  sql:        [{ role:'Data Analyst',    score:93 },{ role:'Data Engineer',  score:87 },{ role:'Backend Dev',   score:82 },{ role:'BI Analyst',     score:79 }],
  linux:      [{ role:'Cybersecurity',   score:94 },{ role:'DevOps',         score:88 },{ role:'Cloud Engineer',score:83 },{ role:'SRE',            score:80 }],
  aws:        [{ role:'Cloud Engineer',  score:95 },{ role:'DevOps',         score:89 },{ role:'Solutions Arch',score:86 },{ role:'Backend Dev',    score:74 }],
  docker:     [{ role:'DevOps',          score:92 },{ role:'Cloud Engineer', score:88 },{ role:'SRE',           score:85 },{ role:'Backend Dev',    score:81 }],
  default:    [{ role:'Software Engineer',score:74},{ role:'Full Stack Dev', score:69 },{ role:'Product Eng',   score:65 },{ role:'Tech Lead',      score:60 }],
}

const TIMELINE_STAGES = [
  { t: 0,   label: 'Today',     sub: 'Where you are',        skills: 2,  jobs: 1,  color: '#6366f1' },
  { t: 33,  label: '3 Months',  sub: 'Foundation built',     skills: 5,  jobs: 4,  color: '#8b5cf6' },
  { t: 66,  label: '6 Months',  sub: 'Momentum achieved',    skills: 9,  jobs: 12, color: '#a78bfa' },
  { t: 100, label: '12 Months', sub: 'Career ready',         skills: 15, jobs: 40, color: '#34d399' },
]

// ─────────────────────────────────────────────────────────────────────────────
// THREE.JS — Neural Network Background
// ─────────────────────────────────────────────────────────────────────────────

function NeuralNet({ phase }) {
  const meshRef = useRef()
  const linesRef = useRef()
  const { size } = useThree()

  const geo = useMemo(() => {
    const count = 140
    const pos = new Float32Array(count * 3)
    const nodes = []
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 18
      const y = (Math.random() - 0.5) * 10
      const z = (Math.random() - 0.5) * 8
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z
      nodes.push([x, y, z])
    }
    const lineVerts = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = Math.hypot(nodes[i][0]-nodes[j][0], nodes[i][1]-nodes[j][1], nodes[i][2]-nodes[j][2])
        if (d < 3.2) lineVerts.push(...nodes[i], ...nodes[j])
      }
    }
    return { pos, lineVerts: new Float32Array(lineVerts) }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.06
    if (meshRef.current) { meshRef.current.rotation.y = t; meshRef.current.rotation.x = Math.sin(t * 0.4) * 0.12 }
    if (linesRef.current) { linesRef.current.rotation.y = t; linesRef.current.rotation.x = Math.sin(t * 0.4) * 0.12 }
  })

  return (
    <group>
      <points ref={meshRef}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[geo.pos, 3]} /></bufferGeometry>
        <pointsMaterial size={0.055} color="#818cf8" transparent opacity={phase >= 1 ? 0.9 : 0.3} sizeAttenuation />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[geo.lineVerts, 3]} /></bufferGeometry>
        <lineBasicMaterial color="#4f46e5" transparent opacity={phase >= 1 ? 0.18 : 0.06} />
      </lineSegments>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLE CANVAS — 2D ambient particles
// ─────────────────────────────────────────────────────────────────────────────

function ParticleCanvas({ count = 80, opacity = 0.4 }) {
  const ref = useRef()
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')
    let id, W = c.offsetWidth, H = c.offsetHeight
    c.width = W; c.height = H
    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.3, o: Math.random() * 0.5 + 0.1,
    }))
    const resize = () => { W = c.offsetWidth; H = c.offsetHeight; c.width = W; c.height = H }
    window.addEventListener('resize', resize)
    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99,102,241,${p.o * opacity})`; ctx.fill()
      }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y
        const d = Math.sqrt(dx*dx + dy*dy)
        if (d < 110) {
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y)
          ctx.strokeStyle = `rgba(99,102,241,${(1 - d/110) * 0.1 * opacity})`
          ctx.lineWidth = 0.7; ctx.stroke()
        }
      }
      id = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize) }
  }, [count, opacity])
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPEWRITER
// ─────────────────────────────────────────────────────────────────────────────

function Typewriter({ text, speed = 42, onDone, startDelay = 0 }) {
  const [chars, setChars] = useState('')
  const [go, setGo] = useState(false)
  useEffect(() => { const t = setTimeout(() => setGo(true), startDelay); return () => clearTimeout(t) }, [startDelay])
  useEffect(() => {
    if (!go) return
    let i = 0
    const iv = setInterval(() => {
      setChars(text.slice(0, ++i))
      if (i >= text.length) { clearInterval(iv); setTimeout(onDone, 700) }
    }, speed)
    return () => clearInterval(iv)
  }, [go])
  return (
    <span>
      {chars}
      {chars.length < text.length && go && (
        <span className="inline-block w-0.5 h-[1em] bg-indigo-400 ml-0.5 animate-pulse align-middle" />
      )}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 0 — THE VOID
// ─────────────────────────────────────────────────────────────────────────────

function VoidScene({ onAwaken }) {
  const [lineIdx, setLineIdx] = useState(0)
  const [showPulse, setShowPulse] = useState(false)
  const [exiting, setExiting] = useState(false)

  const next = useCallback(() => {
    if (lineIdx < VOID_LINES.length - 1) setTimeout(() => setLineIdx(i => i + 1), 500)
    else setTimeout(() => setShowPulse(true), 600)
  }, [lineIdx])

  const handleClick = () => {
    if (!showPulse) return
    setExiting(true)
    setTimeout(onAwaken, 1000)
  }

  return (
    <motion.div
      key="void"
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: exiting ? 1 : 0.8 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030305] overflow-hidden cursor-default"
      onClick={handleClick}
    >
      <ParticleCanvas count={60} opacity={0.6} />

      {/* Deep glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Lines */}
      <div className="relative z-10 text-center px-6 space-y-8 min-h-[160px] flex flex-col items-center justify-center">
        {VOID_LINES.slice(0, lineIdx + 1).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: i === lineIdx ? 1 : 0.2 }}
            transition={{ duration: 0.6 }}
            className={`font-display leading-snug ${
              i === VOID_LINES.length - 1
                ? 'text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 bg-clip-text text-transparent'
                : 'text-lg sm:text-xl font-medium text-slate-300'
            }`}
          >
            {i === lineIdx
              ? <Typewriter text={line} onDone={next} startDelay={i === 0 ? 800 : 0} />
              : line}
          </motion.div>
        ))}
      </div>

      {/* Pulse orb */}
      <AnimatePresence>
        {showPulse && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 80 }}
            className="relative mt-20 flex flex-col items-center gap-4 cursor-pointer"
          >
            {/* Outer rings */}
            {[1, 2, 3].map(r => (
              <motion.div key={r}
                className="absolute rounded-full border border-indigo-500/20"
                style={{ width: 60 + r * 30, height: 60 + r * 30, left: '50%', top: '50%', marginLeft: -(30 + r * 15), marginTop: -(30 + r * 15) }}
                animate={{ opacity: [0.4, 0.1, 0.4], scale: [1, 1.08, 1] }}
                transition={{ duration: 2.5, delay: r * 0.4, repeat: Infinity }}
              />
            ))}
            {/* Core */}
            <motion.div
              className="relative w-16 h-16 rounded-full flex items-center justify-center"
              animate={{ boxShadow: ['0 0 20px rgba(99,102,241,0.4)', '0 0 50px rgba(99,102,241,0.8)', '0 0 20px rgba(99,102,241,0.4)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 opacity-90" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 blur-xl opacity-60" />
              <motion.div className="relative z-10 w-3 h-3 rounded-full bg-white"
                animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="text-xs text-indigo-400/60 tracking-[0.3em] uppercase"
            >
              Click to enter
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1 — THE AWAKENING (full-screen neural explosion)
// ─────────────────────────────────────────────────────────────────────────────

function AwakeningScene({ onComplete }) {
  const [step, setStep] = useState(0)
  const STEPS = [
    'Initializing Career Intelligence System...',
    'Loading neural pathways...',
    'Mapping skill connections...',
    'Calibrating career vectors...',
    'System ready.',
  ]

  useEffect(() => {
    if (step < STEPS.length - 1) {
      const t = setTimeout(() => setStep(s => s + 1), step === STEPS.length - 2 ? 900 : 500)
      return () => clearTimeout(t)
    } else {
      setTimeout(onComplete, 1200)
    }
  }, [step])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-40 bg-[#030305] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Three.js neural net */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 9], fov: 65 }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
          <NeuralNet phase={1} />
        </Canvas>
      </div>

      {/* Scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent pointer-events-none"
        animate={{ top: ['-2%', '102%'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
      />

      {/* Boot text */}
      <div className="relative z-10 text-center space-y-3">
        {STEPS.slice(0, step + 1).map((s, i) => (
          <motion.p key={i}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: i === step ? 1 : 0.25, x: 0 }}
            transition={{ duration: 0.4 }}
            className={`font-mono text-sm ${i === step ? 'text-indigo-300' : 'text-slate-600'}`}
          >
            <span className="text-indigo-500 mr-2">{i === step ? '▶' : '✓'}</span>
            {s}
          </motion.p>
        ))}
      </div>

      {/* Corner decorations */}
      {[['top-4 left-4', 'border-t border-l'], ['top-4 right-4', 'border-t border-r'], ['bottom-4 left-4', 'border-b border-l'], ['bottom-4 right-4', 'border-b border-r']].map(([pos, border]) => (
        <div key={pos} className={`absolute ${pos} w-8 h-8 ${border} border-indigo-500/30`} />
      ))}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CAREER GALAXY — Interactive planet system
// ─────────────────────────────────────────────────────────────────────────────

function CareerGalaxy() {
  const [active, setActive] = useState(null)
  const [hovered, setHovered] = useState(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 })

  const handleMouse = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left - rect.width / 2) * 0.015)
    mouseY.set((e.clientY - rect.top - rect.height / 2) * 0.015)
  }, [])

  const activePlanet = CAREERS.find(c => c.id === active)

  return (
    <div className="relative w-full" style={{ paddingBottom: '62%' }} onMouseMove={handleMouse}>
      {/* Star field */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        {Array.from({ length: 80 }).map((_, i) => (
          <motion.div key={i}
            className="absolute rounded-full bg-white"
            style={{ width: Math.random() * 1.8 + 0.3, height: Math.random() * 1.8 + 0.3, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: Math.random() * 0.35 + 0.05 }}
            animate={{ opacity: [0.05, 0.4, 0.05] }}
            transition={{ duration: Math.random() * 4 + 2, delay: Math.random() * 4, repeat: Infinity }}
          />
        ))}
        {/* Nebula glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-indigo-900/15 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 left-1/4 w-[30%] h-[30%] bg-violet-900/10 rounded-full blur-[60px]" />
      </div>

      {/* Parallax container */}
      <motion.div className="absolute inset-0" style={{ x: springX, y: springY }}>
        {CAREERS.map((c) => {
          const isActive = active === c.id
          const isHovered = hovered === c.id
          return (
            <div key={c.id} className="absolute" style={{ left: `${c.cx}%`, top: `${c.cy}%`, transform: 'translate(-50%,-50%)' }}>
              {/* Orbit ring */}
              {(isHovered || isActive) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                  className="absolute rounded-full border pointer-events-none"
                  style={{ width: c.r * 5.5, height: c.r * 5.5, left: '50%', top: '50%', marginLeft: -(c.r * 2.75), marginTop: -(c.r * 2.75), borderColor: c.color + '25' }}
                >
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 rounded-full"
                  >
                    <div className="absolute w-2 h-2 rounded-full -top-1 left-1/2 -translate-x-1/2" style={{ background: c.color, boxShadow: `0 0 8px ${c.color}` }} />
                  </motion.div>
                </motion.div>
              )}

              {/* Planet */}
              <motion.button
                whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.92 }}
                onHoverStart={() => setHovered(c.id)} onHoverEnd={() => setHovered(null)}
                onClick={() => setActive(active === c.id ? null : c.id)}
                className="relative rounded-full cursor-pointer flex items-center justify-center"
                style={{ width: c.r * 2, height: c.r * 2 }}
                animate={{ y: [0, -5, 0], boxShadow: [`0 0 15px ${c.glow}55`, `0 0 35px ${c.glow}99`, `0 0 15px ${c.glow}55`] }}
                transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, ${c.color}ee, ${c.color}44)`, boxShadow: `inset 0 0 15px rgba(0,0,0,0.4)` }} />
                <div className="absolute rounded-full" style={{ width: '38%', height: '28%', top: '14%', left: '18%', background: 'rgba(255,255,255,0.22)', filter: 'blur(3px)' }} />
                {isActive && <div className="absolute inset-0 rounded-full border-2 animate-pulse" style={{ borderColor: c.color }} />}
              </motion.button>

              {/* Label */}
              <motion.p
                animate={{ opacity: isHovered || isActive ? 1 : 0.45 }}
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-center text-xs font-semibold pointer-events-none"
                style={{ color: c.color, textShadow: `0 0 12px ${c.color}80` }}
              >
                {c.label}
              </motion.p>
            </div>
          )
        })}
      </motion.div>

      {/* Detail panel */}
      <AnimatePresence>
        {activePlanet && (
          <motion.div
            key={activePlanet.id}
            initial={{ opacity: 0, y: 12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-72 rounded-2xl p-4 z-20 pointer-events-none"
            style={{ background: 'rgba(10,10,20,0.92)', border: `1px solid ${activePlanet.color}30`, backdropFilter: 'blur(20px)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-white">{activePlanet.label}</h4>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: activePlanet.color + '20', color: activePlanet.color }}>{activePlanet.demand}</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Salary: <span className="text-white font-medium">{activePlanet.salary}</span></p>
            <div className="flex flex-wrap gap-1.5">
              {activePlanet.skills.map(s => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-lg" style={{ background: activePlanet.color + '15', color: activePlanet.color + 'cc', border: `1px solid ${activePlanet.color}25` }}>{s}</span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="absolute top-3 right-4 text-xs text-slate-700 pointer-events-none">Click a planet to explore</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE AI CONSOLE
// ─────────────────────────────────────────────────────────────────────────────

function AIConsole() {
  const [input, setInput] = useState('')
  const [skills, setSkills] = useState([])
  const [results, setResults] = useState([])
  const [thinking, setThinking] = useState(false)
  const [resultKey, setResultKey] = useState(0)
  const inputRef = useRef()

  const getResults = useCallback((skillList) => {
    const lower = skillList.map(s => s.toLowerCase().trim())
    for (const key of Object.keys(SKILL_MAP)) {
      if (lower.some(s => s.includes(key) || key.includes(s))) return SKILL_MAP[key]
    }
    return SKILL_MAP.default
  }, [])

  const addSkill = useCallback((raw) => {
    const s = raw.trim()
    if (!s || skills.includes(s)) { setInput(''); return }
    const next = [...skills, s]
    setSkills(next)
    setInput('')
    setThinking(true)
    setTimeout(() => {
      setResults(getResults(next))
      setResultKey(k => k + 1)
      setThinking(false)
    }, 600)
  }, [skills, getResults])

  const removeSkill = useCallback((s) => {
    const next = skills.filter(x => x !== s)
    setSkills(next)
    if (next.length) { setResults(getResults(next)); setResultKey(k => k + 1) }
    else setResults([])
  }, [skills, getResults])

  const COLORS = ['from-indigo-500 to-violet-500', 'from-violet-500 to-purple-500', 'from-purple-500 to-pink-500', 'from-blue-500 to-indigo-500']

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Glow */}
      <div className="absolute -inset-6 bg-gradient-to-r from-indigo-600/8 via-violet-600/8 to-purple-600/8 rounded-3xl blur-3xl" />

      <div className="relative rounded-3xl overflow-hidden" style={{ background: 'rgba(8,8,18,0.95)', border: '1px solid rgba(99,102,241,0.15)', backdropFilter: 'blur(30px)' }}>
        {/* Terminal header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.05]" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-amber-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
            </div>
            <span className="text-xs font-mono text-slate-600">career-intelligence.ai — skill analyzer</span>
          </div>
          <div className="flex items-center gap-2">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }}
            />
            <span className="text-xs text-emerald-500 font-mono">LIVE</span>
          </div>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* Input side */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-mono text-indigo-400/70 mb-3 uppercase tracking-widest">// Enter your skills</p>
              <div className="flex flex-wrap gap-2 min-h-[36px] mb-3">
                <AnimatePresence>
                  {skills.map(s => (
                    <motion.span key={s}
                      initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium"
                      style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}
                    >
                      {s}
                      <button onClick={() => removeSkill(s)} className="text-indigo-400/50 hover:text-indigo-300 cursor-pointer">×</button>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 font-mono text-sm">›</span>
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(input) } }}
                  placeholder="python, react, sql..."
                  className="w-full pl-7 pr-4 py-3 rounded-xl text-sm font-mono text-slate-200 placeholder-slate-700 focus:outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>
              <p className="text-xs text-slate-700 mt-2 font-mono">Press Enter to add a skill</p>
            </div>

            {/* Quick add */}
            <div>
              <p className="text-xs text-slate-700 font-mono mb-2">// quick add:</p>
              <div className="flex flex-wrap gap-1.5">
                {['Python','JavaScript','React','SQL','Linux','AWS','Docker'].filter(s => !skills.includes(s)).slice(0, 5).map(s => (
                  <button key={s} onClick={() => addSkill(s)}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono cursor-pointer transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b' }}
                    onMouseEnter={e => { e.target.style.color = '#a5b4fc'; e.target.style.borderColor = 'rgba(99,102,241,0.3)' }}
                    onMouseLeave={e => { e.target.style.color = '#64748b'; e.target.style.borderColor = 'rgba(255,255,255,0.07)' }}
                  >+ {s}</button>
                ))}
              </div>
            </div>

            {/* Thinking */}
            <AnimatePresence>
              {thinking && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-xs font-mono text-indigo-400"
                >
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="w-1 h-1 rounded-full bg-indigo-400"
                      animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 0.7, delay: i*0.2, repeat: Infinity }}
                    />
                  ))}
                  analyzing...
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results side */}
          <div>
            <p className="text-xs font-mono text-indigo-400/70 mb-3 uppercase tracking-widest">// career probability</p>
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <p className="text-xs font-mono text-slate-700">Awaiting input...</p>
                <p className="text-xs text-slate-800 mt-1">Add skills to see matches</p>
              </div>
            ) : (
              <div key={resultKey} className="space-y-4">
                {results.map((r, i) => (
                  <motion.div key={r.role}
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-slate-300 font-medium">{r.role}</span>
                      <motion.span
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 + 0.7 }}
                        className={`text-sm font-bold bg-gradient-to-r ${COLORS[i % COLORS.length]} bg-clip-text text-transparent`}
                      >{r.score}%</motion.span>
                    </div>
                    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${r.score}%` }}
                        transition={{ duration: 1.2, delay: i * 0.1 + 0.2, ease: [0.25,0.46,0.45,0.94] }}
                        className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${COLORS[i % COLORS.length]}`}
                      />
                    </div>
                  </motion.div>
                ))}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                  className="mt-3 px-3 py-2 rounded-xl text-xs font-mono"
                  style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)', color: '#6ee7b7' }}
                >
                  ✦ Top match: {results[0]?.role}
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FUTURE MACHINE — Draggable timeline
// ─────────────────────────────────────────────────────────────────────────────

function FutureMachine() {
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const trackRef = useRef()

  const stage = TIMELINE_STAGES.reduce((best, s) => progress >= s.t ? s : best, TIMELINE_STAGES[0])

  const handleTrack = useCallback((e) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    setProgress(pct)
  }, [])

  const handleMouseDown = (e) => { setDragging(true); handleTrack(e) }
  const handleMouseMove = useCallback((e) => { if (dragging) handleTrack(e) }, [dragging, handleTrack])
  const handleMouseUp = () => setDragging(false)

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleMouseMove)
    window.addEventListener('touchend', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleMouseMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [handleMouseMove])

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Stage display */}
      <motion.div key={stage.label}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <motion.p className="text-5xl sm:text-6xl font-display font-bold mb-2"
          style={{ color: stage.color, textShadow: `0 0 40px ${stage.color}60` }}
        >{stage.label}</motion.p>
        <p className="text-slate-500 text-sm">{stage.sub}</p>
        <div className="flex items-center justify-center gap-8 mt-4">
          <motion.div key={`s-${stage.skills}`} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <p className="text-2xl font-display font-bold text-white">{stage.skills}</p>
            <p className="text-xs text-slate-600">Skills</p>
          </motion.div>
          <div className="w-px h-8 bg-white/10" />
          <motion.div key={`j-${stage.jobs}`} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <p className="text-2xl font-display font-bold text-white">{stage.jobs}+</p>
            <p className="text-xs text-slate-600">Job Matches</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Track */}
      <div className="relative px-4">
        <div ref={trackRef}
          className="relative h-2 rounded-full cursor-pointer select-none"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          onMouseDown={handleMouseDown}
          onTouchStart={(e) => { setDragging(true); handleTrack(e) }}
        >
          {/* Fill */}
          <motion.div className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${progress}%`, background: `linear-gradient(to right, #6366f1, ${stage.color})` }}
          />
          {/* Thumb */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white/20 flex items-center justify-center cursor-grab active:cursor-grabbing"
            style={{ left: `${progress}%`, marginLeft: -12, background: stage.color, boxShadow: `0 0 20px ${stage.color}80` }}
            animate={{ scale: dragging ? 1.3 : 1 }}
          >
            <div className="w-2 h-2 rounded-full bg-white/60" />
          </motion.div>
        </div>

        {/* Stage markers */}
        <div className="flex justify-between mt-4">
          {TIMELINE_STAGES.map((s) => (
            <button key={s.t} onClick={() => setProgress(s.t)}
              className="flex flex-col items-center gap-1 cursor-pointer group"
            >
              <div className="w-1.5 h-1.5 rounded-full transition-all" style={{ background: progress >= s.t ? s.color : 'rgba(255,255,255,0.15)', boxShadow: progress >= s.t ? `0 0 8px ${s.color}` : 'none' }} />
              <span className="text-xs transition-colors" style={{ color: progress >= s.t ? s.color : '#475569' }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-slate-700 mt-6 font-mono">← drag to explore your future →</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AI CORE — Animated intelligence engine
// ─────────────────────────────────────────────────────────────────────────────

const AI_INPUTS  = [{ l:'Skills',  i:'⚡', c:'#818cf8', a:-120 },{ l:'Resume',  i:'📄', c:'#60a5fa', a:-60 },{ l:'Interests',i:'🎯', c:'#fbbf24', a:0 },{ l:'Goals',   i:'🚀', c:'#f87171', a:60 },{ l:'Market',  i:'📊', c:'#34d399', a:120 }]
const AI_OUTPUTS = [{ l:'Career Match',    c:'#a78bfa' },{ l:'Skill Gaps',     c:'#f87171' },{ l:'Roadmap',        c:'#34d399' },{ l:'Resources',      c:'#fbbf24' },{ l:'Readiness Score',c:'#60a5fa' }]

function AICore() {
  return (
    <div className="relative w-full max-w-xl mx-auto" style={{ paddingBottom: '85%' }}>
      {AI_INPUTS.map((inp, i) => {
        const rad = ((inp.a - 90) * Math.PI) / 180
        const r = 40
        const x = 50 + r * Math.cos(rad), y = 50 + r * Math.sin(rad)
        return (
          <motion.div key={inp.l}
            initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ delay: i * 0.15, type: 'spring', stiffness: 120 }}
            className="absolute flex flex-col items-center gap-1"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }}
          >
            <motion.div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg"
              style={{ background: inp.c + '15', border: `1px solid ${inp.c}30` }}
              animate={{ boxShadow: [`0 0 8px ${inp.c}20`, `0 0 22px ${inp.c}45`, `0 0 8px ${inp.c}20`] }}
              transition={{ duration: 2.5, delay: i * 0.3, repeat: Infinity }}
            >{inp.i}</motion.div>
            <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">{inp.l}</span>
          </motion.div>
        )
      })}

      {/* Flow lines SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {AI_INPUTS.map((inp, i) => {
          const rad = ((inp.a - 90) * Math.PI) / 180
          const r = 40
          const x1 = 50 + r * Math.cos(rad), y1 = 50 + r * Math.sin(rad)
          return (
            <g key={inp.l}>
              <motion.line x1={`${x1}%`} y1={`${y1}%`} x2="50%" y2="50%"
                stroke={inp.c} strokeWidth="0.35" strokeOpacity="0.35" strokeDasharray="1.5 1.5"
                initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }}
                viewport={{ once: true }} transition={{ duration: 1.2, delay: i * 0.2 + 0.5 }}
              />
              <motion.circle r="0.7" fill={inp.c}
                animate={{ cx: [`${x1}%`, '50%'], cy: [`${y1}%`, '50%'], opacity: [0, 1, 0] }}
                transition={{ duration: 2, delay: i * 0.3 + 1, repeat: Infinity, ease: 'easeInOut' }}
              />
            </g>
          )
        })}
      </svg>

      {/* Core */}
      <motion.div
        initial={{ opacity: 0, scale: 0.3 }} whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4, type: 'spring', stiffness: 80 }}
        className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}
      >
        {[1,2,3].map(r => (
          <motion.div key={r} className="absolute rounded-full border border-indigo-500/15"
            style={{ width: 70 + r*26, height: 70 + r*26, left: '50%', top: '50%', marginLeft: -(35+r*13), marginTop: -(35+r*13) }}
            animate={{ opacity: [0.3,0.08,0.3], scale: [1,1.06,1] }}
            transition={{ duration: 2.5, delay: r*0.4, repeat: Infinity }}
          />
        ))}
        <div className="relative w-[70px] h-[70px] rounded-full flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 blur-xl opacity-60" />
          <motion.span className="relative z-10 text-2xl"
            animate={{ rotate: [0,360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >🧠</motion.span>
        </div>
      </motion.div>

      {/* Outputs */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 flex-wrap px-2">
        {AI_OUTPUTS.map((o, i) => (
          <motion.div key={o.l}
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 1.2 + i * 0.12 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{ background: o.c + '10', border: `1px solid ${o.c}22`, color: o.c }}
          >
            <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: o.c }}
              animate={{ opacity: [0.4,1,0.4] }} transition={{ duration: 1.5, delay: i*0.3, repeat: Infinity }}
            />
            {o.l}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION WRAPPER — reusable cinematic section
// ─────────────────────────────────────────────────────────────────────────────

function Section({ id, label, title, sub, children, glowColor = '#6366f1', className = '' }) {
  return (
    <section id={id} className={`relative py-28 sm:py-36 overflow-hidden ${className}`}>
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full blur-[120px] pointer-events-none opacity-40"
        style={{ background: glowColor + '18' }}
      />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          {label && (
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 text-xs font-mono uppercase tracking-widest"
              style={{ background: glowColor + '12', border: `1px solid ${glowColor}25`, color: glowColor }}
            >
              <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: glowColor }}
                animate={{ opacity: [0.4,1,0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
              />
              {label}
            </div>
          )}
          {title && (
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4 leading-tight"
              dangerouslySetInnerHTML={{ __html: title }}
            />
          )}
          {sub && <p className="text-slate-500 text-lg max-w-xl mx-auto">{sub}</p>}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.8, delay: 0.1 }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_KEY = 'sb_v3_seen'

export default function LandingPage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState(() => sessionStorage.getItem(SESSION_KEY) ? 2 : 0)
  // 0 = void, 1 = awakening, 2 = main experience

  const handleAwaken = useCallback(() => {
    setPhase(1)
  }, [])

  const handleReady = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, '1')
    setPhase(2)
  }, [])

  // Magnetic cursor effect
  const cursorX = useMotionValue(-200)
  const cursorY = useMotionValue(-200)
  const springCX = useSpring(cursorX, { stiffness: 120, damping: 20 })
  const springCY = useSpring(cursorY, { stiffness: 120, damping: 20 })

  useEffect(() => {
    const move = (e) => { cursorX.set(e.clientX); cursorY.set(e.clientY) }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return (
    <>
      {/* Magnetic cursor glow */}
      <motion.div
        className="fixed pointer-events-none z-[9998] rounded-full"
        style={{ x: springCX, y: springCY, translateX: '-50%', translateY: '-50%', width: 350, height: 350, background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)' }}
      />

      {/* Phase 0 — Void */}
      <AnimatePresence>{phase === 0 && <VoidScene onAwaken={handleAwaken} />}</AnimatePresence>

      {/* Phase 1 — Awakening */}
      <AnimatePresence>{phase === 1 && <AwakeningScene onComplete={handleReady} />}</AnimatePresence>

      {/* Phase 2 — Main Experience */}
      <AnimatePresence>
        {phase === 2 && (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
            className="relative bg-[#030305] min-h-screen overflow-x-hidden"
          >
            {/* Persistent neural background */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
              <Canvas camera={{ position: [0, 0, 9], fov: 65 }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
                <NeuralNet phase={2} />
              </Canvas>
            </div>

            {/* Ambient particles */}
            <div className="fixed inset-0 pointer-events-none z-0">
              <ParticleCanvas count={50} opacity={0.3} />
            </div>

            {/* ── HERO ── */}
            <section className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6">
              {/* Top badge */}
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-10 text-xs font-mono uppercase tracking-widest"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}
              >
                <motion.div className="w-2 h-2 rounded-full bg-emerald-400"
                  animate={{ scale: [1,1.5,1], opacity: [0.7,1,0.7] }} transition={{ duration: 1.5, repeat: Infinity }}
                />
                Career Intelligence System · Active
              </motion.div>

              {/* Main headline */}
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.9 }}
                className="text-6xl sm:text-8xl lg:text-9xl font-display font-bold leading-[0.95] tracking-tight mb-6"
              >
                <span className="text-white">Transform</span>
                <br />
                <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 bg-clip-text text-transparent"
                  style={{ filter: 'drop-shadow(0 0 40px rgba(139,92,246,0.4))' }}
                >Skills.</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                className="text-lg sm:text-xl text-slate-500 max-w-lg mx-auto mb-12 leading-relaxed"
              >
                AI-powered guidance that maps your skills to careers, identifies gaps, and builds your roadmap to success.
              </motion.p>

              {/* CTA */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
                className="flex flex-col sm:flex-row items-center gap-4"
              >
                <motion.button whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/profile')}
                  className="group relative px-10 py-4 rounded-2xl text-white font-bold text-base cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600" />
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 blur-2xl opacity-50 group-hover:opacity-80 transition-opacity" />
                  <span className="relative z-10 flex items-center gap-2">
                    Begin Your Journey
                    <motion.span animate={{ x: [0,5,0] }} transition={{ duration: 1.2, repeat: Infinity }}>→</motion.span>
                  </span>
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={() => document.getElementById('galaxy')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl text-slate-400 font-medium text-base cursor-pointer transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                >
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  Explore Universe
                </motion.button>
              </motion.div>

              {/* Scroll cue */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
              >
                <motion.div animate={{ y: [0,8,0] }} transition={{ duration: 1.8, repeat: Infinity }}
                  className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <div className="w-1 h-2 rounded-full bg-indigo-400/50" />
                </motion.div>
              </motion.div>
            </section>

            {/* ── GALAXY ── */}
            <Section id="galaxy" label="Career Universe" glowColor="#60a5fa"
              title='Explore the <span class="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">Career Galaxy</span>'
              sub="Every career is a world. Click a planet to discover its skills, salary, and demand."
            >
              <div className="glass-strong rounded-3xl overflow-hidden p-4" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <CareerGalaxy />
              </div>
            </Section>

            {/* ── CONSOLE ── */}
            <Section id="console" label="Live Intelligence" glowColor="#a78bfa"
              title='Type Skills. <span class="bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">Watch AI Think.</span>'
              sub="No submit button. Results appear in real time as you type."
            >
              <AIConsole />
            </Section>

            {/* ── FUTURE MACHINE ── */}
            <Section id="future" label="Future Machine" glowColor="#34d399"
              title='Drag Your <span class="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">Future.</span>'
              sub="Slide the timeline to see how your career evolves over 12 months."
            >
              <div className="rounded-3xl p-8 sm:p-12" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <FutureMachine />
              </div>
            </Section>

            {/* ── AI CORE ── */}
            <Section id="core" label="AI Engine" glowColor="#818cf8"
              title='The Intelligence <span class="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">Behind It All.</span>'
              sub="Every input processed. Every output meaningful. The AI core never stops working for you."
            >
              <AICore />
            </Section>

            {/* ── FINAL CTA ── */}
            <section className="relative z-10 py-40 text-center px-4 overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[140px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
              />
              <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.9 }}
                className="relative z-10 max-w-3xl mx-auto"
              >
                <motion.div
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-8 text-sm font-medium"
                  style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#6ee7b7' }}
                  animate={{ boxShadow: ['0 0 0px rgba(52,211,153,0)', '0 0 25px rgba(52,211,153,0.15)', '0 0 0px rgba(52,211,153,0)'] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Free to start · No credit card required
                </motion.div>

                <h2 className="text-5xl sm:text-7xl font-display font-bold text-white mb-6 leading-tight">
                  Your Career
                  <br />
                  <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 bg-clip-text text-transparent"
                    style={{ filter: 'drop-shadow(0 0 30px rgba(139,92,246,0.3))' }}
                  >Starts Now.</span>
                </h2>

                <p className="text-xl text-slate-500 mb-12 max-w-xl mx-auto">
                  Join thousands of professionals who've used AI to accelerate their careers.
                </p>

                <motion.button whileHover={{ scale: 1.06, y: -4 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/profile')}
                  className="group relative inline-flex items-center gap-3 px-12 py-5 rounded-2xl text-white font-bold text-lg cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600" />
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 blur-3xl opacity-60 group-hover:opacity-90 transition-opacity" />
                  <span className="relative z-10 flex items-center gap-3">
                    Launch Your Journey
                    <motion.span className="text-xl" animate={{ x: [0,6,0] }} transition={{ duration: 1.2, repeat: Infinity }}>→</motion.span>
                  </span>
                </motion.button>

                <p className="mt-6 text-xs text-slate-700 font-mono">
                  Trusted by engineers at Google · Stripe · Notion · OpenAI
                </p>
              </motion.div>
            </section>

            {/* Minimal footer */}
            <footer className="relative z-10 py-8 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-xs text-slate-800 font-mono">© 2025 SkillBridge AI · Bridging Skills to Careers</p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
