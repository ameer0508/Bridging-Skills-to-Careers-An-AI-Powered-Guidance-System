/**
 * DashboardPage — AI Career Intelligence Command Center
 * Premium glassmorphism dashboard with live animated metrics
 */
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart3, Map, BookOpen, Upload, ArrowRight,
  TrendingUp, Target, Zap, Clock, CheckCircle2,
  Activity, Sparkles, ChevronRight, Star, Brain,
  Rocket, Shield, Globe
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'

const recentActivity = [
  { action: 'Profile updated', time: '2 hours ago', icon: CheckCircle2, color: '#34d399' },
  { action: 'Resume uploaded & parsed', time: '1 day ago', icon: Upload, color: '#818cf8' },
  { action: 'Skill gap analyzed', time: '2 days ago', icon: BarChart3, color: '#a78bfa' },
  { action: 'Roadmap generated', time: '2 days ago', icon: Map, color: '#60a5fa' },
]

const quickActions = [
  { label: 'Analyze Skill Gap', to: '/skill-gap', icon: BarChart3, color: 'from-brand-500 to-violet-500', desc: 'See what you\'re missing', glow: 'rgba(99,102,241,0.3)' },
  { label: 'View Roadmap', to: '/roadmap', icon: Map, color: 'from-violet-500 to-purple-500', desc: 'Your learning path', glow: 'rgba(139,92,246,0.3)' },
  { label: 'Browse Resources', to: '/resources', icon: BookOpen, color: 'from-purple-500 to-pink-500', desc: 'Courses & certs', glow: 'rgba(192,132,252,0.3)' },
  { label: 'Update Resume', to: '/resume', icon: Upload, color: 'from-emerald-500 to-teal-500', desc: 'Upload latest version', glow: 'rgba(52,211,153,0.3)' },
]

const roadmapPreview = [
  { week: 'Week 1', title: 'TypeScript Fundamentals', status: 'completed', progress: 100 },
  { week: 'Week 2', title: 'System Design Basics', status: 'in-progress', progress: 60 },
  { week: 'Week 3', title: 'Machine Learning Intro', status: 'upcoming', progress: 0 },
]

const kpis = [
  { label: 'Career Match', value: '73%', change: '+8%', icon: Target, color: '#818cf8', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.15)' },
  { label: 'Roadmap Progress', value: '45%', change: '+12%', icon: Map, color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.15)' },
  { label: 'Resources Done', value: '12', change: '+3 this week', icon: BookOpen, color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.15)' },
  { label: 'Skills in Profile', value: '8', change: 'active', icon: TrendingUp, color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.15)' },
]

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

export default function DashboardPage() {
  const { profile } = useApp()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs text-slate-600 uppercase tracking-widest mb-1">Career Intelligence</p>
              <h1 className="text-2xl font-display font-bold text-white">
                Welcome back, <span className="bg-gradient-to-r from-brand-300 to-violet-300 bg-clip-text text-transparent">{profile.fullName?.split(' ')[0] || 'Explorer'}</span> 👋
              </h1>
              <p className="text-slate-500 text-sm mt-1">Your AI career system is active and monitoring your progress.</p>
            </div>
            <motion.div
              className="flex items-center gap-2 glass rounded-xl px-4 py-2 border border-emerald-500/20"
              animate={{ boxShadow: ['0 0 0px rgba(52,211,153,0)', '0 0 15px rgba(52,211,153,0.1)', '0 0 0px rgba(52,211,153,0)'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-300 font-medium">AI Analysis Active</span>
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">

          {/* ── KPI Row ── */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(({ label, value, change, icon: Icon, color, bg, border }, i) => (
              <motion.div key={label}
                whileHover={{ y: -3, scale: 1.02 }}
                className="relative rounded-2xl p-5 overflow-hidden cursor-default"
                style={{ background: bg, border: `1px solid ${border}` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color }}>{change}</span>
                </div>
                <p className="text-2xl font-display font-bold text-white mb-0.5">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
                {/* Subtle glow */}
                <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-30" style={{ background: color }} />
              </motion.div>
            ))}
          </motion.div>

          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Profile Summary */}
            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-semibold text-slate-200">Profile Summary</h2>
                  <button onClick={() => navigate('/profile')}
                    className="text-xs text-brand-400 hover:text-brand-300 transition-colors cursor-pointer flex items-center gap-1"
                  >Edit <ChevronRight size={11} /></button>
                </div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-brand-900/40">
                      {profile.fullName?.charAt(0) || 'A'}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0a0a0f]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{profile.fullName || 'Your Name'}</p>
                    <p className="text-xs text-slate-500">{profile.email || 'email@example.com'}</p>
                  </div>
                </div>
                <div className="space-y-2.5 text-xs">
                  {[
                    { label: 'Education', value: profile.education || 'Not set' },
                    { label: 'Target Role', value: profile.targetJobRole || 'Not set' },
                    { label: 'Skills', value: `${profile.skills.length} skills added` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                      <span className="text-slate-600">{label}</span>
                      <span className="text-slate-300 font-medium text-right max-w-[140px] truncate">{value}</span>
                    </div>
                  ))}
                </div>
                {profile.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {profile.skills.slice(0, 4).map((s) => (
                      <Badge key={s} variant="default" size="sm">{s}</Badge>
                    ))}
                    {profile.skills.length > 4 && <Badge variant="ghost" size="sm">+{profile.skills.length - 4}</Badge>}
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Skill Gap Radial */}
            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-200">Skill Gap Overview</h2>
                  <button onClick={() => navigate('/skill-gap')}
                    className="text-xs text-brand-400 hover:text-brand-300 transition-colors cursor-pointer flex items-center gap-1"
                  >Full Analysis <ChevronRight size={11} /></button>
                </div>
                <div className="flex items-center justify-center mb-5">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                      <motion.circle cx="50" cy="50" r="40" fill="none" stroke="url(#sg)" strokeWidth="8"
                        strokeLinecap="round" strokeDasharray="251.2"
                        initial={{ strokeDashoffset: 251.2 }}
                        animate={{ strokeDashoffset: 251.2 * 0.27 }}
                        transition={{ duration: 1.8, ease: 'easeOut', delay: 0.4 }}
                      />
                      <defs>
                        <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-display font-bold bg-gradient-to-r from-brand-300 to-violet-300 bg-clip-text text-transparent">73%</span>
                      <span className="text-xs text-slate-600">Match</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { skill: 'TypeScript', pct: 90, color: 'success' },
                    { skill: 'System Design', pct: 61, color: 'warning' },
                    { skill: 'Machine Learning', pct: 35, color: 'danger' },
                  ].map(({ skill, pct, color }) => (
                    <ProgressBar key={skill} label={skill} value={pct} color={color} size="sm" />
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Activity + AI Insight */}
            <motion.div variants={fadeUp}>
              <Card className="h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={13} className="text-slate-500" />
                  <h2 className="text-sm font-semibold text-slate-200">Recent Activity</h2>
                </div>
                <div className="space-y-1">
                  {recentActivity.map(({ action, time, icon: Icon, color }) => (
                    <div key={action} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '15' }}>
                        <Icon size={12} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 font-medium">{action}</p>
                        <p className="text-xs text-slate-600">{time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl p-3 border border-brand-500/15 bg-brand-500/[0.06]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles size={11} className="text-brand-400" />
                    <span className="text-xs font-semibold text-brand-300">AI Insight</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    You're 27% away from your target role. Focus on System Design this week to make the biggest impact.
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* ── Roadmap Preview ── */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Map size={14} className="text-violet-400" />
                  <h2 className="text-sm font-semibold text-slate-200">Learning Roadmap</h2>
                </div>
                <button onClick={() => navigate('/roadmap')}
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors cursor-pointer flex items-center gap-1"
                >View Full <ChevronRight size={11} /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {roadmapPreview.map(({ week, title, status, progress }, i) => (
                  <motion.div key={week}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className={`rounded-2xl p-4 border transition-all ${
                      status === 'completed' ? 'bg-emerald-500/[0.06] border-emerald-500/20'
                      : status === 'in-progress' ? 'bg-brand-500/[0.06] border-brand-500/20'
                      : 'bg-white/[0.02] border-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-600">{week}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                        status === 'completed' ? 'text-emerald-400 bg-emerald-500/10'
                        : status === 'in-progress' ? 'text-brand-400 bg-brand-500/10'
                        : 'text-slate-600 bg-white/5'
                      }`}>
                        {status === 'completed' ? '✓ Done' : status === 'in-progress' ? '● Active' : '○ Next'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-200 mb-3">{title}</p>
                    <ProgressBar value={progress} size="sm" showValue={false} color={status === 'completed' ? 'success' : 'brand'} />
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* ── Quick Actions ── */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center gap-2 mb-5">
                <Zap size={13} className="text-brand-400" />
                <h2 className="text-sm font-semibold text-slate-200">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {quickActions.map(({ label, to, icon: Icon, color, desc, glow }) => (
                  <motion.button key={label}
                    whileHover={{ y: -4, boxShadow: `0 8px 30px ${glow}` }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(to)}
                    className="glass rounded-2xl p-4 border border-white/[0.05] hover:border-white/10 text-left transition-all cursor-pointer group"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg`}>
                      <Icon size={17} className="text-white" />
                    </div>
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">{label}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{desc}</p>
                  </motion.button>
                ))}
              </div>
            </Card>
          </motion.div>

        </motion.div>
      </div>
    </div>
  )
}
