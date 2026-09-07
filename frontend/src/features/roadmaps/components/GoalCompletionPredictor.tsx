import React, { useState } from 'react';
import { Calendar, Clock, Zap, Activity } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface PredictorProps {
  totalEstimatedWeeks?: number;
  readinessDate?: string;
  onHoursChange?: (hours: number) => void;
}

export const GoalCompletionPredictor: React.FC<PredictorProps> = ({
  totalEstimatedWeeks = 16,
  readinessDate = '2027-01-14',
  onHoursChange
}) => {
  const [weeklyHours, setWeeklyHours] = useState<number>(15);

  const handleAdjust = (hrs: number) => {
    setWeeklyHours(hrs);
    if (onHoursChange) onHoursChange(hrs);
  };

  const calculatedWeeks = Math.round(totalEstimatedWeeks * (15 / weeklyHours));

  return (
    <GlassPanel className="p-5 border-emerald-500/30 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Target Goal & Timeline Predictor</h4>
        </div>
        <span className="text-xs font-mono text-emerald-400 font-bold">Predictive Forecast</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* HOURS ADJUSTER */}
        <div className="md:col-span-6 space-y-2">
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">
            Select Study Commitment (Hours / Week):
          </span>
          <div className="flex gap-2">
            {[10, 15, 20, 25].map((hrs) => (
              <button
                key={hrs}
                onClick={() => handleAdjust(hrs)}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  weeklyHours === hrs
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-900 border border-white/10 text-slate-300 hover:border-emerald-500/40'
                }`}
              >
                {hrs} hrs/wk
              </button>
            ))}
          </div>
        </div>

        {/* TIMELINE METRICS */}
        <div className="md:col-span-6 grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase">Est. Duration</span>
            <span className="font-bold text-emerald-400 text-sm">{calculatedWeeks} Weeks</span>
          </div>

          <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase">Readiness Date</span>
            <span className="font-bold text-cyan-300 text-xs truncate block">{readinessDate}</span>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};
