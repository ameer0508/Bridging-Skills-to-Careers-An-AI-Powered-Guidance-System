import React from 'react';
import { TrendingUp, Award, Briefcase, Sparkles } from 'lucide-react';
import { GlassCard } from '../cards/GlassCard';
import { CountUpNumber } from '../typography/CountUpNumber';
import { OpportunityForecastData } from './ForecastEngine';

export interface OpportunityForecastProps {
  forecast?: OpportunityForecastData;
  className?: string;
}

export const OpportunityForecast: React.FC<OpportunityForecastProps> = ({
  forecast = {
    projectedReadinessScore: 78,
    readinessDelta: 12,
    unlockedRoleCount: 3,
    upcomingMilestonesCount: 5,
    trajectoryLabel: 'Accelerating',
  },
  className = '',
}) => {
  return (
    <GlassCard className={`p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Opportunity & Trajectory Forecast</h3>
            <p className="text-xs text-neutral-400">
              Predictive career growth upon completing active roadmap phase
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          {forecast.trajectoryLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Projected Readiness</span>
          </div>
          <div className="text-2xl font-extrabold text-white flex items-baseline gap-1">
            <CountUpNumber value={forecast.projectedReadinessScore} suffix="%" />
            <span className="text-xs font-semibold text-emerald-400">
              (+{forecast.readinessDelta}%)
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <span>Unlocked Role Matches</span>
          </div>
          <div className="text-2xl font-extrabold text-white">
            <CountUpNumber value={forecast.unlockedRoleCount} suffix=" Roles" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Upcoming Milestones</span>
          </div>
          <div className="text-2xl font-extrabold text-white">
            <CountUpNumber value={forecast.upcomingMilestonesCount} suffix=" Tasks" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default OpportunityForecast;
