import React from 'react';
import { DollarSign, TrendingUp, Award, Zap } from 'lucide-react';
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
    <GlassPanel className="p-6 space-y-5 border-amber-500/30">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Compensation & Market Value Forecast</h3>
            <p className="text-xs text-slate-400">Baseline role benchmarks vs skill-boosted earning potential</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
          Compensation Model
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="p-4 bg-slate-950/80 border border-white/5 rounded-2xl space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Current Role Baseline</span>
          <span className="text-xl font-bold text-slate-200">${baselineMedian.toLocaleString()} / yr</span>
          <span className="text-[10px] text-slate-400 block pt-1">{baselineRange}</span>
        </div>

        <div className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-2xl space-y-1">
          <span className="text-[10px] text-amber-400 uppercase font-bold block">Projected Skill-Boosted Median</span>
          <span className="text-xl font-bold text-amber-300">${projectedMedian.toLocaleString()} / yr</span>
          <span className="text-[10px] text-slate-400 block pt-1">{projectedRange}</span>
        </div>

        <div className="p-4 bg-slate-950/80 border border-emerald-500/30 rounded-2xl space-y-1">
          <span className="text-[10px] text-emerald-400 uppercase font-bold block">Potential Annual Gain</span>
          <span className="text-xl font-bold text-emerald-400">+${potentialIncrease.toLocaleString()} / yr</span>
          <span className="text-[10px] text-emerald-300 block pt-1">+6% - 15% Incremental Payoff</span>
        </div>
      </div>
    </GlassPanel>
  );
};
