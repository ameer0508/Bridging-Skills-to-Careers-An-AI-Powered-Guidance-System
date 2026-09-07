import React from 'react';
import { ShieldCheck, Cpu, ChevronRight } from 'lucide-react';

interface IEvidence {
  sourceType: string;
  description: string;
  weight: number;
}

interface IUserSkill {
  id: string;
  skillId: string;
  name: string;
  evidenceScore: number;
  evidences: IEvidence[];
  aliases: string[];
}

interface SkillNodeMatrixProps {
  categories: Record<string, IUserSkill[]>;
  onSelectSkill: (skill: IUserSkill) => void;
}

export const SkillNodeMatrix: React.FC<SkillNodeMatrixProps> = ({
  categories,
  onSelectSkill,
}) => {
  const categoryEntries = Object.entries(categories);

  if (categoryEntries.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-slate-950/70 border border-white/10 text-center space-y-2">
        <Cpu className="w-8 h-8 text-slate-500 mx-auto" />
        <h4 className="text-sm font-bold text-white">No Matching Skills Found</h4>
        <p className="text-xs text-slate-400">Try adjusting your search query or category filter.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {categoryEntries.map(([category, skills]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="font-display text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              {category}
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              {skills.length} {skills.length === 1 ? 'Skill' : 'Skills'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {skills.map((skill) => (
              <div
                key={skill.id || skill.name}
                onClick={() => onSelectSkill(skill)}
                className="group p-4 rounded-2xl bg-slate-950/70 border border-white/10 hover:border-indigo-500/40 hover:bg-slate-900/80 transition-all cursor-pointer space-y-2.5 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                    {skill.name}
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Evidence Score</span>
                  <span className="text-emerald-400 font-bold">{skill.evidenceScore}%</span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-linear-to-r from-indigo-500 via-purple-500 to-cyan-400 h-1.5 rounded-full"
                    style={{ width: `${skill.evidenceScore}%` }}
                  />
                </div>

                <div className="pt-1 flex items-center justify-between text-[9px] font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
                  <span>{skill.evidences?.length || 1} Evidence Records</span>
                  <ChevronRight className="w-3 h-3 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkillNodeMatrix;
