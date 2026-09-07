import React from 'react';
import { Sparkles, Award, ArrowRight, Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';
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
  type = 'project',
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
    <GlassPanel className="p-6 space-y-6 border-indigo-500/40 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/40 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Top Recommendation Spotlight
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                ROI: {learningRoi}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">{title}</h3>
          </div>
        </div>
        <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
          High Impact Priority
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed font-sans">{reason}</p>
          <div className="p-3.5 bg-slate-950/80 border border-indigo-500/20 rounded-xl text-xs text-indigo-200 font-mono space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Why Recommended by AI:</span>
            <span>💡 {whyRecommended}</span>
          </div>

          <div className="space-y-2 pt-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">
              Skills Improved ({skillsImproved.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {skillsImproved.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* METRICS & ACTION COLUMN */}
        <div className="md:col-span-4 p-4 bg-slate-950/80 border border-white/5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Readiness Boost:</span>
              <span className="font-bold text-emerald-400">+{estimatedReadinessBoost}%</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Match Gain:</span>
              <span className="font-bold text-cyan-400">+{estimatedMatchBoost}%</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Time Commitment:</span>
              <span className="font-bold text-slate-200">{learningTime}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Difficulty:</span>
              <span className="font-bold text-purple-300">{difficulty}</span>
            </div>
          </div>

          <button
            onClick={onAction}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            <span>Execute Recommendation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </GlassPanel>
  );
};
