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
      'Since initiating your learning journey, you have indexed verified skills, improved overall career readiness, and consistently completed foundational roadmap milestones.',
    evidenceChips: ['6 Verified Skills', '85% Readiness Score', '40% Roadmap Complete'],
  },
  className = '',
}) => {
  return (
    <GlassCard className={`p-6 border-indigo-500/20 bg-indigo-950/20 space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Synthesized Growth Story</h3>
            <p className="text-xs text-neutral-400">
              Natural language summary derived strictly from verified telemetry
            </p>
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-purple-400" />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-bold text-white">{growthStory.headline}</h4>
        <p className="text-xs text-neutral-200 leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5">
          {growthStory.narrativeParagraph}
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {growthStory.evidenceChips.map((chip, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              {chip}
            </span>
          ))}
        </div>
      </div>
    </GlassCard>
  );
};

export default GrowthStoryPanel;
