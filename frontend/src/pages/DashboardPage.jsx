/**
 * DashboardPage — AI Career Intelligence Operating System
 *
 * Layout:
 *   Top: Command bar (search, goal, status, AI toggle)
 *   Left col (4/12): Readiness ring + Career matches + Interview prep
 *   Center col (5/12): Welcome hero + Skill network + Future projection
 *   Right col (3/12): AI Insights + Roadmap timeline + Resources
 *   Floating: AI Assistant panel (collapsible)
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Bell, Sparkles, ChevronRight, Zap,
  BarChart3, Map, BookOpen, User, Target,
  TrendingUp, Activity, Settings
} from 'lucide-react'
import { useApp } from '../context/AppContext'

import ReadinessRing      from '../components/dashboard/ReadinessRing'
import SkillNetwork       from '../components/dashboard/SkillNetwork'
import RoadmapTimeline    from '../components/dashboard/RoadmapTimeline'
import AIInsightsPanel    from '../components/dashboard/AIInsightsPanel'
import FutureProjection   from '../components/dashboard/FutureProjection'
import CareerMatchRanking from '../components/dashboard/CareerMatchRanking'
import InterviewPrep      from '../components/dashboard/InterviewPrep'
import ResourceHub        from '../components/dashboard/ResourceHub'
import AIAssistant        from '../components/dashboard/AIAssistant'

// ── Panel wrapper ─────────────────────────────────────────────────────────────
function Panel({ title, subtitle, icon: Icon, iconColor = '#818cf8', children, className = '', action, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-3xl overflow-hidden ${className}`}
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
    >
      {(title || subtitle) && (
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: iconColor + '15' }}
              >
                <Icon size={13} style={{ color: iconColor }} />
              </div>
            )}
            <div>
              {title && <p className="text-sm font-bold text-slate-200">{title}</p>}
              {subtitle && <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && (
            <button onClick={onAction}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              {action} <ChevronRight size={11} />
            </button>
          )}
        </div>
      )}
      <div className={title ? 'px-5 pb-5' : 'p-5'}>
        {children}
      </div>
    </motion.div>
  )
}

// ── Command Bar ───────────────────────────────────────────────────────────────
function CommandBar({ onToggleAI, aiOpen }) {
  const { profile } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-6"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
    >
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search skills, roles, resources..."
          className="w-full pl-8 pr-3 py-2 rounded-xl text-xs text-slate-300 placeholder-slate-700 focus:outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        />
      </div>

      {/* Career goal chip */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
      >
        <Target size={11} className="text-indigo-400" />
        <span className="text-xs text-indigo-300 font-medium max-w-[120px] truncate">{profile.targetJobRole}</span>
      </div>

      {/* Readiness score */}
      <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}
      >
        <motion.div className="w-2 h-2 rounded-full bg-emerald-400"
          animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-xs text-emerald-300 font-bold">73% Ready</span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="relative w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <Bell size={13} className="text-slate-400" />
          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-400" />
        </motion.button>

        {/* AI toggle */}
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onToggleAI}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
          style={aiOpen
            ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc' }
            : { background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }
          }
        >
          <Sparkles size={12} />
          <span className="hidden sm:inline">AI Mentor</span>
        </motion.button>

        {/* Profile */}
        <button onClick={() => navigate('/profile')}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white cursor-pointer flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          {profile.fullName?.charAt(0) || 'A'}
        </button>
      </div>
    </motion.div>
  )
}

// ── Welcome Hero ──────────────────────────────────────────────────────────────
function WelcomeHero({ profile }) {
  const navigate = useNavigate()
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative rounded-3xl overflow-hidden p-6 sm:p-8 mb-5"
      style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(10,10,20,0) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}
    >
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }}
      />

      <div className="relative z-10">
        <p className="text-xs text-slate-600 uppercase tracking-widest font-mono mb-2">Career Intelligence · Active</p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-3xl sm:text-4xl font-display font-bold text-white leading-tight mb-1"
        >
          Your Future Is{' '}
          <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent"
            style={{ filter: 'drop-shadow(0 0 20px rgba(139,92,246,0.4))' }}
          >
            68% Ready.
          </span>
        </motion.h1>
        <p className="text-slate-500 text-sm mb-5">
          Targeting <span className="text-indigo-300 font-medium">{profile.targetJobRole}</span> · 27% gap remaining
        </p>

        {/* Quick stats row */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Skills', value: profile.skills.length, color: '#818cf8', icon: Zap },
            { label: 'Match Score', value: '73%', color: '#34d399', icon: TrendingUp },
            { label: 'Roadmap', value: '45%', color: '#a78bfa', icon: Map },
            { label: 'Resources', value: '12/28', color: '#fbbf24', icon: BookOpen },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: color + '10', border: `1px solid ${color}20` }}
            >
              <Icon size={11} style={{ color }} />
              <span className="text-xs font-bold" style={{ color }}>{value}</span>
              <span className="text-xs text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ── Tab navigation for center column ─────────────────────────────────────────
const CENTER_TABS = [
  { id: 'skills',   label: 'Skill Network',    icon: Activity },
  { id: 'future',   label: 'Future Projection', icon: TrendingUp },
  { id: 'resources',label: 'Resources',         icon: BookOpen },
]

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { profile } = useApp()
  const navigate = useNavigate()
  const [aiOpen, setAiOpen] = useState(true)
  const [centerTab, setCenterTab] = useState('skills')

  return (
    <div className="min-h-screen p-4 sm:p-6 relative">
      {/* Background particles */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-violet-600/8 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto">

        {/* Command Bar */}
        <CommandBar onToggleAI={() => setAiOpen(o => !o)} aiOpen={aiOpen} />

        {/* Main grid */}
        <div className={`grid gap-4 transition-all duration-300 ${aiOpen ? 'grid-cols-1 lg:grid-cols-[280px_1fr_300px]' : 'grid-cols-1 lg:grid-cols-[280px_1fr]'}`}>

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-4">
            {/* Readiness Ring */}
            <Panel title="Career Readiness" subtitle="5 dimensions analyzed" icon={Target} iconColor="#818cf8"
              action="Full Analysis" onAction={() => navigate('/skill-gap')}
            >
              <ReadinessRing />
            </Panel>

            {/* Career Match Ranking */}
            <Panel title="Career Matches" subtitle="Live probability ranking" icon={TrendingUp} iconColor="#34d399"
              action="Explore" onAction={() => navigate('/skill-gap')}
            >
              <CareerMatchRanking />
            </Panel>

            {/* Interview Prep */}
            <Panel title="Interview Prep" subtitle="Confidence assessment" icon={Zap} iconColor="#fbbf24">
              <InterviewPrep />
            </Panel>
          </div>

          {/* ── CENTER COLUMN ── */}
          <div className="space-y-4 min-w-0">
            {/* Welcome hero */}
            <WelcomeHero profile={profile} />

            {/* Tab switcher */}
            <div className="flex gap-1 p-1 rounded-2xl mb-1"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              {CENTER_TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setCenterTab(id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  style={centerTab === id
                    ? { background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }
                    : { color: '#475569', border: '1px solid transparent' }
                  }
                >
                  <Icon size={12} />{label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {centerTab === 'skills' && (
                <motion.div key="skills"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <Panel title="Skill Intelligence Hub" subtitle="Known · Missing · Connections" icon={Activity} iconColor="#818cf8"
                    action="Full Gap Analysis" onAction={() => navigate('/skill-gap')}
                  >
                    <SkillNetwork />
                  </Panel>
                </motion.div>
              )}
              {centerTab === 'future' && (
                <motion.div key="future"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <Panel title="Future Projection" subtitle="Your career evolution over 12 months" icon={TrendingUp} iconColor="#34d399">
                    <FutureProjection />
                  </Panel>
                </motion.div>
              )}
              {centerTab === 'resources' && (
                <motion.div key="resources"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <Panel title="Resource Hub" subtitle="Curated for your skill gaps" icon={BookOpen} iconColor="#a78bfa"
                    action="Browse All" onAction={() => navigate('/resources')}
                  >
                    <ResourceHub />
                  </Panel>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── RIGHT COLUMN — AI Panel ── */}
          <AnimatePresence>
            {aiOpen && (
              <motion.div
                key="ai-panel"
                initial={{ opacity: 0, x: 20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: 20, width: 0 }}
                transition={{ duration: 0.35 }}
                className="space-y-4 overflow-hidden"
              >
                {/* AI Insights */}
                <div className="rounded-3xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="p-5">
                    <AIInsightsPanel />
                  </div>
                </div>

                {/* Roadmap Timeline */}
                <Panel title="Learning Roadmap" subtitle="Your week-by-week journey" icon={Map} iconColor="#a78bfa"
                  action="Full Roadmap" onAction={() => navigate('/roadmap')}
                >
                  <RoadmapTimeline />
                </Panel>

                {/* AI Assistant Chat */}
                <div className="rounded-3xl overflow-hidden" style={{ height: '420px', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <AIAssistant collapsed={false} onToggle={() => setAiOpen(false)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating AI button when panel is closed */}
      {!aiOpen && <AIAssistant collapsed={true} onToggle={() => setAiOpen(true)} />}
    </div>
  )
}
