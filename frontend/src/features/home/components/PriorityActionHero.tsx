import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
export interface NextBestActionInfo {
  action: string;
  title: string;
  subtitle: string;
  route: string;
  actionLabel: string;
  badge: string;
}

interface PriorityActionHeroProps {
  nextBestAction: NextBestActionInfo;
  targetRole: string;
  onNavigate: (route: string) => void;
}

export const PriorityActionHero: React.FC<PriorityActionHeroProps> = ({
  nextBestAction,
  targetRole,
  onNavigate,
}) => {
  return (
    <section className="editorial-card p-6 sm:p-7 relative overflow-hidden border-l-4 border-l-amber-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="editorial-tag text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Priority Focus
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-slate-400">Target Role: {targetRole}</span>
          </div>

          <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
            {nextBestAction.title}
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            {nextBestAction.subtitle}
          </p>
        </div>

        <div className="shrink-0">
          <button
            onClick={() => onNavigate(nextBestAction.route)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-all shadow-sm hover:shadow cursor-pointer"
          >
            <span>{nextBestAction.actionLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
