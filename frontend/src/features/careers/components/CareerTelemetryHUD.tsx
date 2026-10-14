import React from 'react';
import { Target } from 'lucide-react';

interface CareerTelemetryHUDProps {
  totalMatches: number;
  topRoleTitle?: string;
  topMatchScore?: number;
}

export const CareerTelemetryHUD: React.FC<CareerTelemetryHUDProps> = ({
  totalMatches,
  topRoleTitle = 'Principal AI Architect',
  topMatchScore = 94,
}) => {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-aurora-line bg-aurora-canvas/60 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
      {/* Ambient Radial Glows */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-linear-to-bl from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-linear-to-tr from-emerald-500/20 via-indigo-500/10 to-transparent blur-3xl" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Title & Overview */}
        <div className="lg:col-span-7 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 backdrop-blur-md">
            <Target className="w-3.5 h-3.5 text-emerald-700" />
            <span className="text-[11px] font-bold text-emerald-700 tracking-wider uppercase">
              Deterministic Career Matching Engine
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-aurora-ink tracking-tight">
              Career <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 via-cyan-300 to-indigo-400">Observatory</span> Hub
            </h1>
            <p className="text-xs sm:text-sm text-aurora-muted">
              Role alignments calculated deterministically from verified skill evidence & requirement multipliers.
            </p>
          </div>
        </div>

        {/* Right Column: Telemetry Cards */}
        <div className="lg:col-span-5 grid grid-cols-3 gap-3 w-full">
          <div className="p-3.5 rounded-2xl bg-aurora-canvas/60 border border-aurora-line text-center space-y-1">
            <span className="text-[10px] font-bold text-aurora-muted uppercase tracking-widest block">
              Top Role Fit
            </span>
            <span className="font-display text-xs sm:text-sm font-bold text-emerald-700 truncate block mt-1">
              {topRoleTitle}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-aurora-canvas/60 border border-aurora-line text-center space-y-1">
            <span className="text-[10px] font-bold text-aurora-muted uppercase tracking-widest block">
              Peak Match
            </span>
            <span className="font-display text-xl sm:text-2xl font-bold text-aurora-violet">
              {topMatchScore}%
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-aurora-canvas/60 border border-aurora-line text-center space-y-1">
            <span className="text-[10px] font-bold text-aurora-muted uppercase tracking-widest block">
              Evaluated Roles
            </span>
            <span className="font-display text-xl sm:text-2xl font-bold text-aurora-indigo">
              {totalMatches}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerTelemetryHUD;
