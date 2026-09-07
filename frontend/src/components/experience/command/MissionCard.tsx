import React from 'react';
import { Target, Zap, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../cards/GlassCard';
import { PrimaryCTA } from '../buttons/PrimaryCTA';

export interface MissionCardProps {
  title?: string;
  category?: string;
  estimatedEffort?: string;
  impactScore?: number;
  isCompleted?: boolean;
  onAction?: () => void;
  className?: string;
}

export const MissionCard: React.FC<MissionCardProps> = ({
  title,
  category = 'Roadmap Milestone',
  estimatedEffort = '45 mins',
  impactScore = 92,
  isCompleted = false,
  onAction,
  className = '',
}) => {
  if (!title) {
    return (
      <GlassCard className={`p-6 border-indigo-500/20 bg-indigo-950/20 ${className}`}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Today's Mission
            </span>
            <h4 className="text-base font-bold text-white">Upload Resume to Activate Missions</h4>
            <p className="text-xs text-neutral-400">
              Your AI Career Architect will construct personalized daily missions once your profile or resume is analyzed.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={`p-6 border-indigo-500/30 bg-indigo-950/30 shadow-xl ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-linear-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20 shrink-0">

            <Target className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Today's Priority Mission
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {category}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {title}
              {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            </h3>
            <div className="flex items-center gap-4 text-xs text-neutral-400 pt-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>{estimatedEffort}</span>
              </div>
              <div className="flex items-center gap-1 font-medium text-emerald-400">
                <Zap className="w-3.5 h-3.5" />
                <span>+{impactScore}% Impact Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right CTA */}
        <div className="shrink-0">
          <PrimaryCTA onClick={onAction} isSuccess={isCompleted}>
            {isCompleted ? 'Mission Completed' : 'Execute Mission'}
            {!isCompleted && <ArrowRight className="w-4 h-4 ml-1" />}
          </PrimaryCTA>
        </div>
      </div>
    </GlassCard>
  );
};

export default MissionCard;
