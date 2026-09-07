import React from 'react';
import { Award, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../cards/GlassCard';
import { Achievement } from './AchievementEngine';

export interface ProfessionalAchievementsProps {
  achievements?: Achievement[];
  className?: string;
}

export const ProfessionalAchievements: React.FC<ProfessionalAchievementsProps> = ({
  achievements = [],
  className = '',
}) => {
  return (
    <GlassCard className={`p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Professional Verified Achievements</h3>
            <p className="text-xs text-neutral-400">
              Evidence-based competency milestones evaluated by AI telemetry
            </p>
          </div>
        </div>
      </div>

      {achievements.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-black/30 border border-dashed border-white/10 space-y-2">
          <ShieldCheck className="w-8 h-8 mx-auto text-indigo-400 opacity-80" />
          <h4 className="text-sm font-semibold text-white">No Verified Achievements Yet</h4>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Complete your active roadmap milestones or skill graph verifications to record evidence-backed achievements.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2 hover:border-indigo-500/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{ach.category}</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">{ach.dateEarned}</span>
              </div>
              <h4 className="text-sm font-bold text-white">{ach.title}</h4>
              <p className="text-xs text-neutral-300">{ach.reason}</p>
              <div className="pt-1 flex items-center justify-between text-[11px] text-neutral-400 border-t border-white/5">
                <span>Evidence: <strong className="text-neutral-200">{ach.evidence}</strong></span>
                <span className="text-emerald-400 font-semibold">+{ach.impactScore}% Impact</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export default ProfessionalAchievements;
