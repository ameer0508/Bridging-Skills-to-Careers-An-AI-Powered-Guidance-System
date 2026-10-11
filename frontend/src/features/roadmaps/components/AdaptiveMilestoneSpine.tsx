import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Layers,
  Target,
  Award,
  ChevronRight,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useReducedMotion } from '../../../components/experience/hooks/useReducedMotion';

export interface MilestoneSpinePhase {
  _id: string;
  order: number;
  title: string;
  objective?: string;
  skillsGained?: string[];
  estimatedCompletionTime?: string;
  items: Array<{
    _id?: string;
    itemId?: string;
    title: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  }>;
}

export interface AdaptiveMilestoneSpineProps {
  phases: MilestoneSpinePhase[];
  targetRoleTitle?: string | null;
  selectedPhaseOrder: number | null;
  onSelectPhase: (phaseOrder: number) => void;
  className?: string;
}

export const AdaptiveMilestoneSpine: React.FC<AdaptiveMilestoneSpineProps> = ({
  phases,
  targetRoleTitle = 'Target Role',
  selectedPhaseOrder,
  onSelectPhase,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (!phases || phases.length === 0) {
    return null;
  }

  // Determine status for each phase
  const evaluatedPhases = phases.map((phase) => {
    const total = phase.items.length;
    const completed = phase.items.filter((i) => i.status === 'completed' || i.status === 'skipped').length;
    const isCompleted = total > 0 && completed === total;
    const hasStarted = phase.items.some((i) => i.status === 'in_progress' || i.status === 'completed');
    const phaseProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

    let state: 'completed' | 'current' | 'upcoming' = 'upcoming';
    if (isCompleted) {
      state = 'completed';
    } else if (hasStarted || phase.order === selectedPhaseOrder) {
      state = 'current';
    }

    return {
      ...phase,
      totalItems: total,
      completedItems: completed,
      phaseProgress,
      state,
    };
  });

  // Ensure at least one phase is marked as current if none is in progress yet
  const hasCurrent = evaluatedPhases.some((p) => p.state === 'current');
  if (!hasCurrent && evaluatedPhases.length > 0) {
    const firstUnfinished = evaluatedPhases.find((p) => p.state !== 'completed');
    if (firstUnfinished) {
      firstUnfinished.state = 'current';
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Visual Spine Container */}
      <div className="relative p-6 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-xl overflow-x-auto">
        <div className="flex items-center justify-between min-w-[720px] relative pb-2">
          {/* Continuous trajectory baseline line */}
          <div className="absolute top-8 left-12 right-12 h-1 bg-gradient-to-r from-emerald-500/40 via-indigo-500/50 to-rose-500/40 -translate-y-1/2 rounded-full pointer-events-none -z-0" />

          {/* START BASELINE NODE */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-2 max-w-[110px]">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider">
                Baseline
              </span>
              <p className="text-xs font-semibold text-slate-300">Verified Skills</p>
            </div>
          </div>

          {/* PHASE NODES */}
          {evaluatedPhases.map((phase) => {
            const isSelected = selectedPhaseOrder === phase.order;
            const isCompleted = phase.state === 'completed';
            const isCurrent = phase.state === 'current';

            return (
              <React.Fragment key={phase._id || phase.order}>
                {/* Connecting arrow separator */}
                <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 relative z-10" />

                {/* Phase Node Button */}
                <motion.button
                  type="button"
                  onClick={() => onSelectPhase(phase.order)}
                  whileHover={!prefersReducedMotion ? { y: -3, scale: 1.02 } : undefined}
                  className={`relative z-10 p-3.5 rounded-2xl border text-left transition-all cursor-pointer min-w-[170px] max-w-[200px] ${
                    isSelected
                      ? 'bg-indigo-950/80 border-indigo-400 ring-2 ring-indigo-500/30 shadow-xl shadow-indigo-950/70'
                      : isCompleted
                      ? 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-400/70'
                      : isCurrent
                      ? 'bg-slate-900/90 border-cyan-500/50 shadow-lg shadow-cyan-950/40'
                      : 'bg-slate-950/60 border-white/10 opacity-70 hover:opacity-100 hover:border-white/20'
                  }`}
                >
                  {/* Status Indicator Chip */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isCurrent
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-slate-800 text-slate-400 border border-white/5'
                      }`}
                    >
                      {isCompleted ? '✓ Done' : isCurrent ? '● Active' : 'Upcoming'}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {phase.phaseProgress}%
                    </span>
                  </div>

                  {/* Title & Stats */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white line-clamp-1">
                      {phase.title}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {phase.completedItems}/{phase.totalItems} Tasks Done
                    </p>
                  </div>

                  {/* Progress Mini Track */}
                  <div className="mt-2.5 w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${phase.phaseProgress}%` }}
                      className={`h-full rounded-full ${
                        isCompleted
                          ? 'bg-emerald-400'
                          : isCurrent
                          ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                          : 'bg-slate-600'
                      }`}
                    />
                  </div>
                </motion.button>
              </React.Fragment>
            );
          })}

          {/* DESTINATION NODE: TARGET ROLE */}
          <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 relative z-10" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-2 max-w-[130px]">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/70 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/50">
              <Award className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-bold uppercase text-rose-400 tracking-wider">
                Target Role
              </span>
              <p className="text-xs font-bold text-white truncate max-w-[120px]">
                {targetRoleTitle}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdaptiveMilestoneSpine;
