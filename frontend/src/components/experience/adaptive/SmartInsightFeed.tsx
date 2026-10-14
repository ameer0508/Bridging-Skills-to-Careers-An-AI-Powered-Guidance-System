import React from 'react';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { GlassCard } from '../cards/GlassCard';
import { PrioritizedInsight } from './InsightPrioritizationEngine';

export interface SmartInsightFeedProps {
  insights?: PrioritizedInsight[];
  className?: string;
}

export const SmartInsightFeed: React.FC<SmartInsightFeedProps> = ({
  insights = [
    {
      id: 'i-1',
      title: 'Database Indexing milestone is your highest impact learning item.',
      category: 'Milestone Focus',
      impactScore: 92,
      confidenceTier: 'High Confidence',
      evidence: 'Addresses #1 target skill gap',
      rank: 1,
    },
    {
      id: 'i-2',
      title: 'Your skill graph aligns 85% with Full Stack Engineer.',
      category: 'Career Alignment',
      impactScore: 88,
      confidenceTier: 'High Confidence',
      evidence: 'Derived from 6 skills',
      rank: 2,
    },
  ],
  className = '',
}) => {
  return (
    <GlassCard className={`p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-aurora-line">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-aurora-violet/[0.06] text-aurora-indigo">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-aurora-ink">Prioritized Adaptive Telemetry</h3>
            <p className="text-xs text-aurora-muted">
              Ranked observations sorted by impact score and confidence
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {insights.slice(0, 3).map((ins) => (
          <div
            key={ins.id}
            className="p-4 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-2 hover:border-aurora-violet/25 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-aurora-indigo">
                Rank #{ins.rank} • {ins.category}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-700">
                <Zap className="w-3.5 h-3.5" />
                {ins.impactScore}% Impact
              </span>
            </div>

            <h4 className="text-xs font-bold text-aurora-ink leading-snug">{ins.title}</h4>

            <div className="pt-1 flex items-center justify-between text-[10px] text-aurora-muted border-t border-aurora-line">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                {ins.confidenceTier}
              </span>
              <span>{ins.evidence}</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default SmartInsightFeed;
