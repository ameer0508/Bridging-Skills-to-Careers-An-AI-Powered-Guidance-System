import React, { useMemo } from 'react';
import { ArrowUpRight, RefreshCw, Compass } from 'lucide-react';

export interface HorizonOrientationCanvasProps {
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

export const HorizonOrientationCanvas: React.FC<HorizonOrientationCanvasProps> = ({
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
  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(new Date());
  }, []);

  const altitudeTier = useMemo(() => {
    if (!readinessScore || !isReadinessEvaluated) {
      return {
        label: 'Orientation Phase',
        caption: 'Awaiting capability inventory to map your trajectory.',
        color: 'text-slate-400',
        stroke: '#475569',
        score: 0,
      };
    }
    if (readinessScore >= 80) {
      return {
        label: 'Peak Market Readiness',
        caption: 'Competency profile aligns strongly with senior industry requisites.',
        color: 'text-amber-400',
        stroke: '#e2b357',
        score: readinessScore,
      };
    }
    if (readinessScore >= 60) {
      return {
        label: 'Advancing Momentum',
        caption: 'Solid foundational competencies with targeted leverage points.',
        color: 'text-sky-400',
        stroke: '#38bdf8',
        score: readinessScore,
      };
    }
    return {
      label: 'Early Ascent',
      caption: 'Initial learning milestones in progress.',
      color: 'text-indigo-400',
      stroke: '#818cf8',
      score: readinessScore,
    };
  }, [readinessScore, isReadinessEvaluated]);

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * altitudeTier.score) / 100;

  return (
    <section className="carto-surface p-8 sm:p-12 relative overflow-hidden">
      {/* Subtle Spatial Horizon Lighting */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-8">
        {/* Top Temporal Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-2 text-slate-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Personal Career Cartography</span>
            </span>
            <span className="text-slate-600">•</span>
            <span>Reflected at {syncTime}</span>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Synchronize career mapping"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            {todayFormatted}
          </div>
        </div>

        {/* Narrative Orientation Core */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs text-slate-400 font-medium">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Target Role Summit</span>
              {primaryDomain && (
                <>
                  <span className="text-slate-600">/</span>
                  <span className="text-slate-300">{primaryDomain}</span>
                </>
              )}
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-display leading-[1.15]">
                {targetRole || 'Define Your Target Career'}
              </h1>
              <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed">
                Welcome back, <strong className="text-white font-semibold">{userName}</strong>. This space maps your verified technical capabilities, structural skill gaps, and active trajectory toward your chosen career summit.
              </p>
            </div>

            <div className="pt-1">
              <button
                onClick={() => onNavigate('/careers')}
                className="carto-ghost-btn group"
              >
                <span>Explore Alternative Paths</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Quiet Gravitational Altitude Ring */}
          <div className="shrink-0 flex items-center gap-6 p-6 rounded-2xl bg-black/40 border border-white/[0.06] backdrop-blur-md">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={altitudeTier.stroke}
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{
                    transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
                  {isReadinessEvaluated && readinessScore !== null ? `${readinessScore}%` : '—'}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Readiness</span>
              </div>
            </div>

            <div className="space-y-1.5 max-w-[190px]">
              <div className={`text-sm font-semibold ${altitudeTier.color}`}>
                {altitudeTier.label}
              </div>
              <p className="text-xs text-slate-400 leading-snug">
                {altitudeTier.caption}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
