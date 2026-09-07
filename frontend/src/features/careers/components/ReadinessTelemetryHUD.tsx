import React from 'react';
import { Compass, ShieldCheck, Award, Sparkles } from 'lucide-react';

interface ReadinessTelemetryHUDProps {
  careerTitle?: string;
  overallScore?: number;
  readinessTier?: string;
}

export const ReadinessTelemetryHUD: React.FC<ReadinessTelemetryHUDProps> = ({
  careerTitle = 'Target Career Path',
  overallScore = 85,
  readinessTier = 'Senior Level Ready',
}) => {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-slate-950/80 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
      {/* Ambient Radial Glows */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-linear-to-bl from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-linear-to-tr from-cyan-500/20 via-emerald-500/10 to-transparent blur-3xl" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Title & Overview */}
        <div className="lg:col-span-7 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-md">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono font-bold text-cyan-300 tracking-wider uppercase">
              4-Dimension Capability Engine
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Career <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-indigo-300 to-emerald-400">Readiness</span> Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Multi-dimensional evaluation across technical skills, work experience, portfolio, and certifications.
            </p>
          </div>
        </div>

        {/* Right Column: Telemetry Cards */}
        <div className="lg:col-span-5 grid grid-cols-3 gap-3 w-full">
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 text-center space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
              Active Role
            </span>
            <span className="font-display text-xs sm:text-sm font-bold text-indigo-300 truncate block mt-1">
              {careerTitle}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 text-center space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
              Overall Score
            </span>
            <span className="font-display text-xl sm:text-2xl font-bold text-cyan-400">
              {overallScore}%
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 text-center space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
              Readiness Tier
            </span>
            <span className="font-display text-[10px] sm:text-xs font-bold text-emerald-400 truncate block mt-1">
              {readinessTier}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadinessTelemetryHUD;
