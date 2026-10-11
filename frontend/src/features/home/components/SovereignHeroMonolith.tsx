import React from 'react';
import { Target, RefreshCw, HelpCircle } from 'lucide-react';

export interface SovereignHeroMonolithProps {
  userName: string;
  targetRole: string;
  primaryDomain: string;
  careerHealth: number | null;
  matchScore: number | null;
  isMatchEvaluated: boolean;
  readinessScore: number | null;
  isReadinessEvaluated: boolean;
  totalSkills: number;
  syncTime: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onNavigate: (route: string) => void;
}

export const SovereignHeroMonolith: React.FC<SovereignHeroMonolithProps> = ({
  userName,
  targetRole,
  primaryDomain,
  careerHealth,
  matchScore,
  isMatchEvaluated,
  readinessScore,
  isReadinessEvaluated,
  totalSkills,
  syncTime,
  isRefreshing,
  onRefresh,
  onNavigate,
}) => {
  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const healthClassification = React.useMemo(() => {
    if (careerHealth === null) return { tier: 'AWAITING TELEMETRY', color: 'text-slate-400', border: 'border-slate-700' };
    if (careerHealth >= 80) return { tier: 'APEX DEPLOYMENT', color: 'text-emerald-400', border: 'border-emerald-500/40' };
    if (careerHealth >= 60) return { tier: 'TACTICAL MOMENTUM', color: 'text-cyan-400', border: 'border-cyan-500/40' };
    if (careerHealth >= 40) return { tier: 'FOUNDATION PHASE', color: 'text-amber-400', border: 'border-amber-500/40' };
    return { tier: 'INITIALIZING', color: 'text-purple-400', border: 'border-purple-500/40' };
  }, [careerHealth]);

  return (
    <div className="hcc-monolith hcc-corner-brackets rounded-3xl p-6 sm:p-10 border border-white/10 relative overflow-hidden">
      {/* Background Radial Atmosphere */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* TOP FLIGHT BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-6 border-b border-white/5 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="hcc-quantum-beacon" />
          <span className="text-slate-400 uppercase tracking-widest text-[11px] font-bold">
            SkillBridge Flagship Intelligence Core
          </span>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <span className="text-cyan-400 text-[11px] hidden sm:inline">Node SB-OS-20.38</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-slate-500 text-[10px]">Synchronized {syncTime}</span>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50 text-[11px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Live'}</span>
          </button>
        </div>
      </div>

      {/* MONUMENTAL HERO ARCHITECTURE */}
      <div className="pt-8 pb-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
        {/* LEFT EDITORIAL CANOPY (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
              {greeting},
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display">
              {userName}
            </h1>
          </div>

          {/* TARGET CAREER BLUEPRINT LOCK */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2 relative group hover:border-cyan-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                Active Career Blueprint Lock
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[9px] font-mono font-bold uppercase tracking-wider">
                  {primaryDomain || 'General Intelligence'}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-[9px] font-mono text-slate-300">
                  {totalSkills} Vector Nodes
                </span>
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold text-white font-display flex items-center justify-between">
              <span className="truncate max-w-[400px]">{targetRole || 'Target Career Not Calibrated'}</span>
              <button
                onClick={() => onNavigate('/careers')}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors shrink-0 ml-2"
              >
                Calibrate Target →
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT INTEGRATED TELEMETRY DECK (5 COLS) */}
        <div className="lg:col-span-5 grid grid-cols-3 gap-3">
          {/* 1. CAREER HEALTH ARC */}
          <div
            onClick={() => onNavigate('/readiness')}
            className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer flex flex-col justify-between items-center text-center group"
          >
            <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              <span>Career Health</span>
              <div className="group/help relative">
                <HelpCircle className="w-3 h-3 text-slate-500" />
              </div>
            </div>
            <div className="my-2 text-2xl sm:text-3xl font-black font-mono text-emerald-400 group-hover:scale-105 transition-transform">
              {careerHealth !== null ? `${careerHealth}%` : '—'}
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${healthClassification.border} ${healthClassification.color}`}>
              {healthClassification.tier}
            </span>
          </div>

          {/* 2. VECTOR MATCH RATE */}
          <div
            onClick={() => onNavigate('/careers')}
            className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer flex flex-col justify-between items-center text-center group"
          >
            <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              Vector Match
            </div>
            <div className="my-2 text-2xl sm:text-3xl font-black font-mono text-cyan-400 group-hover:scale-105 transition-transform">
              {isMatchEvaluated && matchScore !== null ? `${matchScore}%` : '—'}
            </div>
            <span className="text-[9px] font-mono text-slate-400">
              {isMatchEvaluated ? 'Calibrated' : 'Awaiting Profile'}
            </span>
          </div>

          {/* 3. CAREER READINESS */}
          <div
            onClick={() => onNavigate('/readiness')}
            className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 hover:border-purple-500/40 transition-all cursor-pointer flex flex-col justify-between items-center text-center group"
          >
            <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              Readiness
            </div>
            <div className="my-2 text-2xl sm:text-3xl font-black font-mono text-purple-400 group-hover:scale-105 transition-transform">
              {isReadinessEvaluated && readinessScore !== null ? `${readinessScore}%` : '—'}
            </div>
            <span className="text-[9px] font-mono text-slate-400">
              {isReadinessEvaluated ? 'Benchmark Fit' : 'Unevaluated'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
