import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ShieldCheck, CheckCircle2, AlertTriangle, Compass } from 'lucide-react';

import { GlassCard } from '../cards/GlassCard';
import { StrategySummary } from './StrategyGenerator';

export interface ExplainableStrategyPanelProps {
  strategy?: StrategySummary;
  className?: string;
}

export const ExplainableStrategyPanel: React.FC<ExplainableStrategyPanelProps> = ({
  strategy = {
    recommendedRoleTitle: 'Target Career Role',
    matchScore: 85,
    readinessScore: 80,
    strengths: ['Core Programming', 'System Design'],
    weaknesses: ['Database Indexing', 'Cloud Security'],
    recommendedSequence: ['REST APIs', 'SQL Mastery', 'JWT Auth'],
    potentialBlockers: ['Unresolved skill gaps in production scalability'],
    estimatedTotalEffort: '2-4 Weeks',
    confidenceTier: 'High Confidence',
    evidence: ['85% match model alignment', 'Skill evidence graph'],
  },
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const strengths = strategy?.strengths || [];
  const weaknesses = strategy?.weaknesses || [];
  const evidence = strategy?.evidence || [];
  const recommendedRoleTitle = strategy?.recommendedRoleTitle || 'Target Career Role';
  const matchScore = strategy?.matchScore ?? 85;
  const confidenceTier = strategy?.confidenceTier || 'High Confidence';
  const estimatedTotalEffort = strategy?.estimatedTotalEffort || '2-4 Weeks';

  return (
    <GlassCard className={`p-6 border-aurora-violet/25 bg-violet-50 space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-aurora-line">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-aurora-violet/[0.06] text-aurora-indigo">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-aurora-ink">Recommended Strategy Architecture</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25">
                {confidenceTier}
              </span>
            </div>
            <p className="text-xs text-aurora-muted">
              Optimal career path strategy derived from deterministic telemetry
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-1.5 text-xs font-semibold text-aurora-indigo hover:text-aurora-indigo transition-colors outline-none cursor-pointer"
        >
          <span>{isExpanded ? 'Collapse Reasoning' : 'Explain Strategy'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Target Strategy Focus */}
      <div className="p-5 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-aurora-muted uppercase tracking-wider block mb-1">
            Top Strategic Path Recommendation
          </span>
          <h2 className="text-2xl font-extrabold text-aurora-ink">{recommendedRoleTitle}</h2>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium text-aurora-muted block mb-0.5">Match Alignment</span>
          <span className="text-3xl font-extrabold text-emerald-700">{matchScore}%</span>
        </div>
      </div>

      {/* Expandable Reasoning Details */}
      {isExpanded && (
        <div className="space-y-4 pt-1 text-xs text-aurora-muted animate-fade-in">
          {/* Why This Path Panel */}
          <div className="p-4 rounded-xl bg-aurora-canvas border border-aurora-line space-y-2">
            <span className="font-bold text-aurora-indigo flex items-center gap-1.5 text-sm">
              <HelpCircle className="w-4 h-4 text-aurora-indigo" />
              Why This Strategy Was Selected:
            </span>
            <p className="text-aurora-ink leading-relaxed">
              Your profile exhibits high alignment with {recommendedRoleTitle}. This path maximizes your existing strengths while addressing minimal remaining skill gaps in the shortest estimated timeframe ({estimatedTotalEffort}).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-2">
              <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Validated Strengths:
              </span>
              <ul className="space-y-1 pl-4 list-disc text-aurora-muted">
                {strengths.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>

            {/* Blockers */}
            <div className="p-4 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-2">
              <span className="font-bold text-amber-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Target Skill Gaps:
              </span>
              <ul className="space-y-1 pl-4 list-disc text-aurora-muted">
                {weaknesses.map((weak, idx) => (
                  <li key={idx}>{weak}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Evidence Chips */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-aurora-muted block mb-2">
              Supporting Evidence Data Points:
            </span>
            <div className="flex flex-wrap gap-2">
              {evidence.map((ev, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  {ev}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default ExplainableStrategyPanel;
