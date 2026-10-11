import React from 'react';
import { ArrowUpRight, Briefcase, Bookmark, Video, Sparkles, ChevronRight } from 'lucide-react';

export interface MarketConstellationStreamProps {
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

export const MarketConstellationStream: React.FC<MarketConstellationStreamProps> = ({
  opportunities,
  interviews,
  topRecommendation,
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. OPPORTUNITY DISCOVERY & PIPELINE STREAM */}
      <section className="carto-surface p-7 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Market Radar</span>
            </div>
            <h3 className="text-base font-semibold text-white tracking-tight font-display">
              Opportunity Pipeline
            </h3>
          </div>
          <button
            onClick={() => onNavigate('/opportunities')}
            className="carto-ghost-btn group"
          >
            <span>Browse Openings</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* 4 Pipeline Stages Stream */}
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Saved Roles</span>
              <Bookmark className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </div>
            <div className="text-2xl font-bold font-display text-white group-hover:text-amber-200 transition-colors">
              {opportunities.saved}
            </div>
          </div>

          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Applied</span>
              <span className="w-2 h-2 rounded-full bg-sky-400" />
            </div>
            <div className="text-2xl font-bold font-display text-white group-hover:text-sky-200 transition-colors">
              {opportunities.applied}
            </div>
          </div>

          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Interviewing</span>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
            <div className="text-2xl font-bold font-display text-white group-hover:text-amber-200 transition-colors">
              {opportunities.interviewing}
            </div>
          </div>

          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Offers</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-display text-white group-hover:text-emerald-200 transition-colors">
              {opportunities.offer}
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERVIEW SIMULATION PRACTICE */}
      <section className="carto-surface p-7 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
              <Video className="w-3.5 h-3.5" />
              <span>Preparation Studio</span>
            </div>
            <h3 className="text-base font-semibold text-white tracking-tight font-display">
              Interview Simulator
            </h3>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400">Mock Sessions</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {interviews.total}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400">Average Performance</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {interviews.latestScore !== null ? `${interviews.latestScore}%` : '—'}
            </div>
          </div>

          <button
            onClick={() => onNavigate('/interview-agent')}
            className="carto-ghost-btn"
          >
            <span>Practice</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 3. AI STRATEGIC ADVISORY */}
      {topRecommendation && (
        <section className="carto-surface p-7 sm:p-8 space-y-3">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Strategic Career Directive</span>
          </div>

          <h4 className="text-sm sm:text-base font-semibold text-white">
            {topRecommendation.title}
          </h4>

          {topRecommendation.reason && (
            <p className="text-xs text-slate-400 leading-relaxed">
              {topRecommendation.reason}
            </p>
          )}

          <div className="pt-1">
            <button
              onClick={() => onNavigate('/recommendations')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All Strategic Recommendations</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
