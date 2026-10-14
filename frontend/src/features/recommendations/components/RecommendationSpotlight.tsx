import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface RecommendationSpotlightProps {
  title?: string;
  type?: string;
  reason?: string;
  whyRecommended?: string;
  estimatedReadinessBoost?: number;
  estimatedMatchBoost?: number;
  learningTime?: string;
  difficulty?: string;
  learningRoi?: string;
  skillsImproved?: string[];
  onAction?: () => void;
}

export const RecommendationSpotlight: React.FC<RecommendationSpotlightProps> = ({
  title = 'Build an Enterprise AI Engineer Microservices Project',
  reason = 'Hands-on portfolio demonstration directly aligned with Senior AI Engineer role postings.',
  whyRecommended = 'Recommended to bridge key skill delta in System Design, Microservices, and FastAPI/Node.js.',
  estimatedReadinessBoost = 18.0,
  estimatedMatchBoost = 22.0,
  learningTime = '3-4 weeks (15 hrs/week)',
  difficulty = 'Intermediate to Advanced',
  learningRoi = 'Exceptional',
  skillsImproved = ['System Design', 'Microservices', 'Async FastAPI', 'Docker'],
  onAction
}) => {
  return (
    <GlassPanel className="p-6 space-y-6 border-aurora-violet/25 bg-white [background-image:linear-gradient(135deg,rgb(167_139_250/0.10),transparent_60%)] relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-aurora-line pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-aurora-violet/[0.06] text-aurora-indigo rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25">
                Top Recommendation Spotlight
              </span>
              <span className="text-[10px] text-emerald-700 font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                ROI: {learningRoi}
              </span>
            </div>
            <h3 className="text-lg font-bold text-aurora-ink mt-1">{title}</h3>
          </div>
        </div>
        <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo text-xs font-bold">
          High Impact Priority
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 space-y-4">
          <p className="text-xs text-aurora-muted leading-relaxed font-sans">{reason}</p>
          <div className="p-3.5 bg-aurora-canvas/60 border border-aurora-violet/25 rounded-xl text-xs text-aurora-indigo space-y-1">
            <span className="text-[10px] text-aurora-muted uppercase font-bold block">Why Recommended by AI:</span>
            <span>💡 {whyRecommended}</span>
          </div>

          <div className="space-y-2 pt-1">
            <span className="text-[10px] text-aurora-muted uppercase tracking-wider block">
              Skills Improved ({skillsImproved.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {skillsImproved.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo text-xs font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* METRICS & ACTION COLUMN */}
        <div className="md:col-span-4 p-4 bg-aurora-canvas/60 border border-aurora-line rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs tabular-nums">
              <span className="text-aurora-muted">Gap impact:</span>
              <span className="font-bold text-emerald-700">{estimatedReadinessBoost}/100</span>
            </div>
            <div className="flex justify-between items-center text-xs tabular-nums">
              <span className="text-aurora-muted">Match Gain:</span>
              <span className="font-bold text-aurora-violet">+{estimatedMatchBoost}%</span>
            </div>
            <div className="flex justify-between items-center text-xs tabular-nums">
              <span className="text-aurora-muted">Time Commitment:</span>
              <span className="font-bold text-aurora-ink">{learningTime}</span>
            </div>
            <div className="flex justify-between items-center text-xs tabular-nums">
              <span className="text-aurora-muted">Difficulty:</span>
              <span className="font-bold text-aurora-violet">{difficulty}</span>
            </div>
          </div>

          <button
            onClick={onAction}
            className="w-full py-2.5 px-4 [background:var(--aurora-gradient-action)] hover:brightness-110 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            <span>Execute Recommendation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </GlassPanel>
  );
};
