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
      className={`relative overflow-hidden rounded-3xl border border-aurora-line bg-gradient-to-br from-white via-aurora-surface to-aurora-sidebar p-6 sm:p-8 shadow-2xl space-y-6 ${className}`}
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-bl from-indigo-500/15 via-purple-500/10 to-transparent blur-3xl -z-10" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-tr from-cyan-500/15 via-indigo-500/10 to-transparent blur-3xl -z-10" />

      {/* Top Banner: Subsystem Badge & Target Context */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-aurora-line">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-aurora-indigo">
                Capability Architecture
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </div>
            <h2 className="text-sm font-semibold text-aurora-muted">
              Personalized Skill Graph & Multi-Source Evidence Records
            </h2>
          </div>
        </div>

        {/* Target Career Quick Switcher */}
        {careers && careers.length > 0 && onSelectCareer && (
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
            <span className="text-[11px] text-aurora-muted shrink-0 font-medium">
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
                      : 'bg-aurora-canvas border-aurora-line text-aurora-muted hover:text-aurora-indigo hover:border-aurora-line'
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
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-aurora-ink tracking-tight">
            Skill{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">
              Intelligence
            </span>{' '}
            Matrix
          </h1>
          <p className="text-xs sm:text-sm text-aurora-muted max-w-xl leading-relaxed">
            Your living capability map. Understand the exact competencies you possess, their
            evidence trail, and how they align with your target career goals.
          </p>
        </div>

        {/* Right Column: 4 Real Telemetry Metrics */}
        <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
          {/* Metric 1: Total Skills on Profile */}
          <div className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line text-center space-y-1 shadow-sm">
            <span className="text-[10px] font-bold text-aurora-muted uppercase tracking-wider block">
              Skills on Profile
            </span>
            <span className="font-display text-2xl font-black text-aurora-violet">
              {totalSkills}
            </span>
            <span className="text-[9px] text-aurora-muted block">Indexed</span>
          </div>

          {/* Metric 2: Dominant Category */}
          <div className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line text-center space-y-1 shadow-sm">
            <span className="text-[10px] font-bold text-aurora-muted uppercase tracking-wider block">
              Top Domain
            </span>
            <span className="font-display text-xs font-bold text-aurora-indigo truncate block mt-1.5" title={topCategory}>
              {topCategory}
            </span>
            <span className="text-[9px] text-aurora-muted block">
              {topCategoryCount} Skills
            </span>
          </div>

          {/* Metric 3: High Evidence Skills */}
          <div className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line text-center space-y-1 shadow-sm">
            <span className="text-[10px] font-bold text-aurora-muted uppercase tracking-wider block">
              High Evidence
            </span>
            <span className="font-display text-2xl font-black text-emerald-700">
              {highEvidenceCount}
            </span>
            <span className="text-[9px] text-aurora-muted block">≥75% Score</span>
          </div>

          {/* Metric 4: Target Role Coverage */}
          <div className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line text-center space-y-1 shadow-sm">
            <span className="text-[10px] font-bold text-aurora-muted uppercase tracking-wider block">
              Requirements Covered
            </span>
            <span className="font-display text-2xl font-black text-aurora-violet">
              {roleCoveragePercentage !== null ? `${roleCoveragePercentage}%` : '—'}
            </span>
            <span className="text-[9px] text-aurora-muted block truncate" title={targetRoleTitle || 'Target Role'}>
              {targetRoleTitle || 'Direction'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivingCapabilityHUD;
