import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, Zap, TrendingUp, CheckCircle } from 'lucide-react';
import { GlassCard } from '../cards/GlassCard';
import { CareerArchitectEngine } from './CareerArchitectEngine';
import { ScenarioResult } from './ScenarioSimulatorEngine';

export interface ScenarioSimulatorProps {
  currentScore?: number;
  targetRoleTitle?: string;
  className?: string;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  currentScore = 75,
  targetRoleTitle = 'Target Role',
  className = '',
}) => {
  const [activeScenarioType, setActiveScenarioType] = useState<
    'complete_skill' | 'switch_role' | 'increase_effort'
  >('complete_skill');

  const [result, setResult] = useState<ScenarioResult>(() =>
    CareerArchitectEngine.simulateScenario('complete_skill', 'Database Indexing Mastery', currentScore)
  );

  const handleSelectScenario = (
    type: 'complete_skill' | 'switch_role' | 'increase_effort',
    title: string
  ) => {
    setActiveScenarioType(type);
    setResult(CareerArchitectEngine.simulateScenario(type, title, currentScore));
  };

  return (
    <GlassCard className={`p-6 border-indigo-500/20 bg-indigo-950/20 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Interactive Scenario Simulator</h3>
            <p className="text-xs text-neutral-400">
              Explore "What If?" career decisions for <strong className="text-white">{targetRoleTitle}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Scenario Triggers */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleSelectScenario('complete_skill', 'Database Indexing Mastery')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer outline-none ${
            activeScenarioType === 'complete_skill'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-black/40 text-neutral-400 border border-white/10 hover:text-white'
          }`}
        >
          What if I complete Database Indexing?
        </button>

        <button
          onClick={() => handleSelectScenario('switch_role', 'Cloud Architect')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer outline-none ${
            activeScenarioType === 'switch_role'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-black/40 text-neutral-400 border border-white/10 hover:text-white'
          }`}
        >
          What if I switch goal to Cloud Architect?
        </button>

        <button
          onClick={() => handleSelectScenario('increase_effort', 'Double Daily Learning Time')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer outline-none ${
            activeScenarioType === 'increase_effort'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-black/40 text-neutral-400 border border-white/10 hover:text-white'
          }`}
        >
          What if I double daily study effort?
        </button>
      </div>

      {/* Outcome Result Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeScenarioType}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="p-5 rounded-xl bg-black/50 border border-white/10 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-bold text-white">{result.scenarioTitle}</h4>
            </div>
            <div className="flex items-center gap-1 text-xs font-extrabold text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              <span>+{result.readinessDelta}% Match Delta</span>
            </div>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">{result.explanation}</p>

          <div className="pt-2 border-t border-white/5 space-y-1">
            <span className="text-[11px] text-neutral-400 block">Unlocked Opportunities & Milestones:</span>
            <div className="flex flex-wrap gap-1.5">
              {result.unlockedOpportunities.map((opp, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                >
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  {opp}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </GlassCard>
  );
};

export default ScenarioSimulator;
