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
    <GlassCard className={`p-6 border-purple-500/30 bg-purple-50 space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-aurora-line">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/10 text-aurora-violet">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-aurora-ink">AI Decision Simulator</h3>
            <p className="text-xs text-aurora-muted">
              Preview readiness impact before committing to a learning milestone
            </p>
          </div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-violet-50 text-aurora-violet border border-purple-500/30">
          Predictive Model
        </span>
      </div>

      {/* Task Selection Selector */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-aurora-muted">Select Task to Simulate:</span>
        <div className="flex flex-wrap gap-2">
          {availableTasks.map((task) => (
            <button
              key={task}
              onClick={() => handleSelectTask(task)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer outline-none ${
                selectedTask === task
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400'
                  : 'bg-aurora-canvas/60 text-aurora-muted border border-aurora-line hover:text-aurora-indigo hover:bg-aurora-canvas'
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
          className="p-5 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-700" />
              <span className="text-sm font-bold text-aurora-ink">Simulated Outcome</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <TrendingUp className="w-4 h-4" />
              <span>+{simulationResult.readinessBoost}% rough estimate</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-aurora-canvas space-y-1">
              <span className="text-[10px] text-aurora-muted uppercase tracking-wider block">
                Projected Score
              </span>
              <div className="text-xl font-extrabold text-aurora-ink flex items-baseline gap-1">
                <span>{simulationResult.projectedReadinessScore}%</span>
                <span className="text-xs font-normal text-emerald-700">
                  (was {currentScore}%)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-aurora-canvas space-y-1">
              <span className="text-[10px] text-aurora-muted uppercase tracking-wider block">
                Unlocked Target Role
              </span>
              <div className="text-sm font-bold text-aurora-indigo flex items-center gap-1.5 pt-0.5">
                <Unlock className="w-4 h-4 text-aurora-indigo" />
                <span>{simulationResult.unlockedRoleTitle}</span>
              </div>
            </div>
          </div>

          {/* Unlocked Skill Gaps */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] text-aurora-muted block">Skills Unlocked Upon Completion:</span>
            <div className="flex flex-wrap gap-1.5">
              {simulationResult.unlockedSkillGaps.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  <CheckCircle className="w-3 h-3 text-emerald-700" />
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
