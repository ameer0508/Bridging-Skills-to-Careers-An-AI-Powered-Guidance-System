import React from 'react';
import { Award, Layers, Target, TrendingUp } from 'lucide-react';
import { ElevatedCard } from '../cards/ElevatedCard';
import { CountUpNumber } from '../typography/CountUpNumber';

export interface CareerMomentumProps {
  totalSkills?: number;
  readinessScore?: number;
  topMatchScore?: number;
  topCareerTitle?: string;
  roadmapProgress?: number;
  className?: string;
}

export const CareerMomentum: React.FC<CareerMomentumProps> = ({
  totalSkills = 0,
  readinessScore = 0,
  topMatchScore = 0,
  topCareerTitle,
  roadmapProgress = 0,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {/* 1. Readiness Score */}
      <ElevatedCard elevation="sm" className="p-5 flex items-start gap-4">
        <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 shrink-0">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Readiness Score
          </span>
          <div className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-0.5">
            <CountUpNumber value={readinessScore} suffix="%" />
          </div>
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>Active Evaluation</span>
          </p>
        </div>
      </ElevatedCard>

      {/* 2. Verified Skills */}
      <ElevatedCard elevation="sm" className="p-5 flex items-start gap-4">
        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 shrink-0">
          <Layers className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Verified Skills
          </span>
          <div className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-0.5">
            <CountUpNumber value={totalSkills} />
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            Normalized Skill Graph
          </p>
        </div>
      </ElevatedCard>

      {/* 3. Top Role Fit */}
      <ElevatedCard elevation="sm" className="p-5 flex items-start gap-4">
        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400 shrink-0">
          <Target className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Top Role Fit
          </span>
          <div className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-0.5">
            <CountUpNumber value={topMatchScore} suffix="%" />
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 truncate max-w-30">

            {topCareerTitle || 'Not Matched'}
          </p>
        </div>
      </ElevatedCard>

      {/* 4. Roadmap Completion */}
      <ElevatedCard elevation="sm" className="p-5 flex items-start gap-4">
        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 shrink-0">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Roadmap Progress
          </span>
          <div className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-0.5">
            <CountUpNumber value={roadmapProgress} suffix="%" />
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            Learning Milestones
          </p>
        </div>
      </ElevatedCard>
    </div>
  );
};

export default CareerMomentum;
