import React from 'react';
import {
  FileText,
  Briefcase,
  Video,
  ArrowRight,
  Zap,
} from 'lucide-react';

export interface ResumeInfo {
  hasResume: boolean;
  fileName?: string | null;
  detectedSkillsCount?: number;
  atsScore?: number | null;
  experienceCount?: number;
  projectsCount?: number;
  educationCount?: number;
  parsingStatus?: string;
}

export interface OpportunityCounts {
  saved: number;
  applied: number;
  interviewing: number;
  offer: number;
}

export interface InterviewStats {
  total: number;
  completed: number;
  averageScore: number | null;
  latestScore: number | null;
}

export interface TopRecommendation {
  id?: string;
  title: string;
  reason?: string;
  category?: string;
  priority?: string;
}

export interface TacticalPipelineTerminalsProps {
  resumeInfo?: ResumeInfo;
  totalSkills: number;
  opportunities: OpportunityCounts;
  interviews: InterviewStats;
  topRecommendation?: TopRecommendation | null;
  onNavigate: (route: string) => void;
}

export const TacticalPipelineTerminals: React.FC<TacticalPipelineTerminalsProps> = ({
  resumeInfo,
  totalSkills,
  opportunities,
  interviews,
  topRecommendation,
  onNavigate,
}) => {
  return (
    <div className="space-y-4">
      {/* 1. RESUME INTELLIGENCE TERMINAL */}
      <div className="hcc-panel p-5 rounded-2xl border border-white/10 bg-[#0c121e]">
        <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Resume Intelligence Vault
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            resumeInfo?.hasResume
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
          }`}>
            {resumeInfo?.hasResume ? 'Parsed & Indexed' : 'Upload Required'}
          </span>
        </div>

        {resumeInfo?.hasResume ? (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 truncate max-w-[190px] font-mono">
                  {resumeInfo.fileName || 'Candidate Resume.pdf'}
                </span>
                {typeof resumeInfo.atsScore === 'number' && (
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
                    ATS {resumeInfo.atsScore}/100
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center font-mono text-[10px]">
                <div>
                  <span className="text-slate-500 block">Skills</span>
                  <strong className="text-cyan-300 font-bold">{resumeInfo.detectedSkillsCount || totalSkills}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Experience</span>
                  <strong className="text-slate-300 font-bold">{resumeInfo.experienceCount || 0}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Projects</span>
                  <strong className="text-purple-300 font-bold">{resumeInfo.projectsCount || 0}</strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('/resume')}
              className="w-full py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all font-mono"
            >
              <span>Manage Resume Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-3 py-1">
            <p className="text-xs text-slate-400 leading-relaxed">
              No verified resume analyzed yet. Upload your document to extract vector skills and compute ATS compliance.
            </p>
            <button
              onClick={() => onNavigate('/resume')}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 transition-all font-mono"
            >
              <FileText className="w-4 h-4" />
              <span>Upload Resume File</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. LIVE OPPORTUNITY RADAR */}
      <div className="hcc-panel p-5 rounded-2xl border border-white/10 bg-[#0c121e]">
        <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Live Opportunity Pipeline
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
            JSEARCH LIVE
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center font-mono">
          <button
            onClick={() => onNavigate('/opportunities?tab=SAVED&status=saved')}
            className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-amber-500/40 hover:bg-slate-900 transition-all cursor-pointer"
          >
            <span className="text-slate-500 block text-[9px]">SAVED</span>
            <strong className="text-white text-base font-bold">{opportunities.saved}</strong>
          </button>
          <button
            onClick={() => onNavigate('/opportunities?tab=SAVED&status=applied')}
            className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-amber-500/40 hover:bg-slate-900 transition-all cursor-pointer"
          >
            <span className="text-slate-500 block text-[9px]">APPLIED</span>
            <strong className="text-amber-400 text-base font-bold">{opportunities.applied}</strong>
          </button>
          <button
            onClick={() => onNavigate('/opportunities?tab=SAVED&status=interviewing')}
            className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-purple-500/40 hover:bg-slate-900 transition-all cursor-pointer"
          >
            <span className="text-slate-500 block text-[9px]">INTERVIEW</span>
            <strong className="text-purple-300 text-base font-bold">{opportunities.interviewing}</strong>
          </button>
          <button
            onClick={() => onNavigate('/opportunities?tab=SAVED&status=offer')}
            className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-emerald-500/40 hover:bg-slate-900 transition-all cursor-pointer"
          >
            <span className="text-slate-500 block text-[9px]">OFFER</span>
            <strong className="text-emerald-400 text-base font-bold">{opportunities.offer}</strong>
          </button>
        </div>

        <button
          onClick={() => onNavigate('/opportunities')}
          className="mt-3 w-full py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all font-mono"
        >
          <span>Explore Live Market Matches</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. STAR INTERVIEW TELEMETRY TERMINAL */}
      <div className="hcc-panel p-5 rounded-2xl border border-white/10 bg-[#0c121e]">
        <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-rose-400" />
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              STAR Interview Intelligence
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
            EVALUATED
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
            <span className="text-slate-500 block text-[9px]">SESSIONS</span>
            <strong className="text-white text-base font-bold">{interviews.total}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
            <span className="text-slate-500 block text-[9px]">AVG SCORE</span>
            <strong className="text-emerald-400 text-base font-bold">
              {typeof interviews.averageScore === 'number' ? `${interviews.averageScore}%` : '—'}
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
            <span className="text-slate-500 block text-[9px]">LATEST</span>
            <strong className="text-indigo-300 text-base font-bold">
              {typeof interviews.latestScore === 'number' ? `${interviews.latestScore}%` : '—'}
            </strong>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/interview-agent')}
          className="mt-3 w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all font-mono"
        >
          <span>Launch Mock Interview Agent</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4. STRATEGIC AI DISPATCH CARD */}
      <div className="hcc-panel p-5 rounded-2xl border border-purple-500/30 bg-linear-to-b from-[#141226] to-[#0a0914]">
        <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-purple-300 uppercase tracking-wider text-[11px]">
              AI Strategic Dispatch
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold uppercase">
            {topRecommendation?.priority || 'High Priority'}
          </span>
        </div>

        {topRecommendation ? (
          <div className="space-y-3">
            <div>
              <h5 className="text-sm font-bold text-white mb-1">
                {topRecommendation.title}
              </h5>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {topRecommendation.reason || 'Strategic priority calculated from capability gaps and target role requirements.'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('/recommendations')}
              className="w-full py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all font-mono"
            >
              <span>View All Priority Recommendations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-3 py-1">
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload your resume or add verified skills to receive prioritized AI strategic recommendations.
            </p>
            <button
              onClick={() => onNavigate('/resume')}
              className="w-full py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all font-mono"
            >
              <span>Activate Recommendations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
