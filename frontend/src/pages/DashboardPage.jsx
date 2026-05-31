import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart3, Map, BookOpen, Upload, ArrowRight,
  TrendingUp, Target, Zap, Clock, CheckCircle2,
  Activity, Sparkles, ChevronRight, Star
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import Button from '../components/ui/Button'

const recentActivity = [
  { action: 'Profile updated', time: '2 hours ago', icon: CheckCircle2, color: 'text-emerald-400' },
  { action: 'Resume uploaded', time: '1 day ago', icon: Upload, color: 'text-brand-400' },
  { action: 'Skill gap analyzed', time: '2 days ago', icon: BarChart3, color: 'text-accent-400' },
  { action: 'Roadmap generated', time: '2 days ago', icon: Map, color: 'text-blue-400' },
]

const quickActions = [
  { label: 'Analyze Skill Gap', to: '/skill-gap', icon: BarChart3, color: 'from-brand-500 to-accent-500', desc: 'See what you\'re missing' },
  { label: 'View Roadmap', to: '/roadmap', icon: Map, color: 'from-accent-500 to-purple-500', desc: 'Your learning path' },
  { label: 'Browse Resources', to: '/resources', icon: BookOpen, color: 'from-purple-500 to-pink-500', desc: 'Courses & certs' },
  { label: 'Update Resume', to: '/resume', icon: Upload, color: 'from-emerald-500 to-teal-500', desc: 'Upload latest version' },
]

const roadmapPreview = [
  { week: 'Week 1', title: 'TypeScript Fundamentals', status: 'completed', progress: 100 },
  { week: 'Week 2', title: 'System Design Basics', status: 'in-progress', progress: 60 },
  { week: 'Week 3', title: 'Machine Learning Intro', status: 'upcoming', progress: 0 },
]

const recommendedResources = [
  { title: 'TypeScript Deep Dive', platform: 'Udemy', type: 'Course', rating: 4.8, duration: '12h', color: 'from-blue-500 to-brand-500' },
  { title: 'System Design Interview', platform: 'Educative', type: 'Course', rating: 4.9, duration: '20h', color: 'from-brand-500 to-accent-500' },
  { title: 'AWS Solutions Architect', platform: 'AWS', type: 'Certification', rating: 4.7, duration: '40h', color: 'from-accent-500 to-purple-500' },
]

export default function DashboardPage() {
  const { profile } = useApp()
  const navigate = useNavigate()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Welcome back,</p>
              <h1 className="text-2xl font-display font-bold text-white">
                {profile.fullName} 👋
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Here's your career intelligence overview.
              </p>
            </div>
            <div className="flex items-center gap-2 glass rounded-xl px-3 py-2 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-300 font-medium">AI Analysis Active</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* KPI Row */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Skill Match', value: '73%', change: '+8%', icon: Target, color: 'text-brand-400', bg: 'bg-brand-500/10', border: 'border-brand-500/15' },
              { label: 'Roadmap Progress', value: '45%', change: '+12%', icon: Map, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15' },
              { label: 'Resources Done', value: '12', change: '+3 this week', icon: BookOpen, color: 'text-accent-400', bg: 'bg-accent-500/10', border: 'border-accent-500/15' },
              { label: 'Skills Added', value: `${profile.skills.length}`, change: 'in profile', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/15' },
            ].map(({ label, value, change, icon: Icon, color, bg, border }) => (
              <div key={label} className={`glass rounded-2xl p-5 border ${border}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon size={16} className={color} />
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">{change}</span>
                </div>
                <p className={`text-2xl font-display font-bold ${color} mb-0.5`}>{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </motion.div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Summary */}
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-200">Profile Summary</h2>
                  <button
                    onClick={() => navigate('/profile')}
                    className="text-xs text-brand-400 hover:text-brand-300 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    Edit <ChevronRight size={12} />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-brand-900/40">
                    {profile.fullName?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{profile.fullName}</p>
                    <p className="text-xs text-slate-500">{profile.email}</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-slate-500">Education</span>
                    <span className="text-slate-300 font-medium text-right max-w-[140px] truncate">{profile.education}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-slate-500">Target Role</span>
                    <span className="text-slate-300 font-medium text-right max-w-[140px] truncate">{profile.targetJobRole}</span>
                  </div>
                  <div className="py-2">
                    <span className="text-slate-500 block mb-2">Current Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.slice(0, 5).map((s) => (
                        <Badge key={s} variant="default" size="sm">{s}</Badge>
                      ))}
                      {profile.skills.length > 5 && (
                        <Badge variant="ghost" size="sm">+{profile.skills.length - 5}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Skill Gap Preview */}
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-200">Skill Gap Overview</h2>
                  <button
                    onClick={() => navigate('/skill-gap')}
                    className="text-xs text-brand-400 hover:text-brand-300 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    Full Analysis <ChevronRight size={12} />
                  </button>
                </div>

                {/* Circular score placeholder */}
                <div className="flex items-center justify-center mb-5">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                      <motion.circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="url(#scoreGrad)" strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="251.2"
                        initial={{ strokeDashoffset: 251.2 }}
                        animate={{ strokeDashoffset: 251.2 * (1 - 0.73) }}
                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                      />
                      <defs>
                        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-display font-bold gradient-text">73%</span>
                      <span className="text-xs text-slate-500">Match</span>
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

            {/* Recent Activity */}
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={14} className="text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-200">Recent Activity</h2>
                </div>
                <div className="space-y-3">
                  {recentActivity.map(({ action, time, icon: Icon, color }) => (
                    <div key={action} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <Icon size={13} className={color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 font-medium">{action}</p>
                        <p className="text-xs text-slate-600">{time}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="glass rounded-xl p-3 border border-brand-500/15">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles size={12} className="text-brand-400" />
                      <span className="text-xs font-semibold text-brand-300">AI Insight</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      You're 27% away from your target role. Focus on System Design this week.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Roadmap Preview */}
          <motion.div variants={itemVariants}>
            <Card>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Map size={15} className="text-accent-400" />
                  <h2 className="text-sm font-semibold text-slate-200">Learning Roadmap Preview</h2>
                </div>
                <button
                  onClick={() => navigate('/roadmap')}
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors cursor-pointer flex items-center gap-1"
                >
                  View Full Roadmap <ChevronRight size={12} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {roadmapPreview.map(({ week, title, status, progress }, i) => (
                  <motion.div
                    key={week}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className={`rounded-xl p-4 border transition-all ${
                      status === 'completed'
                        ? 'bg-emerald-500/8 border-emerald-500/20'
                        : status === 'in-progress'
                        ? 'bg-brand-500/8 border-brand-500/20'
                        : 'bg-white/3 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-500">{week}</span>
                      <Badge
                        variant={status === 'completed' ? 'success' : status === 'in-progress' ? 'default' : 'ghost'}
                        size="sm"
                      >
                        {status === 'completed' ? '✓ Done' : status === 'in-progress' ? 'Active' : 'Upcoming'}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-slate-200 mb-3">{title}</p>
                    <ProgressBar value={progress} size="sm" showValue={false} color={status === 'completed' ? 'success' : 'brand'} />
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <motion.div variants={itemVariants}>
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={14} className="text-brand-400" />
                  <h2 className="text-sm font-semibold text-slate-200">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map(({ label, to, icon: Icon, color, desc }) => (
                    <motion.button
                      key={label}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(to)}
                      className="glass rounded-xl p-4 border border-white/5 hover:border-white/10 text-left transition-all cursor-pointer group"
                    >
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg`}>
                        <Icon size={16} className="text-white" />
                      </div>
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">{label}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{desc}</p>
                    </motion.button>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Recommended Resources */}
            <motion.div variants={itemVariants}>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-accent-400" />
                    <h2 className="text-sm font-semibold text-slate-200">Recommended Resources</h2>
                  </div>
                  <button
                    onClick={() => navigate('/resources')}
                    className="text-xs text-brand-400 hover:text-brand-300 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    View All <ChevronRight size={12} />
                  </button>
                </div>
                <div className="space-y-3">
                  {recommendedResources.map(({ title, platform, type, rating, duration, color }) => (
                    <div key={title} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0 group cursor-pointer">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
                        <BookOpen size={14} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors truncate">{title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-500">{platform}</span>
                          <span className="text-slate-700">·</span>
                          <span className="text-xs text-slate-500">{duration}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={type === 'Certification' ? 'warning' : 'default'} size="sm">{type}</Badge>
                        <div className="flex items-center gap-1">
                          <Star size={10} className="text-amber-400 fill-amber-400" />
                          <span className="text-xs text-slate-500">{rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
