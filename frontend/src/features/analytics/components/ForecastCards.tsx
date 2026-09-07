import React from 'react';
import { TrendingUp, DollarSign, Activity, Award } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface ForecastCardsProps {
  projectedReadiness?: number;
  readinessDate?: string;
  interviewPassProb?: number;
  salaryProjection?: string;
  marketIndex?: number;
}

export const ForecastCards: React.FC<ForecastCardsProps> = ({
  projectedReadiness = 0,
  readinessDate = 'Next Quarter',
  interviewPassProb = 0,
  salaryProjection = 'Market Dependent',
  marketIndex = 0
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CARD 1: READINESS FORECAST */}
      <GlassPanel className="p-4 space-y-2 border-emerald-500/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Projected Readiness</span>
          <span className="text-emerald-400 font-mono text-xs font-bold">Target Forecast</span>
        </div>
        <div className="flex items-end justify-between">
          <h3 className="text-2xl font-bold text-white">{projectedReadiness}%</h3>
          <span className="text-[10px] font-mono text-slate-400">Target: {readinessDate}</span>
        </div>
      </GlassPanel>

      {/* CARD 2: INTERVIEW PASS PROBABILITY */}
      <GlassPanel className="p-4 space-y-2 border-cyan-500/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Tech Interview Pass %</span>
          <span className="text-cyan-400 font-mono text-xs font-bold">Confidence</span>
        </div>
        <div className="flex items-end justify-between">
          <h3 className="text-2xl font-bold text-white">{interviewPassProb}%</h3>
          <span className="text-[10px] font-mono text-slate-400">Shortlist Potential</span>
        </div>
      </GlassPanel>

      {/* CARD 3: SALARY PROJECTION */}
      <GlassPanel className="p-4 space-y-2 border-amber-500/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Salary Potential</span>
          <span className="text-amber-400 font-mono text-xs font-bold">Market Range</span>
        </div>
        <div className="flex items-end justify-between">
          <h3 className="text-base font-bold text-white truncate max-w-[170px]">{salaryProjection}</h3>
        </div>
      </GlassPanel>

      {/* CARD 4: MARKET RELEVANCE INDEX */}
      <GlassPanel className="p-4 space-y-2 border-purple-500/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Market Relevance</span>
          <span className="text-purple-400 font-mono text-xs font-bold">Live Telemetry</span>
        </div>
        <div className="flex items-end justify-between">
          <h3 className="text-2xl font-bold text-white">{marketIndex}%</h3>
          <span className="text-[10px] font-mono text-slate-400">Role Index</span>
        </div>
      </GlassPanel>
    </div>
  );
};
