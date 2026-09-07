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
    <GlassCard className={`p-5 border-indigo-500/20 bg-indigo-950/20 ${className}`}>
      <div className="space-y-3">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              AI Recommendation
            </span>
            <span className="text-neutral-500">•</span>
            <span className="text-xs text-neutral-400">{category}</span>
          </div>
          <ConfidenceIndicator tier={confidenceTier} />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white">{title}</h3>

        {/* Explainability Trigger Toggle */}
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition-colors outline-none cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{isExpanded ? 'Hide AI Reasoning' : 'Why is this recommended?'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* Expandable Reasoning Panel */}
        {isExpanded && (
          <div className="pt-3 border-t border-white/10 space-y-3 text-xs text-neutral-300 animate-fade-in">
            <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
              <span className="font-semibold text-indigo-300">Synthesized Explanation:</span>
              <p className="leading-relaxed">{reason}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="flex items-center gap-2 p-2 rounded bg-white/5">
                <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="block text-[10px] text-neutral-400">Impact Boost</span>
                  <span className="font-bold text-white">+{impactScore}% Score</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded bg-white/5">
                <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <span className="block text-[10px] text-neutral-400">Est. Time</span>
                  <span className="font-bold text-white">{estimatedTime}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded bg-white/5">
                <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <span className="block text-[10px] text-neutral-400">Prerequisites</span>
                  <span className="font-bold text-white">
                    {matchingSkills.length > 0 ? `${matchingSkills.length} Verified` : 'Direct Skill'}
                  </span>
                </div>
              </div>
            </div>

            {missingSkills.length > 0 && (
              <div className="pt-1">
                <span className="text-[11px] text-neutral-400 block mb-1">Target Skill Gaps Addressed:</span>
                <div className="flex flex-wrap gap-1.5">
                  {missingSkills.slice(0, 3).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30"
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
