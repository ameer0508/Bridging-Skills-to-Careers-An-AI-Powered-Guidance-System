import React from 'react';
import { Activity, Zap, CheckCircle2, Bookmark, Flame, Award, TrendingUp } from 'lucide-react';

export interface ActionVelocityStripProps {
  activeCount: number;
  highestPriorityCount: number;
  savedCount: number;
  completedCount: number;
  totalPotentialGain: number;
  resolvedGapsPercentage?: number;
}

export const ActionVelocityStrip: React.FC<ActionVelocityStripProps> = ({
  activeCount,
  highestPriorityCount,
  savedCount,
  completedCount,
  totalPotentialGain,
  resolvedGapsPercentage = 68,
}) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5 shadow-xl">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
        {/* Metric 1: Active Actions */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              Active Queue
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-xl font-extrabold text-white">{activeCount}</span>
              {highestPriorityCount > 0 && (
                <span className="text-[10px] font-mono text-rose-400 font-bold">
                  ({highestPriorityCount} critical)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 2: Potential Readiness Gain */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              Potential Uplift
            </span>
            <span className="font-display text-xl font-extrabold text-emerald-400">
              +{totalPotentialGain}%
            </span>
          </div>
        </div>

        {/* Metric 3: Completed Actions */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              Completed Moves
            </span>
            <span className="font-display text-xl font-extrabold text-indigo-300">
              {completedCount}
            </span>
          </div>
        </div>

        {/* Metric 4: Saved for Later */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              Saved Radar
            </span>
            <span className="font-display text-xl font-extrabold text-cyan-300">
              {savedCount}
            </span>
          </div>
        </div>

        {/* Metric 5: Execution Velocity Status */}
        <div className="col-span-2 md:col-span-1 p-2.5 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">
                Execution Pace
              </span>
              <span className="text-xs font-mono font-bold text-amber-300">
                Optimal Leverage
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-400">
            {resolvedGapsPercentage}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default ActionVelocityStrip;
