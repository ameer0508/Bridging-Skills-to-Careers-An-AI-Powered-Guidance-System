import React from 'react';
import { ArrowUpRight, CheckCircle2, Circle, Compass, Sparkles } from 'lucide-react';

interface RoadmapMilestoneLedgerProps {
  progressPercentage: number;
  isInitialized: boolean;
  phases: Array<{
    title: string;
    description?: string;
    items?: Array<{ title: string; status: string }>;
  }>;
  onViewFullRoadmap: () => void;
}

export const RoadmapMilestoneLedger: React.FC<RoadmapMilestoneLedgerProps> = ({
  progressPercentage,
  isInitialized,
  phases,
  onViewFullRoadmap,
}) => {
  return (
    <section className="editorial-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 hairline-divider">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-purple-400" />
          <span className="editorial-tag text-slate-200">Learning Roadmap</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
            {isInitialized ? `${progressPercentage}% Complete` : 'Awaiting Generation'}
          </span>
          <button
            onClick={onViewFullRoadmap}
            className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Full roadmap</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isInitialized || phases.length === 0 ? (
        <div className="py-8 px-4 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
            <Compass className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-200">Roadmap not yet generated</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Synthesize a tailored milestone learning plan that bridges your current capabilities to your target role.
            </p>
          </div>
          <button
            onClick={onViewFullRoadmap}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Generate Career Roadmap</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Progress Overview */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Overall Progress</span>
              <span className="font-semibold text-slate-200">{progressPercentage}%</span>
            </div>
            <div className="editorial-progress-track">
              <div
                className="editorial-progress-fill bg-purple-500"
                style={{ width: `${Math.max(5, Math.min(100, progressPercentage))}%` }}
              />
            </div>
          </div>

          {/* Phases Summary */}
          <div className="space-y-3 pt-2">
            {phases.slice(0, 3).map((phase, idx) => {
              const isCurrentPhase = idx === 0;
              return (
                <div
                  key={phase.title || idx}
                  className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                        Phase {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-200">{phase.title}</span>
                    </div>
                    {isCurrentPhase && (
                      <span className="text-[10px] text-purple-400 font-medium">In Progress</span>
                    )}
                  </div>

                  {phase.items && phase.items.length > 0 && (
                    <div className="space-y-1.5 pl-1 pt-1">
                      {phase.items.slice(0, 3).map((item, itemIdx) => {
                        const isDone = item.status === 'completed';
                        return (
                          <div
                            key={itemIdx}
                            className="flex items-center gap-2 text-xs text-slate-300"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            )}
                            <span className={isDone ? 'line-through text-slate-500' : ''}>
                              {item.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
