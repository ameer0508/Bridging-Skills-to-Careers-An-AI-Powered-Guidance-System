import React from 'react';
import { ArrowUpRight, Target, Compass, Layers, CheckCircle } from 'lucide-react';

export interface VitalityMetricRibbonProps {
  matchScore: number | null;
  isMatchEvaluated: boolean;
  totalSkills: number;
  readinessScore: number | null;
  isReadinessEvaluated: boolean;
  roadmapProgress: number;
  isRoadmapInitialized: boolean;
  onNavigate: (route: string) => void;
}

export const VitalityMetricRibbon: React.FC<VitalityMetricRibbonProps> = ({
  matchScore,
  isMatchEvaluated,
  totalSkills,
  readinessScore,
  isReadinessEvaluated,
  roadmapProgress,
  isRoadmapInitialized,
  onNavigate,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
      {/* 1. FOCAL READINESS & MATCH BENCHMARK (6 COLS) */}
      <div
        onClick={() => onNavigate('/readiness')}
        className="md:col-span-6 atelier-glass-card p-6 sm:p-7 flex flex-col justify-between space-y-6 cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-300">Career Readiness & Alignment</span>
              <p className="text-[11px] text-slate-400">Composite role capability benchmark</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-sky-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>

        <div className="grid grid-cols-2 gap-6 pt-2">
          <div>
            <div className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight">
              {isReadinessEvaluated && readinessScore !== null ? `${readinessScore}%` : '—'}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              {isReadinessEvaluated ? 'Benchmark verified' : 'Readiness pending'}
            </span>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight">
              {isMatchEvaluated && matchScore !== null ? `${matchScore}%` : '—'}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              {isMatchEvaluated ? 'Role semantic match' : 'Awaiting target role'}
            </span>
          </div>
        </div>

        {/* Subtle Visual Progression Bar */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Overall Alignment</span>
            <span>{isReadinessEvaluated && readinessScore !== null ? `${readinessScore}%` : '0%'}</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-sky-400 rounded-full transition-all duration-700"
              style={{ width: `${isReadinessEvaluated && readinessScore !== null ? readinessScore : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. VERIFIED COMPETENCIES PORTFOLIO (3 COLS) */}
      <div
        onClick={() => onNavigate('/skills')}
        className="md:col-span-3 atelier-glass-card p-6 flex flex-col justify-between space-y-4 cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300">
            <Layers className="w-4 h-4" />
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>

        <div>
          <div className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight">
            {totalSkills}
          </div>
          <h4 className="text-xs font-semibold text-slate-200 mt-1">Verified Skills</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {totalSkills > 0 ? 'Extracted from resume and verified' : 'Upload resume to extract skills'}
          </p>
        </div>

        <div className="pt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-indigo-300 font-medium">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{totalSkills > 0 ? 'Inventory audited' : 'Inventory empty'}</span>
        </div>
      </div>

      {/* 3. ROADMAP EXECUTION VELOCITY (3 COLS) */}
      <div
        onClick={() => onNavigate('/roadmap')}
        className="md:col-span-3 atelier-glass-card p-6 flex flex-col justify-between space-y-4 cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Compass className="w-4 h-4" />
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>

        <div>
          <div className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight">
            {isRoadmapInitialized ? `${roadmapProgress}%` : '—'}
          </div>
          <h4 className="text-xs font-semibold text-slate-200 mt-1">Roadmap Progress</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isRoadmapInitialized ? 'Milestones on track' : 'Roadmap waiting for generation'}
          </p>
        </div>

        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span>{isRoadmapInitialized ? 'Active curriculum' : 'Not started'}</span>
          <span className="text-emerald-400 font-medium">View Plan</span>
        </div>
      </div>
    </div>
  );
};
