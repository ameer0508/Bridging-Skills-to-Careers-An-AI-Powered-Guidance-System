import React from 'react';
import { TrendingUp } from 'lucide-react';
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
    <GlassPanel className="p-5 border-emerald-200 space-y-4">
      <div className="flex items-center justify-between border-b border-aurora-line pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-700" />
          <h4 className="text-xs font-bold text-aurora-ink uppercase tracking-wider">{title}</h4>
        </div>
        <span className="text-[10px] text-emerald-700 font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
          Predictive Analytics
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums">
        <div className="p-3 bg-aurora-canvas/60 border border-aurora-line rounded-xl space-y-1">
          <span className="text-[10px] text-aurora-muted block uppercase">Readiness Gain</span>
          <span className="font-bold text-emerald-700 text-sm">+{readinessGain}%</span>
        </div>

        <div className="p-3 bg-aurora-canvas/60 border border-aurora-line rounded-xl space-y-1">
          <span className="text-[10px] text-aurora-muted block uppercase">Match Gain</span>
          <span className="font-bold text-aurora-violet text-sm">+{matchGain}%</span>
        </div>

        <div className="p-3 bg-aurora-canvas/60 border border-aurora-line rounded-xl space-y-1">
          <span className="text-[10px] text-aurora-muted block uppercase">Recruiter Callbacks</span>
          <span className="font-bold text-aurora-indigo text-xs truncate block">{competitiveness}</span>
        </div>

        <div className="p-3 bg-aurora-canvas/60 border border-aurora-line rounded-xl space-y-1">
          <span className="text-[10px] text-aurora-muted block uppercase">Salary Potential</span>
          <span className="font-bold text-amber-700 text-xs truncate block">{salaryPotential}</span>
        </div>
      </div>
    </GlassPanel>
  );
};
