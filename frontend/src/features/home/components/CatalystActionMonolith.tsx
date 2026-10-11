import React from 'react';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { NextBestActionInfo } from './PriorityActionHero';

export interface CatalystActionMonolithProps {
  nextBestAction: NextBestActionInfo;
  targetRole: string;
  onNavigate: (route: string) => void;
}

export const CatalystActionMonolith: React.FC<CatalystActionMonolithProps> = ({
  nextBestAction,
  targetRole: _targetRole,
  onNavigate,
}) => {
  return (
    <section className="carto-surface p-7 sm:p-9 relative overflow-hidden">
      {/* Soft Ambient Champagne Light */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Highest-Leverage Catalyst</span>
            {nextBestAction.badge && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{nextBestAction.badge}</span>
              </>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight font-display">
            {nextBestAction.title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed">
            {nextBestAction.subtitle}
          </p>
        </div>

        <div className="shrink-0 flex items-center">
          <button
            onClick={() => onNavigate(nextBestAction.route)}
            className="catalyst-btn w-full sm:w-auto"
          >
            <span>{nextBestAction.actionLabel}</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      </div>
    </section>
  );
};
