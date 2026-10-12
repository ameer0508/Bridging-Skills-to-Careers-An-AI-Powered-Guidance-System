import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  ArrowRight,
  TrendingUp,
  Award,
  CheckCircle2,
  Sparkles,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ComprehensiveArchitectStrategy } from '../../../../components/experience/architect/CareerArchitectEngine';
import { ScenarioSimulatorEngine, ScenarioResult } from '../../../../components/experience/architect/ScenarioSimulatorEngine';

interface NeuralStrategyHorizonProps {
  strategy: ComprehensiveArchitectStrategy;
  targetRole: string;
  readinessScore: number;
}

export const NeuralStrategyHorizon: React.FC<NeuralStrategyHorizonProps> = ({
  strategy,
  targetRole,
  readinessScore,
}) => {
  const navigate = useNavigate();
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = (type: 'complete_skill' | 'switch_role' | 'increase_effort') => {
    setIsSimulating(true);
    setTimeout(() => {
      const result = ScenarioSimulatorEngine.simulateScenario(type, targetRole, readinessScore);
      setScenarioResult(result);
      setIsSimulating(false);
    }, 400);
  };

  const highLeverageItems = strategy?.strategySummary?.recommendedSequence || [];
  const tradeoff = strategy?.tradeoffAnalysis;

  return (
    <div className="w-full space-y-6 pt-4">
      {/* SECTION HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-white">
              Explainable AI Strategy Horizon
            </h2>
            <p className="text-xs text-slate-400">
              Algorithmic reasoning explaining why milestones are prioritized and projecting trajectory impact.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/roadmap')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-400/20 hover:bg-cyan-500/20 transition-all cursor-pointer"
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
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              High-Leverage Strategic Vectors
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Ranked by ROI
            </span>
          </div>

          <div className="space-y-3">
            {highLeverageItems.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-400">
                Strategic vectors will populate as skills and target roles synchronize.
              </div>
            ) : (
              highLeverageItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-400/30 transition-all duration-200 space-y-2 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 shrink-0">
                      Step {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {item}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tradeoff Analysis Card if Multiple Roles are Matched */}
          {tradeoff && (
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Path Trade-off Analysis: {tradeoff.pathA.title} vs. {tradeoff.pathB.title}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {tradeoff.reasoning}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Scenario Simulator (5 cols) */}
        <div className="lg:col-span-5 neural-glass-blade p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Scenario Simulator
              </span>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                Predictive AI
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Model hypothetical actions to project quantitative impacts on readiness score and career trajectory before committing effort.
            </p>

            {/* Simulation Triggers */}
            <div className="space-y-2">
              <button
                onClick={() => handleSimulate('complete_skill')}
                disabled={isSimulating}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-200 bg-white/[0.04] border border-white/10 hover:border-cyan-400/40 hover:bg-cyan-500/10 transition-all text-left group cursor-pointer"
              >
                <span>Simulate: Master 1 Critical Skill Gap</span>
                <Play className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => handleSimulate('increase_effort')}
                disabled={isSimulating}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-200 bg-white/[0.04] border border-white/10 hover:border-purple-400/40 hover:bg-purple-500/10 transition-all text-left group cursor-pointer"
              >
                <span>Simulate: Double Study Cadence (+5 hrs/wk)</span>
                <Play className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Simulation Output Display */}
            {scenarioResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-2.5 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300">
                    {scenarioResult.scenarioTitle}
                  </span>
                  <button
                    onClick={() => setScenarioResult(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-2xl font-black font-display text-white">
                    +{scenarioResult.readinessDelta}%
                  </div>
                  <div className="text-[11px] text-slate-300 leading-tight">
                    Projected Readiness: <span className="text-emerald-400 font-bold">{scenarioResult.projectedMatchScore}%</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300/90 pt-1 border-t border-cyan-500/20 leading-relaxed">
                  {scenarioResult.explanation}
                </p>
              </motion.div>
            )}
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Mathematical Convergence Model
            </span>
            <span>v2.4 Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeuralStrategyHorizon;
