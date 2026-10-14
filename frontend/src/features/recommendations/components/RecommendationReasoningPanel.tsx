import React from 'react';
import { HelpCircle, CheckCircle2 } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface ReasoningPanelProps {
  whyRecommended?: string;
  supportingEvidence?: string[];
  skillsImproved?: string[];
}

export const RecommendationReasoningPanel: React.FC<ReasoningPanelProps> = ({
  whyRecommended = 'Recommended to bridge core skill delta required for target Senior AI Engineer role.',
  supportingEvidence = [
    'Target role postings list FastAPI and System Architecture as mandatory competencies.',
    'Completing this item directly elevates your candidate profile competitiveness.',
    'High recruiter search index in top tech companies.'
  ]}) => {
  return (
    <GlassPanel className="p-4 space-y-3 border-aurora-violet/25 text-xs">
      <div className="flex items-center gap-2 text-aurora-indigo font-bold border-b border-aurora-line pb-2">
        <HelpCircle className="w-4 h-4" />
        <span>AI Explainability Rationale</span>
      </div>

      <p className="text-aurora-muted leading-relaxed">💡 {whyRecommended}</p>

      {supportingEvidence.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] text-aurora-muted uppercase tracking-wider block">Supporting Evidence Traces:</span>
          <ul className="space-y-1">
            {supportingEvidence.map((ev, i) => (
              <li key={i} className="text-aurora-muted text-[11px] flex items-start gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-700 mt-0.5 shrink-0" />
                <span>{ev}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </GlassPanel>
  );
};
