/**
 * CinematicIntro — Full-screen AI introduction experience
 * Shows on first visit. Dark background, neural particles,
 * typewriter-style text sequence, then glowing ENTER button.
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ParticleField from './ParticleField'

const LINES = [
  'Every career begins with a skill.',
  'Every opportunity begins with preparation.',
  'Every success story begins with a roadmap.',
  'Welcome to the Future of Career Intelligence.',
]

function TypewriterLine({ text, onDone, delay = 0 }) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  useEffect(() => {
    if (!started) return
    let i = 0
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1))
      i++
      if (i >= text.length) {
        clearInterval(interval)
        setTimeout(onDone, 600)
      }
    }, 38)
    return () => clearInterval(interval)
  }, [started, text, onDone])

  return (
    <span>
      {displayed}
      {displayed.length < text.length && started && (
        <span className="inline-block w-0.5 h-5 bg-brand-400 ml-0.5 animate-pulse align-middle" />
      )}
    </span>
  )
}

export default function CinematicIntro({ onEnter }) {
  const [lineIndex, setLineIndex] = useState(0)
  const [showEnter, setShowEnter] = useState(false)
  const [exiting, setExiting] = useState(false)

  const handleLineDone = () => {
    if (lineIndex < LINES.length - 1) {
      setTimeout(() => setLineIndex((i) => i + 1), 400)
    } else {
      setTimeout(() => setShowEnter(true), 500)
    }
  }

  const handleEnter = () => {
    setExiting(true)
    setTimeout(onEnter, 900)
  }

  return (
    <AnimatePresence>
      {!exiting ? (
        <motion.div
          key="intro"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050508] overflow-hidden"
        >
          {/* Particle background */}
          <ParticleField count={90} color="99,102,241" />

          {/* Deep glow orbs */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-brand-600/8 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-violet-600/6 rounded-full blur-[80px] pointer-events-none" />

          {/* Neural network SVG overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="ng" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="50%" cy="50%" r="35%" fill="url(#ng)" />
          </svg>

          {/* Logo mark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-16 flex flex-col items-center gap-3"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-brand-500/40">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 blur-xl opacity-40" />
            </div>
            <span className="text-xs tracking-[0.3em] text-slate-500 uppercase font-medium">
              SkillBridge AI
            </span>
          </motion.div>

          {/* Text lines */}
          <div className="relative z-10 max-w-2xl mx-auto px-6 text-center space-y-6 min-h-[200px]">
            {LINES.slice(0, lineIndex + 1).map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: i === lineIndex ? 1 : 0.3, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`font-display font-semibold leading-snug ${
                  i === LINES.length - 1
                    ? 'text-2xl sm:text-3xl bg-gradient-to-r from-brand-300 via-violet-300 to-purple-300 bg-clip-text text-transparent'
                    : 'text-lg sm:text-xl text-slate-300'
                }`}
              >
                {i === lineIndex ? (
                  <TypewriterLine
                    text={line}
                    onDone={handleLineDone}
                    delay={i === 0 ? 600 : 0}
                  />
                ) : (
                  line
                )}
              </motion.div>
            ))}
          </div>

          {/* Enter button */}
          <AnimatePresence>
            {showEnter && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="mt-16 flex flex-col items-center gap-4"
              >
                <motion.button
                  onClick={handleEnter}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.96 }}
                  className="relative group px-10 py-4 rounded-2xl cursor-pointer overflow-hidden"
                >
                  {/* Animated border */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-500 via-violet-500 to-purple-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-[1px] rounded-[14px] bg-[#050508]" />
                  {/* Glow */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-500 via-violet-500 to-purple-500 blur-xl opacity-30 group-hover:opacity-60 transition-opacity" />
                  <span className="relative z-10 flex items-center gap-3 text-white font-semibold text-base tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Enter Platform
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </motion.button>
                <p className="text-xs text-slate-600 tracking-widest uppercase">
                  Press to begin your journey
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom scan line effect */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
