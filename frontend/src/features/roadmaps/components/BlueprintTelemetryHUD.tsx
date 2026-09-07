import React from 'react';
import { Layers, CheckCircle2, Sparkles, Clock } from 'lucide-react';

interface BlueprintTelemetryHUDProps {
  careerTitle?: string;
  progressPercentage?: number;
  activePhaseTitle?: string;
}

export const BlueprintTelemetryHUD: React.FC<BlueprintTelemetryHUDProps> = ({
  careerTitle = 'Target Career Blueprint',
  progressPercentage = 0,
  activePhaseTitle = 'Phase 1: Critical Foundations',
}) => {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-slate-950/80 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
      {/* Ambient Radial Glows */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-linear-to-bl from-cyan-500/20 via-indigo-500/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-linear-to-tr from-emerald-500/20 via-purple-500/10 to-transparent blur-3xl" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Title & Overview */}
        <div className="lg:col-span-7 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono font-bold text-indigo-300 tracking-wider uppercase">
              Adaptive Learning Blueprint
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Career <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-cyan-300 to-emerald-400">Blueprint</span> Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Phased milestone execution connecting skill gaps, learning resources, and readiness growth.
            </p>
          </div>
        </div>

        {/* Right Column: Telemetry Cards */}
        <div className="lg:col-span-5 grid grid-cols-3 gap-3 w-full">
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 text-center space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
              Target Role
            </span>
            <span className="font-display text-xs sm:text-sm font-bold text-indigo-300 truncate block mt-1">
              {careerTitle}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 text-center space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
              Progress
            </span>
            <span className="font-display text-xl sm:text-2xl font-bold text-emerald-400">
              {progressPercentage}%
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 text-center space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
              Current Phase
            </span>
            <span className="font-display text-[10px] sm:text-xs font-bold text-cyan-400 truncate block mt-1">
              {activePhaseTitle?.split(':')[0] || 'Phase 1'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlueprintTelemetryHUD;
