import React from 'react';
import { Gauge, CheckSquare, Zap, Clock } from 'lucide-react';
import { GlassCard } from '../cards/GlassCard';
import { VelocityMetrics } from './VelocityEngine';
import { TrendAnalysisResult } from './TrendAnalysisEngine';

export interface VelocityTrendsWidgetProps {
  velocity?: VelocityMetrics;
  trend?: TrendAnalysisResult;
  className?: string;
}

export const VelocityTrendsWidget: React.FC<VelocityTrendsWidgetProps> = ({
  velocity = {
    roadmapItemsPerWeek: 2,
    readinessGainPerWeek: 4,
    skillsAcquiredPerMonth: 3,
    velocityRating: 'Moderate Velocity',
  },
  trend = {
    trendState: 'Improving',
    explanation: 'Steady progress detected in skill indexing and foundational roadmap milestones.',
    evidence: 'Active learning velocity',
    recommendation: 'Maintain your current pace.',
  },
  className = '',
}) => {
  return (
    <GlassCard className={`p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Velocity & Trend Analysis</h3>
            <p className="text-xs text-neutral-400">
              Execution velocity and telemetry trend state
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
          {trend.trendState}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>Milestones / Wk</span>
          </div>
          <div className="text-xl font-extrabold text-white">
            {velocity.roadmapItemsPerWeek} Items
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Readiness / Wk</span>
          </div>
          <div className="text-xl font-extrabold text-white">
            +{velocity.readinessGainPerWeek}% Score
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Skills / Mo</span>
          </div>
          <div className="text-xl font-extrabold text-white">
            {velocity.skillsAcquiredPerMonth} Skills
          </div>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-500/20 space-y-1 text-xs text-neutral-300">
        <span className="font-bold text-sky-300">Trend Synthesis:</span>
        <p className="leading-relaxed">{trend.explanation}</p>
      </div>
    </GlassCard>
  );
};

export default VelocityTrendsWidget;
