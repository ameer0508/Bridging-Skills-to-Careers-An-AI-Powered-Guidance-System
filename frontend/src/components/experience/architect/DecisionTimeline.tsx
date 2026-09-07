import React from 'react';
import { History, CheckCircle2, Circle } from 'lucide-react';

import { GlassCard } from '../cards/GlassCard';

export interface DecisionCheckpoint {
  timeframe: string;
  title: string;
  description: string;
  isCompleted?: boolean;
  isDecisionPoint?: boolean;
}

export interface DecisionTimelineProps {
  checkpoints?: DecisionCheckpoint[];
  targetRoleTitle?: string;
  className?: string;
}

export const DecisionTimeline: React.FC<DecisionTimelineProps> = ({
  checkpoints,
  targetRoleTitle = 'Target Role',
  className = '',
}) => {
  const defaultCheckpoints: DecisionCheckpoint[] = checkpoints || [
    {
      timeframe: 'Today',
      title: "Execute Today's Priority Mission",
      description: 'Complete active database indexing module.',
      isCompleted: false,
      isDecisionPoint: false,
    },
    {
      timeframe: 'Next 2 Weeks',
      title: 'Phase 1 Foundations Milestone',
      description: 'Decision Point: Evaluate cloud readiness vs backend specialization.',
      isCompleted: false,
      isDecisionPoint: true,
    },
    {
      timeframe: 'Quarter 1',
      title: 'Full Stack Project Portfolio',
      description: 'Build production API services & user interface.',
      isCompleted: false,
      isDecisionPoint: false,
    },
    {
      timeframe: 'Destination Goal',
      title: `${targetRoleTitle} Mastery`,
      description: 'Qualify for senior placement & AI technical evaluation.',
      isCompleted: false,
      isDecisionPoint: false,
    },
  ];

  return (
    <GlassCard className={`p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Strategic Decision Timeline</h3>
            <p className="text-xs text-neutral-400">
              Key milestone checkpoints mapping your long-term destination
            </p>
          </div>
        </div>
      </div>

      <div className="relative pl-6 space-y-4 border-l border-white/10 my-2">
        {defaultCheckpoints.map((cp, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline Dot */}
            <div
              className={`absolute -left-7.75 top-0.5 p-1 rounded-full border ${

                cp.isDecisionPoint
                  ? 'bg-purple-900 border-purple-400 text-purple-300'
                  : 'bg-neutral-900 border-white/20 text-neutral-400'
              }`}
            >
              {cp.isCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Circle className="w-3.5 h-3.5" />
              )}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300">
                  {cp.timeframe}
                </span>
                {cp.isDecisionPoint && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Decision Checkpoint
                  </span>
                )}
              </div>
              <h4 className="text-xs font-bold text-white">{cp.title}</h4>
              <p className="text-xs text-neutral-300">{cp.description}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default DecisionTimeline;
