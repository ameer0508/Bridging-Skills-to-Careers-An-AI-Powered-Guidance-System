import React from 'react';
import { Layers, CheckCircle2, Clock, ShieldCheck, ChevronRight, Circle, PlayCircle } from 'lucide-react';

interface IRoadmapItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  estimatedDuration: string;
  difficulty: string;
  prerequisites: string[];
  careerRelevance: string;
  expectedOutcome: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  targetSkill?: string;
}

interface IRoadmapPhase {
  _id: string;
  title: string;
  order: number;
  objective: string;
  skillsGained: string[];
  estimatedCompletionTime: string;
  items: IRoadmapItem[];
}

interface PhasedBlueprintTimelineProps {
  phases: IRoadmapPhase[];
  onUpdateStatus: (itemId: string, status: string) => void;
}

export const PhasedBlueprintTimeline: React.FC<PhasedBlueprintTimelineProps> = ({
  phases,
  onUpdateStatus,
}) => {
  if (phases.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-slate-950/70 border border-white/10 text-center space-y-2">
        <Layers className="w-8 h-8 text-slate-500 mx-auto" />
        <h4 className="text-sm font-bold text-white">No Roadmap Phases Generated</h4>
        <p className="text-xs text-slate-400">Generate a roadmap to structure your milestone journey.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {phases.map((phase) => {
        const completedCount = phase.items.filter(
          (i) => i.status === 'completed' || i.status === 'skipped'
        ).length;
        const phaseProgress =
          phase.items.length > 0 ? Math.round((completedCount / phase.items.length) * 100) : 0;

        return (
          <div
            key={phase._id || phase.order}
            className="p-6 rounded-3xl border border-white/10 bg-slate-950/70 space-y-5 shadow-xl"
          >
            {/* Phase Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <h3 className="font-display text-lg font-bold text-white tracking-tight">
                    {phase.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-400">{phase.objective}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/30">
                  {phaseProgress}% Complete
                </span>
              </div>
            </div>

            {/* Phase Items List */}
            <div className="space-y-3">
              {phase.items.map((item) => {
                const isCompleted = item.status === 'completed';
                const isInProgress = item.status === 'in_progress';

                return (
                  <div
                    key={item._id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isCompleted
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : isInProgress
                        ? 'bg-indigo-500/10 border-indigo-500/40'
                        : 'bg-slate-900/60 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 font-mono text-[9px] border border-white/10 uppercase">
                            {item.category}
                          </span>
                          {item.targetSkill && (
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[9px] font-mono font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-cyan-400" />
                              {item.targetSkill}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-white">{item.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Status Mutation Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isCompleted ? (
                          <button
                            onClick={() => onUpdateStatus(item._id, 'not_started')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Completed</span>
                          </button>
                        ) : isInProgress ? (
                          <button
                            onClick={() => onUpdateStatus(item._id, 'completed')}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <PlayCircle className="w-4 h-4 text-cyan-300" />
                            <span>In Progress</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateStatus(item._id, 'in_progress')}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Circle className="w-4 h-4 text-slate-400" />
                            <span>Start Task</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-white/5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        Est. Duration: {item.estimatedDuration || '1-2 weeks'}
                      </span>
                      <span>Difficulty: {item.difficulty}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PhasedBlueprintTimeline;
