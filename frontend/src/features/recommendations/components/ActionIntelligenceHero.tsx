import React from 'react';
import { Sparkles, RefreshCw, Zap, Target, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ActionIntelligenceHeroProps {
  userName?: string;
  targetRole?: string;
  careerDomain?: string;
  readinessScore?: number;
  criticalGapsCount?: number;
  topRecommendation?: {
    _id: string;
    title: string;
    category: string;
    impact: number;
    difficulty: string;
    estimatedTime: string;
    targetSkill?: string;
    reason?: string;
  };
  isRegenerating?: boolean;
  onRegenerate?: () => void;
  onSelectTopAction?: (id: string) => void;
}

export const ActionIntelligenceHero: React.FC<ActionIntelligenceHeroProps> = ({
  targetRole = 'Senior AI Engineer',
  careerDomain = 'Artificial Intelligence & Systems',
  readinessScore = 74,
  criticalGapsCount = 3,
  topRecommendation,
  isRegenerating = false,
  onRegenerate,
  onSelectTopAction,
}) => {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/15 bg-slate-950/85 backdrop-blur-2xl p-6 sm:p-8 lg:p-10 shadow-2xl shadow-black/80">
      {/* Ambient Radial Mesh Lighting */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-linear-to-bl from-amber-500/20 via-indigo-600/15 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-[32rem] h-[32rem] rounded-full bg-linear-to-tr from-cyan-500/20 via-purple-600/15 to-transparent blur-3xl" />

      <div className="relative z-10 space-y-8">
        {/* Top Bar: Subsystem Badge + Recalculate Trigger */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Zap className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-300">
                  Intelligence Becoming Action
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Real-time gap mitigation & high-leverage execution roadmap
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="group px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/15 hover:border-amber-500/40 text-xs font-mono font-bold text-slate-200 hover:text-white flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-black/40 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-amber-400 transition-transform ${
                    isRegenerating ? 'animate-spin' : 'group-hover:rotate-180 duration-500'
                  }`}
                />
                <span>{isRegenerating ? 'Re-evaluating Intelligence...' : 'Re-evaluate Recommendations'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Hero Body: Personalized Greeting & Trajectory Focus */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                Target Trajectory • {targetRole}
              </span>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Your Next Strategic{' '}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 via-purple-300 to-cyan-400">
                  Moves
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans max-w-2xl">
                The career intelligence engine has analyzed your skills against market requirements in{' '}
                <span className="text-indigo-300 font-semibold">{careerDomain}</span>. The actions below represent
                the shortest, highest-leverage path to close your remaining{' '}
                <span className="text-amber-300 font-mono font-bold">{criticalGapsCount} skill deltas</span> and
                maximize recruiter callback velocity.
              </p>
            </div>

            {/* Trajectory Highlights Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 flex items-center gap-2">
                <span className="text-slate-400">Current readiness:</span>
                <span className="text-emerald-400 font-bold">{readinessScore}%</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 flex items-center gap-2">
                <span className="text-slate-400">Critical Skill Gaps:</span>
                <span className="text-rose-400 font-bold">{criticalGapsCount} Active</span>
              </div>
            </div>
          </div>

          {/* Right Spotlight: #1 Strategic Priority Action */}
          {topRecommendation ? (
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative p-5 sm:p-6 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-slate-900/90 to-indigo-950/40 shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    #1 Highest Leverage Action
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                    Gap impact {topRecommendation.impact}/100
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-display text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                    {topRecommendation.title}
                  </h3>
                  {topRecommendation.reason && (
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      💡 {topRecommendation.reason}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-white/5 space-y-0.5">
                    <span className="text-slate-500 text-[9px] block uppercase">Category</span>
                    <span className="text-indigo-300 font-bold truncate block">{topRecommendation.category}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-white/5 space-y-0.5">
                    <span className="text-slate-500 text-[9px] block uppercase">Difficulty</span>
                    <span className="text-purple-300 font-bold block">{topRecommendation.difficulty}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-white/5 space-y-0.5">
                    <span className="text-slate-500 text-[9px] block uppercase">Est. Time</span>
                    <span className="text-cyan-300 font-bold block">{topRecommendation.estimatedTime}</span>
                  </div>
                </div>

                {onSelectTopAction && (
                  <button
                    onClick={() => onSelectTopAction(topRecommendation._id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <span>Execute Top Priority Move</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            </div>
          ) : (
            <div className="lg:col-span-5 p-6 rounded-2xl border border-white/10 bg-slate-900/60 flex flex-col items-center justify-center text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">All Immediate Moves Completed</h4>
              <p className="text-xs text-slate-400">
                You have addressed all high-priority recommendations for this career stage.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionIntelligenceHero;
