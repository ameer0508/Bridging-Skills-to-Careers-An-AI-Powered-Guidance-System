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
    <div className="relative overflow-hidden rounded-[32px] border border-aurora-line bg-white p-5 sm:p-8 lg:p-10 shadow-aurora-md">
      {/* Ambient Radial Mesh Lighting */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-linear-to-bl from-amber-500/20 via-indigo-600/15 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-[32rem] h-[32rem] rounded-full bg-linear-to-tr from-cyan-500/20 via-purple-600/15 to-transparent blur-3xl" />

      <div className="relative z-10 space-y-8">
        {/* Top Bar: Subsystem Badge + Recalculate Trigger */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-aurora-line pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700">
                  Recommendations
                </span>
              </div>
              <p className="text-xs text-aurora-muted tabular-nums">
                Gap closing and next steps from your records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="group px-4 py-2 rounded-xl bg-aurora-canvas/60 hover:bg-aurora-canvas border border-aurora-line hover:border-amber-200 text-xs font-bold text-aurora-ink hover:text-aurora-indigo flex items-center gap-2 transition-all cursor-pointer shadow-aurora-sm disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-amber-700 transition-transform ${
                    isRegenerating ? 'animate-spin' : 'group-hover:rotate-180 duration-500'
                  }`}
                />
                <span>{isRegenerating ? 'Recalculating…' : 'Recalculate recommendations'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Hero Body: Personalized Greeting & Trajectory Focus */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-aurora-indigo font-semibold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-aurora-violet" />
                Goal • {targetRole}
              </span>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-aurora-ink tracking-tight leading-tight">
                Your next{' '}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-aurora-indigo via-aurora-violet to-aurora-sky">
                  steps
                </span>
              </h1>
              <p className="text-sm sm:text-base text-aurora-muted leading-relaxed font-sans max-w-2xl">
                These actions come from the gaps between your evidence and the requirements of your target career in{' '}
                <span className="text-aurora-indigo font-semibold">{careerDomain}</span>. They are ranked by a fixed
                formula and do not predict hiring outcomes.
              </p>
            </div>

            {/* Trajectory Highlights Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs tabular-nums">
              <div className="px-3 py-1.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex items-center gap-2">
                <span className="text-aurora-muted">Current readiness:</span>
                <span className="text-emerald-700 font-bold">{readinessScore}%</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex items-center gap-2">
                <span className="text-aurora-muted">Required skills missing for your goal:</span>
                <span className="text-rose-700 font-bold">{criticalGapsCount}</span>
              </div>
            </div>
          </div>

          {/* Right Spotlight: #1 Strategic Priority Action */}
          {topRecommendation ? (
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative p-5 sm:p-6 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-aurora-sidebar shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    Ranked first
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    Ranking score {topRecommendation.impact}/100
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-display text-base sm:text-lg font-bold text-aurora-ink tracking-tight leading-snug">
                    {topRecommendation.title}
                  </h3>
                  {topRecommendation.reason && (
                    <p className="text-xs text-aurora-muted line-clamp-2 leading-relaxed">
                      💡 {topRecommendation.reason}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] tabular-nums">
                  <div className="p-2 rounded-lg bg-aurora-canvas/60 border border-aurora-line space-y-0.5">
                    <span className="text-aurora-muted text-[9px] block uppercase">Category</span>
                    <span className="text-aurora-indigo font-bold truncate block">{topRecommendation.category}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-aurora-canvas/60 border border-aurora-line space-y-0.5">
                    <span className="text-aurora-muted text-[9px] block uppercase">Difficulty</span>
                    <span className="text-aurora-violet font-bold block">{topRecommendation.difficulty}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-aurora-canvas/60 border border-aurora-line space-y-0.5">
                    <span className="text-aurora-muted text-[9px] block uppercase">Est. Time</span>
                    <span className="text-aurora-violet font-bold block">{topRecommendation.estimatedTime}</span>
                  </div>
                </div>

                {onSelectTopAction && (
                  <button
                    onClick={() => onSelectTopAction(topRecommendation._id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-aurora-ink font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <span>Start this step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            </div>
          ) : (
            <div className="lg:col-span-5 p-6 rounded-2xl border border-aurora-line bg-aurora-canvas/60 flex flex-col items-center justify-center text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-700" />
              <h4 className="text-sm font-bold text-aurora-ink">All Immediate Moves Completed</h4>
              <p className="text-xs text-aurora-muted">
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
