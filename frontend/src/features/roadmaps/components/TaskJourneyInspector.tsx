import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle2,
  Clock,
  Target,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { useReducedMotion } from '../../../components/experience/hooks/useReducedMotion';

export interface TaskInspectorData {
  _id?: string;
  itemId?: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  estimatedDuration: string;
  difficulty: string;
  prerequisites?: string[];
  careerRelevance?: string;
  expectedOutcome?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  targetSkill?: string;
}

export interface TaskJourneyInspectorProps {
  task: TaskInspectorData | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (itemId: string, status: string) => void;
  targetRoleTitle?: string | null;
}

export const TaskJourneyInspector: React.FC<TaskJourneyInspectorProps> = ({
  task,
  isOpen,
  onClose,
  onStatusChange,
  targetRoleTitle = 'Target Role',
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (!isOpen || !task) return null;

  const taskId = task._id || task.itemId || '';
  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
        {/* Backdrop click */}
        <div className="flex-1" onClick={onClose} />

        {/* Slide-over Container */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' }}
          className="w-full max-w-xl h-full bg-slate-950 border-l border-white/10 p-6 md:p-8 overflow-y-auto custom-scrollbar shadow-2xl flex flex-col justify-between space-y-6"
        >
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Layers className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold tracking-wider block">
                    Learning Journey Workspace
                  </span>
                  <h3 className="text-base font-bold text-white">Milestone Execution Studio</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task Category & Status Badge */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                  {task.category || 'Competency'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold">
                  {task.difficulty || 'Intermediate'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  {task.estimatedDuration || '45 mins'}
                </span>
              </div>

              <span
                className={`text-xs font-mono font-bold uppercase px-3 py-1 rounded-lg ${
                  isCompleted
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : isInProgress
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-slate-800 text-slate-400 border border-white/5'
                }`}
              >
                {task.status.replace('_', ' ')}
              </span>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-black font-display text-white tracking-tight">
                {task.title}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">{task.description}</p>
            </div>

            {/* Target Skill */}
            {task.targetSkill && (
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1">
                <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold block">
                  Target Skill Acquisition
                </span>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>{task.targetSkill}</span>
                </div>
              </div>
            )}

            {/* Career Relevance */}
            {task.careerRelevance && (
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <strong className="text-xs font-mono uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  Career Readiness Alignment
                </strong>
                <p className="text-xs text-slate-300 leading-relaxed">{task.careerRelevance}</p>
              </div>
            )}

            {/* Expected Outcome */}
            {task.expectedOutcome && (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                <strong className="text-xs font-mono uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Expected Milestone Outcome
                </strong>
                <p className="text-xs text-slate-300 leading-relaxed">{task.expectedOutcome}</p>
              </div>
            )}

            {/* Prerequisites */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider block">
                Required Prerequisites
              </span>
              {task.prerequisites && task.prerequisites.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {task.prerequisites.map((p, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  No foundational prerequisites required. This task is directly actionable.
                </p>
              )}
            </div>
          </div>

          {/* Action Footer: Status Switcher */}
          <div className="pt-6 border-t border-white/10 space-y-3">
            <span className="text-xs font-mono uppercase text-slate-400 font-bold block">
              Update Execution Status
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => onStatusChange(taskId, 'not_started')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  task.status === 'not_started'
                    ? 'bg-slate-700 text-white border-white/20'
                    : 'bg-black/30 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                Not Started
              </button>
              <button
                type="button"
                onClick={() => onStatusChange(taskId, 'in_progress')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  task.status === 'in_progress'
                    ? 'bg-cyan-600 text-white border-cyan-400'
                    : 'bg-black/30 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                In Progress
              </button>
              <button
                type="button"
                onClick={() => onStatusChange(taskId, 'completed')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  task.status === 'completed'
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-black/30 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                Completed
              </button>
              <button
                type="button"
                onClick={() => onStatusChange(taskId, 'skipped')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  task.status === 'skipped'
                    ? 'bg-slate-600 text-white border-white/20'
                    : 'bg-black/30 text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                Skip
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaskJourneyInspector;
