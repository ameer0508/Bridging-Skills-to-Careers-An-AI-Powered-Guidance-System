import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, Zap, TrendingUp, CheckCircle, Unlock, ArrowRight } from 'lucide-react';
import { GlassCard } from '../cards/GlassCard';
import { PrimaryCTA } from '../buttons/PrimaryCTA';
import { CareerPlanningEngine, SimulatedDecisionImpact } from './CareerPlanningEngine';

export interface DecisionSimulatorProps {
  currentScore?: number;
  targetRoleTitle?: string;
  availableTasks?: string[];
  onExecuteSimulatedTask?: (taskTitle: string) => void;
  className?: string;
}

export const DecisionSimulator: React.FC<DecisionSimulatorProps> = ({
  currentScore = 45,
  targetRoleTitle = 'Target Role',
  availableTasks = [
    'Complete REST API Architecture',
    'Master SQL Database Indexing',
    'Implement JWT Authentication',
  ],
  onExecuteSimulatedTask,
  className = '',
}) => {
  const [selectedTask, setSelectedTask] = useState<string>(availableTasks[0] || 'Complete REST API Architecture');
  const [simulationResult, setSimulationResult] = useState<SimulatedDecisionImpact>(() =>
    CareerPlanningEngine.simulateDecision(selectedTask, currentScore, targetRoleTitle)
  );

  const handleSelectTask = (task: string) => {
    setSelectedTask(task);
    setSimulationResult(CareerPlanningEngine.simulateDecision(task, currentScore, targetRoleTitle));
  };

  return (
    <GlassCard className={`p-6 border-purple-500/30 bg-purple-950/20 space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">AI Decision Simulator</h3>
            <p className="text-xs text-neutral-400">
              Preview readiness impact before committing to a learning milestone
            </p>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
          Predictive Model
        </span>
      </div>

      {/* Task Selection Selector */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-neutral-300">Select Task to Simulate:</span>
        <div className="flex flex-wrap gap-2">
          {availableTasks.map((task) => (
            <button
              key={task}
              onClick={() => handleSelectTask(task)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer outline-none ${
                selectedTask === task
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400'
                  : 'bg-black/40 text-neutral-400 border border-white/10 hover:text-white hover:bg-white/5'
              }`}
            >
              {task}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Simulation Result Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTask}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="p-5 rounded-xl bg-black/50 border border-white/10 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-white">Simulated Outcome</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              <span>+{simulationResult.readinessBoost}% Readiness Boost</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-white/5 space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                Projected Score
              </span>
              <div className="text-xl font-extrabold text-white flex items-baseline gap-1">
                <span>{simulationResult.projectedReadinessScore}%</span>
                <span className="text-xs font-normal text-emerald-400">
                  (was {currentScore}%)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white/5 space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                Unlocked Target Role
              </span>
              <div className="text-sm font-bold text-indigo-300 flex items-center gap-1.5 pt-0.5">
                <Unlock className="w-4 h-4 text-indigo-400" />
                <span>{simulationResult.unlockedRoleTitle}</span>
              </div>
            </div>
          </div>

          {/* Unlocked Skill Gaps */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] text-neutral-400 block">Skills Unlocked Upon Completion:</span>
            <div className="flex flex-wrap gap-1.5">
              {simulationResult.unlockedSkillGaps.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                >
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Action Footer */}
      <div className="flex justify-end pt-1">
        <PrimaryCTA onClick={() => onExecuteSimulatedTask?.(selectedTask)}>
          <span>Commit to Task & Execute</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </PrimaryCTA>
      </div>
    </GlassCard>
  );
};

export default DecisionSimulator;
