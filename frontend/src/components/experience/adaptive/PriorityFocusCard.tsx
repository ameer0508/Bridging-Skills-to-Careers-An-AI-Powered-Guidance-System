import React from 'react';
import { Target, ArrowRight, HelpCircle } from 'lucide-react';
import { LightingSurface } from '../lighting/LightingSurface';
import { PrimaryCTA } from '../buttons/PrimaryCTA';
import { ContextPrioritizationResult } from './ContextPrioritizationEngine';

export interface PriorityFocusCardProps {
  prioritization?: ContextPrioritizationResult;
  onTakeAction?: () => void;
  className?: string;
}

export const PriorityFocusCard: React.FC<PriorityFocusCardProps> = ({
  prioritization = {
    primaryFocus: 'planning',
    focusTitle: 'Focus: Complete Database Indexing',
    focusDescription: 'Direct milestone required to advance your current learning roadmap.',
    explanation: 'Prioritized because executing this milestone directly advances your roadmap progress percentage.',
    evidence: 'Estimated time: 30 mins',
    urgencyScore: 85,
  },
  onTakeAction,
  className = '',
}) => {
  return (
    <LightingSurface
      profile="heroSpotlight"
      className={`p-6 rounded-2xl border border-aurora-violet/25 bg-aurora-canvas/60 space-y-4 shadow-xl shadow-indigo-500/10 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-aurora-line">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-aurora-violet/[0.06] text-aurora-indigo">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-aurora-indigo">
              Primary Adaptive Focus
            </span>
            <h3 className="text-base font-bold text-aurora-ink">{prioritization.focusTitle}</h3>
          </div>
        </div>

        <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25">
          {prioritization.urgencyScore}% Priority Score
        </span>
      </div>

      <p className="text-xs text-aurora-ink leading-relaxed bg-aurora-canvas/60 p-4 rounded-xl border border-aurora-line font-medium">
        {prioritization.focusDescription}
      </p>

      <div className="p-3 rounded-lg bg-aurora-canvas border border-aurora-line text-xs text-aurora-muted flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-aurora-indigo shrink-0" />
        <span>{prioritization.explanation}</span>
      </div>

      <div className="flex justify-end pt-1">
        <PrimaryCTA onClick={onTakeAction} className="text-xs py-2.5">
          <span>Execute Priority Action</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </PrimaryCTA>
      </div>
    </LightingSurface>
  );
};

export default PriorityFocusCard;
