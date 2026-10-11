import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { SpotlightSurface } from './SpotlightSurface';
import { MagneticButton } from './MagneticButton';
import { NextBestActionInfo } from '../index';

export interface SpatialCatalystActionProps {
  nextBestAction: NextBestActionInfo;
  targetRole: string;
  onNavigate: (route: string) => void;
}

export const SpatialCatalystAction: React.FC<SpatialCatalystActionProps> = ({
  nextBestAction,
  targetRole,
  onNavigate,
}) => {
  return (
    <SpotlightSurface
      spotlightColor="rgba(245, 158, 11, 0.12)"
      spotlightRadius={380}
      className="p-6 sm:p-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-amber-400/10 text-amber-300 border border-amber-400/25">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{nextBestAction.badge || 'Highest Leverage Direct Action'}</span>
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Aligned with {targetRole || 'Career Summit'}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight font-display">
            {nextBestAction.title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
            {nextBestAction.subtitle}
          </p>
        </div>

        <div className="shrink-0 flex items-center">
          <MagneticButton
            onClick={() => onNavigate(nextBestAction.route)}
            className="catalyst-magnetic-btn group w-full md:w-auto"
          >
            <span>{nextBestAction.actionLabel}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </MagneticButton>
        </div>
      </div>
    </SpotlightSurface>
  );
};
