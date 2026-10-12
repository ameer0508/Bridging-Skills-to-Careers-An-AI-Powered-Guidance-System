import React from 'react';
import { ArrowUpRight, AlertTriangle, Layers, Upload } from 'lucide-react';

export interface CompetencyVectorMeshProps {
  skills: Array<{ name: string; category?: string }>;
  targetRole: string;
  criticalGaps?: string[];
  onNavigateSkills: () => void;
  onUploadResume: () => void;
}

export const CompetencyVectorMesh: React.FC<CompetencyVectorMeshProps> = ({
  skills,
  targetRole,
  criticalGaps = [],
  onNavigateSkills,
  onUploadResume,
}) => {
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
    <section className="quantum-glass-panel p-6 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-white tracking-tight">
              Competency Vector Portfolio
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Audited Skill Profile & Gap Analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-semibold">
            {totalSkillsCount} Verified
          </span>
          <button
            onClick={onNavigateSkills}
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 cursor-pointer group"
          >
            <span>Matrix View</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Critical Gaps Alert Deck if present */}
      {criticalGaps.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/20 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-amber-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              PRIORITY SKILL GAPS FOR {targetRole.toUpperCase() || 'TARGET ROLE'}
            </span>
            <span className="text-[10px] text-amber-400/80 uppercase">{criticalGaps.length} Action Items</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {criticalGaps.map((gap) => (
              <span
                key={gap}
                className="text-xs font-medium px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-200 border border-amber-500/30 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {gap}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Body: Categorized Skill Clusters or Empty State */}
      {totalSkillsCount === 0 ? (
        <div className="py-10 px-4 text-center space-y-4 rounded-xl bg-slate-950/40 border border-white/5">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
            <Upload className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">No Competencies Registered</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Upload your resume document to parse work history, technologies, and benchmark against {targetRole || 'your target career'}.
            </p>
          </div>
          <button
            onClick={onUploadResume}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Resume Document</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryEntries.slice(0, 4).map(([category, items]) => (
              <div
                key={category}
                className="p-4 rounded-xl bg-slate-950/50 border border-white/5 space-y-2.5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                    {category}
                  </span>
                  <span className="text-slate-500 text-[10px]">{items.length} nodes</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {items.slice(0, 6).map((name) => (
                    <span
                      key={name}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-900/80 text-slate-200 border border-white/10 hover:border-cyan-500/40 hover:text-cyan-200 transition-all font-medium"
                    >
                      {name}
                    </span>
                  ))}
                  {items.length > 6 && (
                    <span className="text-[11px] font-mono px-2 py-1 text-slate-500 self-center">
                      +{items.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 text-xs font-mono text-slate-500">
            <span>Aggregated through AI Semantic Resume Extraction</span>
            <button
              onClick={onNavigateSkills}
              className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
            >
              Explore Full Taxonomy →
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
