import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  GitBranch,
  Target,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { useReducedMotion } from '../../../components/experience/hooks/useReducedMotion';

export interface IEvidenceRecord {
  sourceType: string;
  description: string;
  weight: number;
}

export interface CapabilitySkill {
  id: string;
  skillId: string;
  name: string;
  evidenceScore: number;
  evidences: IEvidenceRecord[];
  aliases: string[];
  category?: string;
}

export interface SkillGraphEdge {
  source: string;
  target: string;
  type: string;
}

export type ViewLensMode = 'clusters' | 'graph' | 'gaps';

export interface CapabilityMatrixCanvasProps {
  categories: Record<string, CapabilitySkill[]>;
  allSkills: CapabilitySkill[];
  graphEdges: SkillGraphEdge[];
  targetRoleTitle?: string | null;
  matchedSkills?: string[];
  missingSkills?: string[];
  onSelectSkill: (skill: CapabilitySkill) => void;
  onBridgeGap?: (skillName: string) => void;
  className?: string;
}

export const CapabilityMatrixCanvas: React.FC<CapabilityMatrixCanvasProps> = ({
  categories,
  allSkills,
  graphEdges,
  targetRoleTitle = 'Target Role',
  matchedSkills = [],
  missingSkills = [],
  onSelectSkill,
  onBridgeGap,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [activeLens, setActiveLens] = useState<ViewLensMode>('clusters');
  const [activeGraphSkill, setActiveGraphSkill] = useState<string>(allSkills[0]?.name || '');

  // Helper for strength tier
  const getStrengthTier = (score: number): { label: string; color: string; badge: string } => {
    if (score >= 90) return { label: 'Expert', color: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    if (score >= 70) return { label: 'Advanced', color: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
    if (score >= 40) return { label: 'Working', color: 'text-indigo-300', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
    return { label: 'Foundational', color: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  };

  // Helper for source tags
  const getSourceTags = (evidences: IEvidenceRecord[] = []) => {
    const types = new Set(evidences.map((e) => e.sourceType));
    const badges: Array<{ key: string; label: string; color: string }> = [];

    if (types.has('resume_experience')) {
      badges.push({ key: 'exp', label: 'EXP', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' });
    }
    if (types.has('resume_projects')) {
      badges.push({ key: 'prj', label: 'PRJ', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' });
    }
    if (types.has('resume_certifications')) {
      badges.push({ key: 'cert', label: 'CERT', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' });
    }
    if (types.has('resume_education')) {
      badges.push({ key: 'edu', label: 'EDU', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' });
    }

    return badges;
  };

  // Filter graph edges relevant to user's skills
  const userSkillNamesSet = useMemo(() => new Set(allSkills.map((s) => s.name.toLowerCase())), [allSkills]);

  const relevantEdges = useMemo(() => {
    return graphEdges.filter(
      (edge) =>
        userSkillNamesSet.has(edge.source?.toLowerCase()) ||
        userSkillNamesSet.has(edge.target?.toLowerCase())
    );
  }, [graphEdges, userSkillNamesSet]);

  // Edges for currently focused node in graph lens
  const activeNodeEdges = useMemo(() => {
    if (!activeGraphSkill) return [];
    return relevantEdges.filter(
      (e) =>
        e.source?.toLowerCase() === activeGraphSkill.toLowerCase() ||
        e.target?.toLowerCase() === activeGraphSkill.toLowerCase()
    );
  }, [relevantEdges, activeGraphSkill]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Lens Mode Controller Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/80 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
            Analysis Lens:
          </span>
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setActiveLens('clusters')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeLens === 'clusters'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Capability Clusters</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveLens('graph')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeLens === 'graph'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Topological Graph</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveLens('gaps')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeLens === 'gaps'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Career Gap Alignment</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Expert (≥90%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Advanced (70-89%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Working (40-69%)</span>
          </div>
        </div>
      </div>

      {/* LENS CONTENT CONTAINER */}
      <AnimatePresence mode="wait">
        {/* ============================================================ */}
        {/* LENS A: CAPABILITY CLUSTER MATRIX */}
        {/* ============================================================ */}
        {activeLens === 'clusters' && (
          <motion.div
            key="clusters"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            className="space-y-8"
          >
            {Object.entries(categories).map(([categoryName, skills]) => (
              <div
                key={categoryName}
                className="p-6 rounded-3xl bg-slate-950/70 border border-white/10 backdrop-blur-xl space-y-4 shadow-xl"
              >
                {/* Domain Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-400 to-cyan-400 shadow-sm shadow-cyan-400/50" />
                    <h3 className="font-display text-base font-bold text-white tracking-tight">
                      {categoryName}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-400">
                    {skills.length} {skills.length === 1 ? 'Competency' : 'Competencies'}
                  </span>
                </div>

                {/* Capability Nodes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {skills.map((skill) => {
                    const tier = getStrengthTier(skill.evidenceScore);
                    const sourceBadges = getSourceTags(skill.evidences);

                    return (
                      <motion.div
                        key={skill.id || skill.name}
                        onClick={() => onSelectSkill({ ...skill, category: categoryName })}
                        whileHover={!prefersReducedMotion ? { y: -3, scale: 1.015 } : undefined}
                        className="group p-4 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-indigo-500/50 hover:bg-slate-900 transition-all cursor-pointer space-y-3 shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                            {skill.name}
                          </h4>
                          <span
                            className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border shrink-0 ${tier.badge}`}
                          >
                            {tier.label}
                          </span>
                        </div>

                        {/* Evidence Score & Progress Ring */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Evidence Weight</span>
                            <span className={`font-bold ${tier.color}`}>
                              {skill.evidenceScore}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                            <div
                              style={{ width: `${Math.min(100, Math.max(5, skill.evidenceScore))}%` }}
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"
                            />
                          </div>
                        </div>

                        {/* Source Badges */}
                        <div className="flex items-center justify-between pt-1 text-[9px] font-mono">
                          <div className="flex items-center gap-1 flex-wrap">
                            {sourceBadges.map((sb) => (
                              <span
                                key={sb.key}
                                className={`px-1.5 py-0.2 rounded border font-bold ${sb.color}`}
                              >
                                {sb.label}
                              </span>
                            ))}
                          </div>
                          <span className="text-slate-500 group-hover:text-slate-300 transition-colors flex items-center gap-0.5">
                            Details <ChevronRight className="w-3 h-3 text-cyan-400" />
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* LENS B: TOPOLOGICAL KNOWLEDGE GRAPH */}
        {/* ============================================================ */}
        {activeLens === 'graph' && (
          <motion.div
            key="graph"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            className="p-6 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-xl space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-cyan-400" />
                  Verified Skill Relationship Traversal
                </h3>
                <p className="text-xs text-slate-400">
                  Select any verified node to inspect its prerequisite and downstream enabled connections.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-300 font-bold bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
                Active Node: {activeGraphSkill || 'Select Node'}
              </span>
            </div>

            {/* Skill Selector Chips */}
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
              {allSkills.map((skill) => {
                const isSelected = skill.name.toLowerCase() === activeGraphSkill.toLowerCase();
                const tier = getStrengthTier(skill.evidenceScore);

                return (
                  <button
                    key={skill.id || skill.name}
                    type="button"
                    onClick={() => setActiveGraphSkill(skill.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 border cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/30'
                        : 'bg-slate-900 border-white/10 text-slate-300 hover:border-cyan-500/40 hover:text-white'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${tier.color.replace('text-', 'bg-')}`} />
                    <span>{skill.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Traversal Results for Selected Node */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Upstream Prerequisites */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-mono uppercase text-amber-400 font-bold">
                    Prerequisites & Parent Skills
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Incoming Dependencies
                  </span>
                </div>

                {activeNodeEdges.filter((e) => e.target?.toLowerCase() === activeGraphSkill.toLowerCase()).length > 0 ? (
                  <div className="space-y-2">
                    {activeNodeEdges
                      .filter((e) => e.target?.toLowerCase() === activeGraphSkill.toLowerCase())
                      .map((edge, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center justify-between"
                        >
                          <span className="font-bold">{edge.source}</span>
                          <span className="text-[10px] font-mono uppercase text-amber-300/80">
                            {edge.type || 'prerequisite'}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No upstream prerequisite edges recorded for this skill.
                  </p>
                )}
              </div>

              {/* Downstream Enabled Capabilities */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-mono uppercase text-indigo-400 font-bold">
                    Enabled Downstream Capabilities
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Outgoing Unlocks
                  </span>
                </div>

                {activeNodeEdges.filter((e) => e.source?.toLowerCase() === activeGraphSkill.toLowerCase()).length > 0 ? (
                  <div className="space-y-2">
                    {activeNodeEdges
                      .filter((e) => e.source?.toLowerCase() === activeGraphSkill.toLowerCase())
                      .map((edge, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 flex items-center justify-between"
                        >
                          <span className="font-bold">{edge.target}</span>
                          <span className="text-[10px] font-mono uppercase text-indigo-300/80">
                            {edge.type || 'enables'}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Direct foundational competency unlocking downstream mastery.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* LENS C: CAREER CAPABILITY GAP ALIGNMENT */}
        {/* ============================================================ */}
        {activeLens === 'gaps' && (
          <motion.div
            key="gaps"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            className="p-6 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-xl space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  Target Career Role Capability Coverage
                </h3>
                <p className="text-xs text-slate-400">
                  Benchmarked against requirements for <strong className="text-white">{targetRoleTitle}</strong>.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
                  {matchedSkills.length} Matched
                </span>
                <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono font-bold">
                  {missingSkills.length} Critical Gaps
                </span>
              </div>
            </div>

            {/* Dual Column: Verified Matches vs Missing Gaps */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Verified Matched Skills */}
              <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">
                    Verified Competencies for {targetRoleTitle} ({matchedSkills.length})
                  </h4>
                </div>

                {matchedSkills.length > 0 ? (
                  <div className="space-y-2">
                    {matchedSkills.map((skillName, idx) => {
                      const userSkill = allSkills.find(
                        (s) => s.name.toLowerCase() === skillName.toLowerCase()
                      );
                      const score = userSkill?.evidenceScore || 85;

                      return (
                        <div
                          key={idx}
                          onClick={() => userSkill && onSelectSkill(userSkill)}
                          className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20 flex items-center justify-between cursor-pointer hover:border-emerald-400/50 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="text-xs font-bold text-white">{skillName}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-emerald-400">
                            {score}% Evidence
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No verified skills currently matched with this target role.
                  </p>
                )}
              </div>

              {/* Right Column: Missing Capability Gaps */}
              <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-rose-500/20">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <h4 className="text-sm font-bold text-white">
                    Missing Capability Gaps ({missingSkills.length})
                  </h4>
                </div>

                {missingSkills.length > 0 ? (
                  <div className="space-y-2">
                    {missingSkills.map((gapName, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-900/80 border border-rose-500/20 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          <span className="text-xs font-bold text-slate-200">{gapName}</span>
                        </div>

                        {onBridgeGap && (
                          <button
                            type="button"
                            onClick={() => onBridgeGap(gapName)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-200 text-[10px] font-bold font-mono transition-all flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <span>Bridge in Roadmap</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center text-xs text-emerald-300 font-bold">
                    Zero Missing Gaps! You satisfy all core technical requirements for this role.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CapabilityMatrixCanvas;
