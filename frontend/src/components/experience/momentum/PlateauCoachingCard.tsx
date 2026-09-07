import React from 'react';
import { AlertTriangle, ArrowRight, Lightbulb } from 'lucide-react';
import { GlassCard } from '../cards/GlassCard';
import { PrimaryCTA } from '../buttons/PrimaryCTA';
import { PlateauAnalysis } from './PlateauDetectionEngine';

export interface PlateauCoachingCardProps {
  plateau?: PlateauAnalysis;
  onTakeAction?: () => void;
  className?: string;
}

export const PlateauCoachingCard: React.FC<PlateauCoachingCardProps> = ({
  plateau = {
    isPlateauDetected: true,
    observation: 'Your learning consistency is active, but roadmap item completion has stalled over recent sessions.',
    coachingAdvice: 'Focusing on completing one specific roadmap phase item will break through this milestone plateau.',
    recommendedAction: "Start Today's Priority Mission in your Learning Roadmap.",
  },
  onTakeAction,
  className = '',
}) => {
  if (!plateau.isPlateauDetected) return null;

  return (
    <GlassCard className={`p-6 border-amber-500/30 bg-amber-950/20 space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Learning Plateau Coaching Insight</h3>
            <p className="text-xs text-amber-300">Constructive feedback to maintain progress velocity</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
          <span className="font-semibold text-neutral-400 block">AI Telemetry Observation:</span>
          <p className="text-neutral-200 leading-relaxed">{plateau.observation}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
          <span className="font-bold text-amber-300 flex items-center gap-1">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Strategic Advice:
          </span>
          <p className="text-neutral-200 leading-relaxed">{plateau.coachingAdvice}</p>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <PrimaryCTA onClick={onTakeAction} className="bg-amber-600 hover:bg-amber-500 text-xs py-2.5">
          <span>{plateau.recommendedAction}</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </PrimaryCTA>
      </div>
    </GlassCard>
  );
};

export default PlateauCoachingCard;
