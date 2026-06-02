/**
 * AIInsightsPanel — dynamic insights from real API data
 */
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, TrendingUp, AlertTriangle, BookOpen, Target, X, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function AIInsightsPanel({ skillGap, readiness, roadmap }) {
  const [dismissed, setDismissed] = useState([])
  const navigate = useNavigate()

  const insights = useMemo(() => {
    const list = []
    if (skillGap) {
      const missing = skillGap.missingSkills?.required || skillGap.skillGap?.missingRequired || []
      if (missing.length > 0) {
        list.push({ id:'gap1', type:'gap', icon:AlertTriangle, color:'#fbbf24',
          title: `${missing[0]} is your highest-priority gap`,
          body: `Learning ${missing[0]} directly addresses your biggest skill gap for ${skillGap.targetRole || 'your target role'}.`,
          action:'View Gap Analysis', route:'/skill-gap' })
      }
      const match = skillGap.matchScore
      if (match !== undefined && match < 80) {
        list.push({ id:'match1', type:'opportunity', icon:TrendingUp, color:'#34d399',
          title: `${match}% match — ${100-match}% gap to close`,
          body: `You need ${missing.length} more skills to reach 100% readiness for your target role.`,
          action:'Generate Roadmap', route:'/roadmap' })
      }
    }
    if (readiness) {
      const score = readiness.score
      if (score !== undefined) {
        const breakdown = readiness.breakdown || {}
        const weakest = Object.entries(breakdown).sort((a,b) => a[1]-b[1])[0]
        if (weakest) {
          list.push({ id:'rd1', type:'skill', icon:BookOpen, color:'#818cf8',
            title: `Improve ${weakest[0].replace(/([A-Z])/g,' $1').trim()} to boost readiness`,
            body: `Your ${weakest[0].replace(/([A-Z])/g,' $1').trim()} score is ${Math.round(weakest[1])}%. Addressing this gives the highest readiness gain.`,
            action:'View Resources', route:'/resources' })
        }
      }
    }
    if (roadmap) {
      const first = roadmap.roadmap?.[0]
      if (first) {
        list.push({ id:'rm1', type:'goal', icon:Target, color:'#a78bfa',
          title: `Next: ${first.topic}`,
          body: `Your roadmap starts with ${first.topic}. ${first.description || 'This is the most important next step.'}`,
          action:'View Roadmap', route:'/roadmap' })
      }
    }
    if (list.length === 0) {
      list.push({ id:'default', type:'goal', icon:Sparkles, color:'#818cf8',
        title:'Complete your profile for AI insights',
        body:'Add your skills and target role to receive personalized AI-powered career guidance.',
        action:'Update Profile', route:'/profile' })
    }
    return list.filter(i => !dismissed.includes(i.id))
  }, [skillGap, readiness, roadmap, dismissed])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <motion.div animate={{ rotate:[0,15,-15,0] }} transition={{ duration:2, repeat:Infinity, repeatDelay:3 }}>
          <Sparkles size={14} className="text-indigo-400" />
        </motion.div>
        <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">AI Insights</span>
        <div className="ml-auto flex items-center gap-1.5">
          <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400" animate={{ opacity:[0.5,1,0.5] }} transition={{ duration:1.5, repeat:Infinity }} />
          <span className="text-xs text-emerald-500">Live</span>
        </div>
      </div>

      <AnimatePresence>
        {insights.map((insight, i) => {
          const Icon = insight.icon
          return (
            <motion.div key={insight.id} layout
              initial={{ opacity:0, y:10, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
              exit={{ opacity:0, x:20, scale:0.95 }} transition={{ delay:i*0.08, duration:0.4 }}
              className="relative rounded-2xl p-4 group"
              style={{ background: insight.color+'08', border:`1px solid ${insight.color}20` }}
            >
              <button onClick={() => setDismissed(d => [...d, insight.id])}
                className="absolute top-3 right-3 text-slate-700 hover:text-slate-400 cursor-pointer opacity-0 group-hover:opacity-100 transition-all"
              ><X size={12} /></button>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:insight.color+'15' }}>
                  <Icon size={14} style={{ color:insight.color }} />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-semibold text-slate-200 mb-1">{insight.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{insight.body}</p>
                  <button onClick={() => navigate(insight.route)}
                    className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
                    style={{ color:insight.color }}
                  >{insight.action} <ArrowRight size={11} /></button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
