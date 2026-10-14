import React from 'react';
import {
  Compass,
  Download,
  Activity,
  Sparkles,
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
    <div className="relative overflow-hidden rounded-3xl border border-aurora-line bg-gradient-to-b from-white via-white to-aurora-sidebar p-6 md:p-8 lg:p-10 shadow-2xl">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-aurora-violet/[0.06] blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-aurora-violet/[0.06] blur-[120px]" />

      <div className="relative z-10 space-y-6">
        {/* Top telemetry status bar & period selectors */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-aurora-line pb-5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25">
              <Activity className="w-3.5 h-3.5 text-aurora-indigo" />
              Progress over time
            </span>


            <span className="text-xs text-aurora-muted flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-aurora-muted" />
              Target: <strong className="text-aurora-ink">{targetRoleTitle}</strong>
            </span>
          </div>

          {/* Timeframe selector + Export button */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div role="group" aria-label="Period" className="flex flex-wrap bg-aurora-canvas/60 p-1 rounded-xl border border-aurora-line shadow-inner">
              {periods.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPeriodChange(p.id)}
                  type="button"
                  aria-pressed={period === p.id}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    period === p.id
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md font-semibold'
                      : 'text-aurora-muted hover:text-aurora-ink hover:bg-aurora-canvas'
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-aurora-line bg-aurora-canvas hover:bg-aurora-canvas text-aurora-ink text-xs font-medium transition cursor-pointer"
              title="Print or save this page as PDF"
              aria-label="Export: print or save this page as PDF"
            >
              <Download className="w-3.5 h-3.5 text-aurora-muted" />
              <span className="hidden md:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Hero headline & narrative */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-aurora-indigo">
              <Sparkles className="w-3.5 h-3.5" />
              Progress analytics
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-aurora-ink">
              See Your Career Development Unfold Over Time
            </h1>
            <p className="text-sm sm:text-base text-aurora-muted max-w-2xl leading-relaxed">
              Your skills, roadmap tasks and readiness for <span className="text-aurora-indigo font-semibold">{targetRoleTitle}</span>, from the snapshots SkillBridge has recorded so far.
            </p>
          </div>

          {/* Contextual quick summary deck */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-1">
              <span className="text-[11px] text-aurora-muted uppercase">Readiness Score</span>
              <div className="text-2xl font-bold text-aurora-ink flex items-baseline gap-1.5">
                {overallReadiness}%
                {readinessGrowth !== 0 && (
                  <span className={`text-xs font-semibold ${readinessGrowth > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {readinessGrowth > 0 ? `+${readinessGrowth}%` : `${readinessGrowth}%`}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-aurora-muted">For your target career</p>
            </div>

            <div className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-1">
              <span className="text-[11px] text-aurora-muted uppercase">Snapshots In Scope</span>
              <div className="text-2xl font-bold text-aurora-indigo">
                {snapshotCount}
              </div>
              <p className="text-[11px] text-aurora-muted">{period} observation window</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ProgressObservatoryHero.displayName = 'ProgressObservatoryHero';
