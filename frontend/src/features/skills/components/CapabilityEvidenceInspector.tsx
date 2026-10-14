import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  Brain,
  FileText,
  Briefcase,
  FolderGit2,
  GraduationCap,
  Award,
  ArrowRight,
  GitBranch,
  Target,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from '../../../components/experience/hooks/useReducedMotion';
import type { CapabilitySkill, SkillGraphEdge } from './CapabilityMatrixCanvas';
import { DialogFrame } from '../../../design/aurora/DialogFrame';

export interface CapabilityEvidenceInspectorProps {
  skill: CapabilitySkill | null;
  isOpen: boolean;
  onClose: () => void;
  graphEdges?: SkillGraphEdge[];
  targetRoleTitle?: string | null;
}

export const CapabilityEvidenceInspector: React.FC<CapabilityEvidenceInspectorProps> = ({
  skill,
  isOpen,
  onClose,
  graphEdges = [],
}) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  if (!isOpen || !skill) return null;

  // Derive incoming and outgoing graph connections
  const incomingPrereqs = graphEdges
    .filter((e) => e.target?.toLowerCase() === skill.name.toLowerCase())
    .map((e) => ({ name: e.source, type: e.type }));

  const outgoingUnlocks = graphEdges
    .filter((e) => e.source?.toLowerCase() === skill.name.toLowerCase())
    .map((e) => ({ name: e.target, type: e.type }));

  // Helper for source icon & label
  const getSourceMeta = (sourceType: string) => {
    switch (sourceType) {
      case 'resume_experience':
        return { label: 'Work Experience', icon: Briefcase, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'resume_projects':
        return { label: 'Project Portfolio', icon: FolderGit2, color: 'text-aurora-violet bg-aurora-violet/[0.06] border-aurora-violet/25' };
      case 'resume_certifications':
        return { label: 'Certification (stated)', icon: Award, color: 'text-aurora-violet bg-purple-500/10 border-purple-500/20' };
      case 'resume_education':
        return { label: 'Academic Education', icon: GraduationCap, color: 'text-amber-700 bg-amber-50 border-amber-200' };
      default:
        return { label: 'Extracted Skill Evidence', icon: FileText, color: 'text-aurora-indigo bg-aurora-violet/[0.06] border-aurora-violet/25' };
    }
  };

  return (
    <AnimatePresence>
      <DialogFrame onClose={onClose} label="Skill evidence" side="right">
        {/* Backdrop click */}
        <div className="flex-1" onClick={onClose} />

        {/* Slide-over Container */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' }}
          className="w-full max-w-xl h-full bg-aurora-canvas border-l border-aurora-line p-6 md:p-8 overflow-y-auto custom-scrollbar shadow-2xl flex flex-col justify-between space-y-6"
        >
          {/* Header */}
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-aurora-line">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase text-aurora-indigo font-bold tracking-wider block">
                    Capability Evidence Inspector
                  </span>
                  <h3 className="text-base font-bold text-aurora-ink">Skill Evidence Deep-Dive</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-aurora-muted hover:text-aurora-indigo hover:bg-aurora-canvas transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title & Domain */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-2xl font-black font-display text-aurora-ink tracking-tight">
                  {skill.name}
                </h2>
                <span className="px-3 py-1 rounded-xl bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo text-xs font-bold">
                  {skill.category || 'General'}
                </span>
              </div>
              <p className="text-xs text-aurora-muted">
                Deterministic skill vector index entry linked to user knowledge profile.
              </p>
            </div>

            {/* Evidence Score Meter */}
            <div className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase text-aurora-muted font-bold">
                  Evidence Strength Score
                </span>
                <span className="text-xl font-black font-display text-emerald-700">
                  {skill.evidenceScore}%
                </span>
              </div>
              <div className="w-full h-2 bg-aurora-canvas rounded-full overflow-hidden border border-aurora-line">
                <div
                  style={{ width: `${Math.min(100, Math.max(5, skill.evidenceScore))}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-aurora-muted pt-0.5">
                <span>Weight Factor: {(skill.evidenceScore / 100).toFixed(2)}</span>
                <span>{skill.evidences?.length || 1} Evidence Points Evaluated</span>
              </div>
            </div>

            {/* Aliases */}
            {skill.aliases && skill.aliases.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-aurora-muted font-bold tracking-wider block">
                  Normalized Taxonomy Synonyms & Aliases
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {skill.aliases.map((alias, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-lg bg-aurora-canvas border border-aurora-line text-aurora-muted text-xs tabular-nums"
                    >
                      {alias}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence Trail */}
            <div className="space-y-2.5">
              <span className="text-xs uppercase text-aurora-violet font-bold tracking-wider block flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-aurora-violet" />
                Evidence Trail ({skill.evidences?.length || 0})
              </span>

              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {skill.evidences && skill.evidences.length > 0 ? (
                  skill.evidences.map((evidence, idx) => {
                    const meta = getSourceMeta(evidence.sourceType);
                    const Icon = meta.icon;

                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-bold flex items-center gap-1.5 ${meta.color}`}
                          >
                            <Icon className="w-3 h-3" />
                            {meta.label}
                          </span>
                          <span className="text-[10px] text-aurora-muted">
                            Impact: {(evidence.weight * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-xs text-aurora-muted leading-relaxed">
                          {evidence.description}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-aurora-muted italic">
                    Derived from resume taxonomy normalization.
                  </p>
                )}
              </div>
            </div>

            {/* Cross-System Graph Connections */}
            {(incomingPrereqs.length > 0 || outgoingUnlocks.length > 0) && (
              <div className="space-y-2.5 pt-2 border-t border-aurora-line">
                <span className="text-xs uppercase text-aurora-indigo font-bold tracking-wider block flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-aurora-indigo" />
                  Ontology Graph Position
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Incoming */}
                  <div className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-1">
                    <span className="text-[10px] text-amber-700 font-bold block">
                      Prerequisites:
                    </span>
                    {incomingPrereqs.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {incomingPrereqs.map((p, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px] tabular-nums"
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-aurora-muted text-[11px] italic">None (Root)</span>
                    )}
                  </div>

                  {/* Outgoing */}
                  <div className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-1">
                    <span className="text-[10px] text-aurora-violet font-bold block">
                      Enables Downstream:
                    </span>
                    {outgoingUnlocks.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {outgoingUnlocks.map((u, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-aurora-violet/[0.06] text-aurora-violet text-[11px] tabular-nums"
                          >
                            {u.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-aurora-muted text-[11px] italic">Terminal Node</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-aurora-line space-y-3">
            <span className="text-xs uppercase text-aurora-muted font-bold block">
              Cross-Subsystem Actions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/roadmap');
                }}
                className="p-3 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <span>View in Learning Roadmap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/interviews');
                }}
                className="p-3 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas text-aurora-ink border border-aurora-line text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Target className="w-3.5 h-3.5 text-aurora-violet" />
                <span>Test in Mock Interview</span>
              </button>
            </div>
          </div>
        </motion.div>
      </DialogFrame>
    </AnimatePresence>
  );
};

export default CapabilityEvidenceInspector;
