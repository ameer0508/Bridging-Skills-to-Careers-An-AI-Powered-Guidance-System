import React from 'react';
import { RefreshCw, Target, ShieldCheck, Compass, ArrowRight } from 'lucide-react';
import { SpotlightSurface } from './SpotlightSurface';
import { MagneticButton } from './MagneticButton';

export interface SpatialOrientationCanvasProps {
  userName: string;
  targetRole: string;
  primaryDomain?: string;
  readinessScore: number | null;
  isReadinessEvaluated: boolean;
  syncTime: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onNavigate: (route: string) => void;
}

export const SpatialOrientationCanvas: React.FC<SpatialOrientationCanvasProps> = ({
  userName,
  targetRole,
  primaryDomain,
  readinessScore,
  isReadinessEvaluated,
  syncTime,
  isRefreshing,
  onRefresh,
  onNavigate,
}) => {
  const displayScore = isReadinessEvaluated && readinessScore !== null ? Math.round(readinessScore) : null;
  const strokeDash = displayScore !== null ? (displayScore / 100) * 283 : 0;

  return (
    <SpotlightSurface
      spotlightColor="rgba(226, 179, 87, 0.08)"
      spotlightRadius={420}
      className="p-7 sm:p-10"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* Left Editorial Aperture */}
        <div className="space-y-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-amber-400/10 text-amber-300 border border-amber-400/25">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>{targetRole || 'Target Career Summit'}</span>
            </span>

            {primaryDomain && (
              <span className="text-xs text-slate-400 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
                {primaryDomain}
              </span>
            )}

            <div className="flex items-center gap-2 text-[11px] text-slate-400 ml-auto lg:ml-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-time Telemetry ({syncTime})</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-display">
              Welcome to Your Career Intelligence Space, {userName}.
            </h1>
            <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
              Your personalized dimensional cartography connecting verified competencies, high-leverage skill gaps, market opportunities, and interview preparedness.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <MagneticButton
              onClick={() => onNavigate('/readiness')}
              className="spatial-ghost-btn group"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Detailed Readiness Audit</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </MagneticButton>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="spatial-ghost-btn hover:text-white"
              title="Synchronize real-time telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isRefreshing ? 'Synchronizing...' : 'Sync Telemetry'}</span>
            </button>
          </div>
        </div>

        {/* Right Gravitational Readiness Gauge */}
        <div className="flex items-center gap-6 self-start lg:self-center p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="6"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#readinessGradient)"
                strokeWidth="6"
                strokeDasharray="283"
                strokeDashoffset={283 - strokeDash}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="readinessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-bold text-white tracking-tight">
                {displayScore !== null ? `${displayScore}%` : '—'}
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                Match
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Gravitational Readiness</span>
            </div>
            <p className="text-[11px] text-slate-400 max-w-[140px] leading-snug">
              {displayScore !== null && displayScore >= 75
                ? 'High market alignment for target role.'
                : displayScore !== null && displayScore >= 50
                ? 'Moderate alignment; bridge priority gaps.'
                : 'Initial orientation phase.'}
            </p>
          </div>
        </div>
      </div>
    </SpotlightSurface>
  );
};
