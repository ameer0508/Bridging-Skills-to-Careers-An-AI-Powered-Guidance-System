import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Layers,
  Video,
  FileText,
  Sparkles,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { OpportunityItem } from './OpportunityStreamFeed';

export interface PersonalRelevanceMatrixProps {
  opportunity: OpportunityItem | null;
  targetRoleTitle: string;
  userSkillsCount: number;
}

export const PersonalRelevanceMatrix: React.FC<PersonalRelevanceMatrixProps> = ({
  opportunity,
  targetRoleTitle,
  userSkillsCount,
}) => {
  const navigate = useNavigate();

  if (!opportunity) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center h-[740px] text-center space-y-3">
        <Target className="w-12 h-12 text-slate-600" />
        <h3 className="text-base font-bold text-slate-300">Relevance Matrix</h3>
        <p className="text-xs text-slate-500 max-w-xs">
          Select an opportunity to compute your candidate capability alignment, matched competencies, and learning gaps.
        </p>
      </div>
    );
  }

  // null means the posting could not be scored (no recognisable requirements, or no resume yet)
  const isScored = typeof opportunity.skillbridgeMatchScore === 'number';
  const matchScore = isScored ? (opportunity.skillbridgeMatchScore as number) : 0;
  const matched = opportunity.matchedSkills || [];
  const missing = opportunity.missingSkills || [];

  const getTier = (score: number) => {
    if (score >= 85) return { label: 'High Alignment', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (score >= 70) return { label: 'Strong Fit', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
    return { label: 'Developing Fit', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
  };

  const tier = getTier(matchScore);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 md:p-7 shadow-2xl backdrop-blur-xl flex flex-col h-[740px] space-y-5">
      {/* Header */}
      <div className="border-b border-white/5 pb-4 shrink-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Award className="w-4 h-4" />
          </span>
          <h3 className="text-base font-bold tracking-tight text-white">
            Personal Relevance Matrix
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Personal candidate qualification analysis grounded in your verified skills.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar">
        {/* Alignment Score Meter */}
        <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-slate-400 uppercase">
              Role Alignment Fit
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${tier.color}`}>
              {tier.label}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-extrabold font-mono text-white">
              {isScored ? matchScore : '—'}
              <span className="text-sm text-slate-400 font-normal">{isScored ? ' / 100' : ' not scored'}</span>
            </div>
            <span className="text-xs font-mono text-indigo-400">
              {matched.length} of {Math.max(1, matched.length + missing.length)} Skills Verified
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${matchScore}%` }}
            />
          </div>
        </div>

        {/* Explainable Rationale */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
            <Lightbulb className="w-4 h-4 text-indigo-400" />
            <span>Why This Opportunity?</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {opportunity.matchExplanation ||
              `Matches your career direction for ${targetRoleTitle} with verified competence in ${matched.slice(0, 3).join(', ')}.`}
          </p>
        </div>

        {/* Matched Capabilities (Emerald) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-emerald-400 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified Competencies ({matched.length})
            </span>
            <span className="text-[10px] font-mono text-slate-500">Profile Match</span>
          </div>

          {matched.length === 0 ? (
            <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5 text-xs text-slate-500 italic">
              No overlapping verified skills detected yet. Add skills in Skill Intelligence.
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {matched.map((sk, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl text-xs font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                >
                  <span>{sk}</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Capability Gaps (Amber) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-amber-400 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              Capability Gaps ({missing.length})
            </span>
            <span className="text-[10px] font-mono text-slate-500">Requirements</span>
          </div>

          {missing.length === 0 ? (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full requirement alignment. Zero critical missing skills.</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {missing.map((sk, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30"
                >
                  {sk}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Cross-System Action Pathways */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold block">
            Opportunity Strategic Actions
          </span>

          <button
            onClick={() => navigate('/roadmap')}
            type="button"
            className="w-full p-3 rounded-xl bg-slate-950/60 hover:bg-purple-950/30 border border-white/10 hover:border-purple-500/30 text-xs text-slate-200 hover:text-white flex items-center justify-between transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-purple-400" />
              <div className="text-left">
                <span className="font-semibold block">Bridge Gaps in Roadmap</span>
                <span className="text-[10px] text-slate-400">Generate learning milestones</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => navigate('/interview-agent', { state: { opportunity } })}
            type="button"
            className="w-full p-3 rounded-xl bg-slate-950/60 hover:bg-cyan-950/30 border border-white/10 hover:border-cyan-500/30 text-xs text-slate-200 hover:text-white flex items-center justify-between transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Video className="w-4 h-4 text-cyan-400" />
              <div className="text-left">
                <span className="font-semibold block">Practice STAR Interview</span>
                <span className="text-[10px] text-slate-400">Simulate mock Q&A for this role</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

PersonalRelevanceMatrix.displayName = 'PersonalRelevanceMatrix';
