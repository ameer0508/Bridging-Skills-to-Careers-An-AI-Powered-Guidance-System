import React from 'react';
import { Zap, CheckCircle2, Bookmark, Flame, TrendingUp } from 'lucide-react';

export interface ActionVelocityStripProps {
  activeCount: number;
  highestPriorityCount: number;
  savedCount: number;
  completedCount: number;
  /** Roadmap completion (0-100), or null when the user has no roadmap yet. */
  roadmapProgress: number | null;
}

export const ActionVelocityStrip: React.FC<ActionVelocityStripProps> = ({
  activeCount,
  highestPriorityCount,
  savedCount,
  completedCount,
  roadmapProgress,
}) => {
  return (
    <div className="rounded-2xl border border-aurora-line bg-aurora-canvas/60 p-4 sm:p-5 shadow-xl">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
        {/* Metric 1: Active Actions */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-aurora-muted block font-semibold">
              Active Queue
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-xl font-extrabold text-aurora-ink">{activeCount}</span>
              {highestPriorityCount > 0 && (
                <span className="text-[10px] text-rose-700 font-bold">
                  ({highestPriorityCount} critical)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 2: Critical actions */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-aurora-muted block font-semibold">
              Highest Priority
            </span>
            <span className="font-display text-xl font-extrabold text-emerald-700">
              {highestPriorityCount}
            </span>
          </div>
        </div>

        {/* Metric 3: Completed Actions */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-aurora-muted block font-semibold">
              Completed Moves
            </span>
            <span className="font-display text-xl font-extrabold text-aurora-indigo">
              {completedCount}
            </span>
          </div>
        </div>

        {/* Metric 4: Saved for Later */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-violet shrink-0">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-aurora-muted block font-semibold">
              Saved Radar
            </span>
            <span className="font-display text-xl font-extrabold text-aurora-violet">
              {savedCount}
            </span>
          </div>
        </div>

        {/* Metric 5: Roadmap progress */}
        <div className="col-span-2 md:col-span-1 p-2.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-700" />
            <div>
              <span className="text-[9px] text-aurora-muted uppercase tracking-widest block">
                Roadmap
              </span>
              <span className="text-xs font-bold text-amber-700">
                {roadmapProgress === null ? 'Not generated' : 'Completed'}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700">
            {roadmapProgress === null ? '—' : `${roadmapProgress}%`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ActionVelocityStrip;
