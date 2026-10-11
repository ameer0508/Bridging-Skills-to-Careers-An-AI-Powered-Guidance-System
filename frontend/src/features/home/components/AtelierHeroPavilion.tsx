import React, { useMemo } from 'react';
import { ArrowUpRight, ArrowRight, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { NextBestActionInfo } from './PriorityActionHero';

export interface AtelierHeroPavilionProps {
  userName: string;
  targetRole: string;
  primaryDomain?: string;
  careerHealth: number | null;
  isCareerHealthEvaluated?: boolean;
  syncTime: string;
  isRefreshing: boolean;
  nextBestAction: NextBestActionInfo;
  onRefresh: () => void;
  onNavigate: (route: string) => void;
}

export const AtelierHeroPavilion: React.FC<AtelierHeroPavilionProps> = ({
  userName,
  targetRole,
  primaryDomain,
  careerHealth,
  isCareerHealthEvaluated,
  syncTime,
  isRefreshing,
  nextBestAction,
  onRefresh,
  onNavigate,
}) => {
  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(new Date());
  }, []);

  const healthStatus = useMemo(() => {
    if (!careerHealth || !isCareerHealthEvaluated) {
      return {
        label: 'Awaiting Profile Input',
        description: 'Upload resume or add competencies to calibrate career health.',
        color: 'text-slate-400',
        stroke: '#64748b',
        value: 0,
      };
    }
    if (careerHealth >= 80) {
      return {
        label: 'Prime Career Momentum',
        description: 'Profile matches top market benchmarks across critical competencies.',
        color: 'text-emerald-400',
        stroke: '#10b981',
        value: careerHealth,
      };
    }
    if (careerHealth >= 60) {
      return {
        label: 'Strong Advancement',
        description: 'Clear capability foundation with high-leverage growth areas.',
        color: 'text-sky-400',
        stroke: '#38bdf8',
        value: careerHealth,
      };
    }
    return {
      label: 'Developing Trajectory',
      description: 'Foundational learning milestones underway.',
      color: 'text-amber-400',
      stroke: '#f59e0b',
      value: careerHealth,
    };
  }, [careerHealth, isCareerHealthEvaluated]);

  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * healthStatus.value) / 100;

  return (
    <section className="atelier-elevated-card p-6 sm:p-10 relative overflow-hidden">
      {/* Soft Ambient Internal Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-8">
        {/* Top Editorial Ribbon: Sync Status & Date */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-5">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Intelligence Active</span>
            </span>
            <span className="text-slate-600">•</span>
            <span>Synced {syncTime}</span>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Synchronize career intelligence"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>

          <div className="text-xs font-medium text-slate-400">
            {todayFormatted}
          </div>
        </div>

        {/* Core Narrative Row: Identity & Visual Trajectory Meter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Executive Career Overview</span>
              {primaryDomain && (
                <>
                  <span className="text-slate-600">/</span>
                  <span className="text-sky-300 font-medium">{primaryDomain}</span>
                </>
              )}
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white font-display">
                {targetRole || 'Define Target Career Path'}
              </h1>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Welcome back, <span className="text-slate-200 font-medium">{userName}</span>. Your career intelligence model is actively tracking market requirements, capability gaps, and high-impact next steps.
              </p>
            </div>

            <div className="pt-1">
              <button
                onClick={() => onNavigate('/careers')}
                className="atelier-ghost-btn group"
              >
                <span>Change Target Career</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Quiet, Elegant Career Vitality Ring */}
          <div className="shrink-0 flex items-center gap-5 p-5 rounded-2xl bg-black/30 border border-white/5 backdrop-blur-md">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 90 90">
                <circle
                  cx="45"
                  cy="45"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="45"
                  cy="45"
                  r={radius}
                  stroke={healthStatus.stroke}
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{
                    transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {isCareerHealthEvaluated && careerHealth !== null ? `${careerHealth}%` : '—'}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Readiness</span>
              </div>
            </div>

            <div className="space-y-1 max-w-[180px]">
              <div className={`text-xs sm:text-sm font-semibold ${healthStatus.color}`}>
                {healthStatus.label}
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                {healthStatus.description}
              </p>
            </div>
          </div>
        </div>

        {/* Integrated Primary Focus Pavilion (Seamless Next Best Action) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-sky-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Recommended Priority Action</span>
              {nextBestAction.badge && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">{nextBestAction.badge}</span>
                </>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
              {nextBestAction.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {nextBestAction.subtitle}
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={() => onNavigate(nextBestAction.route)}
              className="atelier-cta-btn w-full sm:w-auto"
            >
              <span>{nextBestAction.actionLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
