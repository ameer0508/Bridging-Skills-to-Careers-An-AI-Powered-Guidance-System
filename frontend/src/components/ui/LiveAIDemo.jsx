/**
 * LiveAIDemo — Interactive skill-to-career matching simulation
 * User types skills, instantly sees animated career match results.
 * No login required — demonstrates platform intelligence immediately.
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CAREER_MAP = {
  python: [
    { role: 'Machine Learning Engineer', score: 94, color: 'from-violet-500 to-purple-600' },
    { role: 'Data Scientist', score: 89, color: 'from-brand-500 to-violet-500' },
    { role: 'Backend Developer', score: 76, color: 'from-blue-500 to-brand-500' },
    { role: 'AI Engineer', score: 85, color: 'from-purple-500 to-pink-500' },
  ],
  javascript: [
    { role: 'Frontend Developer', score: 96, color: 'from-amber-500 to-orange-500' },
    { role: 'Full Stack Developer', score: 88, color: 'from-brand-500 to-violet-500' },
    { role: 'React Developer', score: 92, color: 'from-cyan-500 to-blue-500' },
    { role: 'Node.js Engineer', score: 82, color: 'from-emerald-500 to-teal-500' },
  ],
  sql: [
    { role: 'Data Analyst', score: 91, color: 'from-emerald-500 to-teal-500' },
    { role: 'Database Engineer', score: 87, color: 'from-blue-500 to-cyan-500' },
    { role: 'Business Intelligence', score: 83, color: 'from-amber-500 to-yellow-500' },
    { role: 'Data Engineer', score: 79, color: 'from-brand-500 to-blue-500' },
  ],
  react: [
    { role: 'Frontend Developer', score: 97, color: 'from-cyan-500 to-blue-500' },
    { role: 'UI Engineer', score: 93, color: 'from-brand-500 to-violet-500' },
    { role: 'Full Stack Developer', score: 85, color: 'from-violet-500 to-purple-500' },
    { role: 'React Native Dev', score: 80, color: 'from-emerald-500 to-cyan-500' },
  ],
  security: [
    { role: 'Cybersecurity Analyst', score: 95, color: 'from-red-500 to-rose-600' },
    { role: 'Penetration Tester', score: 88, color: 'from-orange-500 to-red-500' },
    { role: 'Security Engineer', score: 84, color: 'from-amber-500 to-orange-500' },
    { role: 'SOC Analyst', score: 79, color: 'from-rose-500 to-pink-500' },
  ],
  default: [
    { role: 'Software Engineer', score: 78, color: 'from-brand-500 to-violet-500' },
    { role: 'Full Stack Developer', score: 72, color: 'from-violet-500 to-purple-500' },
    { role: 'Product Engineer', score: 68, color: 'from-blue-500 to-brand-500' },
    { role: 'Technical Lead', score: 61, color: 'from-emerald-500 to-teal-500' },
  ],
}

const SUGGESTIONS = ['Python', 'JavaScript', 'React', 'SQL', 'Machine Learning', 'Node.js', 'TypeScript', 'AWS']

function getMatches(skills) {
  const lower = skills.map((s) => s.toLowerCase())
  for (const key of Object.keys(CAREER_MAP)) {
    if (lower.some((s) => s.includes(key) || key.includes(s))) {
      return CAREER_MAP[key]
    }
  }
  return CAREER_MAP.default
}

function AnimatedBar({ score, color, delay }) {
  return (
    <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1.2, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${color}`}
      />
      {/* Shimmer */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ duration: 1.5, delay: delay + 0.5, ease: 'easeInOut' }}
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
    </div>
  )
}

export default function LiveAIDemo() {
  const [input, setInput] = useState('')
  const [skills, setSkills] = useState(['Python', 'SQL', 'Machine Learning'])
  const [matches, setMatches] = useState(getMatches(['Python', 'SQL', 'Machine Learning']))
  const [analyzing, setAnalyzing] = useState(false)
  const [key, setKey] = useState(0)
  const inputRef = useRef(null)

  const addSkill = (skill) => {
    if (!skill.trim() || skills.includes(skill)) return
    const newSkills = [...skills, skill.trim()]
    setSkills(newSkills)
    setInput('')
    triggerAnalysis(newSkills)
  }

  const removeSkill = (skill) => {
    const newSkills = skills.filter((s) => s !== skill)
    setSkills(newSkills)
    triggerAnalysis(newSkills)
  }

  const triggerAnalysis = (skillList) => {
    setAnalyzing(true)
    setTimeout(() => {
      setMatches(getMatches(skillList))
      setKey((k) => k + 1)
      setAnalyzing(false)
    }, 800)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill(input)
    }
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Glow backdrop */}
      <div className="absolute -inset-4 bg-gradient-to-r from-brand-600/10 via-violet-600/10 to-purple-600/10 rounded-3xl blur-2xl" />

      <div className="relative glass-strong rounded-3xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            </div>
            <span className="text-xs text-slate-500 font-mono">ai-career-matcher.live</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">AI Active</span>
          </div>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* Left: Input */}
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">
                Your Skills
              </p>
              {/* Skill tags */}
              <div className="flex flex-wrap gap-2 mb-3 min-h-[40px]">
                <AnimatePresence>
                  {skills.map((skill) => (
                    <motion.span
                      key={skill}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-500/15 border border-brand-500/25 text-brand-300 text-xs font-medium"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="text-brand-400/60 hover:text-brand-300 transition-colors cursor-pointer"
                      >
                        ×
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>

              {/* Input */}
              <div className="relative">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a skill + Enter..."
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/50 focus:bg-white/[0.06] transition-all"
                />
                {input && (
                  <button
                    onClick={() => addSkill(input)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-400 hover:text-brand-300 font-medium cursor-pointer"
                  >
                    Add →
                  </button>
                )}
              </div>
            </div>

            {/* Suggestions */}
            <div>
              <p className="text-xs text-slate-600 mb-2">Quick add:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.filter((s) => !skills.includes(s)).slice(0, 5).map((s) => (
                  <button
                    key={s}
                    onClick={() => addSkill(s)}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/8 text-xs text-slate-500 hover:text-slate-300 hover:border-white/15 transition-all cursor-pointer"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            {/* AI thinking indicator */}
            <AnimatePresence>
              {analyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-xs text-brand-400"
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 h-1 rounded-full bg-brand-400"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }}
                      />
                    ))}
                  </div>
                  AI analyzing your profile...
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Results */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">
              Career Match Results
            </p>
            <div key={key} className="space-y-3">
              {matches.map((match, i) => (
                <motion.div
                  key={match.role}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">
                      {match.role}
                    </span>
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.1 + 0.8 }}
                      className={`text-sm font-bold bg-gradient-to-r ${match.color} bg-clip-text text-transparent`}
                    >
                      {match.score}%
                    </motion.span>
                  </div>
                  <AnimatedBar score={match.score} color={match.color} delay={i * 0.1 + 0.2} />
                </motion.div>
              ))}
            </div>

            {/* Match summary */}
            <motion.div
              key={`summary-${key}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-4 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/15"
            >
              <p className="text-xs text-emerald-400 font-medium">
                ✦ Top match: {matches[0]?.role} — {matches[0]?.score}% compatibility
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
