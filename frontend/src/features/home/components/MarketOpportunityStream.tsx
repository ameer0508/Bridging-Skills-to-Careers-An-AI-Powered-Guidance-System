import React from 'react';
import { ArrowUpRight, Briefcase, Bookmark, Video, Sparkles, ChevronRight } from 'lucide-react';

export interface MarketOpportunityStreamProps {
  resumeInfo?: {
    hasResume: boolean;
    fileName?: string | null;
    detectedSkillsCount?: number;
    atsScore?: number | null;
  };
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

export const MarketOpportunityStream: React.FC<MarketOpportunityStreamProps> = ({
  opportunities,
  interviews,
  topRecommendation,
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. OPPORTUNITY PIPELINE & MARKET RADAR */}
      <section className="atelier-glass-card p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight font-display">
                Opportunity Radar
              </h3>
              <p className="text-xs text-slate-400">
                Live market matching & application tracking
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('/opportunities')}
            className="atelier-ghost-btn py-1 px-2.5 text-xs group"
          >
            <span>Explore Roles</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* 4 Pipeline Milestones in Asymmetric Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Saved Roles</span>
              <Bookmark className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-300 transition-colors" />
            </div>
            <div className="text-2xl font-bold font-display text-white group-hover:text-sky-200 transition-colors">
              {opportunities.saved}
            </div>
          </div>

          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all cursor-pointer group"
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
            className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all cursor-pointer group"
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
            className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all cursor-pointer group"
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
      <section className="atelier-glass-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Interview Simulation
              </h3>
              <p className="text-xs text-slate-400">
                AI interactive behavioral & technical coaching
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400">Completed Sessions</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {interviews.total} {interviews.total === 1 ? 'Session' : 'Sessions'}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400">Performance Score</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {interviews.latestScore !== null ? `${interviews.latestScore}%` : '—'}
            </div>
          </div>

          <button
            onClick={() => onNavigate('/interview-agent')}
            className="atelier-ghost-btn py-1 px-3 text-xs"
          >
            <span>Practice</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 3. AI STRATEGIC RECOMMENDATION */}
      {topRecommendation && (
        <section className="atelier-glass-card p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs text-sky-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Strategic Advisory</span>
          </div>

          <h4 className="text-sm font-semibold text-white">
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
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors inline-flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>View All Guidance Directives</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
