import React from 'react';
import {
  Video,
  Building,
  Target,
  History,
  ShieldCheck,
  AlertCircle,
  Briefcase,
  ChevronRight,
  RefreshCw,
  Zap,
  Award
} from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface StudioLobbyProps {
  targetRoleTitle: string;
  targetCompany: string;
  onCompanyChange: (company: string) => void;
  selectedMode: 'technical' | 'behavioral' | 'project' | 'resume' | 'career' | 'mixed';
  onModeSelect: (mode: 'technical' | 'behavioral' | 'project' | 'resume' | 'career' | 'mixed') => void;
  opportunityContext?: {
    id?: string;
    title?: string;
    company?: string;
    location?: string;
  } | null;
  onClearOpportunityContext?: () => void;
  verifiedStrengths: string[];
  focusGaps: string[];
  readinessScore: number;
  technicalDepth: number;
  behavioralScore: number;
  offerProbability: number;
  historyCount: number;
  onOpenHistory: () => void;
  onStartSession: () => void;
  isStarting: boolean;
  onChangeRole: () => void;
}

export const StudioLobby: React.FC<StudioLobbyProps> = ({
  targetRoleTitle,
  targetCompany,
  onCompanyChange,
  selectedMode,
  onModeSelect,
  opportunityContext,
  onClearOpportunityContext,
  verifiedStrengths,
  focusGaps,
  readinessScore,
  technicalDepth,
  behavioralScore,
  offerProbability,
  historyCount,
  onOpenHistory,
  onStartSession,
  isStarting,
  onChangeRole,
}) => {
  const interviewModes = [
    {
      id: 'technical' as const,
      label: 'Technical Depth',
      tag: 'ARCHITECTURE & CODE',
      desc: 'Deep-dive system design, algorithms, concurrency, and your verified tech stack.',
      focus: 'System Design & Code',
    },
    {
      id: 'behavioral' as const,
      label: 'Behavioral STAR',
      tag: 'LEADERSHIP & CONFLICT',
      desc: 'Evaluated strictly against Situation, Task, Action, and Quantified Results.',
      focus: 'STAR Method',
    },
    {
      id: 'project' as const,
      label: 'Project Trade-offs',
      tag: 'SYSTEMS & EXECUTION',
      desc: 'Defend architectural decisions, bottleneck mitigations, and technology choices.',
      focus: 'Engineering Trade-offs',
    },
    {
      id: 'resume' as const,
      label: 'Resume Verification',
      tag: 'CAREER EVIDENCE',
      desc: 'Interrogate claims, production incidents, and scale metrics from your parsed resume.',
      focus: 'Past Impact Evidence',
    },
    {
      id: 'career' as const,
      label: 'Role Competency',
      tag: 'TARGET CAREER ALIGNMENT',
      desc: 'Targeted directly at the responsibilities and domain expertise of this specific role.',
      focus: 'Domain Proficiency',
    },
    {
      id: 'mixed' as const,
      label: 'Comprehensive Suite',
      tag: 'FULL ROUND SIMULATION',
      desc: 'A complete multi-stage interview round spanning technical, behavioral, and architecture.',
      focus: 'Holistic Readiness',
    },
  ];

  return (
    <div className="space-y-6 font-mono">
      {/* Studio Header Briefing */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-950 to-indigo-950/40 border border-indigo-500/30 overflow-hidden shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                STUDIO LOBBY • PREPARATION CHAMBER
              </span>
              {opportunityContext && (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  JOB LINKED: {opportunityContext.company}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Prepare for the Hot Seat
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed">
              Step into an adaptive interview environment powered by your actual career evidence.
              Questions are tailored to your verified technical capabilities, target role standards,
              and critical focus gaps.
            </p>
          </div>

          {/* Quick Telemetry Indicators */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[220px]">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Interview Readiness</span>
                <span className="text-lg font-bold text-emerald-400">{readinessScore}/100</span>
              </div>
              <Award className="w-5 h-5 text-emerald-400/70" />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Estimated Offer Prob.</span>
                <span className="text-lg font-bold text-cyan-400">{offerProbability}%</span>
              </div>
              <Zap className="w-5 h-5 text-cyan-400/70" />
            </div>
          </div>
        </div>

        {/* Opportunity Context Banner (if linked from Job Search Agent) */}
        {opportunityContext && (
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <Briefcase className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Targeting Opportunity: <strong className="text-white">{opportunityContext.title}</strong> at{' '}
                <strong className="text-cyan-300">{opportunityContext.company}</strong>
                {opportunityContext.location ? ` (${opportunityContext.location})` : ''}
              </span>
            </div>
            {onClearOpportunityContext && (
              <button
                onClick={onClearOpportunityContext}
                type="button"
                className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                Reset to generic target
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Grid: Target Configuration & Preparation Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Target Context & Mode Selector (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Target Role & Employer Config */}
          <GlassPanel className="p-6 space-y-4 border-indigo-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Target Role & Organization Context
              </span>
              <button
                onClick={onChangeRole}
                type="button"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-bold"
              >
                Change Role <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block">Target Career Role</span>
                <span className="text-sm font-bold text-white block truncate">{targetRoleTitle}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1">
                <label htmlFor="company-input" className="text-[10px] text-slate-400 uppercase block">
                  Simulated Employer / Company
                </label>
                <div className="relative flex items-center">
                  <input
                    id="company-input"
                    type="text"
                    value={targetCompany}
                    onChange={(e) => onCompanyChange(e.target.value)}
                    placeholder="e.g. Stripe, OpenAI, Google..."
                    className="w-full pl-6 pr-2 py-1 rounded-lg bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <Building className="w-3 h-3 text-slate-500 absolute left-1.5" />
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* Mode Selector */}
          <GlassPanel className="p-6 space-y-4 border-indigo-500/30">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 block">
                  Select Interview Track
                </span>
                <span className="text-[11px] text-slate-400">
                  Each mode customizes the question generation engine and evaluation rubric.
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                5 QUESTIONS • 20 MIN
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {interviewModes.map((mode) => {
                const isSelected = selectedMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => onModeSelect(mode.id)}
                    type="button"
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-400 text-white shadow-lg shadow-indigo-600/20 ring-1 ring-indigo-400'
                        : 'bg-slate-950/70 border-white/10 text-slate-300 hover:border-white/20 hover:bg-slate-900/60'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-bl-full pointer-events-none" />
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                          {mode.label}
                        </span>
                        <span className="text-[9px] font-bold tracking-wider text-indigo-300/80 uppercase">
                          {mode.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{mode.desc}</p>
                    </div>

                    <div className="pt-3 mt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Evaluation Focus:</span>
                      <span className="text-indigo-300 font-semibold">{mode.focus}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassPanel>

          {/* Primary Action CTA */}
          <div className="pt-2">
            <button
              onClick={onStartSession}
              disabled={isStarting}
              type="button"
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] cursor-pointer"
            >
              {isStarting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Synthesizing Contextual Questions...</span>
                </>
              ) : (
                <>
                  <Video className="w-5 h-5 text-indigo-100" />
                  <span className="tracking-wide">ENTER INTERVIEW STUDIO & START ROUND</span>
                  <ChevronRight className="w-4 h-4 text-indigo-200" />
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-500 mt-2">
              Microphone dictation supported locally • STAR structure evaluated deterministically
            </p>
          </div>
        </div>

        {/* Right Column: Preparation Context & Historical Journey (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Grounded Career Evidence Card */}
          <GlassPanel className="p-6 space-y-4 border-indigo-500/30">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Grounded Candidate Telemetry
              </span>
              <p className="text-[11px] text-slate-400">
                The interview prompter grounds scenario challenges into your actual verified skills and recognized gaps.
              </p>
            </div>

            {/* Verified Skills */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/80 border border-white/10">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Skills Being Tested
              </span>
              <div className="flex flex-wrap gap-1.5">
                {verifiedStrengths.length > 0 ? (
                  verifiedStrengths.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                    >
                      ✓ {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-500">No verified skills synced yet.</span>
                )}
              </div>
            </div>

            {/* Critical Focus Gaps */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/80 border border-white/10">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Target Role Capability Gaps
              </span>
              <div className="space-y-1.5">
                {focusGaps.length > 0 ? (
                  focusGaps.map((gap, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 flex items-center justify-between"
                    >
                      <span>{gap}</span>
                      <span className="text-[9px] uppercase tracking-wider text-amber-400/80 font-bold">Tested</span>
                    </div>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-500">No active gaps detected.</span>
                )}
              </div>
            </div>

            {/* Dimensional Baseline Preview */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-slate-500 block text-[9px] uppercase">Technical Baseline</span>
                <strong className="text-slate-200">{technicalDepth}%</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-slate-500 block text-[9px] uppercase">Behavioral Baseline</span>
                <strong className="text-slate-200">{behavioralScore}%</strong>
              </div>
            </div>
          </GlassPanel>

          {/* Historical Sessions Quick Ledger */}
          <GlassPanel className="p-6 space-y-4 border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                Interview Journey Ledger
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-slate-400 border border-white/10">
                {historyCount} Sessions Recorded
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Review prior interview transcripts, dimensional scores, and historical STAR feedback reports.
            </p>

            <button
              onClick={onOpenHistory}
              type="button"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs text-white font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Inspect Past Sessions ({historyCount})</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
};
