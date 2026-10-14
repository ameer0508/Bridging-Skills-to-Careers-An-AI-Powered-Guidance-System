import React from 'react';
import { Layers, CheckCircle, ArrowRight, Award } from 'lucide-react';
import { GlassCard } from '../cards/GlassCard';
import { PathComparisonItem } from './CareerPathComparisonEngine';

export interface CareerPathComparisonProps {
  paths?: PathComparisonItem[];
  onSelectPath?: (pathId: string) => void;
  className?: string;
}

export const CareerPathComparison: React.FC<CareerPathComparisonProps> = ({
  paths = [],
  onSelectPath,
  className = '',
}) => {
  const defaultPaths: PathComparisonItem[] = paths.length > 0 ? paths : [
    {
      id: 'p-1',
      title: 'Full Stack Engineer',
      matchScore: 85,
      matchingSkillsCount: 5,
      missingSkillsCount: 2,
      category: 'Software Engineering',
      isRecommended: true,
      roadmapOverlapPercentage: 80,
    },
    {
      id: 'p-2',
      title: 'Backend Systems Engineer',
      matchScore: 78,
      matchingSkillsCount: 4,
      missingSkillsCount: 3,
      category: 'Backend Architecture',
      isRecommended: false,
      roadmapOverlapPercentage: 70,
    },
    {
      id: 'p-3',
      title: 'Cloud DevOps Architect',
      matchScore: 62,
      matchingSkillsCount: 2,
      missingSkillsCount: 5,
      category: 'Infrastructure',
      isRecommended: false,
      roadmapOverlapPercentage: 45,
    },
  ];

  return (
    <GlassCard className={`p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-aurora-line">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-aurora-violet/[0.06] text-aurora-indigo">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-aurora-ink">Target Career Path Comparison</h3>
            <p className="text-xs text-aurora-muted">
              Comparative matrix evaluating alternative career trajectories
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {defaultPaths.map((path) => (
          <div
            key={path.id}
            onClick={() => onSelectPath?.(path.id)}
            className={`p-5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-4 ${
              path.isRecommended
                ? 'bg-violet-50 border-aurora-violet/25 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/40'
                : 'bg-aurora-canvas/60 border-aurora-line hover:border-aurora-line'
            }`}
          >
            {path.isRecommended && (
              <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500 text-white shadow">
                Top Match
              </span>
            )}

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-aurora-muted">
                {path.category}
              </span>
              <h4 className="text-base font-bold text-aurora-ink">{path.title}</h4>

              <div className="flex items-baseline gap-1 pt-1">
                <span className="text-2xl font-extrabold text-aurora-ink">{path.matchScore}%</span>
                <span className="text-xs text-aurora-muted">Match Score</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-aurora-line text-xs text-aurora-muted">
              <div className="flex items-center justify-between">
                <span className="text-aurora-muted flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                  Matching Skills:
                </span>
                <span className="font-bold text-aurora-ink">{path.matchingSkillsCount}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-aurora-muted flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-700" />
                  Target Skill Gaps:
                </span>
                <span className="font-bold text-aurora-ink">{path.missingSkillsCount}</span>
              </div>

              <div className="pt-2">
                <button className="w-full py-2 rounded-lg text-xs font-semibold bg-aurora-canvas hover:bg-aurora-canvas text-aurora-indigo transition-colors flex items-center justify-center gap-1">
                  <span>Select Career Goal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default CareerPathComparison;
