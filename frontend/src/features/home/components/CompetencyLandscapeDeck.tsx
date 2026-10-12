import React, { useMemo } from 'react';
import { ArrowUpRight, Upload, Layers, AlertCircle, BookOpen } from 'lucide-react';

export interface CompetencyLandscapeDeckProps {
  skills: Array<{ name: string; category?: string }>;
  targetRole: string;
  criticalGaps?: string[];
  onNavigateSkills: () => void;
  onUploadResume: () => void;
  onBridgeGap?: (gap: string) => void;
}

export const CompetencyLandscapeDeck: React.FC<CompetencyLandscapeDeckProps> = ({
  skills,
  targetRole,
  criticalGaps = [],
  onNavigateSkills,
  onUploadResume,
  onBridgeGap,
}) => {
  const groupedSkills = useMemo(() => {
    const groups: Record<string, string[]> = {};
    skills.forEach((skill) => {
      const cat = skill.category || 'Core Competencies';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(skill.name);
    });
    return groups;
  }, [skills]);

  const categoryEntries = Object.entries(groupedSkills);
  const totalSkillsCount = skills.length;

  return (
    <section className="atelier-glass-card p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight font-display">
              Competency Architecture
            </h3>
            <p className="text-xs text-slate-400">
              Verified skills & targeted capability growth
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 font-medium">
            {totalSkillsCount} {totalSkillsCount === 1 ? 'Skill' : 'Skills'} Verified
          </span>
          <button
            onClick={onNavigateSkills}
            className="atelier-ghost-btn py-1 px-2.5 text-xs group"
          >
            <span>Explore Matrix</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Critical Growth Areas (Gaps) */}
      {criticalGaps.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between text-xs text-amber-300 font-medium">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Priority Focus Areas for {targetRole || 'Target Career'}</span>
            </span>
            <span className="text-[11px] text-amber-400/80">{criticalGaps.length} Recommendations</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {criticalGaps.map((gap) => (
              <button
                key={gap}
                onClick={() => onBridgeGap?.(gap)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border border-amber-500/20 transition-colors flex items-center gap-2 cursor-pointer"
                title={`Learn more about ${gap}`}
              >
                <BookOpen className="w-3 h-3 text-amber-400" />
                <span>{gap}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Verified Skills Landscape or Inspiring Empty State */}
      {totalSkillsCount === 0 ? (
        <div className="py-12 px-6 text-center space-y-4 rounded-2xl bg-white/[0.01] border border-dashed border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto text-sky-400">
            <Upload className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h4 className="text-base font-semibold text-white">Your skill profile is waiting to be discovered</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Upload your resume document to automatically extract technical proficiencies, project experience, and benchmark against {targetRole || 'industry roles'}.
            </p>
          </div>
          <button
            onClick={onUploadResume}
            className="atelier-cta-btn"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Resume Document</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {categoryEntries.map(([category, skillNames]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium text-slate-300">{category}</span>
                <span>{skillNames.length} verified</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {skillNames.map((skillName) => (
                  <span
                    key={skillName}
                    className="text-xs px-3 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-slate-300 transition-colors"
                  >
                    {skillName}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
