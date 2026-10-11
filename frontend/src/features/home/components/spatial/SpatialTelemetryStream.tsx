import React from 'react';
import { Briefcase, Video, Sparkles, ArrowUpRight, ChevronRight, TrendingUp, ShieldCheck } from 'lucide-react';

export interface SpatialTelemetryStreamProps {
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

export const SpatialTelemetryStream: React.FC<SpatialTelemetryStreamProps> = ({
  opportunities,
  interviews,
  topRecommendation,
  onNavigate,
}) => {
  const safeOpps = opportunities || { saved: 0, applied: 0, interviewing: 0, offer: 0, total: 0 };
  const safeInterviews = interviews || {
    total: 0,
    completed: 0,
    averageScore: null,
    latestScore: null,
    isEvaluated: false,
    latestWeaknesses: [],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* 1. Placement Pipeline Fluid Blade */}
      <div className="spatial-glass-blade p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-bold tracking-wide">
            <Briefcase className="w-4 h-4" />
            <span>Market Placement Pipeline</span>
          </div>
          <button
            onClick={() => onNavigate('/opportunities')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Radar</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-indigo-400/40 transition-all cursor-pointer group"
          >
            <span className="text-[11px] text-slate-400 font-medium block mb-1">Tracked</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white group-hover:text-indigo-300 transition-colors">
                {safeOpps.saved ?? 0}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">SAVED</span>
            </div>
          </div>

          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-indigo-400/40 transition-all cursor-pointer group"
          >
            <span className="text-[11px] text-slate-400 font-medium block mb-1">Submitted</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white group-hover:text-indigo-300 transition-colors">
                {safeOpps.applied ?? 0}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">APPLIED</span>
            </div>
          </div>

          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-4 rounded-2xl bg-amber-500/[0.03] hover:bg-amber-500/[0.08] border border-amber-500/20 hover:border-amber-400/50 transition-all cursor-pointer group shadow-[0_0_20px_rgba(245,158,11,0.1)]"
          >
            <span className="text-[11px] text-amber-400 font-medium block mb-1">Active Rounds</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-300 group-hover:text-amber-200 transition-colors">
                {safeOpps.interviewing ?? 0}
              </span>
              <span className="text-[10px] text-amber-400/60 font-mono">IN PROGRESS</span>
            </div>
          </div>

          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-4 rounded-2xl bg-emerald-500/[0.03] hover:bg-emerald-500/[0.08] border border-emerald-500/20 hover:border-emerald-400/50 transition-all cursor-pointer group shadow-[0_0_20px_rgba(16,185,129,0.1)]"
          >
            <span className="text-[11px] text-emerald-400 font-medium block mb-1">Secured Offers</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-300 group-hover:text-emerald-200 transition-colors">
                {safeOpps.offer ?? 0}
              </span>
              <span className="text-[10px] text-emerald-400/60 font-mono">ACCEPTED</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Simulation & Interview Coaching Blade */}
      <div className="spatial-glass-blade p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-bold tracking-wide">
            <Video className="w-4 h-4" />
            <span>Interview Coaching Simulation</span>
          </div>
          <button
            onClick={() => onNavigate('/interview-agent')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Simulate</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-500/[0.06] to-transparent border border-amber-500/25">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Evaluation Average</span>
            <div className="text-2xl font-black text-amber-200">
              {safeInterviews.averageScore !== null && safeInterviews.averageScore !== undefined
                ? `${safeInterviews.averageScore}%`
                : 'Awaiting Prep'}
            </div>
          </div>
          <div className="text-right space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Completed Sessions</span>
            <div className="text-sm font-bold text-white">
              {safeInterviews.total ?? 0} Finished
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/interview-agent')}
          className="w-full py-3 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer group shadow-lg"
        >
          <span>Launch AI Mock Interview Session</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-amber-400" />
        </button>
      </div>

      {/* 3. Strategic Directive Blade */}
      <div className="spatial-glass-blade p-6 sm:p-7 space-y-4 md:col-span-2 lg:col-span-1">
        <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08] text-xs text-amber-400 font-bold tracking-wide">
          <Sparkles className="w-4 h-4" />
          <span>Strategic AI Advisory</span>
        </div>

        {topRecommendation ? (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white leading-snug">
              {topRecommendation.title}
            </h4>
            {topRecommendation.reason && (
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                {topRecommendation.reason}
              </p>
            )}
            <button
              onClick={() => onNavigate('/recommendations')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 pt-1 transition-colors cursor-pointer"
            >
              <span>Review Advisory Directives</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2 py-3 text-center sm:text-left">
            <h4 className="text-sm font-bold text-slate-200">
              Autonomous Guidance Initialized
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Synthesizing market telemetry benchmarks and learning paths for your career summit.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
