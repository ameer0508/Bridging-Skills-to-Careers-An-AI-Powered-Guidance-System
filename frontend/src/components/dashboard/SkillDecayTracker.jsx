/**
 * SkillDecayTracker — real time-based skill decay visualization
 */
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

const RISK_CONFIG = {
  High:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
  Medium: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)'  },
  Low:    { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.25)'  },
}

export default function SkillDecayTracker({ decayData }) {
  if (!decayData) return (
    <div className="text-center py-8 text-slate-600 text-sm">
      <Clock size={24} className="mx-auto mb-2 opacity-30" />
      Skill decay analysis will appear after profile setup.
    </div>
  )

  const { skills = [], overallDecayScore, overallRisk, weeksInactive, recommendation, refreshPlan = [] } = decayData
  const riskCfg = RISK_CONFIG[overallRisk] || RISK_CONFIG.Low

  return (
    <div className="space-y-4">
      {/* Overall status */}
      <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: riskCfg.bg, border: `1px solid ${riskCfg.border}` }}>
        <div className="w-14 h-14 relative flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
            <motion.circle cx="28" cy="28" r="22" fill="none" stroke={riskCfg.color} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 22}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - overallDecayScore / 100) }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 4px ${riskCfg.color})` }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold" style={{ color: riskCfg.color }}>{overallDecayScore}%</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold" style={{ color: riskCfg.color }}>{overallRisk} Risk</span>
          </div>
          <p className="text-xs text-slate-400">{weeksInactive} weeks since last activity</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{recommendation}</p>
        </div>
      </div>

      {/* Per-skill decay bars */}
      {skills.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Per-Skill Health</p>
          {skills.map((s, i) => {
            const cfg = RISK_CONFIG[s.risk] || RISK_CONFIG.Low
            return (
              <motion.div key={s.skill} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-300 font-medium">{s.skill}</span>
                  <span className="text-xs font-bold" style={{ color: cfg.color }}>{s.retentionScore}% retained</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <motion.div className="h-full rounded-full" style={{ background: cfg.color }}
                    initial={{ width: 0 }} animate={{ width: `${s.retentionScore}%` }}
                    transition={{ duration: 1, delay: i * 0.06 + 0.3 }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Refresh plan */}
      {refreshPlan.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Refresh Plan</p>
          {refreshPlan.slice(0, 3).map((item, i) => {
            const cfg = RISK_CONFIG[item.risk] || RISK_CONFIG.Low
            return (
              <div key={item.skill} className="flex items-start gap-2 p-3 rounded-xl" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                <AlertTriangle size={12} style={{ color: cfg.color }} className="mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-400 leading-relaxed">{item.action}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
