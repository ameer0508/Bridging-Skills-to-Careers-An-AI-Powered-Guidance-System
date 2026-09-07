import React from 'react';
import { Zap, CheckCircle2, Bookmark, Trash2, ExternalLink, Clock, BarChart3, ShieldCheck } from 'lucide-react';

interface IRecommendation {
  _id: string;
  careerId: {
    title: string;
    category: string;
  };
  category: string;
  title: string;
  description: string;
  priority: string;
  priorityScore: number;
  reason: string;
  impact: number;
  difficulty: string;
  estimatedTime: string;
  dependencies: string[];
  actionLink?: string;
  actionType?: string;
  targetSkill?: string;
  status: string;
}

interface ActionRecommendationGridProps {
  recommendations: IRecommendation[];
  onUpdateStatus: (id: string, status: string) => void;
}

export const ActionRecommendationGrid: React.FC<ActionRecommendationGridProps> = ({
  recommendations,
  onUpdateStatus,
}) => {
  if (recommendations.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-slate-950/70 border border-white/10 text-center space-y-2">
        <Zap className="w-8 h-8 text-slate-500 mx-auto" />
        <h4 className="text-sm font-bold text-white">No Action Items in This View</h4>
        <p className="text-xs text-slate-400">Switch tabs or process skill gaps to generate fresh recommendations.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {recommendations.map((rec) => {
        const isHighest = rec.priority === 'Highest';
        const isHigh = rec.priority === 'High';

        return (
          <div
            key={rec._id}
            className="p-6 rounded-3xl border border-white/10 bg-slate-950/70 hover:border-indigo-500/40 hover:bg-slate-900/80 transition-all space-y-4 shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Category & Priority Badge Header */}
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold border border-indigo-500/30 uppercase">
                  {rec.category}
                </span>

                <span
                  className={`px-2.5 py-0.5 rounded font-mono text-[9px] font-bold uppercase border ${
                    isHighest
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : isHigh
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  {rec.priority} Priority ({rec.priorityScore} Pts)
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-white tracking-tight">
                  {rec.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {rec.description}
                </p>
              </div>

              {/* Impact & Meta Metrics */}
              <div className="pt-2 grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-400">
                <div className="p-2 rounded-lg bg-slate-900 border border-white/5 space-y-0.5">
                  <span className="text-slate-500 block">Readiness Impact</span>
                  <span className="text-emerald-400 font-bold">+{rec.impact}% Gain</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-white/5 space-y-0.5">
                  <span className="text-slate-500 block">Estimated Time</span>
                  <span className="text-cyan-300 font-bold">{rec.estimatedTime || '1-2 hrs'}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-white/5 space-y-0.5">
                  <span className="text-slate-500 block">Difficulty</span>
                  <span className="text-indigo-300 font-bold">{rec.difficulty}</span>
                </div>
              </div>

              {/* Target Skill Tag */}
              {rec.targetSkill && (
                <div className="flex items-center gap-2 pt-1 text-[10px] font-mono">
                  <span className="text-slate-500">Target Skill Node:</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-cyan-400" />
                    {rec.targetSkill}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons Footer */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {rec.status === 'active' && (
                  <button
                    onClick={() => onUpdateStatus(rec._id, 'saved_for_later')}
                    title="Save for Later"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => onUpdateStatus(rec._id, 'dismissed')}
                  title="Dismiss Recommendation"
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {rec.status !== 'completed' ? (
                <button
                  onClick={() => onUpdateStatus(rec._id, 'completed')}
                  className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Complete</span>
                </button>
              ) : (
                <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Completed
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActionRecommendationGrid;
