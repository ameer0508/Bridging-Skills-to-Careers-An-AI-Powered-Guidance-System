import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Map, CheckCircle2, Circle, Clock, ArrowRight,
  BookOpen, Trophy, Sparkles, ChevronDown, ChevronUp,
  Play, Lock, Star
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import Button from '../components/ui/Button'

const roadmapData = [
  {
    week: 1,
    title: 'TypeScript Fundamentals',
    status: 'completed',
    progress: 100,
    duration: '5-7 hours',
    skills: ['TypeScript', 'Type System', 'Interfaces', 'Generics'],
    milestones: [
      { id: 'm1', title: 'Complete TypeScript Basics course', done: true },
      { id: 'm2', title: 'Build a typed React component library', done: true },
      { id: 'm3', title: 'Pass TypeScript assessment quiz', done: true },
    ],
    resources: ['TypeScript Deep Dive (Udemy)', 'Official TypeScript Docs'],
    badge: '🏆 TypeScript Pro',
  },
  {
    week: 2,
    title: 'System Design Fundamentals',
    status: 'in-progress',
    progress: 60,
    duration: '8-10 hours',
    skills: ['Scalability', 'Load Balancing', 'Caching', 'Databases'],
    milestones: [
      { id: 'm4', title: 'Study scalability patterns', done: true },
      { id: 'm5', title: 'Design a URL shortener system', done: true },
      { id: 'm6', title: 'Complete load balancing module', done: false },
      { id: 'm7', title: 'Mock system design interview', done: false },
    ],
    resources: ['System Design Interview (Educative)', 'Grokking System Design'],
    badge: '🏗️ System Architect',
  },
  {
    week: 3,
    title: 'Machine Learning Basics',
    status: 'upcoming',
    progress: 0,
    duration: '10-12 hours',
    skills: ['Python ML', 'Scikit-learn', 'Data Preprocessing', 'Model Evaluation'],
    milestones: [
      { id: 'm8', title: 'Complete ML fundamentals course', done: false },
      { id: 'm9', title: 'Build a classification model', done: false },
      { id: 'm10', title: 'Kaggle beginner competition', done: false },
    ],
    resources: ['Machine Learning A-Z (Udemy)', 'Fast.ai Practical ML'],
    badge: '🤖 ML Practitioner',
  },
  {
    week: 4,
    title: 'AWS Cloud Essentials',
    status: 'locked',
    progress: 0,
    duration: '12-15 hours',
    skills: ['EC2', 'S3', 'Lambda', 'RDS', 'CloudFormation'],
    milestones: [
      { id: 'm11', title: 'AWS Cloud Practitioner prep', done: false },
      { id: 'm12', title: 'Deploy a full-stack app to AWS', done: false },
      { id: 'm13', title: 'Pass AWS Cloud Practitioner exam', done: false },
    ],
    resources: ['AWS Solutions Architect (A Cloud Guru)', 'AWS Free Tier Practice'],
    badge: '☁️ Cloud Engineer',
  },
]

const statusConfig = {
  completed: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', badge: 'success', label: 'Completed' },
  'in-progress': { color: 'text-brand-400', bg: 'bg-brand-500/10', border: 'border-brand-500/20', badge: 'default', label: 'In Progress' },
  upcoming: { color: 'text-slate-400', bg: 'bg-white/5', border: 'border-white/8', badge: 'ghost', label: 'Upcoming' },
  locked: { color: 'text-slate-600', bg: 'bg-white/3', border: 'border-white/5', badge: 'ghost', label: 'Locked' },
}

export default function RoadmapPage() {
  const { profile } = useApp()
  const navigate = useNavigate()
  const [expandedWeek, setExpandedWeek] = useState(2)
  const [milestones, setMilestones] = useState(
    roadmapData.reduce((acc, week) => {
      week.milestones.forEach((m) => { acc[m.id] = m.done })
      return acc
    }, {})
  )

  const totalMilestones = roadmapData.flatMap((w) => w.milestones).length
  const completedMilestones = Object.values(milestones).filter(Boolean).length
  const overallProgress = Math.round((completedMilestones / totalMilestones) * 100)

  const toggleMilestone = (id, weekStatus) => {
    if (weekStatus === 'locked') return
    setMilestones((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-white mb-1">Learning Roadmap</h1>
              <p className="text-slate-400 text-sm">
                Personalized 4-week plan for{' '}
                <span className="text-brand-300 font-medium">{profile.targetJobRole}</span>
              </p>
            </div>
            <Button icon={Sparkles} onClick={() => {}}>
              Regenerate
            </Button>
          </div>
        </motion.div>

        {/* Overall progress */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-900/40">
                  <Map size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Overall Progress</p>
                  <p className="text-xs text-slate-500">
                    {completedMilestones} of {totalMilestones} milestones completed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {[
                  { label: 'Weeks', value: `${roadmapData.filter(w => w.status === 'completed').length}/${roadmapData.length}` },
                  { label: 'Skills', value: roadmapData.flatMap(w => w.skills).length },
                  { label: 'Hours', value: '35-44h' },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-lg font-display font-bold gradient-text">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <ProgressBar value={overallProgress} size="lg" label="Roadmap Completion" />
            </div>
          </Card>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-brand-500/40 via-brand-500/20 to-transparent hidden sm:block" />

          <div className="space-y-4">
            {roadmapData.map((week, i) => {
              const config = statusConfig[week.status]
              const isExpanded = expandedWeek === week.week
              const isLocked = week.status === 'locked'
              const weekMilestoneDone = week.milestones.filter((m) => milestones[m.id]).length

              return (
                <motion.div
                  key={week.week}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative sm:pl-16"
                >
                  {/* Timeline dot */}
                  <div className={`absolute left-3.5 top-6 w-5 h-5 rounded-full border-2 flex items-center justify-center hidden sm:flex ${
                    week.status === 'completed'
                      ? 'bg-emerald-500 border-emerald-400'
                      : week.status === 'in-progress'
                      ? 'bg-brand-500 border-brand-400 shadow-lg shadow-brand-500/40'
                      : 'bg-surface-700 border-white/10'
                  }`}>
                    {week.status === 'completed' && <CheckCircle2 size={10} className="text-white" />}
                    {week.status === 'in-progress' && (
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-white"
                      />
                    )}
                  </div>

                  {/* Week card */}
                  <div className={`glass rounded-2xl border ${config.border} overflow-hidden ${isLocked ? 'opacity-60' : ''}`}>
                    {/* Card header */}
                    <button
                      onClick={() => !isLocked && setExpandedWeek(isExpanded ? null : week.week)}
                      className={`w-full flex items-center gap-4 p-5 text-left transition-colors ${
                        !isLocked ? 'cursor-pointer hover:bg-white/3' : 'cursor-not-allowed'
                      }`}
                    >
                      {/* Week number */}
                      <div className={`w-12 h-12 rounded-xl ${config.bg} border ${config.border} flex flex-col items-center justify-center flex-shrink-0`}>
                        {isLocked ? (
                          <Lock size={16} className="text-slate-600" />
                        ) : (
                          <>
                            <span className="text-xs text-slate-500 leading-none">Week</span>
                            <span className={`text-lg font-display font-bold ${config.color} leading-none`}>{week.week}</span>
                          </>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-semibold text-slate-200">{week.title}</h3>
                          <Badge variant={config.badge} size="sm">{config.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {week.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            {weekMilestoneDone}/{week.milestones.length} milestones
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {week.status !== 'locked' && (
                          <div className="hidden sm:block w-24">
                            <ProgressBar value={week.progress} size="sm" showValue={false} color={week.status === 'completed' ? 'success' : 'brand'} />
                          </div>
                        )}
                        {!isLocked && (
                          isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />
                        )}
                      </div>
                    </button>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && !isLocked && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-5">
                            {/* Skills */}
                            <div>
                              <p className="text-xs font-medium text-slate-400 mb-2">Skills Covered</p>
                              <div className="flex flex-wrap gap-1.5">
                                {week.skills.map((skill) => (
                                  <Badge key={skill} variant="default" size="sm">{skill}</Badge>
                                ))}
                              </div>
                            </div>

                            {/* Milestones */}
                            <div>
                              <p className="text-xs font-medium text-slate-400 mb-2">Milestones</p>
                              <div className="space-y-2">
                                {week.milestones.map((milestone) => {
                                  const done = milestones[milestone.id]
                                  return (
                                    <motion.button
                                      key={milestone.id}
                                      whileHover={{ x: 2 }}
                                      onClick={() => toggleMilestone(milestone.id, week.status)}
                                      className="w-full flex items-center gap-3 text-left cursor-pointer group"
                                    >
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                        done
                                          ? 'bg-emerald-500 border-emerald-400'
                                          : 'border-white/20 group-hover:border-brand-400'
                                      }`}>
                                        {done && <CheckCircle2 size={10} className="text-white" />}
                                      </div>
                                      <span className={`text-xs transition-colors ${
                                        done ? 'text-slate-500 line-through' : 'text-slate-300 group-hover:text-slate-200'
                                      }`}>
                                        {milestone.title}
                                      </span>
                                    </motion.button>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Resources */}
                            <div>
                              <p className="text-xs font-medium text-slate-400 mb-2">Recommended Resources</p>
                              <div className="space-y-1.5">
                                {week.resources.map((res) => (
                                  <div key={res} className="flex items-center gap-2 text-xs text-slate-400">
                                    <BookOpen size={11} className="text-brand-400 flex-shrink-0" />
                                    {res}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Badge */}
                            {week.status === 'completed' && (
                              <div className="flex items-center gap-2 glass rounded-xl px-4 py-2.5 border border-amber-500/20 bg-amber-500/5">
                                <Trophy size={14} className="text-amber-400" />
                                <span className="text-xs font-semibold text-amber-300">
                                  Badge Earned: {week.badge}
                                </span>
                              </div>
                            )}

                            {week.status === 'in-progress' && (
                              <button
                                onClick={() => navigate('/resources')}
                                className="flex items-center gap-2 text-xs text-brand-400 hover:text-brand-300 transition-colors cursor-pointer"
                              >
                                <Play size={11} />
                                Continue learning — find resources
                                <ArrowRight size={11} />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex justify-end"
        >
          <Button
            size="lg"
            onClick={() => navigate('/resources')}
            iconRight={<ArrowRight size={16} />}
          >
            Browse Learning Resources
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
