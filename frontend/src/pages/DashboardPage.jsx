/**
 * DashboardPage — AI Career Intelligence OS
 * All data fetched from real APIs on mount. No hardcoded values.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Bell, Sparkles, ChevronRight, Zap,
  BarChart3, Map, BookOpen, Target, TrendingUp,
  Activity, RefreshCw, Briefcase, Code2, AlertTriangle
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
import JobRecommendations from '../components/dashboard/JobRecommendations'
import ProjectRecommendations from '../components/dashboard/ProjectRecommendations'
import SkillDecayTracker  from '../components/dashboard/SkillDecayTracker'

// ── Panel ──────────────────────────────────────────────────────
function Panel({ title, subtitle, icon: Icon, iconColor = '#818cf8', children, action, onAction }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="rounded-3xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
    >
      {title && (
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            {Icon && <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconColor + '15' }}><Icon size={13} style={{ color: iconColor }} /></div>}
            <div>
              <p className="text-sm font-bold text-slate-200">{title}</p>
              {subtitle && <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <button onClick={onAction} className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer flex items-center gap-1">{action} <ChevronRight size={11} /></button>}
        </div>
      )}
      <div className={title ? 'px-5 pb-5' : 'p-5'}>{children}</div>
    </motion.div>
  )
}

// ── Loading skeleton ───────────────────────────────────────────
function LoadingSkeleton({ lines = 3 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  )
}

// ── Command Bar ────────────────────────────────────────────────
function CommandBar({ onToggleAI, aiOpen, readiness, dashboardLoading, onRefresh }) {
  const { profile } = useApp()
  const navigate = useNavigate()
  const score = readiness?.score ?? null

  return (
    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-6"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="relative flex-1 max-w-xs">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
        <input placeholder="Search skills, roles, resources..." className="w-full pl-8 pr-3 py-2 rounded-xl text-xs text-slate-300 placeholder-slate-700 focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }} />
      </div>

      <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
        <Target size={11} className="text-indigo-400" />
        <span className="text-xs text-indigo-300 font-medium max-w-[120px] truncate">{profile.targetJobRole || 'Set your goal'}</span>
      </div>

      <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
        <motion.div className="w-2 h-2 rounded-full bg-emerald-400" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <span className="text-xs text-emerald-300 font-bold">
          {dashboardLoading ? 'Loading...' : score !== null ? `${score}% Ready` : 'Not analyzed'}
        </span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onRefresh}
          disabled={dashboardLoading}
          className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-40"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          title="Refresh AI data"
        >
          <motion.div animate={dashboardLoading ? { rotate: 360 } : {}} transition={{ duration: 1, repeat: dashboardLoading ? Infinity : 0, ease: 'linear' }}>
            <RefreshCw size={13} className="text-slate-400" />
          </motion.div>
        </motion.button>

        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onToggleAI}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          style={aiOpen ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc' }
                        : { background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}
        >
          <Sparkles size={12} /><span className="hidden sm:inline">AI Mentor</span>
        </motion.button>

        <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white cursor-pointer" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          {profile.fullName?.charAt(0) || 'A'}
        </button>
      </div>
    </motion.div>
  )
}

// ── Welcome Hero ───────────────────────────────────────────────
function WelcomeHero({ profile, readiness, skillGap, roadmap, resources, dashboardLoading }) {
  const navigate = useNavigate()
  const score = readiness?.score ?? null
  const matchScore = skillGap?.matchScore ?? null
  const totalWeeks = roadmap?.totalWeeks ?? null
  const resourceCount = Array.isArray(resources) ? resources.length : 0

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="relative rounded-3xl overflow-hidden p-6 sm:p-8 mb-5"
      style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(10,10,20,0) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}
    >
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
      <div className="relative z-10">
        <p className="text-xs text-slate-600 uppercase tracking-widest font-mono mb-2">Career Intelligence · Active</p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-3xl sm:text-4xl font-display font-bold text-white leading-tight mb-1"
        >
          {dashboardLoading ? 'Analyzing your profile...' : score !== null ? (
            <>Your Future Is <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent" style={{ filter: 'drop-shadow(0 0 20px rgba(139,92,246,0.4))' }}>{score}% Ready.</span></>
          ) : 'Welcome back.'}
        </motion.h1>
        <p className="text-slate-500 text-sm mb-5">
          Targeting <span className="text-indigo-300 font-medium">{profile.targetJobRole || 'your career goal'}</span>
          {matchScore !== null && ` · ${100 - matchScore}% gap remaining`}
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Skills',      value: profile.skills.length,                          color: '#818cf8', icon: Zap },
            { label: 'Match Score', value: matchScore !== null ? `${matchScore}%` : '—',   color: '#34d399', icon: TrendingUp },
            { label: 'Roadmap',     value: totalWeeks !== null ? `${totalWeeks} weeks` : '—', color: '#a78bfa', icon: Map },
            { label: 'Resources',   value: resourceCount > 0 ? resourceCount : '—',        color: '#fbbf24', icon: BookOpen },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: color + '10', border: `1px solid ${color}20` }}>
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

const CENTER_TABS = [
  { id: 'skills',    label: 'Skill Network',    icon: Activity  },
  { id: 'future',   label: 'Future Projection', icon: TrendingUp },
  { id: 'jobs',     label: 'Job Matches',       icon: Briefcase  },
  { id: 'projects', label: 'Projects',          icon: Code2      },
  { id: 'decay',    label: 'Skill Health',      icon: AlertTriangle },
  { id: 'resources',label: 'Resources',         icon: BookOpen   },
]

// ── Main ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const {
    profile, readiness, skillGap, roadmap, careerMatches, interviewQuestions,
    resources, jobRecs, projectRecs, decayData,
    dashboardLoading, fetchAllDashboardData,
  } = useApp()
  const navigate = useNavigate()
  const [aiOpen, setAiOpen] = useState(true)
  const [centerTab, setCenterTab] = useState('skills')

  const handleRefresh = () => {
    if (profile.skills.length && profile.targetJobRole) {
      fetchAllDashboardData(profile.skills, profile.targetJobRole)
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 relative">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-violet-600/8 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto">
        <CommandBar onToggleAI={() => setAiOpen(o => !o)} aiOpen={aiOpen} readiness={readiness} dashboardLoading={dashboardLoading} onRefresh={handleRefresh} />

        <div className={`grid gap-4 ${aiOpen ? 'grid-cols-1 lg:grid-cols-[280px_1fr_300px]' : 'grid-cols-1 lg:grid-cols-[280px_1fr]'}`}>

          {/* LEFT */}
          <div className="space-y-4">
            <Panel title="Career Readiness" subtitle="5 dimensions analyzed" icon={Target} iconColor="#818cf8" action="Full Analysis" onAction={() => navigate('/skill-gap')}>
              {dashboardLoading && !readiness ? <LoadingSkeleton lines={5} /> : <ReadinessRing readiness={readiness} />}
            </Panel>
            <Panel title="Career Matches" subtitle="Live AI ranking" icon={TrendingUp} iconColor="#34d399" action="Explore" onAction={() => navigate('/skill-gap')}>
              {dashboardLoading && !careerMatches.length ? <LoadingSkeleton /> : <CareerMatchRanking matches={careerMatches} />}
            </Panel>
            <Panel title="Interview Prep" subtitle="Role-specific questions" icon={Zap} iconColor="#fbbf24">
              {dashboardLoading && !interviewQuestions.length ? <LoadingSkeleton /> : <InterviewPrep questions={interviewQuestions} targetRole={profile.targetJobRole} />}
            </Panel>
          </div>

          {/* CENTER */}
          <div className="space-y-4 min-w-0">
            <WelcomeHero profile={profile} readiness={readiness} skillGap={skillGap} roadmap={roadmap} resources={resources} dashboardLoading={dashboardLoading} />

            {/* Tab bar */}
            <div className="flex gap-1 p-1 rounded-2xl overflow-x-auto" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              {CENTER_TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setCenterTab(id)}
                  className="flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  style={centerTab === id ? { background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' } : { color: '#475569', border: '1px solid transparent' }}
                >
                  <Icon size={11} />{label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {centerTab === 'skills' && (
                <motion.div key="skills" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <Panel title="Skill Intelligence Hub" subtitle="Known · Missing · Connections" icon={Activity} iconColor="#818cf8" action="Full Analysis" onAction={() => navigate('/skill-gap')}>
                    <SkillNetwork skillGap={skillGap} userSkills={profile.skills} />
                  </Panel>
                </motion.div>
              )}
              {centerTab === 'future' && (
                <motion.div key="future" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <Panel title="Future Projection" subtitle="Your career evolution" icon={TrendingUp} iconColor="#34d399">
                    <FutureProjection readiness={readiness} />
                  </Panel>
                </motion.div>
              )}
              {centerTab === 'jobs' && (
                <motion.div key="jobs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <Panel title="Job Recommendations" subtitle="Matched to your skills" icon={Briefcase} iconColor="#60a5fa">
                    {dashboardLoading && !jobRecs.length ? <LoadingSkeleton lines={4} /> : <JobRecommendations jobs={jobRecs} />}
                  </Panel>
                </motion.div>
              )}
              {centerTab === 'projects' && (
                <motion.div key="projects" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <Panel title="Project Recommendations" subtitle="Build what you need to learn" icon={Code2} iconColor="#a78bfa">
                    {dashboardLoading && !projectRecs.length ? <LoadingSkeleton lines={4} /> : <ProjectRecommendations projects={projectRecs} />}
                  </Panel>
                </motion.div>
              )}
              {centerTab === 'decay' && (
                <motion.div key="decay" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <Panel title="Skill Health Tracker" subtitle="Detect and prevent skill decay" icon={AlertTriangle} iconColor="#f87171">
                    {dashboardLoading && !decayData ? <LoadingSkeleton lines={4} /> : <SkillDecayTracker decayData={decayData} />}
                  </Panel>
                </motion.div>
              )}
              {centerTab === 'resources' && (
                <motion.div key="resources" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <Panel title="Resource Hub" subtitle="Curated for your skill gaps" icon={BookOpen} iconColor="#a78bfa" action="Browse All" onAction={() => navigate('/resources')}>
                    <ResourceHub resources={resources} loading={dashboardLoading} />
                  </Panel>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT — AI Panel */}
          <AnimatePresence>
            {aiOpen && (
              <motion.div key="ai-panel" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.35 }} className="space-y-4">
                <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="p-5"><AIInsightsPanel skillGap={skillGap} readiness={readiness} roadmap={roadmap} /></div>
                </div>
                <Panel title="Learning Roadmap" subtitle="Week-by-week journey" icon={Map} iconColor="#a78bfa" action="Full Roadmap" onAction={() => navigate('/roadmap')}>
                  {dashboardLoading && !roadmap ? <LoadingSkeleton lines={3} /> : <RoadmapTimeline roadmap={roadmap} />}
                </Panel>
                <div className="rounded-3xl overflow-hidden" style={{ height: '420px', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <AIAssistant collapsed={false} onToggle={() => setAiOpen(false)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {!aiOpen && <AIAssistant collapsed={true} onToggle={() => setAiOpen(true)} />}
    </div>
  )
}
