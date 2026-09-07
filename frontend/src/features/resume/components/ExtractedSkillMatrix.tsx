import React from 'react';
import { Cpu, ShieldCheck } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

interface SkillItem {
  id?: string;
  name: string;
  category?: string;
  evidenceScore?: number;
  confidence?: number;
}

interface ExtractedSkillMatrixProps {
  skills?: SkillItem[];
  totalSkills?: number;
}

export const ExtractedSkillMatrix: React.FC<ExtractedSkillMatrixProps> = ({
  skills = [],
  totalSkills = 0,
}) => {
  if (skills.length === 0) {
    return (
      <GlassPanel className="p-8 text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
          <Cpu className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-white">No Extracted Skills Displayed Yet</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          Upload your PDF or Word resume to execute the 14-stage Transformer NLP skill extraction engine.
        </p>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-white">Extracted Skill Matrix</h3>
          <p className="text-xs text-slate-400">Verified vector skill nodes from resume NLP parsing</p>
        </div>
        <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/30">
          {totalSkills || skills.length} Verified Skills
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {skills.map((skill, idx) => {
          const confidence = Math.round(skill.confidence ? skill.confidence * 100 : skill.evidenceScore || 85);

          return (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-950/70 border border-white/10 space-y-1.5 hover:border-indigo-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate">{skill.name}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                <span className="truncate">{skill.category || 'Skill'}</span>
                <span className="text-emerald-400 font-bold">{confidence}%</span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-linear-to-r from-indigo-500 to-cyan-400 h-1 rounded-full"
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExtractedSkillMatrix;
