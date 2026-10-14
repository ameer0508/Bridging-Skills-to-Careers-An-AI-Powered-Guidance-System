import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Zap, Clock, Layers, Sparkles } from 'lucide-react';
import { GlassCard } from '../cards/GlassCard';
import { ConfidenceIndicator } from './ConfidenceIndicator';

export interface RecommendationExplanationProps {
  title: string;
  category: string;
  reason?: string;
  impactScore?: number;
  estimatedTime?: string;
  matchingSkills?: string[];
  missingSkills?: string[];
  confidenceTier?: string;
  className?: string;
}

export const RecommendationExplanation: React.FC<RecommendationExplanationProps> = ({
  title,
  category,
  reason = 'Analyzed as a high-impact skill gap to accelerate your career readiness score.',
  impactScore = 88,
  estimatedTime = '45 mins',
  matchingSkills = [],
  missingSkills = [],
  confidenceTier = 'High Confidence',
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <GlassCard className={`p-5 border-aurora-violet/25 bg-violet-50 ${className}`}>
      <div className="space-y-3">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-aurora-indigo flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              AI Recommendation
            </span>
            <span className="text-aurora-muted">•</span>
            <span className="text-xs text-aurora-muted">{category}</span>
          </div>
          <ConfidenceIndicator tier={confidenceTier} />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-aurora-ink">{title}</h3>

        {/* Explainability Trigger Toggle */}
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-1.5 text-xs font-semibold text-aurora-indigo hover:text-aurora-indigo transition-colors outline-none cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{isExpanded ? 'Hide AI Reasoning' : 'Why is this recommended?'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* Expandable Reasoning Panel */}
        {isExpanded && (
          <div className="pt-3 border-t border-aurora-line space-y-3 text-xs text-aurora-muted animate-fade-in">
            <div className="p-3 rounded-lg bg-aurora-canvas/60 border border-aurora-line space-y-1">
              <span className="font-semibold text-aurora-indigo">Synthesized Explanation:</span>
              <p className="leading-relaxed">{reason}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="flex items-center gap-2 p-2 rounded bg-aurora-canvas">
                <Zap className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="block text-[10px] text-aurora-muted">Impact Boost</span>
                  <span className="font-bold text-aurora-ink">+{impactScore}% Score</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded bg-aurora-canvas">
                <Clock className="w-4 h-4 text-aurora-indigo shrink-0" />
                <div>
                  <span className="block text-[10px] text-aurora-muted">Est. Time</span>
                  <span className="font-bold text-aurora-ink">{estimatedTime}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded bg-aurora-canvas">
                <Layers className="w-4 h-4 text-aurora-violet shrink-0" />
                <div>
                  <span className="block text-[10px] text-aurora-muted">Prerequisites</span>
                  <span className="font-bold text-aurora-ink">
                    {matchingSkills.length > 0 ? `${matchingSkills.length} Matched` : 'Direct Skill'}
                  </span>
                </div>
              </div>
            </div>

            {missingSkills.length > 0 && (
              <div className="pt-1">
                <span className="text-[11px] text-aurora-muted block mb-1">Target Skill Gaps Addressed:</span>
                <div className="flex flex-wrap gap-1.5">
                  {missingSkills.slice(0, 3).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-violet-50 text-aurora-violet border border-purple-500/30"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default RecommendationExplanation;
