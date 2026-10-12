import React from 'react';
import {
  Compass,
  Download,
  Activity,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { PeriodType } from './AnalyticsWorkspaceHeader';

export interface ProgressObservatoryHeroProps {
  userName?: string;
  targetRoleTitle: string;
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  snapshotCount: number;
  overallReadiness: number;
  readinessGrowth: number;
  totalSkills: number;
  onExport?: () => void;
}

export const ProgressObservatoryHero: React.FC<ProgressObservatoryHeroProps> = ({
  targetRoleTitle,
  period,
  onPeriodChange,
  snapshotCount,
  overallReadiness,
  readinessGrowth,
  onExport,
}) => {
  const periods: { id: PeriodType; label: string; range: string }[] = [
    { id: 'weekly', label: 'Weekly', range: '7 Days' },
    { id: 'monthly', label: 'Monthly', range: '30 Days' },
    { id: 'quarterly', label: 'Quarterly', range: '90 Days' },
    { id: 'yearly', label: 'Yearly', range: '365 Days' },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 p-6 md:p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="relative z-10 space-y-6">
        {/* Top telemetry status bar & period selectors */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              Career Progress Observatory
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Deterministic Daily Telemetry
            </span>

            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-slate-500" />
              Target: <strong className="text-slate-200">{targetRoleTitle}</strong>
            </span>
          </div>

          {/* Timeframe selector + Export button */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex bg-slate-950/80 p-1 rounded-xl border border-white/10 shadow-inner">
              {periods.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPeriodChange(p.id)}
                  type="button"
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    period === p.id
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {p.label}
                  <span className="hidden md:inline ml-1 text-[10px] opacity-70">({p.range})</span>
                </button>
              ))}
            </div>

            <button
              onClick={onExport || (() => window.print())}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium transition cursor-pointer"
              title="Export Temporal Telemetry Report"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Hero headline & narrative */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              Temporal Capability Intelligence
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              See Your Career Development Unfold Over Time
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              SkillBridge tracks every capability milestone, verified skill, roadmap task, and readiness delta. Observe how your empirical preparation evolves toward <span className="text-indigo-300 font-semibold">{targetRoleTitle}</span> across genuine daily snapshots.
            </p>
          </div>

          {/* Contextual quick summary deck */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Readiness Score</span>
              <div className="text-2xl font-bold text-white flex items-baseline gap-1.5">
                {overallReadiness}%
                {readinessGrowth !== 0 && (
                  <span className={`text-xs font-semibold font-mono ${readinessGrowth > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {readinessGrowth > 0 ? `+${readinessGrowth}%` : `${readinessGrowth}%`}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">Authentic benchmark fit</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Snapshots In Scope</span>
              <div className="text-2xl font-bold text-indigo-400">
                {snapshotCount}
              </div>
              <p className="text-[11px] text-slate-500">{period} observation window</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ProgressObservatoryHero.displayName = 'ProgressObservatoryHero';
