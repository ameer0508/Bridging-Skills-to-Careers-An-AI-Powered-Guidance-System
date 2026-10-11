import React from 'react';
import { ArrowUpRight, AlertTriangle, Layers, Upload } from 'lucide-react';

interface SkillsCompetencyLedgerProps {
  skills: Array<{ name: string; category?: string }>;
  targetRole: string;
  criticalGaps?: string[];
  onNavigateSkills: () => void;
  onUploadResume: () => void;
}

export const SkillsCompetencyLedger: React.FC<SkillsCompetencyLedgerProps> = ({
  skills,
  targetRole,
  criticalGaps = [],
  onNavigateSkills,
  onUploadResume,
}) => {
  // Group skills by category cleanly
  const groupedSkills = React.useMemo(() => {
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
    <section className="editorial-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 hairline-divider">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="editorial-tag text-slate-200">Competency Portfolio</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
            {totalSkillsCount} Verified
          </span>
          <button
            onClick={onNavigateSkills}
            className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>All skills</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body: Empty State or Categorized Matrix */}
      {totalSkillsCount === 0 ? (
        <div className="py-8 px-4 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
            <Upload className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-200">No skills identified yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Upload your resume or enter skills manually to benchmark your competencies against {targetRole || 'your target role'}.
            </p>
          </div>
          <button
            onClick={onUploadResume}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 cursor-pointer transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Resume Document</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Categorized Skills */}
          <div className="space-y-3">
            {categoryEntries.slice(0, 4).map(([category, items]) => (
              <div key={category} className="space-y-1.5">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  {category} ({items.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {items.slice(0, 8).map((name) => (
                    <span
                      key={name}
                      className="text-xs px-2.5 py-1 rounded-md bg-slate-800/90 text-slate-200 border border-slate-700/70 hover:border-slate-500 transition-colors"
                    >
                      {name}
                    </span>
                  ))}
                  {items.length > 8 && (
                    <span className="text-xs px-2 py-1 text-slate-500 font-medium">
                      +{items.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Identified Skill Gaps (if any) */}
          {criticalGaps.length > 0 && (
            <div className="pt-3 hairline-divider space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Identified Priority Skill Gaps ({criticalGaps.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {criticalGaps.slice(0, 5).map((gap) => (
                  <span
                    key={gap}
                    className="text-xs px-2.5 py-0.5 rounded-md bg-amber-950/40 text-amber-300 border border-amber-800/60 font-medium"
                  >
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
