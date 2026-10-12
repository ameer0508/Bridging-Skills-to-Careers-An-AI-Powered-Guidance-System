import React from 'react';
import { ArrowUpRight, Bookmark, Briefcase, ChevronRight, FileText, MessageSquare, Sparkles, Video, Award } from 'lucide-react';

export interface MarketOpportunityTerminalProps {
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

export const MarketOpportunityTerminal: React.FC<MarketOpportunityTerminalProps> = ({
  resumeInfo: _resumeInfo,
  opportunities,
  interviews,
  topRecommendation,
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. OPPORTUNITY PIPELINE FUNNEL */}
      <section className="quantum-glass-panel p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white tracking-tight">
                Opportunity Pipeline
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Live Market Radar & Application Funnel
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('/opportunities')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1 cursor-pointer group"
          >
            <span>Market Radar</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* 4 Pipeline Stages */}
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-emerald-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
              <span>Saved Roles</span>
              <Bookmark className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <div className="text-2xl font-extrabold font-display text-white group-hover:text-emerald-300 transition-colors">
              {opportunities.saved}
            </div>
          </div>

          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-cyan-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
              <span>Applications</span>
              <FileText className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </div>
            <div className="text-2xl font-extrabold font-display text-white group-hover:text-cyan-300 transition-colors">
              {opportunities.applied}
            </div>
          </div>

          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-amber-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
              <span>Interviewing</span>
              <MessageSquare className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </div>
            <div className="text-2xl font-extrabold font-display text-white group-hover:text-amber-300 transition-colors">
              {opportunities.interviewing}
            </div>
          </div>

          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-purple-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
              <span>Offer Track</span>
              <Award className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-colors" />
            </div>
            <div className="text-2xl font-extrabold font-display text-white group-hover:text-purple-300 transition-colors">
              {opportunities.offer}
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERVIEW READINESS BENCHMARK */}
      <section className="quantum-glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white tracking-tight">
                Interview Simulator Studio
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                AI Mock Sessions & Response Telemetry
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('/interview-agent')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 cursor-pointer group"
          >
            <span>Launch Studio</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-white/5">
          <div className="space-y-0.5">
            <span className="text-xs text-slate-400 font-mono block">Evaluated Performance</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-display text-white">
                {interviews.isEvaluated && interviews.latestScore !== null ? `${interviews.latestScore}%` : '—'}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {interviews.total > 0 ? `(${interviews.total} sessions)` : '(No sessions)'}
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('/interview-agent')}
            className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Practice Session
          </button>
        </div>

        {interviews.latestWeaknesses && interviews.latestWeaknesses.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono text-amber-400 font-semibold uppercase tracking-wider block">
              Recent Coach Feedback:
            </span>
            <div className="space-y-1 text-xs text-slate-300">
              {interviews.latestWeaknesses.slice(0, 2).map((weakness, wIdx) => (
                <div key={wIdx} className="p-2 rounded-lg bg-slate-950/40 border border-white/5 truncate">
                  • {weakness}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3. STRATEGIC AI RECOMMENDATION DOSSIER */}
      {topRecommendation && (
        <section className="quantum-glass-panel p-6 space-y-3 border-indigo-500/30">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> High-Impact Strategic Action
            </span>
            {topRecommendation.priority && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase font-semibold">
                {topRecommendation.priority} Priority
              </span>
            )}
          </div>

          <h4 className="text-sm font-bold text-white font-display">
            {topRecommendation.title}
          </h4>

          {topRecommendation.reason && (
            <p className="text-xs text-slate-300/80 leading-relaxed">
              {topRecommendation.reason}
            </p>
          )}

          <div className="pt-2">
            <button
              onClick={() => onNavigate('/recommendations')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View Strategic Briefing</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
