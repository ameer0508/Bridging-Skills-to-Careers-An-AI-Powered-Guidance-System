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
  Award
} from 'lucide-react';
import { Panel as GlassPanel } from '../../../design/aurora/kit';

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
  historyCount: number;
  onOpenHistory: () => void;
  onStartSession: () => void;
  isStarting: boolean;
  onChangeRole: () => void;
  /** Extra session settings shown above the start button (e.g. the scoring rubric). */
  settingsSlot?: React.ReactNode;
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
  historyCount,
  onOpenHistory,
  onStartSession,
  isStarting,
  onChangeRole,
  settingsSlot,
}) => {
  const interviewModes = [
    {
      id: 'technical' as const,
      label: 'Technical Depth',
      tag: 'ARCHITECTURE & CODE',
      desc: 'Deep-dive system design, algorithms, concurrency, and the tech stack on your resume.',
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
    <div className="space-y-6">
      {/* Studio Header Briefing */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-white [background-image:linear-gradient(135deg,rgb(167_139_250/0.10),transparent_55%)] border border-aurora-line overflow-hidden shadow-aurora-md">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Set up your round
              </span>
              {opportunityContext && (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-aurora-violet/[0.06] text-aurora-violet border border-aurora-violet/25 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  JOB LINKED: {opportunityContext.company}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-aurora-ink tracking-tight">
              Choose how you want to practise
            </h1>

            <p className="text-xs text-aurora-muted leading-relaxed">
              Pick a track and a rubric. Questions come from the question bank, your target role and the skills on your resume.
            </p>
          </div>

          {/* Quick Telemetry Indicators */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[220px]">
            <div className="p-3.5 rounded-2xl bg-aurora-canvas/60 border border-aurora-line flex items-center justify-between">
              <div>
                <span className="text-[10px] text-aurora-muted uppercase block">Interview Readiness</span>
                <span className="text-lg font-bold text-emerald-700">{readinessScore}/100</span>
              </div>
              <Award className="w-5 h-5 text-emerald-800" />
            </div>

          </div>
        </div>

        {/* Opportunity Context Banner (if linked from Job Search Agent) */}
        {opportunityContext && (
          <div className="mt-6 pt-4 border-t border-aurora-line flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs text-aurora-ink">
              <Briefcase className="w-4 h-4 text-aurora-violet shrink-0" />
              <span>
                Targeting Opportunity: <strong className="text-aurora-ink">{opportunityContext.title}</strong> at{' '}
                <strong className="text-aurora-violet">{opportunityContext.company}</strong>
                {opportunityContext.location ? ` (${opportunityContext.location})` : ''}
              </span>
            </div>
            {onClearOpportunityContext && (
              <button
                onClick={onClearOpportunityContext}
                type="button"
                className="text-[11px] text-aurora-muted hover:text-aurora-indigo underline cursor-pointer"
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
          <GlassPanel className="p-6 space-y-4 border-aurora-violet/25">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-aurora-indigo flex items-center gap-2">
                <Target className="w-4 h-4" />
                Target Role & Organization Context
              </span>
              <button
                onClick={onChangeRole}
                type="button"
                className="text-xs text-aurora-indigo hover:text-aurora-indigo flex items-center gap-1 cursor-pointer font-bold"
              >
                Change Role <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-1">
                <span className="text-[10px] text-aurora-muted uppercase block">Target Career Role</span>
                <span className="text-sm font-bold text-aurora-ink block truncate">{targetRoleTitle}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-1">
                <label htmlFor="company-input" className="text-[10px] text-aurora-muted uppercase block">
                  Simulated Employer / Company
                </label>
                <div className="relative flex items-center">
                  <input
                    id="company-input"
                    type="text"
                    value={targetCompany}
                    onChange={(e) => onCompanyChange(e.target.value)}
                    placeholder="e.g. Stripe, OpenAI, Google..."
                    className="w-full pl-6 pr-2 py-1 rounded-lg bg-aurora-canvas border border-aurora-line text-xs text-aurora-ink placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <Building className="w-3 h-3 text-aurora-muted absolute left-1.5" />
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* Mode Selector */}
          <GlassPanel className="p-6 space-y-4 border-aurora-violet/25">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-aurora-indigo block">
                  Select Interview Track
                </span>
                <span className="text-[11px] text-aurora-muted">
                  Each mode customizes the question generation engine and evaluation rubric.
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25">
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
                        ? 'bg-indigo-600/20 border-indigo-400 text-aurora-ink shadow-lg shadow-indigo-600/20 ring-1 ring-indigo-400'
                        : 'bg-aurora-canvas/60 border-aurora-line text-aurora-muted hover:border-aurora-line hover:bg-aurora-canvas/60'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 right-0 w-16 h-16 bg-aurora-violet/[0.06] rounded-bl-full pointer-events-none" />
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-aurora-ink flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                          {mode.label}
                        </span>
                        <span className="text-[9px] font-bold tracking-wider text-aurora-indigo/80 uppercase">
                          {mode.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-aurora-muted leading-relaxed">{mode.desc}</p>
                    </div>

                    <div className="pt-3 mt-2 border-t border-aurora-line flex items-center justify-between text-[10px]">
                      <span className="text-aurora-muted">Evaluation Focus:</span>
                      <span className="text-aurora-indigo font-semibold">{mode.focus}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassPanel>

          {settingsSlot}

          {/* Primary Action CTA */}
          <div className="pt-2">
            <button
              onClick={onStartSession}
              disabled={isStarting}
              type="button"
              className="w-full py-4 px-6 rounded-2xl [background:var(--aurora-gradient-action)] hover:brightness-110 disabled:opacity-50 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] cursor-pointer"
            >
              {isStarting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Synthesizing Contextual Questions...</span>
                </>
              ) : (
                <>
                  <Video className="w-5 h-5 text-white" />
                  <span className="tracking-wide">ENTER INTERVIEW STUDIO & START ROUND</span>
                  <ChevronRight className="w-4 h-4 text-aurora-indigo" />
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-aurora-muted mt-2">
              Typing always works • voice dictation is optional and needs your consent
            </p>
          </div>
        </div>

        {/* Right Column: Preparation Context & Historical Journey (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Grounded Career Evidence Card */}
          <GlassPanel className="p-6 space-y-4 border-aurora-violet/25">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-aurora-indigo flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                What the questions draw on
              </span>
              <p className="text-[11px] text-aurora-muted">
                Questions draw on the skills in your evidence and the gaps recorded for your career.
              </p>
            </div>

            {/* Verified Skills */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-aurora-canvas/60 border border-aurora-line">
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Skills from your resume being tested
              </span>
              <div className="flex flex-wrap gap-1.5">
                {verifiedStrengths.length > 0 ? (
                  verifiedStrengths.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                    >
                      ✓ {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-aurora-muted">No skills on your profile yet.</span>
                )}
              </div>
            </div>

            {/* Critical Focus Gaps */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-aurora-canvas/60 border border-aurora-line">
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Target Role Capability Gaps
              </span>
              <div className="space-y-1.5">
                {focusGaps.length > 0 ? (
                  focusGaps.map((gap, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center justify-between"
                    >
                      <span>{gap}</span>
                      <span className="text-[9px] uppercase tracking-wider text-amber-800 font-bold">Tested</span>
                    </div>
                  ))
                ) : (
                  <span className="text-[11px] text-aurora-muted">No active gaps detected.</span>
                )}
              </div>
            </div>

            {/* Dimensional Baseline Preview */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line">
                <span className="text-aurora-muted block text-[9px] uppercase">Technical Baseline</span>
                <strong className="text-aurora-ink">{technicalDepth}%</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line">
                <span className="text-aurora-muted block text-[9px] uppercase">Behavioral Baseline</span>
                <strong className="text-aurora-ink">{behavioralScore}%</strong>
              </div>
            </div>
          </GlassPanel>

          {/* Historical Sessions Quick Ledger */}
          <GlassPanel className="p-6 space-y-4 border-aurora-line">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-aurora-muted flex items-center gap-2">
                <History className="w-4 h-4 text-aurora-indigo" />
                Past sessions
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-aurora-canvas text-aurora-muted border border-aurora-line">
                {historyCount} Sessions Recorded
              </span>
            </div>

            <p className="text-[11px] text-aurora-muted">
              Review prior interview transcripts, dimensional scores, and historical STAR feedback reports.
            </p>

            <button
              onClick={onOpenHistory}
              type="button"
              className="w-full py-2.5 px-4 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line text-xs text-aurora-ink font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-aurora-indigo" />
              <span>Inspect Past Sessions ({historyCount})</span>
              <ChevronRight className="w-3.5 h-3.5 text-aurora-muted" />
            </button>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
};
