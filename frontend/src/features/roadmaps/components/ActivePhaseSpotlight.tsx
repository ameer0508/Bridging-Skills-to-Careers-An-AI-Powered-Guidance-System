import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Flame,
} from 'lucide-react';

export interface ActiveRoadmapItem {
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

export interface ActivePhaseData {
  _id: string;
  order: number;
  title: string;
  objective?: string;
  skillsGained?: string[];
  estimatedCompletionTime?: string;
  items: ActiveRoadmapItem[];
}

export interface ActivePhaseSpotlightProps {
  phase: ActivePhaseData;
  onStatusChange: (itemId: string, status: string) => void;
  onInspectTask: (item: ActiveRoadmapItem) => void;
  className?: string;
}

export const ActivePhaseSpotlight: React.FC<ActivePhaseSpotlightProps> = ({
  phase,
  onStatusChange,
  onInspectTask,
  className = '',
}) => {

  const totalTasks = phase.items.length;
  const completedTasks = phase.items.filter((i) => i.status === 'completed' || i.status === 'skipped').length;
  const phaseProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Find active or first unfinished item
  const activeItem =
    phase.items.find((i) => i.status === 'in_progress') ||
    phase.items.find((i) => i.status === 'not_started') ||
    phase.items[0];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Primary Active Phase Studio Card */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-slate-950/90 p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                Active Learning Chapter
              </span>
              <span className="text-xs font-mono text-slate-400">
                Phase {phase.order} of Blueprint
              </span>
            </div>
            <h2 className="text-2xl font-black font-display text-white tracking-tight">
              {phase.title}
            </h2>
            {phase.objective && (
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {phase.objective}
              </p>
            )}
          </div>

          {/* Phase Progress Badge */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 shrink-0 text-right space-y-1">
            <div className="flex items-center justify-end gap-2">
              <span className="text-2xl font-black font-display text-cyan-400">
                {phaseProgress}%
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              {completedTasks} of {totalTasks} Tasks Complete
            </p>
          </div>
        </div>

        {/* Skills Acquired Chips */}
        {phase.skillsGained && phase.skillsGained.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Skills Target:
            </span>
            {phase.skillsGained.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Next Best Action Card inside Active Phase */}
        {activeItem && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-slate-950/80 border border-indigo-500/40 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  Immediate Priority
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {activeItem.category || 'Skill Task'} • Est. {activeItem.estimatedDuration || 'Self-paced'}
                </span>
              </div>

              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                  activeItem.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : activeItem.status === 'in_progress'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {activeItem.status.replace('_', ' ')}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-1">{activeItem.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{activeItem.description}</p>
            </div>

            {activeItem.careerRelevance && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300">
                <strong className="text-cyan-400 block mb-0.5">Career Alignment Impact:</strong>
                {activeItem.careerRelevance}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => onInspectTask(activeItem)}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>View Full Evidence & Prerequisites</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2">
                {activeItem.status !== 'completed' ? (
                  <>
                    {activeItem.status !== 'in_progress' && (
                      <button
                        type="button"
                        onClick={() =>
                          onStatusChange(activeItem._id || activeItem.itemId || '', 'in_progress')
                        }
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer border border-white/10"
                      >
                        Start Learning
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        onStatusChange(activeItem._id || activeItem.itemId || '', 'completed')
                      }
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/30"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Complete</span>
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Completed!</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Phase Tasks List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Chapter Milestone Tasks ({phase.items.length})
            </h4>
            <span className="text-[11px] text-slate-500">
              Click task to inspect prerequisites & objectives
            </span>
          </div>

          <div className="space-y-2">
            {phase.items.map((item) => {
              const id = item._id || item.itemId || '';
              const isCompleted = item.status === 'completed';
              const isInProgress = item.status === 'in_progress';

              return (
                <div
                  key={id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isCompleted
                      ? 'bg-emerald-950/20 border-emerald-500/30 opacity-75'
                      : isInProgress
                      ? 'bg-indigo-950/40 border-indigo-400/50 shadow-sm'
                      : 'bg-black/30 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div
                    onClick={() => onInspectTask(item)}
                    className="flex-1 min-w-0 cursor-pointer space-y-1"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isInProgress
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.estimatedDuration} • {item.difficulty}
                      </span>
                      {item.prerequisites && item.prerequisites.length > 0 && (
                        <span className="text-[10px] text-indigo-400 font-mono">
                          Req: {item.prerequisites.join(', ')}
                        </span>
                      )}
                    </div>
                    <h5
                      className={`text-sm font-semibold truncate ${
                        isCompleted ? 'line-through text-slate-400' : 'text-white'
                      }`}
                    >
                      {item.title}
                    </h5>
                  </div>

                  {/* 1-Click Status Quick Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onStatusChange(id, isCompleted ? 'not_started' : 'completed')}
                      title={isCompleted ? 'Mark not started' : 'Mark completed'}
                      className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        isCompleted
                          ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/40'
                          : 'bg-slate-800 hover:bg-slate-700 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivePhaseSpotlight;
