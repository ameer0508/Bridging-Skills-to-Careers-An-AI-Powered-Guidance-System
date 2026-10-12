import React from 'react';
import {
  Brain,
} from 'lucide-react';

export interface LivingCapabilityHUDProps {
  totalSkills: number;
  topCategory: string;
  topCategoryCount: number;
  highEvidenceCount: number;
  targetRoleTitle?: string | null;
  targetMatchedSkillsCount?: number;
  targetTotalRequiredCount?: number;
  careers?: Array<{ careerId: { _id: string; title: string } }>;
  activeCareerId?: string | null;
  onSelectCareer?: (careerId: string) => void;
  className?: string;
}

export const LivingCapabilityHUD: React.FC<LivingCapabilityHUDProps> = ({
  totalSkills,
  topCategory,
  topCategoryCount,
  highEvidenceCount,
  targetRoleTitle,
  targetMatchedSkillsCount = 0,
  targetTotalRequiredCount = 0,
  careers = [],
  activeCareerId,
  onSelectCareer,
  className = '',
}) => {

  const roleCoveragePercentage =
    targetTotalRequiredCount > 0
      ? Math.round((targetMatchedSkillsCount / targetTotalRequiredCount) * 100)
      : null;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-indigo-950/40 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6 ${className}`}
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-bl from-indigo-500/15 via-purple-500/10 to-transparent blur-3xl -z-10" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-tr from-cyan-500/15 via-indigo-500/10 to-transparent blur-3xl -z-10" />

      {/* Top Banner: Subsystem Badge & Target Context */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-indigo-400">
                Verified Capability Architecture
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <h2 className="text-sm font-semibold text-slate-300">
              Personalized Skill Graph & Multi-Source Evidence Records
            </h2>
          </div>
        </div>

        {/* Target Career Quick Switcher */}
        {careers && careers.length > 0 && onSelectCareer && (
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
            <span className="text-[11px] font-mono text-slate-400 shrink-0 font-medium">
              Target Lens:
            </span>
            {careers.slice(0, 3).map((c) => {
              const isSelected = activeCareerId === c.careerId._id;
              return (
                <button
                  key={c.careerId._id}
                  type="button"
                  onClick={() => onSelectCareer(c.careerId._id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30 font-bold'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-white/20'
                  }`}
                >
                  {c.careerId.title}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Row: Header Info & Telemetry Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Title & Mission */}
        <div className="lg:col-span-6 space-y-2">
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Skill{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">
              Intelligence
            </span>{' '}
            Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Your living capability map. Understand the exact competencies you possess, their verified
            evidence trail, and how they align with your target career goals.
          </p>
        </div>

        {/* Right Column: 4 Real Telemetry Metrics */}
        <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
          {/* Metric 1: Total Verified Skills */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 text-center space-y-1 shadow-sm">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Verified Skills
            </span>
            <span className="font-display text-2xl font-black text-cyan-400">
              {totalSkills}
            </span>
            <span className="text-[9px] font-mono text-slate-500 block">Indexed</span>
          </div>

          {/* Metric 2: Dominant Category */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 text-center space-y-1 shadow-sm">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Top Domain
            </span>
            <span className="font-display text-xs font-bold text-indigo-300 truncate block mt-1.5" title={topCategory}>
              {topCategory}
            </span>
            <span className="text-[9px] font-mono text-slate-500 block">
              {topCategoryCount} Skills
            </span>
          </div>

          {/* Metric 3: High Evidence Skills */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 text-center space-y-1 shadow-sm">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              High Evidence
            </span>
            <span className="font-display text-2xl font-black text-emerald-400">
              {highEvidenceCount}
            </span>
            <span className="text-[9px] font-mono text-slate-500 block">≥75% Score</span>
          </div>

          {/* Metric 4: Target Role Coverage */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 text-center space-y-1 shadow-sm">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Requirements Covered
            </span>
            <span className="font-display text-2xl font-black text-purple-400">
              {roleCoveragePercentage !== null ? `${roleCoveragePercentage}%` : '—'}
            </span>
            <span className="text-[9px] font-mono text-slate-500 block truncate" title={targetRoleTitle || 'Target Role'}>
              {targetRoleTitle || 'Direction'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivingCapabilityHUD;
