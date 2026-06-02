/**
 * JobRecommendations — real API-powered job matching
 */
import { motion } from 'framer-motion'
import { Briefcase, MapPin, DollarSign, Target } from 'lucide-react'

const DIFF_COLOR = { Low: '#34d399', Medium: '#fbbf24', High: '#f87171' }

export default function JobRecommendations({ jobs = [] }) {
  if (!jobs.length) return (
    <div className="text-center py-8 text-slate-600 text-sm">
      <Briefcase size={24} className="mx-auto mb-2 opacity-30" />
      Complete your profile to see personalized job matches.
    </div>
  )

  return (
    <div className="space-y-3">
      {jobs.slice(0, 6).map((job, i) => (
        <motion.div key={`${job.title}-${i}`}
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
          className="rounded-2xl p-4 group hover:bg-white/[0.03] transition-all"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{job.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{job.company}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-sm font-bold" style={{ color: job.match >= 70 ? '#34d399' : job.match >= 40 ? '#fbbf24' : '#f87171' }}>
                {job.match}%
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-lg font-medium" style={{ background: (DIFF_COLOR[job.difficulty] || '#818cf8') + '15', color: DIFF_COLOR[job.difficulty] || '#818cf8' }}>
                {job.difficulty}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600 mb-2">
            <span className="flex items-center gap-1"><MapPin size={10} />{job.location}</span>
            <span className="flex items-center gap-1"><DollarSign size={10} />{job.salary}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <motion.div className="h-full rounded-full" style={{ background: job.match >= 70 ? '#34d399' : job.match >= 40 ? '#fbbf24' : '#f87171' }}
              initial={{ width: 0 }} animate={{ width: `${job.match}%` }}
              transition={{ duration: 1, delay: i * 0.07 + 0.3 }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  )
}
