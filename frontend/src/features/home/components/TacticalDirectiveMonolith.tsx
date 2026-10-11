import React from 'react';
import { ArrowRight, Zap, Target } from 'lucide-react';
import { NextBestActionInfo } from './PriorityActionHero';

export interface TacticalDirectiveMonolithProps {
  nextBestAction: NextBestActionInfo;
  targetRole: string;
  onNavigate: (route: string) => void;
}

export const TacticalDirectiveMonolith: React.FC<TacticalDirectiveMonolithProps> = ({
  nextBestAction,
  targetRole,
  onNavigate,
}) => {
  return (
    <section className="directive-monolith p-6 sm:p-7 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        {/* Left Directive Content */}
        <div className="space-y-2.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>Apex Tactical Directive</span>
            </span>

            <span className="text-slate-600">/</span>

            <span className="text-slate-400 flex items-center gap-1">
              <Target className="w-3 h-3 text-cyan-400" />
              <span className="truncate max-w-[260px] sm:max-w-md">{targetRole || 'Target Career Track'}</span>
            </span>

            {nextBestAction.badge && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                {nextBestAction.badge}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight leading-tight">
            {nextBestAction.title}
          </h2>

          <p className="text-sm text-slate-300/90 leading-relaxed max-w-2xl">
            {nextBestAction.subtitle}
          </p>
        </div>

        {/* Right CTA Button */}
        <div className="shrink-0 flex items-center">
          <button
            onClick={() => onNavigate(nextBestAction.route)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>{nextBestAction.actionLabel}</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      </div>
    </section>
  );
};
