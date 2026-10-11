import React from 'react';
import { ArrowUpRight, RefreshCw, Sparkles, Activity } from 'lucide-react';

export interface SovereignCommandHorizonProps {
  userName: string;
  targetRole: string;
  primaryDomain?: string;
  careerHealth: number | null;
  isCareerHealthEvaluated?: boolean;
  syncTime: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onNavigate: (route: string) => void;
}

export const SovereignCommandHorizon: React.FC<SovereignCommandHorizonProps> = ({
  userName,
  targetRole,
  primaryDomain,
  careerHealth,
  isCareerHealthEvaluated,
  syncTime,
  isRefreshing,
  onRefresh,
  onNavigate,
}) => {
  const todayFormatted = React.useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(new Date());
  }, []);

  const healthTier = React.useMemo(() => {
    if (!careerHealth || !isCareerHealthEvaluated) {
      return {
        label: 'Calibrating Baseline',
        color: 'text-amber-400',
        stroke: '#f59e0b',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
      };
    }
    if (careerHealth >= 80) {
      return {
        label: 'Market Optimized',
        color: 'text-emerald-400',
        stroke: '#10b981',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
      };
    }
    if (careerHealth >= 60) {
      return {
        label: 'Competitive Velocity',
        color: 'text-cyan-400',
        stroke: '#06b6d4',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/30',
      };
    }
    return {
      label: 'Development Arc',
      color: 'text-indigo-400',
      stroke: '#6366f1',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/30',
    };
  }, [careerHealth, isCareerHealthEvaluated]);

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const healthVal = isCareerHealthEvaluated && careerHealth !== null ? careerHealth : 0;
  const strokeDashoffset = circumference - (circumference * healthVal) / 100;

  return (
    <header className="quantum-glass-panel p-6 sm:p-8 relative">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        {/* Left Side: Candidate Identity & Target Career Trajectory */}
        <div className="space-y-4 max-w-3xl">
          {/* Top Metadata Strip */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-wider">Telemetry Online</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Synced {syncTime}</span>
            </div>

            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-400 font-medium">{todayFormatted}</span>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Synchronize real-time intelligence telemetry"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

          {/* Identity & Career Banner */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Career Mission Control</span>
              {primaryDomain && (
                <>
                  <span className="text-slate-600">/</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px]">
                    {primaryDomain}
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-display">
                {targetRole || 'Define Target Career Path'}
              </h1>
              <button
                onClick={() => onNavigate('/careers')}
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer self-start shrink-0 group"
              >
                <span>Alter Trajectory</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>

            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Welcome back, <strong className="text-slate-200 font-semibold">{userName}</strong>. All telemetry feeds, neural matching matrices, and market discovery signals are calibrated to your profile.
            </p>
          </div>
        </div>

        {/* Right Side: Composite Career Health Radial Monolith */}
        <div className="shrink-0 flex items-center gap-5 p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-white/10 shadow-xl backdrop-blur-xl">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="7"
                fill="transparent"
              />
              {/* Gradient Progress Arc */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke={healthTier.stroke}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)',
                  filter: `drop-shadow(0 0 6px ${healthTier.stroke}50)`,
                }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl sm:text-2xl font-black font-display text-white tracking-tight">
                {isCareerHealthEvaluated && careerHealth !== null ? `${careerHealth}%` : '—'}
              </span>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Health</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-[10px] uppercase tracking-wider">System State</span>
            </div>
            <div className={`text-xs sm:text-sm font-bold font-display px-2.5 py-1 rounded-md border ${healthTier.bg} ${healthTier.border} ${healthTier.color}`}>
              {healthTier.label}
            </div>
            <p className="text-[11px] text-slate-400 max-w-[140px] leading-tight">
              Weighted composite of verified skills, role alignment & readiness.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
