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
      className={`p-6 rounded-2xl border border-indigo-500/40 bg-neutral-900/90 backdrop-blur-xl space-y-4 shadow-xl shadow-indigo-500/10 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
              Primary Adaptive Focus
            </span>
            <h3 className="text-base font-bold text-white">{prioritization.focusTitle}</h3>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          {prioritization.urgencyScore}% Priority Score
        </span>
      </div>

      <p className="text-xs text-neutral-200 leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5 font-medium">
        {prioritization.focusDescription}
      </p>

      <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-neutral-300 flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
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
