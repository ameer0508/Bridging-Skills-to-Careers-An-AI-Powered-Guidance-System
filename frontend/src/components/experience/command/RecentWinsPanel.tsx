import React from 'react';
import { Trophy, CheckCircle, Sparkles } from 'lucide-react';

import { GlassCard } from '../cards/GlassCard';

export interface WinItem {
  id: string;
  title: string;
  category?: string;
  completedAt?: string;
}

export interface RecentWinsPanelProps {
  wins?: WinItem[];
  className?: string;
}

export const RecentWinsPanel: React.FC<RecentWinsPanelProps> = ({
  wins = [],
  className = '',
}) => {
  return (
    <GlassCard className={`p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Recent Milestones & Wins
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Verified accomplishments in your career journey
            </p>
          </div>
        </div>
      </div>

      {wins.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-neutral-50/50 dark:bg-neutral-900/30 border border-dashed border-neutral-200 dark:border-neutral-800 space-y-2">
          <Sparkles className="w-8 h-8 mx-auto text-indigo-400 opacity-80" />
          <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Your Journey Has Begun
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
            Complete your first roadmap item or verified skill assessment to record milestone achievements here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {wins.map((win) => (
            <div
              key={win.id}
              className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-neutral-900 dark:text-white">
                    {win.title}
                  </h5>
                  {win.category && (
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      {win.category}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Verified
              </span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export default RecentWinsPanel;
