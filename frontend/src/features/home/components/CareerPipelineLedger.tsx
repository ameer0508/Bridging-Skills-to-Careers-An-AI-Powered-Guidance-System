import React from 'react';
import { ArrowUpRight, Bookmark, Briefcase, CheckCircle2, ChevronRight, FileText, MessageSquare, Sparkles } from 'lucide-react';

interface CareerPipelineLedgerProps {
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

export const CareerPipelineLedger: React.FC<CareerPipelineLedgerProps> = ({
  resumeInfo,
  opportunities,
  interviews,
  topRecommendation,
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Job Application Pipeline Ledger */}
      <section className="editorial-card p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 hairline-divider">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-400" />
            <span className="editorial-tag text-slate-200">Opportunity Pipeline</span>
          </div>
          <button
            onClick={() => onNavigate('/opportunities')}
            className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Explore market</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Pipeline Stages */}
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-3.5 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Saved Roles</span>
              <Bookmark className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </div>
            <div className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
              {opportunities.saved}
            </div>
          </div>

          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-3.5 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Applications</span>
              <FileText className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </div>
            <div className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
              {opportunities.applied}
            </div>
          </div>

          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-3.5 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Interviewing</span>
              <MessageSquare className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </div>
            <div className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
              {opportunities.interviewing}
            </div>
          </div>

          <div
            onClick={() => onNavigate('/opportunities')}
            className="p-3.5 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Offers</span>
              <CheckCircle2 className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </div>
            <div className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
              {opportunities.offer}
            </div>
          </div>
        </div>

        {/* Active Resume & ATS Baseline */}
        <div
          onClick={() => onNavigate('/resume')}
          className="pt-3 hairline-divider flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
            <span className="truncate max-w-[200px]">
              {resumeInfo?.hasResume ? (resumeInfo.fileName || 'Active Resume Verified') : 'No resume uploaded'}
            </span>
          </div>
          {resumeInfo?.atsScore !== null && resumeInfo?.atsScore !== undefined && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
              ATS {resumeInfo.atsScore}%
            </span>
          )}
        </div>
      </section>

      {/* 2. Interview Studio Ledger */}
      <section className="editorial-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 hairline-divider">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span className="editorial-tag text-slate-200">Interview Readiness</span>
          </div>
          <button
            onClick={() => onNavigate('/interview-agent')}
            className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Practice studio</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-slate-400">Average Performance</span>
            <span className="text-lg font-bold text-white">
              {interviews.isEvaluated && interviews.averageScore !== null
                ? `${interviews.averageScore}%`
                : 'Not Yet Evaluated'}
            </span>
          </div>

          <div className="flex items-baseline justify-between text-xs text-slate-400">
            <span>Completed Mock Sessions</span>
            <span className="font-medium text-slate-300">{interviews.completed} completed</span>
          </div>

          {interviews.latestWeaknesses && interviews.latestWeaknesses.length > 0 && (
            <div className="pt-2 hairline-divider space-y-1.5">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                Focus Areas:
              </span>
              <div className="flex flex-wrap gap-1">
                {interviews.latestWeaknesses.slice(0, 3).map((w, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => onNavigate('/interview-agent')}
              className="w-full py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Launch Mock Technical Interview</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Executive AI Advisory / Strategic Recommendation */}
      {topRecommendation && (
        <section className="editorial-card p-6 space-y-3 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="editorial-tag text-blue-400">Strategic Advisory</span>
            </div>
            {topRecommendation.priority && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/60 font-semibold uppercase">
                {topRecommendation.priority}
              </span>
            )}
          </div>

          <h4 className="text-sm font-semibold text-slate-200">
            {topRecommendation.title}
          </h4>

          {topRecommendation.reason && (
            <p className="text-xs text-slate-400 leading-relaxed">
              {topRecommendation.reason}
            </p>
          )}

          <button
            onClick={() => onNavigate('/recommendations')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 cursor-pointer pt-1"
          >
            <span>View all strategic recommendations</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </section>
      )}
    </div>
  );
};
