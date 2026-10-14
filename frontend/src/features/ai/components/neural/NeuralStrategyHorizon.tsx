import React from 'react';
import {
  Compass,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ComprehensiveArchitectStrategy } from '../../../../components/experience/architect/CareerArchitectEngine';

interface NeuralStrategyHorizonProps {
  strategy: ComprehensiveArchitectStrategy;
  targetRole: string;
  /** Accepted for compatibility; no projection is made from it here. */
  readinessScore?: number;
}

export const NeuralStrategyHorizon: React.FC<NeuralStrategyHorizonProps> = ({
  strategy,
  targetRole,
}) => {
  const navigate = useNavigate();
  const highLeverageItems = strategy?.strategySummary?.recommendedSequence || [];
  const tradeoff = strategy?.tradeoffAnalysis;

  return (
    <div className="w-full space-y-6 pt-4">
      {/* SECTION HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-purple-500/10 text-aurora-violet border border-purple-500/20">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-aurora-ink">
              Your strategy
            </h2>
            <p className="text-xs text-aurora-muted">
              Your roadmap phases in order, with what each one is for.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/roadmap')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-aurora-violet bg-aurora-violet/[0.06] border border-cyan-400/20 hover:bg-aurora-violet/[0.06] transition-all cursor-pointer"
        >
          <span>Open Full Learning Roadmap</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2-COLUMN SPATIAL STRATEGY BLADES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: High-Leverage Strategic Priorities (7 cols) */}
        <div className="lg:col-span-7 neural-glass-blade p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-aurora-muted flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-700" />
              Next priorities
            </span>
            <span className="text-[10px] text-aurora-indigo bg-aurora-violet/[0.06] px-2 py-0.5 rounded border border-aurora-violet/25">
              In roadmap order
            </span>
          </div>

          <div className="space-y-3">
            {highLeverageItems.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-aurora-line text-xs text-aurora-muted">
                Priorities appear once you have a roadmap.
              </div>
            ) : (
              highLeverageItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-aurora-line hover:border-cyan-400/30 transition-all duration-200 space-y-2 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25 shrink-0">
                      Step {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-aurora-ink group-hover:text-aurora-violet transition-colors">
                      {item}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tradeoff Analysis Card if Multiple Roles are Matched */}
          {tradeoff && (
            <div className="p-4 rounded-2xl bg-violet-50 border border-aurora-violet/25 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-aurora-indigo">
                <Sparkles className="w-3.5 h-3.5 text-aurora-indigo" />
                <span>Path Trade-off Analysis: {tradeoff.pathA.title} vs. {tradeoff.pathB.title}</span>
              </div>
              <p className="text-xs text-aurora-muted leading-relaxed">
                {tradeoff.reasoning}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Scenario Simulator (5 cols) */}
        <div className="lg:col-span-5 neural-glass-blade p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-aurora-muted flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-aurora-violet" aria-hidden="true" />
              Test a what-if
            </span>
            <p className="text-xs text-aurora-muted leading-relaxed">
              Career Lab recalculates your match for {targetRole || 'a career'} as if you added a skill or finished a
              project, from the career&apos;s real requirements. Results are hypothetical and never change your profile.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/career-lab')}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-aurora-indigo bg-aurora-violet/[0.06] border border-aurora-violet/25 hover:bg-aurora-violet/10 transition-colors text-left cursor-pointer"
          >
            <span>Open the what-if in Career Lab</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NeuralStrategyHorizon;
