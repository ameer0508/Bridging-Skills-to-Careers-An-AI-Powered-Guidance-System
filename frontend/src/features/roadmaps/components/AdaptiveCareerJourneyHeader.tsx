import React from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Target,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useReducedMotion } from '../../../components/experience/hooks/useReducedMotion';

export interface CareerOption {
  _id: string;
  title: string;
}

export interface AdaptiveCareerJourneyHeaderProps {
  userName?: string;
  targetRoleTitle?: string | null;
  careers: Array<{ careerId: CareerOption }>;
  activeCareerId: string | null;
  onSelectCareer: (careerId: string) => void;
  activePhaseTitle?: string | null;
  activePhaseOrder?: number | null;
  totalPhasesCount: number;
  progressPercentage: number;
  completedTasksCount: number;
  totalTasksCount: number;
  nextBestItem?: {
    _id: string;
    title: string;
    category?: string;
    estimatedDuration?: string;
    priority?: string;
  } | null;
  onStartNextTask?: (itemId: string) => void;
  onRegenerateRoadmap?: () => void;
  isRegenerating?: boolean;
  lastUpdated?: string | null;
}

export const AdaptiveCareerJourneyHeader: React.FC<AdaptiveCareerJourneyHeaderProps> = ({
  userName = 'Learner',
  targetRoleTitle,
  careers,
  activeCareerId,
  onSelectCareer,
  activePhaseTitle,
  activePhaseOrder,
  totalPhasesCount,
  progressPercentage = 0,
  completedTasksCount = 0,
  totalTasksCount = 0,
  nextBestItem,
  onStartNextTask,
  onRegenerateRoadmap,
  isRegenerating = false,
  lastUpdated,
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Formatting date or relative sync time
  const formattedSyncTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Live Synced';

  // Calculate estimated remaining effort
  const remainingTasks = Math.max(0, totalTasksCount - completedTasksCount);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-indigo-950/40 p-6 md:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
      {/* Background ambient radial glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Bar: Subsystem Badge & AI Sync Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-indigo-400">
                AI Career Navigation Engine
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <h2 className="text-sm font-semibold text-slate-300">
              Personalized Learning Journey for <span className="text-white font-bold">{userName}</span>
            </h2>
          </div>
        </div>

        {/* Adaptive Sync Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-400">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Updated: {formattedSyncTime}</span>
          </div>

          {onRegenerateRoadmap && (
            <button
              type="button"
              onClick={onRegenerateRoadmap}
              disabled={isRegenerating || !activeCareerId}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                isRegenerating
                  ? 'bg-slate-800/60 border-white/10 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/30 hover:border-indigo-500/50 text-indigo-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>{isRegenerating ? 'Re-aligning Blueprint...' : 'Re-align with AI'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Journey Direction Grid: 4 Core Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Col (7 cols): Destination Role & Active Phase Flow */}
        <div className="lg:col-span-7 space-y-5">
          {/* Target Role Selector & Destination Banner */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-rose-400" /> Target Career Destination
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
                {targetRoleTitle || 'Select Target Career'}
              </h1>
              {targetRoleTitle && (
                <span className="px-2.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-xs font-semibold">
                  Verified Direction
                </span>
              )}
            </div>

            {/* Target Career Switcher Chips */}
            {careers && careers.length > 0 && (
              <div className="pt-2 flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                <span className="text-xs text-slate-400 shrink-0 font-medium">Switch Target:</span>
                {careers.map((c) => {
                  const isSelected = activeCareerId === c.careerId._id;
                  return (
                    <button
                      key={c.careerId._id}
                      type="button"
                      onClick={() => onSelectCareer(c.careerId._id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30 font-bold'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {c.careerId.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Journey Progression Ribbon: Current State -> Active Phase -> Goal */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Journey Trajectory</span>
              <span className="text-cyan-400 font-mono font-bold">
                {totalPhasesCount > 0
                  ? `Stage ${activePhaseOrder || 1} of ${totalPhasesCount}`
                  : 'Curriculum Initializing'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Base Skills</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 font-bold shrink-0 shadow-sm">
                <Layers className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>{activePhaseTitle || 'Phase 1: Foundation'}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/40 border border-white/5 text-slate-400 font-medium shrink-0">
                <Target className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate max-w-[140px]">{targetRoleTitle || 'Goal'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col (5 cols): Real Progress & Next Learning Action */}
        <div className="lg:col-span-5 space-y-4">
          {/* Progress Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                Overall Journey Completion
              </span>
              <span className="text-2xl font-black font-display text-white tracking-tight">
                {progressPercentage}%
              </span>
            </div>

            {/* Custom Track Bar */}
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 shadow-sm shadow-cyan-400/30"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>
                <strong className="text-white font-semibold">{completedTasksCount}</strong> of{' '}
                <strong className="text-white font-semibold">{totalTasksCount}</strong> Tasks Done
              </span>
              <span>
                <strong className="text-cyan-400 font-semibold">{remainingTasks}</strong> Remaining
              </span>
            </div>
          </div>

          {/* Action Area: What to do next */}
          {nextBestItem ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-slate-900/80 border border-indigo-500/30 flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-cyan-400 font-bold">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>Next Action Milestone</span>
                </div>
                <h4 className="text-sm font-bold text-white truncate">{nextBestItem.title}</h4>
                <p className="text-[11px] text-slate-400">
                  {nextBestItem.category || 'Core Skill'} • {nextBestItem.estimatedDuration || 'Self-paced'}
                </p>
              </div>

              {onStartNextTask && (
                <button
                  type="button"
                  onClick={() => onStartNextTask(nextBestItem._id)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  <span>Start</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 text-center text-xs text-slate-400">
              {totalTasksCount > 0 && completedTasksCount >= totalTasksCount ? (
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All Roadmap Milestones Completed! Ready for Role.</span>
                </div>
              ) : (
                <span>No active task pending. Re-align with AI to sequence new tasks.</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdaptiveCareerJourneyHeader;
