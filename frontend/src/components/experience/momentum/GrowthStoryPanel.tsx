import React from 'react';
import { BookOpen, Sparkles, ShieldCheck } from 'lucide-react';
import { GlassCard } from '../cards/GlassCard';
import { GrowthStoryData } from './GrowthStoryEngine';

export interface GrowthStoryPanelProps {
  growthStory?: GrowthStoryData;
  className?: string;
}

export const GrowthStoryPanel: React.FC<GrowthStoryPanelProps> = ({
  growthStory = {
    headline: 'Professional Growth Journey: Target Career Role',
    narrativeParagraph:
      'Since initiating your learning journey, you have indexed skills, improved overall career readiness, and consistently completed foundational roadmap milestones.',
    evidenceChips: ['6 Skills on Profile', '85% Readiness Score', '40% Roadmap Complete'],
  },
  className = '',
}) => {
  return (
    <GlassCard className={`p-6 border-aurora-violet/25 bg-violet-50 space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-aurora-line">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-aurora-violet/[0.06] text-aurora-indigo">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-aurora-ink">Synthesized Growth Story</h3>
            <p className="text-xs text-aurora-muted">
              Summary written from your recorded progress
            </p>
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-aurora-violet" />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-bold text-aurora-ink">{growthStory.headline}</h4>
        <p className="text-xs text-aurora-ink leading-relaxed bg-aurora-canvas/60 p-4 rounded-xl border border-aurora-line">
          {growthStory.narrativeParagraph}
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {growthStory.evidenceChips.map((chip, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-aurora-indigo" />
              {chip}
            </span>
          ))}
        </div>
      </div>
    </GlassCard>
  );
};

export default GrowthStoryPanel;
