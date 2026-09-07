import React from 'react';
import { TrendingUp, Award, Zap, DollarSign } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface ImpactPredictionProps {
  title?: string;
  readinessGain?: number;
  matchGain?: number;
  competitiveness?: string;
  salaryPotential?: string;
}

export const ImpactPredictionCard: React.FC<ImpactPredictionProps> = ({
  title = 'Recommendation Impact Prediction',
  readinessGain = 18.0,
  matchGain = 22.0,
  competitiveness = 'High (+35% Recruiter Callback Rate)',
  salaryPotential = '+$8,000 - $15,000 / year'
}) => {
  return (
    <GlassPanel className="p-5 border-emerald-500/30 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h4>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
          Predictive Analytics
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase">Readiness Gain</span>
          <span className="font-bold text-emerald-400 text-sm">+{readinessGain}%</span>
        </div>

        <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase">Match Gain</span>
          <span className="font-bold text-cyan-400 text-sm">+{matchGain}%</span>
        </div>

        <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase">Recruiter Callbacks</span>
          <span className="font-bold text-indigo-300 text-xs truncate block">{competitiveness}</span>
        </div>

        <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase">Salary Potential</span>
          <span className="font-bold text-amber-300 text-xs truncate block">{salaryPotential}</span>
        </div>
      </div>
    </GlassPanel>
  );
};
