import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3, CheckCircle2, XCircle, AlertCircle,
  ArrowRight, Sparkles, TrendingUp, Target, Zap,
  ChevronDown, ChevronUp
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import Button from '../components/ui/Button'

const currentSkillsData = [
  { name: 'JavaScript', level: 90, category: 'Frontend' },
  { name: 'React', level: 85, category: 'Frontend' },
  { name: 'HTML/CSS', level: 92, category: 'Frontend' },
  { name: 'Node.js', level: 70, category: 'Backend' },
  { name: 'Git', level: 88, category: 'Tools' },
  { name: 'SQL', level: 65, category: 'Database' },
  { name: 'Python', level: 55, category: 'Backend' },
  { name: 'Docker', level: 45, category: 'DevOps' },
]

const requiredSkillsData = [
  { name: 'TypeScript', required: 85, current: 60, priority: 'high' },
  { name: 'System Design', required: 80, current: 40, priority: 'high' },
  { name: 'Machine Learning', required: 70, current: 25, priority: 'high' },
  { name: 'AWS/Cloud', required: 75, current: 35, priority: 'medium' },
  { name: 'GraphQL', required: 65, current: 30, priority: 'medium' },
  { name: 'Kubernetes', required: 60, current: 20, priority: 'medium' },
  { name: 'CI/CD', required: 70, current: 50, priority: 'low' },
  { name: 'Microservices', required: 75, current: 45, priority: 'low' },
]

const missingSkills = [
  { name: 'TypeScript', importance: 'Critical', reason: 'Required for 94% of Senior Full Stack roles' },
  { name: 'System Design', importance: 'Critical', reason: 'Core interview topic for senior positions' },
  { name: 'Machine Learning', importance: 'High', reason: 'Increasingly required for full stack AI roles' },
  { name: 'AWS/Cloud', importance: 'High', reason: 'Cloud deployment is standard at senior level' },
  { name: 'GraphQL', importance: 'Medium', reason: 'Modern API standard replacing REST in many stacks' },
  { name: 'Kubernetes', importance: 'Medium', reason: 'Container orchestration for production systems' },
]

const importanceColors = {
  Critical: 'danger',
  High: 'warning',
  Medium: 'info',
  Low: 'ghost',
}

const priorityColors = {
  high: { bar: 'danger', badge: 'danger' },
  medium: { bar: 'warning', badge: 'warning' },
  low: { bar: 'info', badge: 'info' },
}

export default function SkillGapPage() {
  const { profile } = useApp()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedSkill, setExpandedSkill] = useState(null)

  const matchScore = 73
  const circumference = 2 * Math.PI * 54

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'current', label: 'Current Skills' },
    { id: 'required', label: 'Required Skills' },
    { id: 'missing', label: 'Missing Skills' },
  ]

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-white mb-1">Skill Gap Analysis</h1>
              <p className="text-slate-400 text-sm">
                AI-powered analysis for{' '}
                <span className="text-brand-300 font-medium">{profile.targetJobRole}</span>
              </p>
            </div>
            <Button icon={Zap} onClick={() => {}}>
              Re-analyze
            </Button>
          </div>
        </motion.div>

        {/* Score cards row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          {[
            { label: 'Match Score', value: `${matchScore}%`, icon: Target, color: 'text-brand-400', bg: 'bg-brand-500/10', border: 'border-brand-500/15' },
            { label: 'Skills Matched', value: `${currentSkillsData.length}/${currentSkillsData.length + missingSkills.length}`, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15' },
            { label: 'Skills Missing', value: `${missingSkills.length}`, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/15' },
            { label: 'Critical Gaps', value: '2', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/15' },
          ].map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className={`glass rounded-2xl p-4 border ${border}`}>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                <Icon size={15} className={color} />
              </div>
              <p className={`text-xl font-display font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-1 glass rounded-xl p-1 border border-white/5 mb-6 overflow-x-auto"
        >
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 min-w-max px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === id
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/25'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Circular score */}
              <Card>
                <h2 className="text-sm font-semibold text-slate-200 mb-5">Overall Match Score</h2>
                <div className="flex items-center gap-8">
                  <div className="relative w-36 h-36 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                      <motion.circle
                        cx="60" cy="60" r="54" fill="none"
                        stroke="url(#mainGrad)" strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference * (1 - matchScore / 100) }}
                        transition={{ duration: 1.8, ease: 'easeOut', delay: 0.3 }}
                      />
                      <defs>
                        <linearGradient id="mainGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-3xl font-display font-bold gradient-text"
                      >
                        {matchScore}%
                      </motion.span>
                      <span className="text-xs text-slate-500">Match</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    {[
                      { label: 'Strong Skills', count: 5, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                      { label: 'Developing Skills', count: 3, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                      { label: 'Missing Skills', count: 6, color: 'text-red-400', bg: 'bg-red-500/10' },
                    ].map(({ label, count, color, bg }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">{label}</span>
                        <span className={`text-sm font-bold ${color} ${bg} px-2 py-0.5 rounded-lg`}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 glass rounded-xl p-3 border border-brand-500/15">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={12} className="text-brand-400" />
                    <span className="text-xs font-semibold text-brand-300">AI Assessment</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    You're well-positioned for this role. Focus on TypeScript and System Design to
                    close the most critical gaps and significantly boost your match score.
                  </p>
                </div>
              </Card>

              {/* Gap breakdown */}
              <Card>
                <h2 className="text-sm font-semibold text-slate-200 mb-5">Gap Breakdown by Priority</h2>
                <div className="space-y-4">
                  {requiredSkillsData.slice(0, 6).map(({ name, required, current, priority }) => {
                    const gap = required - current
                    return (
                      <div key={name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-slate-300 font-medium">{name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={priorityColors[priority].badge} size="sm">
                              {priority}
                            </Badge>
                            <span className="text-xs text-slate-500">Gap: {gap}%</span>
                          </div>
                        </div>
                        <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                          {/* Required level */}
                          <div
                            className="absolute top-0 left-0 h-full rounded-full bg-white/10"
                            style={{ width: `${required}%` }}
                          />
                          {/* Current level */}
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${current}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                            className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${
                              priority === 'high'
                                ? 'from-red-500 to-rose-400'
                                : priority === 'medium'
                                ? 'from-amber-500 to-orange-400'
                                : 'from-sky-500 to-blue-400'
                            }`}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-slate-600 mt-1">
                          <span>Current: {current}%</span>
                          <span>Required: {required}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </motion.div>
          )}

          {/* CURRENT SKILLS TAB */}
          {activeTab === 'current' && (
            <motion.div
              key="current"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <Card>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-semibold text-slate-200">Your Current Skills</h2>
                  <Badge variant="success">{currentSkillsData.length} skills</Badge>
                </div>
                <div className="space-y-4">
                  {currentSkillsData.map(({ name, level, category }, i) => (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-200 font-medium">{name}</span>
                          <Badge variant="ghost" size="sm">{category}</Badge>
                        </div>
                        <span className="text-sm font-bold text-slate-300">{level}%</span>
                      </div>
                      <ProgressBar
                        value={level}
                        color={level >= 80 ? 'success' : level >= 60 ? 'brand' : 'warning'}
                        size="md"
                        showValue={false}
                      />
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* REQUIRED SKILLS TAB */}
          {activeTab === 'required' && (
            <motion.div
              key="required"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <Card>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-semibold text-slate-200">
                    Required for {profile.targetJobRole}
                  </h2>
                  <Badge variant="default">{requiredSkillsData.length} skills</Badge>
                </div>
                <div className="space-y-5">
                  {requiredSkillsData.map(({ name, required, current, priority }, i) => (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass rounded-xl p-4 border border-white/5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-slate-200">{name}</span>
                        <Badge variant={priorityColors[priority].badge} size="sm">
                          {priority} priority
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-500 mb-1.5">Your Level</p>
                          <ProgressBar value={current} color={current >= 60 ? 'success' : 'danger'} size="sm" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1.5">Required Level</p>
                          <ProgressBar value={required} color="brand" size="sm" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* MISSING SKILLS TAB */}
          {activeTab === 'missing' && (
            <motion.div
              key="missing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <Card>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-semibold text-slate-200">Skills to Acquire</h2>
                  <Badge variant="danger">{missingSkills.length} gaps</Badge>
                </div>
                <div className="space-y-3">
                  {missingSkills.map(({ name, importance, reason }, i) => (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="glass rounded-xl border border-white/5 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedSkill(expandedSkill === name ? null : name)}
                        className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-white/3 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <XCircle size={15} className="text-red-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-slate-200">{name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={importanceColors[importance]} size="sm">{importance}</Badge>
                          {expandedSkill === name ? (
                            <ChevronUp size={14} className="text-slate-500" />
                          ) : (
                            <ChevronDown size={14} className="text-slate-500" />
                          )}
                        </div>
                      </button>
                      <AnimatePresence>
                        {expandedSkill === name && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 border-t border-white/5 pt-3">
                              <p className="text-xs text-slate-400 leading-relaxed mb-3">{reason}</p>
                              <button
                                onClick={() => navigate('/resources')}
                                className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                Find learning resources <ArrowRight size={11} />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex justify-end"
        >
          <Button
            size="lg"
            onClick={() => navigate('/roadmap')}
            iconRight={<ArrowRight size={16} />}
          >
            Generate Learning Roadmap
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
