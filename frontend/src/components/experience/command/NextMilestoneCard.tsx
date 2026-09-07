import React from 'react';
import { Compass, BookOpen, ArrowRight } from 'lucide-react';

import { SpotlightCard } from '../cards/SpotlightCard';
import { ProgressLoader } from '../loading/ProgressLoader';
import { PrimaryCTA } from '../buttons/PrimaryCTA';

export interface NextMilestoneCardProps {
  careerTitle?: string;
  phaseTitle?: string;
  completedItems?: number;
  totalItems?: number;
  progressPercentage?: number;
  onNavigate?: () => void;
  className?: string;
}

export const NextMilestoneCard: React.FC<NextMilestoneCardProps> = ({
  careerTitle = 'Target Career',
  phaseTitle = 'Phase 1: Foundations & Core Competencies',
  completedItems = 0,
  totalItems = 0,
  progressPercentage = 0,
  onNavigate,
  className = '',
}) => {
  return (
    <SpotlightCard className={`p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Next Learning Milestone
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {careerTitle} Roadmap Phase
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
          {completedItems}/{totalItems} Items Done
        </span>
      </div>

      {/* Phase Details */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          <span>{phaseTitle}</span>
        </div>

        <ProgressLoader progress={progressPercentage} showLabel height={8} />

        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-2">
          <span>{totalItems - completedItems} Actionable items remaining</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            {progressPercentage}% Phase Complete
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex justify-end">
        <PrimaryCTA onClick={onNavigate} fullWidth className="text-xs py-2.5">
          <span>Open Full Roadmap</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </PrimaryCTA>
      </div>
    </SpotlightCard>
  );
};

export default NextMilestoneCard;
