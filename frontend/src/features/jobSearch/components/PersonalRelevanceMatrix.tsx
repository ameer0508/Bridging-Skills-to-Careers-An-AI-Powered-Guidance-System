import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Layers,
  Video,
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
}) => {
  const navigate = useNavigate();

  if (!opportunity) {
    return (
      <div className="rounded-3xl border border-aurora-line bg-aurora-canvas/60 p-8 shadow-aurora-md flex flex-col items-center justify-center h-[740px] text-center space-y-3">
        <Target className="w-12 h-12 text-aurora-muted" />
        <h3 className="text-base font-bold text-aurora-muted">Relevance Matrix</h3>
        <p className="text-xs text-aurora-muted max-w-xs">
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
    if (score >= 85) return { label: 'High Alignment', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (score >= 70) return { label: 'Strong Fit', color: 'text-aurora-indigo bg-aurora-violet/[0.06] border-aurora-violet/25' };
    return { label: 'Developing Fit', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  };

  const tier = getTier(matchScore);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-aurora-line bg-aurora-canvas/60 p-6 md:p-7 shadow-aurora-md flex flex-col h-[740px] space-y-5">
      {/* Header */}
      <div className="border-b border-aurora-line pb-4 shrink-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-violet">
            <Award className="w-4 h-4" />
          </span>
          <h3 className="text-base font-bold tracking-tight text-aurora-ink">
            Personal Relevance Matrix
          </h3>
        </div>
        <p className="text-xs text-aurora-muted">
          How this listing's skills compare with the skills on your profile.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar">
        {/* Alignment Score Meter */}
        <div className="p-5 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-aurora-muted uppercase">
              Role Alignment Fit
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tier.color}`}>
              {tier.label}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-aurora-ink">
              {isScored ? matchScore : '—'}
              <span className="text-sm text-aurora-muted font-normal">{isScored ? ' / 100' : ' not scored'}</span>
            </div>
            <span className="text-xs text-aurora-indigo">
              {matched.length} of {Math.max(1, matched.length + missing.length)} skills on your profile
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 rounded-full bg-aurora-canvas overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-aurora-violet via-aurora-sky to-aurora-mint rounded-full transition-all duration-500"
              style={{ width: `${matchScore}%` }}
            />
          </div>
        </div>

        {/* Explainable Rationale */}
        <div className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-aurora-indigo">
            <Lightbulb className="w-4 h-4 text-aurora-indigo" />
            <span>Why This Opportunity?</span>
          </div>
          <p className="text-xs text-aurora-muted leading-relaxed font-normal">
            {opportunity.matchExplanation ||
              `Matches your career direction for ${targetRoleTitle} with evidence on your profile for ${matched.slice(0, 3).join(', ')}.`}
          </p>
        </div>

        {/* Matched Capabilities (Emerald) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Skills you have ({matched.length})
            </span>
            <span className="text-[10px] text-aurora-muted">Profile Match</span>
          </div>

          {matched.length === 0 ? (
            <div className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-xs text-aurora-muted italic">
              None of this listing's skills are on your profile yet. Add skills in Skill Intelligence.
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {matched.map((sk, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"
                >
                  <span>{sk}</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Capability Gaps (Amber) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-amber-700 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              Capability Gaps ({missing.length})
            </span>
            <span className="text-[10px] text-aurora-muted">Requirements</span>
          </div>

          {missing.length === 0 ? (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Full requirement alignment. Zero critical missing skills.</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {missing.map((sk, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl text-xs bg-amber-50 text-amber-700 border border-amber-200"
                >
                  {sk}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Cross-System Action Pathways */}
        <div className="space-y-2 pt-2 border-t border-aurora-line">
          <span className="text-[11px] text-aurora-muted uppercase tracking-wider font-semibold block">
            Opportunity Strategic Actions
          </span>

          <button
            onClick={() => navigate('/roadmap')}
            type="button"
            className="w-full p-3 rounded-xl bg-aurora-canvas/60 hover:bg-violet-50 border border-aurora-line hover:border-purple-500/30 text-xs text-aurora-ink hover:text-aurora-indigo flex items-center justify-between transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-aurora-violet" />
              <div className="text-left">
                <span className="font-semibold block">Bridge Gaps in Roadmap</span>
                <span className="text-[10px] text-aurora-muted">Generate learning milestones</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-aurora-muted" />
          </button>

          <button
            onClick={() => navigate('/interview-agent', { state: { opportunity } })}
            type="button"
            className="w-full p-3 rounded-xl bg-aurora-canvas/60 hover:bg-cyan-50 border border-aurora-line hover:border-aurora-violet/25 text-xs text-aurora-ink hover:text-aurora-indigo flex items-center justify-between transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Video className="w-4 h-4 text-aurora-violet" />
              <div className="text-left">
                <span className="font-semibold block">Practice STAR Interview</span>
                <span className="text-[10px] text-aurora-muted">Simulate mock Q&A for this role</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-aurora-muted" />
          </button>
        </div>
      </div>
    </div>
  );
};

PersonalRelevanceMatrix.displayName = 'PersonalRelevanceMatrix';
