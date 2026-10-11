import React from 'react';
import { ArrowUpRight, Briefcase, Video, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';
import { SpotlightSurface } from './SpotlightSurface';

export interface SpatialMarketStreamProps {
  opportunities: {
    saved: number;
    applied: number;
    interviewing: number;
    offer: number;
    total: number;
  };
  interviews: {
    total: number;
    completed: number;
    averageScore: number | null;
    latestScore: number | null;
    isEvaluated: boolean;
    latestWeaknesses?: string[];
  };
  topRecommendation?: {
    id?: string;
    title: string;
    reason?: string;
    category?: string;
    priority?: string;
  } | null;
  onNavigate: (route: string) => void;
}

export const SpatialMarketStream: React.FC<SpatialMarketStreamProps> = ({
  opportunities,
  interviews,
  topRecommendation,
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Market Alignment Pipeline */}
      <SpotlightSurface
        spotlightColor="rgba(129, 140, 248, 0.08)"
        spotlightRadius={300}
        className="p-6 space-y-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Market Placement Pipeline</span>
          </div>
          <button
            onClick={() => onNavigate('/opportunities')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Explore</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Pipeline Stage Cells */}
        <div className="grid grid-cols-2 gap-2.5">
          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/15 transition-all cursor-pointer group"
          >
            <span className="text-[11px] text-slate-400 block mb-1">Tracked</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                {opportunities.saved}
              </span>
              <span className="text-[10px] text-slate-500">Saved</span>
            </div>
          </div>

          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/15 transition-all cursor-pointer group"
          >
            <span className="text-[11px] text-slate-400 block mb-1">Submitted</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                {opportunities.applied}
              </span>
              <span className="text-[10px] text-slate-500">Applied</span>
            </div>
          </div>

          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/15 transition-all cursor-pointer group"
          >
            <span className="text-[11px] text-amber-400/80 block mb-1">Active Rounds</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-amber-300 group-hover:text-amber-200 transition-colors">
                {opportunities.interviewing}
              </span>
              <span className="text-[10px] text-amber-400/60">Interviews</span>
            </div>
          </div>

          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/15 transition-all cursor-pointer group"
          >
            <span className="text-[11px] text-emerald-400/80 block mb-1">Offers</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-emerald-300 group-hover:text-emerald-200 transition-colors">
                {opportunities.offer}
              </span>
              <span className="text-[10px] text-emerald-400/60">Secured</span>
            </div>
          </div>
        </div>
      </SpotlightSurface>

      {/* 2. Simulation & Interview Preparation */}
      <SpotlightSurface
        spotlightColor="rgba(245, 158, 11, 0.08)"
        spotlightRadius={300}
        className="p-6 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
            <Video className="w-3.5 h-3.5" />
            <span>Interview Coaching Simulation</span>
          </div>
          <button
            onClick={() => onNavigate('/interview-agent')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Practice</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/[0.04] border border-amber-500/15">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400">Simulation Score</span>
            <div className="text-lg font-bold text-amber-200">
              {interviews.averageScore !== null ? `${interviews.averageScore}%` : 'Not Evaluated'}
            </div>
          </div>
          <div className="text-right space-y-0.5">
            <span className="text-[11px] text-slate-400">Total Rounds</span>
            <div className="text-sm font-semibold text-white">
              {interviews.total} Completed
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/interview-agent')}
          className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all cursor-pointer group"
        >
          <span>Launch Mock Interview Session</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </SpotlightSurface>

      {/* 3. Strategic AI Directive */}
      {topRecommendation && (
        <SpotlightSurface
          spotlightColor="rgba(226, 179, 87, 0.07)"
          spotlightRadius={300}
          className="p-6 space-y-3"
        >
          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Strategic AI Advisory</span>
          </div>

          <h4 className="text-xs font-bold text-white leading-snug">
            {topRecommendation.title}
          </h4>

          {topRecommendation.reason && (
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {topRecommendation.reason}
            </p>
          )}

          <button
            onClick={() => onNavigate('/recommendations')}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 pt-1 transition-colors"
          >
            <span>Review Full Guidance</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </SpotlightSurface>
      )}
    </div>
  );
};
