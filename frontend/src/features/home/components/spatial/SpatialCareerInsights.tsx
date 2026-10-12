import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { MagneticButton } from './MagneticButton';

export interface SpatialCareerInsightsProps {
  topRecommendation?: {
    title?: string;
    type?: string;
    reason?: string;
    actionLabel?: string;
    route?: string;
  } | null;
  onNavigate: (route: string) => void;
}

export const SpatialCareerInsights: React.FC<SpatialCareerInsightsProps> = ({
  topRecommendation,
  onNavigate,
}) => {
  const rec = topRecommendation || {
    title: 'Profile Optimization & Career Cartography',
    type: 'Career Directive',
    reason: 'Synthesize verified capabilities, benchmark role readiness, and unlock tailored market pathways.',
    actionLabel: 'Explore Capabilities',
    route: '/skills',
  };

  return (
    <div className="spatial-glass-blade p-6 sm:p-8 relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-start gap-4 max-w-2xl">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Sparkles className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                {rec.type || 'Career Intelligence'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {rec.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {rec.reason}
            </p>
          </div>
        </div>

        <MagneticButton
          onClick={() => onNavigate(rec.route || '/skills')}
          className="catalyst-magnetic-btn text-xs py-2.5 px-5 shrink-0 self-start md:self-center shadow-[0_0_20px_rgba(245,158,11,0.3)]"
        >
          <span>{rec.actionLabel || 'Execute Directive'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </MagneticButton>
      </div>
    </div>
  );
};
