import React from 'react';
import { Cpu, ShieldCheck, Award, Sparkles } from 'lucide-react';

interface SkillTelemetryHUDProps {
  totalSkills: number;
  topCategory?: string;
  maxScore?: number;
}

export const SkillTelemetryHUD: React.FC<SkillTelemetryHUDProps> = ({
  totalSkills,
  topCategory = 'AI & Engineering',
  maxScore = 95,
}) => {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-slate-950/80 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
      {/* Ambient Radial Glows */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-linear-to-bl from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-linear-to-tr from-cyan-500/20 via-indigo-500/10 to-transparent blur-3xl" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Title & Overview */}
        <div className="lg:col-span-7 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono font-bold text-indigo-300 tracking-wider uppercase">
              Semantic Skill Taxonomy Graph
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Skill <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-purple-300 to-cyan-400">Intelligence</span> Matrix
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Deterministic skill nodes verified via work experience, projects, and certifications.
            </p>
          </div>
        </div>

        {/* Right Column: Telemetry Cards */}
        <div className="lg:col-span-5 grid grid-cols-3 gap-3 w-full">
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 text-center space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
              Total Skills
            </span>
            <span className="font-display text-xl sm:text-2xl font-bold text-cyan-400">
              {totalSkills}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 text-center space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
              Top Domain
            </span>
            <span className="font-display text-xs sm:text-sm font-bold text-indigo-300 truncate block mt-1">
              {topCategory}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 text-center space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
              Peak Evidence
            </span>
            <span className="font-display text-xl sm:text-2xl font-bold text-emerald-400">
              {maxScore}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillTelemetryHUD;
