import React from 'react';
import { Zap, ArrowRight, Compass } from 'lucide-react';
import { NextBestActionInfo } from './TacticalTrajectoryRibbon';

export interface SovereignDirectiveProps {
  nextBestAction: NextBestActionInfo;
  targetRole: string;
  onNavigate: (route: string) => void;
}

export const SovereignDirective: React.FC<SovereignDirectiveProps> = ({
  nextBestAction,
  targetRole,
  onNavigate,
}) => {
  return (
    <div className="hcc-monolith p-6 sm:p-8 rounded-3xl border border-amber-500/30 bg-linear-to-r from-amber-950/20 via-[#0e1422] to-[#080c14] relative overflow-hidden">
      {/* Background Accent Flare */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold uppercase tracking-wider">
              {nextBestAction.badge || 'Sovereign Directive'}
            </span>
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              Prioritized Vector for {targetRole || 'Target Career'}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-amber-400 shrink-0" />
            {nextBestAction.title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-sans">
            {nextBestAction.subtitle}
          </p>
        </div>

        <button
          onClick={() => onNavigate(nextBestAction.route)}
          className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2.5 cursor-pointer shadow-xl shadow-amber-500/20 shrink-0 transition-all font-mono group"
        >
          <span>{nextBestAction.actionLabel}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
