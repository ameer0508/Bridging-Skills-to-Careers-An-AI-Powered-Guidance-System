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
  Sparkles,
  ArrowRight,
  GitBranch,
  Target,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from '../../../components/experience/hooks/useReducedMotion';
import type { CapabilitySkill, SkillGraphEdge } from './CapabilityMatrixCanvas';

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
  targetRoleTitle = 'Target Role',
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
        return { label: 'Work Experience', icon: Briefcase, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'resume_projects':
        return { label: 'Project Portfolio', icon: FolderGit2, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
      case 'resume_certifications':
        return { label: 'Verified Certification', icon: Award, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
      case 'resume_education':
        return { label: 'Academic Education', icon: GraduationCap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      default:
        return { label: 'Extracted Skill Evidence', icon: FileText, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
        {/* Backdrop click */}
        <div className="flex-1" onClick={onClose} />

        {/* Slide-over Container */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' }}
          className="w-full max-w-xl h-full bg-slate-950 border-l border-white/10 p-6 md:p-8 overflow-y-auto custom-scrollbar shadow-2xl flex flex-col justify-between space-y-6"
        >
          {/* Header */}
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold tracking-wider block">
                    Capability Evidence Inspector
                  </span>
                  <h3 className="text-base font-bold text-white">Verified Skill Deep-Dive</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title & Domain */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-2xl font-black font-display text-white tracking-tight">
                  {skill.name}
                </h2>
                <span className="px-3 py-1 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold">
                  {skill.category || 'General'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Deterministic skill vector index entry linked to user knowledge profile.
              </p>
            </div>

            {/* Evidence Score Meter */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400 font-bold">
                  Evidence Strength Score
                </span>
                <span className="text-xl font-black font-display text-emerald-400">
                  {skill.evidenceScore}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                <div
                  style={{ width: `${Math.min(100, Math.max(5, skill.evidenceScore))}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5">
                <span>Weight Factor: {(skill.evidenceScore / 100).toFixed(2)}</span>
                <span>{skill.evidences?.length || 1} Evidence Points Evaluated</span>
              </div>
            </div>

            {/* Aliases */}
            {skill.aliases && skill.aliases.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider block">
                  Normalized Taxonomy Synonyms & Aliases
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {skill.aliases.map((alias, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-mono"
                    >
                      {alias}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Evidence Trail */}
            <div className="space-y-2.5">
              <span className="text-xs font-mono uppercase text-cyan-400 font-bold tracking-wider block flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Verified Evidence Trail ({skill.evidences?.length || 0})
              </span>

              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {skill.evidences && skill.evidences.length > 0 ? (
                  skill.evidences.map((evidence, idx) => {
                    const meta = getSourceMeta(evidence.sourceType);
                    const Icon = meta.icon;

                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold flex items-center gap-1.5 ${meta.color}`}
                          >
                            <Icon className="w-3 h-3" />
                            {meta.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Impact: {(evidence.weight * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {evidence.description}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Derived from resume taxonomy normalization.
                  </p>
                )}
              </div>
            </div>

            {/* Cross-System Graph Connections */}
            {(incomingPrereqs.length > 0 || outgoingUnlocks.length > 0) && (
              <div className="space-y-2.5 pt-2 border-t border-white/10">
                <span className="text-xs font-mono uppercase text-indigo-400 font-bold tracking-wider block flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                  Ontology Graph Position
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Incoming */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono text-amber-400 font-bold block">
                      Prerequisites:
                    </span>
                    {incomingPrereqs.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {incomingPrereqs.map((p, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[11px] font-mono"
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px] italic">None (Root)</span>
                    )}
                  </div>

                  {/* Outgoing */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold block">
                      Enables Downstream:
                    </span>
                    {outgoingUnlocks.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {outgoingUnlocks.map((u, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[11px] font-mono"
                          >
                            {u.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px] italic">Terminal Node</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <span className="text-xs font-mono uppercase text-slate-400 font-bold block">
              Cross-Subsystem Actions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/roadmap');
                }}
                className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer"
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
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span>Test in Mock Interview</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CapabilityEvidenceInspector;
