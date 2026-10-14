import React from 'react';
import { Zap, CheckCircle2, Bookmark, Trash2, ShieldCheck } from 'lucide-react';

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
      <div className="p-8 rounded-2xl bg-aurora-canvas/60 border border-aurora-line text-center space-y-2">
        <Zap className="w-8 h-8 text-aurora-muted mx-auto" />
        <h4 className="text-sm font-bold text-aurora-ink">No Action Items in This View</h4>
        <p className="text-xs text-aurora-muted">Switch tabs or process skill gaps to generate fresh recommendations.</p>
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
            className="p-6 rounded-3xl border border-aurora-line bg-aurora-canvas/60 hover:border-aurora-violet/25 hover:bg-aurora-canvas/60 transition-all space-y-4 shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Category & Priority Badge Header */}
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded bg-aurora-violet/[0.06] text-aurora-indigo text-[9px] font-bold border border-aurora-violet/25 uppercase">
                  {rec.category}
                </span>

                <span
                  className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                    isHighest
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : isHigh
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-aurora-violet/[0.06] text-aurora-violet border-aurora-violet/25'
                  }`}
                >
                  {rec.priority} Priority ({rec.priorityScore} Pts)
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-aurora-ink tracking-tight">
                  {rec.title}
                </h3>
                <p className="text-xs text-aurora-muted leading-relaxed">
                  {rec.description}
                </p>
              </div>

              {/* Impact & Meta Metrics */}
              <div className="pt-2 grid grid-cols-3 gap-2 text-[10px] text-aurora-muted">
                <div className="p-2 rounded-lg bg-aurora-canvas border border-aurora-line space-y-0.5">
                  <span className="text-aurora-muted block">Readiness Impact</span>
                  <span className="text-emerald-700 font-bold">+{rec.impact}% Gain</span>
                </div>
                <div className="p-2 rounded-lg bg-aurora-canvas border border-aurora-line space-y-0.5">
                  <span className="text-aurora-muted block">Estimated Time</span>
                  <span className="text-aurora-violet font-bold">{rec.estimatedTime || '1-2 hrs'}</span>
                </div>
                <div className="p-2 rounded-lg bg-aurora-canvas border border-aurora-line space-y-0.5">
                  <span className="text-aurora-muted block">Difficulty</span>
                  <span className="text-aurora-indigo font-bold">{rec.difficulty}</span>
                </div>
              </div>

              {/* Target Skill Tag */}
              {rec.targetSkill && (
                <div className="flex items-center gap-2 pt-1 text-[10px] tabular-nums">
                  <span className="text-aurora-muted">Target Skill Node:</span>
                  <span className="px-2 py-0.5 rounded bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-aurora-violet" />
                    {rec.targetSkill}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons Footer */}
            <div className="pt-3 border-t border-aurora-line flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {rec.status === 'active' && (
                  <button
                    onClick={() => onUpdateStatus(rec._id, 'saved_for_later')}
                    title="Save for Later"
                    className="p-2 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line text-aurora-muted hover:text-aurora-indigo transition-colors cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => onUpdateStatus(rec._id, 'dismissed')}
                  title="Dismiss Recommendation"
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-50 border border-rose-200 text-rose-700 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {rec.status !== 'completed' ? (
                <button
                  onClick={() => onUpdateStatus(rec._id, 'completed')}
                  className="py-2 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Complete</span>
                </button>
              ) : (
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
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
