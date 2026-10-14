import React from 'react';
import { DollarSign } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface SalaryProjectionProps {
  baselineMedian?: number;
  projectedMedian?: number;
  potentialIncrease?: number;
  baselineRange?: string;
  projectedRange?: string;
}

export const SalaryProjectionPanel: React.FC<SalaryProjectionProps> = ({
  baselineMedian = 120000,
  projectedMedian = 135000,
  potentialIncrease = 15000,
  baselineRange = '$90,000 - $150,000',
  projectedRange = '$105,000 - $165,000'
}) => {
  return (
    <GlassPanel className="p-6 space-y-5 border-amber-200">
      <div className="flex items-center justify-between border-b border-aurora-line pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-aurora-ink">Compensation & Market Value Forecast</h3>
            <p className="text-xs text-aurora-muted">Baseline role benchmarks vs skill-boosted earning potential</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
          Compensation Model
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-aurora-canvas/60 border border-aurora-line rounded-2xl space-y-1">
          <span className="text-[10px] text-aurora-muted uppercase font-bold block">Current Role Baseline</span>
          <span className="text-xl font-bold text-aurora-ink">${baselineMedian.toLocaleString()} / yr</span>
          <span className="text-[10px] text-aurora-muted block pt-1">{baselineRange}</span>
        </div>

        <div className="p-4 bg-aurora-canvas/60 border border-amber-200 rounded-2xl space-y-1">
          <span className="text-[10px] text-amber-700 uppercase font-bold block">Projected Skill-Boosted Median</span>
          <span className="text-xl font-bold text-amber-700">${projectedMedian.toLocaleString()} / yr</span>
          <span className="text-[10px] text-aurora-muted block pt-1">{projectedRange}</span>
        </div>

        <div className="p-4 bg-aurora-canvas/60 border border-emerald-200 rounded-2xl space-y-1">
          <span className="text-[10px] text-emerald-700 uppercase font-bold block">Potential Annual Gain</span>
          <span className="text-xl font-bold text-emerald-700">+${potentialIncrease.toLocaleString()} / yr</span>
          <span className="text-[10px] text-emerald-700 block pt-1">+6% - 15% Incremental Payoff</span>
        </div>
      </div>
    </GlassPanel>
  );
};
