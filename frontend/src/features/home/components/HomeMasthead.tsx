import React from 'react';
import { ArrowUpRight, CheckCircle2, RefreshCw, TrendingUp } from 'lucide-react';

interface HomeMastheadProps {
  userName: string;
  targetRole: string;
  primaryDomain?: string;
  careerHealth: number | null;
  isCareerHealthEvaluated?: boolean;
  matchScore: number | null;
  isMatchEvaluated?: boolean;
  readinessScore: number | null;
  isReadinessEvaluated?: boolean;
  totalSkills: number;
  syncTime: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onNavigate: (route: string) => void;
}

export const HomeMasthead: React.FC<HomeMastheadProps> = ({
  userName,
  targetRole,
  primaryDomain,
  careerHealth,
  isCareerHealthEvaluated,
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
  // Format current date in human editorial format
  const todayFormatted = React.useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(new Date());
  }, []);

  const healthTier = React.useMemo(() => {
    if (!careerHealth || !isCareerHealthEvaluated) {
      return { label: 'Calibrating Baseline', color: 'text-amber-400' };
    }
    if (careerHealth >= 80) return { label: 'Market Optimized', color: 'text-emerald-400' };
    if (careerHealth >= 60) return { label: 'Competitive Standing', color: 'text-blue-400' };
    return { label: 'Development Focus', color: 'text-amber-400' };
  }, [careerHealth, isCareerHealthEvaluated]);

  return (
    <header className="editorial-card p-6 sm:p-8 space-y-6">
      {/* Top Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-300 whitespace-nowrap">{todayFormatted}</span>
          <span className="text-slate-600">/</span>
          <span>Welcome, <strong className="text-slate-200 font-semibold">{userName}</strong></span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Updated {syncTime}</span>
          </div>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh career intelligence"
            className="p-1.5 rounded-md hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Masthead Display */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="editorial-tag">Target Career Track</span>
          {primaryDomain && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {primaryDomain}
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white">
            {targetRole || 'Define Target Career Role'}
          </h1>
          <button
            onClick={() => onNavigate('/careers')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer self-start shrink-0"
          >
            <span>Change target role</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Open Horizontal Metrics Ledger (2 cols on mobile/tablet, 4 cols on desktop) */}
      <div className="pt-6 hairline-divider grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Career Health */}
        <div
          onClick={() => onNavigate('/analytics')}
          className="space-y-1 cursor-pointer group"
        >
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <span>Career Health</span>
            <TrendingUp className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors truncate">
              {isCareerHealthEvaluated && careerHealth !== null ? `${careerHealth}%` : 'Calibrating'}
            </span>
          </div>
          <p className={`text-[11px] ${healthTier.color} font-medium`}>
            {healthTier.label}
          </p>
        </div>

        {/* Metric 2: Role Match */}
        <div
          onClick={() => onNavigate('/careers')}
          className="space-y-1 cursor-pointer group"
        >
          <div className="text-xs text-slate-400">Role Match Score</div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors truncate">
            {isMatchEvaluated && matchScore !== null ? `${matchScore}%` : 'Pending'}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {isMatchEvaluated ? 'Vector alignment score' : 'Profile analysis needed'}
          </p>
        </div>

        {/* Metric 3: Readiness Score */}
        <div
          onClick={() => onNavigate('/readiness')}
          className="space-y-1 cursor-pointer group"
        >
          <div className="text-xs text-slate-400">Target Readiness</div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors truncate">
            {isReadinessEvaluated && readinessScore !== null ? `${readinessScore}%` : 'Baseline'}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {isReadinessEvaluated ? 'Comprehensive readiness' : 'Awaiting completion'}
          </p>
        </div>

        {/* Metric 4: Verified Skills */}
        <div
          onClick={() => onNavigate('/skills')}
          className="space-y-1 cursor-pointer group"
        >
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <span>Verified Skills</span>
            <CheckCircle2 className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" />
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-white transition-colors truncate">
            {totalSkills}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {totalSkills > 0 ? 'Verified capabilities' : 'Upload resume to extract'}
          </p>
        </div>
      </div>
    </header>
  );
};
