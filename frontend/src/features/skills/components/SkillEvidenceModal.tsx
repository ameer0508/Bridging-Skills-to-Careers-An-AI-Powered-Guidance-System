import React from 'react';
import { ShieldCheck, X, FileText } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-aurora-line bg-aurora-canvas/60 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-aurora-line pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-aurora-violet/[0.06] border border-aurora-violet/25 flex items-center justify-center text-aurora-indigo">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-aurora-ink">{skill.name}</h3>
              <p className="text-xs text-aurora-muted tabular-nums">
                Evidence Score: <span className="text-emerald-700 font-bold">{skill.evidenceScore}%</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-aurora-muted hover:text-aurora-indigo hover:bg-aurora-canvas transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aliases */}
        {skill.aliases && skill.aliases.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] text-aurora-muted uppercase tracking-widest font-bold">
              Normalized Taxonomy Aliases
            </span>
            <div className="flex flex-wrap gap-1.5">
              {skill.aliases.map((alias, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-aurora-canvas text-aurora-muted border border-aurora-line text-xs tabular-nums">
                  {alias}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Evidence Trail List */}
        <div className="space-y-2">
          <span className="text-[10px] text-aurora-muted uppercase tracking-widest font-bold">
            Evidence Trail
          </span>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {skill.evidences && skill.evidences.length > 0 ? (
              skill.evidences.map((evidence, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-aurora-violet">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      {evidence.sourceType.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-aurora-muted text-[10px] tabular-nums">
                      Weight: {(evidence.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-aurora-muted leading-relaxed">{evidence.description}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-aurora-muted italic">No explicit evidence records attached.</p>
            )}
          </div>
        </div>

        {/* Action */}
        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          Close Evidence Viewer
        </button>
      </div>
    </div>
  );
};

export default SkillEvidenceModal;
