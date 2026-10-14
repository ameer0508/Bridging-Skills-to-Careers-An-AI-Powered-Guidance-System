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
      <div className="flex items-center justify-between pb-3 border-b border-aurora-line">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-aurora-ink">Recorded Achievements</h3>
            <p className="text-xs text-aurora-muted">
              Evidence-based competency milestones evaluated by AI telemetry
            </p>
          </div>
        </div>
      </div>

      {achievements.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-aurora-canvas/60 border border-dashed border-aurora-line space-y-2">
          <ShieldCheck className="w-8 h-8 mx-auto text-aurora-indigo opacity-80" />
          <h4 className="text-sm font-semibold text-aurora-ink">No Recorded Achievements Yet</h4>
          <p className="text-xs text-aurora-muted max-w-sm mx-auto">
            Complete your active roadmap milestones or skill graph verifications to record evidence-backed achievements.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="p-4 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-2 hover:border-aurora-violet/25 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{ach.category}</span>
                </div>
                <span className="text-[10px] text-aurora-muted">{ach.dateEarned}</span>
              </div>
              <h4 className="text-sm font-bold text-aurora-ink">{ach.title}</h4>
              <p className="text-xs text-aurora-muted">{ach.reason}</p>
              <div className="pt-1 flex items-center justify-between text-[11px] text-aurora-muted border-t border-aurora-line">
                <span>Evidence: <strong className="text-aurora-ink">{ach.evidence}</strong></span>
                <span className="text-emerald-700 font-semibold">+{ach.impactScore}% Impact</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export default ProfessionalAchievements;
