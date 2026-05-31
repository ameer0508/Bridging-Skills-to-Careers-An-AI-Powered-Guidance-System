/**
 * LandingPage — Futuristic AI Career Intelligence Platform
 * Cinematic intro → Hero → Live Demo → Journey → AI Brain → Universe → Timeline → CTA
 */
import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import CinematicIntro from '../components/ui/CinematicIntro'
import ParticleField from '../components/ui/ParticleField'
import LiveAIDemo from '../components/ui/LiveAIDemo'
import CareerUniverse from '../components/ui/CareerUniverse'
import AIBrainCore from '../components/ui/AIBrainCore'

const INTRO_KEY = 'sb_intro_seen'

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ to, suffix = '', duration = 2 }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const [started, setStarted] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true) }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  useEffect(() => {
    if (!started) return
    let start = 0
    const step = to / (duration * 60)
    const t = setInterval(() => {
      start += step
      if (start >= to) { setVal(to); clearInterval(t) } else setVal(Math.floor(start))
    }, 1000 / 60)
    return () => clearInterval(t)
  }, [started, to, duration])
  return <span ref={ref}>{val}{suffix}</span>
}

// ── Journey steps ─────────────────────────────────────────────────────────────
const JOURNEY = [
  { icon: '👤', label: 'You', desc: 'Your skills & goals', color: '#818cf8' },
  { icon: '📄', label: 'Resume', desc: 'AI parses your profile', color: '#60a5fa' },
  { icon: '🧠', label: 'AI Brain', desc: 'Deep intelligence layer', color: '#a78bfa' },
  { icon: '🔍', label: 'Skill Intel', desc: 'Precision analysis', color: '#34d399' },
  { icon: '⚡', label: 'Gap Detection', desc: 'What you need', color: '#fbbf24' },
  { icon: '🎯', label: 'Career Match', desc: 'Your best roles', color: '#f87171' },
  { icon: '🗺️', label: 'Roadmap', desc: 'Week-by-week plan', color: '#38bdf8' },
  { icon: '📚', label: 'Resources', desc: 'Curated learning', color: '#c084fc' },
  { icon: '🚀', label: 'Career Growth', desc: 'Your future', color: '#4ade80' },
]

// ── Timeline milestones ───────────────────────────────────────────────────────
const TIMELINE = [
  { period: 'Now', label: 'Current State', items: ['Assess skills', 'Set target role', 'Build profile'], color: '#818cf8' },
  { period: '3 Months', label: 'Foundation', items: ['Core skills acquired', 'First projects built', '40% gap closed'], color: '#60a5fa' },
  { period: '6 Months', label: 'Momentum', items: ['Portfolio complete', 'Certifications earned', '75% gap closed'], color: '#34d399' },
  { period: '12 Months', label: 'Career Ready', items: ['Job applications', 'Interview prep', '100% ready'], color: '#4ade80' },
]

// ── Stats ─────────────────────────────────────────────────────────────────────
const STATS = [
  { value: 50, suffix: 'K+', label: 'Professionals Guided', icon: '👥' },
  { value: 94, suffix: '%', label: 'Goal Achievement Rate', icon: '🎯' },
  { value: 3, suffix: '.2x', label: 'Faster Skill Growth', icon: '⚡' },
  { value: 200, suffix: '+', label: 'Learning Resources', icon: '📚' },
]

// ── Main export ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  // Show cinematic intro only once per session
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem(INTRO_KEY))
  const handleEnter = () => {
    sessionStorage.setItem(INTRO_KEY, '1')
    setShowIntro(false)
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] } }),
  }

  return (
    <>
      {/* ── CINEMATIC INTRO ── */}
      <AnimatePresence>{showIntro && <CinematicIntro onEnter={handleEnter} />}</AnimatePresence>

      <div className="relative overflow-x-hidden">

        {/* ══════════════════════════════════════════════════════════════
            HERO SECTION
        ══════════════════════════════════════════════════════════════ */}
        <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden">
          {/* Particle field */}
          <ParticleField count={70} color="99,102,241" className="opacity-60" />

          {/* Aurora orbs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-brand-600/8 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-violet-600/6 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] bg-blue-600/5 rounded-full blur-[80px] pointer-events-none" />

          {/* Grid */}
          <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center"
          >
            {/* Badge */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
              className="inline-flex items-center gap-2 glass border border-brand-500/25 rounded-full px-5 py-2 mb-10"
            >
              <motion.div className="w-2 h-2 rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-sm text-brand-300 font-medium tracking-wide">AI Career Intelligence Platform</span>
              <span className="text-xs text-slate-600">v2.0</span>
            </motion.div>

            {/* Hero headline */}
            <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="text-5xl sm:text-7xl lg:text-8xl font-display font-bold text-white leading-[1.02] tracking-tight mb-6"
            >
              Transform Skills
              <br />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-brand-300 via-violet-300 to-purple-300 bg-clip-text text-transparent">
                  Into Careers.
                </span>
                {/* Underline glow */}
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent"
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ duration: 1.2, delay: 0.8 }}
                />
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12"
            >
              AI-powered guidance that analyzes skills, identifies opportunities,
              and maps your career journey — with precision no human advisor can match.
            </motion.p>

            {/* CTA buttons */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
            >
              <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/profile')}
                className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-semibold text-base cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-violet-600" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-violet-600 blur-xl opacity-40 group-hover:opacity-70 transition-opacity" />
                <span className="relative z-10 flex items-center gap-2">
                  Begin Your Journey
                  <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>→</motion.span>
                </span>
              </motion.button>

              <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl glass border border-white/10 text-slate-200 font-semibold text-base hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                See Live Demo
              </motion.button>
            </motion.div>

            {/* Floating glass dashboard preview */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
              className="relative max-w-4xl mx-auto"
            >
              <div className="glass-strong rounded-3xl border border-white/10 p-1 shadow-2xl shadow-black/60">
                <div className="rounded-2xl overflow-hidden bg-[#0d0d1a]">
                  {/* Browser chrome */}
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                    </div>
                    <div className="flex-1 mx-6">
                      <div className="glass rounded-lg px-3 py-1 text-xs text-slate-600 text-center border border-white/5 max-w-xs mx-auto">
                        skillbridge.ai/dashboard
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-emerald-500">Live</span>
                    </div>
                  </div>

                  {/* Dashboard content */}
                  <div className="p-5 grid grid-cols-3 gap-3">
                    {[
                      { label: 'Career Match', value: '87%', color: 'text-brand-400', bg: 'bg-brand-500/8', border: 'border-brand-500/15', bar: 87 },
                      { label: 'Roadmap Progress', value: '52%', color: 'text-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/15', bar: 52 },
                      { label: 'Skills Acquired', value: '14/26', color: 'text-violet-400', bg: 'bg-violet-500/8', border: 'border-violet-500/15', bar: 54 },
                    ].map((s) => (
                      <div key={s.label} className={`${s.bg} rounded-xl p-4 border ${s.border}`}>
                        <p className="text-xs text-slate-600 mb-1">{s.label}</p>
                        <p className={`text-2xl font-bold font-display ${s.color} mb-2`}>{s.value}</p>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${s.bar}%` }}
                            transition={{ duration: 1.5, delay: 1.2, ease: 'easeOut' }}
                            className={`h-full rounded-full ${s.color.replace('text-', 'bg-')}`}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="col-span-3 glass rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-slate-500 font-medium">AI Skill Gap Analysis</p>
                        <span className="text-xs text-brand-400 glass px-2 py-0.5 rounded-lg border border-brand-500/20">Live</span>
                      </div>
                      <div className="space-y-2.5">
                        {[
                          { skill: 'System Design', pct: 68, color: 'from-brand-500 to-violet-500' },
                          { skill: 'Machine Learning', pct: 45, color: 'from-violet-500 to-purple-500' },
                          { skill: 'Cloud Architecture', pct: 82, color: 'from-blue-500 to-brand-500' },
                        ].map((s) => (
                          <div key={s.skill} className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 w-36">{s.skill}</span>
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }}
                                transition={{ duration: 1.8, delay: 1.4, ease: 'easeOut' }}
                                className={`h-full rounded-full bg-gradient-to-r ${s.color}`}
                              />
                            </div>
                            <span className="text-xs text-slate-500 w-8 text-right">{s.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Glow under card */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-2/3 h-12 bg-brand-600/20 blur-2xl rounded-full" />
            </motion.div>
          </motion.div>

          {/* Scroll cue */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-xs text-slate-700 tracking-widest uppercase">Scroll</span>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center pt-1.5"
            >
              <div className="w-1 h-2 rounded-full bg-brand-400/60" />
            </motion.div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            STATS SECTION
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 border-y border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950/20 via-transparent to-violet-950/20" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {STATS.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="glass rounded-2xl p-6 text-center border border-white/5 hover:border-brand-500/20 transition-all group"
                >
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <p className="text-3xl font-display font-bold bg-gradient-to-r from-brand-300 to-violet-300 bg-clip-text text-transparent mb-1">
                    <Counter to={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            LIVE AI DEMO
        ══════════════════════════════════════════════════════════════ */}
        <section id="demo" className="relative py-32 overflow-hidden">
          <ParticleField count={40} color="139,92,246" className="opacity-30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-600/6 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 glass border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
                <motion.div className="w-2 h-2 rounded-full bg-violet-400"
                  animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-xs text-violet-300 font-medium uppercase tracking-wider">Live Intelligence Demo</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
                Watch AI Work
                <br />
                <span className="bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">In Real Time</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto">
                Type your skills. Watch the AI instantly map your career potential. No login required.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.7 }}
            >
              <LiveAIDemo />
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            CINEMATIC JOURNEY
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative py-32 border-t border-white/5 overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} className="text-center mb-20"
            >
              <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
                The Intelligence
                <span className="bg-gradient-to-r from-brand-300 to-violet-300 bg-clip-text text-transparent"> Journey</span>
              </h2>
              <p className="text-slate-400 text-lg">From raw skills to career success — every step powered by AI.</p>
            </motion.div>

            {/* Journey flow */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-500/30 to-transparent hidden md:block" />

              <div className="space-y-6">
                {JOURNEY.map((step, i) => (
                  <motion.div key={step.label}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.6, delay: i * 0.05 }}
                    className={`flex items-center gap-6 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                  >
                    <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                      <div className={`inline-block glass rounded-2xl px-5 py-3 border border-white/5 hover:border-white/10 transition-all`}
                        style={{ borderColor: step.color + '20' }}
                      >
                        <p className="text-sm font-semibold text-white">{step.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                      </div>
                    </div>

                    {/* Center node */}
                    <motion.div
                      className="relative flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl z-10"
                      style={{ background: step.color + '15', border: `1px solid ${step.color}30`, boxShadow: `0 0 20px ${step.color}20` }}
                      whileInView={{ boxShadow: [`0 0 10px ${step.color}20`, `0 0 30px ${step.color}40`, `0 0 10px ${step.color}20`] }}
                      transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
                    >
                      {step.icon}
                    </motion.div>

                    <div className="flex-1 hidden md:block" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            AI BRAIN SECTION
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative py-32 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-brand-600/6 rounded-full blur-[120px] pointer-events-none" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.7 }}
              >
                <div className="inline-flex items-center gap-2 glass border border-brand-500/20 rounded-full px-4 py-1.5 mb-6">
                  <span className="text-xs text-brand-300 font-medium uppercase tracking-wider">🧠 AI Core</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-6">
                  The Intelligence
                  <br />
                  <span className="bg-gradient-to-r from-brand-300 to-violet-300 bg-clip-text text-transparent">Behind the Platform</span>
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed mb-8">
                  Our AI core processes your complete profile — skills, experience, interests, and market data —
                  to generate insights no human advisor could produce at this speed or precision.
                </p>
                <div className="space-y-3">
                  {['Processes 50+ career data signals simultaneously', 'Matches against 10,000+ job market data points', 'Updates recommendations in real-time as you grow'].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                      </div>
                      <span className="text-sm text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.7 }}
              >
                <AIBrainCore />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            CAREER UNIVERSE
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative py-32 border-t border-white/5 overflow-hidden">
          <ParticleField count={30} color="56,189,248" className="opacity-20" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 glass border border-blue-500/20 rounded-full px-4 py-1.5 mb-4">
                <span className="text-xs text-blue-300 font-medium uppercase tracking-wider">🌌 Career Universe</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
                Explore Your
                <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent"> Career Galaxy</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto">
                Every career is a world waiting to be explored. Click a planet to discover its skills, demand, and salary range.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ duration: 0.8 }}
              className="glass-strong rounded-3xl border border-white/8 overflow-hidden p-4"
            >
              <CareerUniverse />
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            FUTURE TIMELINE
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-950/10 to-transparent" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} className="text-center mb-20"
            >
              <div className="inline-flex items-center gap-2 glass border border-emerald-500/20 rounded-full px-4 py-1.5 mb-4">
                <span className="text-xs text-emerald-300 font-medium uppercase tracking-wider">⏱ Your Future</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
                See Your
                <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent"> Transformation</span>
              </h2>
              <p className="text-slate-400 text-lg">From today to career-ready — your 12-month journey visualized.</p>
            </motion.div>

            {/* Timeline */}
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute top-8 left-0 right-0 h-px hidden lg:block">
                <motion.div className="h-full bg-gradient-to-r from-brand-500/20 via-emerald-500/40 to-emerald-500/20"
                  initial={{ scaleX: 0, originX: 0 }} whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }} transition={{ duration: 1.5, ease: 'easeInOut' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {TIMELINE.map((t, i) => (
                  <motion.div key={t.period}
                    initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.6 }}
                    className="relative"
                  >
                    {/* Node */}
                    <div className="flex items-center gap-3 mb-4">
                      <motion.div className="w-4 h-4 rounded-full border-2 flex-shrink-0 relative z-10"
                        style={{ borderColor: t.color, background: t.color + '30', boxShadow: `0 0 12px ${t.color}50` }}
                        animate={{ boxShadow: [`0 0 8px ${t.color}30`, `0 0 20px ${t.color}60`, `0 0 8px ${t.color}30`] }}
                        transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                      />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: t.color }}>{t.period}</span>
                    </div>

                    <div className="glass rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all"
                      style={{ borderColor: t.color + '15' }}
                    >
                      <h4 className="text-sm font-bold text-white mb-3">{t.label}</h4>
                      <ul className="space-y-2">
                        {t.items.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-xs text-slate-400">
                            <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: t.color }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            FINAL CTA
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative py-40 border-t border-white/5 overflow-hidden">
          <ParticleField count={50} color="99,102,241" className="opacity-40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-violet-600/10 rounded-full blur-[60px] pointer-events-none" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.8 }}
            >
              <motion.div className="inline-flex items-center gap-2 glass border border-emerald-500/20 rounded-full px-5 py-2 mb-8"
                animate={{ boxShadow: ['0 0 0px rgba(52,211,153,0)', '0 0 20px rgba(52,211,153,0.15)', '0 0 0px rgba(52,211,153,0)'] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm text-emerald-300 font-medium">Free to start · No credit card</span>
              </motion.div>

              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight">
                Your Career
                <br />
                <span className="bg-gradient-to-r from-brand-300 via-violet-300 to-purple-300 bg-clip-text text-transparent">
                  Starts Now.
                </span>
              </h2>

              <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                Join thousands of professionals who've used AI to accelerate their careers.
                Your roadmap is waiting.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/profile')}
                  className="group relative flex items-center gap-3 px-10 py-5 rounded-2xl text-white font-bold text-lg cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-600 via-violet-600 to-purple-600" />
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-500 via-violet-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-violet-600 blur-2xl opacity-50 group-hover:opacity-80 transition-opacity" />
                  <span className="relative z-10 flex items-center gap-3">
                    Launch Your Journey
                    <motion.span className="text-xl" animate={{ x: [0, 5, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>→</motion.span>
                  </span>
                </motion.button>

                <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 px-8 py-5 rounded-2xl glass border border-white/10 text-slate-200 font-semibold text-base hover:border-white/20 transition-all cursor-pointer"
                >
                  View Dashboard
                </motion.button>
              </div>

              <p className="mt-8 text-sm text-slate-700">
                Trusted by engineers at Google, Stripe, Notion, and 500+ companies worldwide
              </p>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════════════════════════ */}
        <footer className="border-t border-white/5 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-900/50">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
                  </svg>
                </div>
                <div>
                  <span className="font-display font-bold text-white">Skill<span className="bg-gradient-to-r from-brand-300 to-violet-300 bg-clip-text text-transparent">Bridge</span> AI</span>
                  <p className="text-xs text-slate-600">Career Intelligence Platform</p>
                </div>
              </div>
              <p className="text-xs text-slate-700">© 2025 SkillBridge AI · Bridging Skills to Careers</p>
              <div className="flex items-center gap-6 text-xs text-slate-600">
                {['Privacy', 'Terms', 'Contact', 'Blog'].map((l) => (
                  <span key={l} className="hover:text-slate-400 cursor-pointer transition-colors">{l}</span>
                ))}
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
