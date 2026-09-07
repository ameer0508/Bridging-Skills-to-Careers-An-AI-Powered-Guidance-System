import React from 'react';
import { Calendar as CalendarIcon, TrendingUp, CheckCircle2 } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface CalendarWeek {
  weekNumber: number;
  focusTopic: string;
  isCompleted: boolean;
}

export const defaultWeeks: CalendarWeek[] = [
  { weekNumber: 1, focusTopic: 'Async FastAPI Architecture', isCompleted: true },
  { weekNumber: 2, focusTopic: 'PostgreSQL Relational Schemas', isCompleted: true },
  { weekNumber: 3, focusTopic: 'Redis Caching & Session Store', isCompleted: true },
  { weekNumber: 4, focusTopic: 'Docker Containerization & Capstone', isCompleted: false },
  { weekNumber: 5, focusTopic: 'PyTorch Deep Learning Basics', isCompleted: false },
  { weekNumber: 6, focusTopic: 'Transformers & RAG Embeddings', isCompleted: false }
];

export const LearningCalendar: React.FC<{ weeks?: CalendarWeek[] }> = ({
  weeks = defaultWeeks
}) => {
  return (
    <GlassPanel className="p-6 space-y-5 border-cyan-500/30">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Weekly Learning Velocity & Calendar Schedule</h3>
            <p className="text-xs text-slate-400">Weekly topic schedule and completion forecast pace</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
          Velocity: 1.2x Target
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {weeks.map((w, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border text-xs space-y-2 font-mono transition-all ${
              w.isCompleted
                ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-200'
                : 'bg-slate-950/60 border-white/5 text-slate-400'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Week {w.weekNumber}</span>
              {w.isCompleted ? (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                  Completed
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">Upcoming</span>
              )}
            </div>

            <p className="font-bold text-white text-xs">{w.focusTopic}</p>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
};
