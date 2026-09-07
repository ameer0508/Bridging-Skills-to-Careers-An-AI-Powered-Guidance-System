import React from 'react';
import { ShieldCheck, X, FileText, CheckCircle2 } from 'lucide-react';

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

interface SkillEvidenceModalProps {
  skill: IUserSkill | null;
  onClose: () => void;
}

export const SkillEvidenceModal: React.FC<SkillEvidenceModalProps> = ({ skill, onClose }) => {
  if (!skill) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-slate-950/90 backdrop-blur-2xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white">{skill.name}</h3>
              <p className="text-xs text-slate-400 font-mono">
                Evidence Score: <span className="text-emerald-400 font-bold">{skill.evidenceScore}%</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aliases */}
        {skill.aliases && skill.aliases.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
              Normalized Taxonomy Aliases
            </span>
            <div className="flex flex-wrap gap-1.5">
              {skill.aliases.map((alias, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10 text-xs font-mono">
                  {alias}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Evidence Trail List */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
            Verified Evidence Trail
          </span>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {skill.evidences && skill.evidences.length > 0 ? (
              skill.evidences.map((evidence, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      {evidence.sourceType.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-slate-400 text-[10px] font-mono">
                      Weight: {(evidence.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{evidence.description}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No explicit evidence records attached.</p>
            )}
          </div>
        </div>

        {/* Action */}
        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          Close Evidence Viewer
        </button>
      </div>
    </div>
  );
};

export default SkillEvidenceModal;
