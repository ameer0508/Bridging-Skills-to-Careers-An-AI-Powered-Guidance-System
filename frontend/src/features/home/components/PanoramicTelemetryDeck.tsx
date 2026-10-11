import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Target, Award, Cpu, ArrowUpRight, HelpCircle } from 'lucide-react';

export interface PanoramicTelemetryDeckProps {
  careerHealth: number | null;
  matchScore: number | null;
  isMatchEvaluated: boolean;
  readinessScore: number | null;
  isReadinessEvaluated: boolean;
  totalSkills: number;
  atsScore: number | null;
  targetRole: string;
  onNavigate: (route: string) => void;
}

export const PanoramicTelemetryDeck: React.FC<PanoramicTelemetryDeckProps> = ({
  careerHealth,
  matchScore,
  isMatchEvaluated,
  readinessScore,
  isReadinessEvaluated,
  totalSkills,
  atsScore,
  targetRole,
  onNavigate,
}) => {
  // Classification tier based on evaluated Career Health
  const healthTier = React.useMemo(() => {
    if (careerHealth === null) {
      return { label: 'CALIBRATING BASELINE', color: 'text-slate-400', bg: 'bg-slate-800/40', border: 'border-slate-700' };
    }
    if (careerHealth >= 80) {
      return { label: 'OPTIMIZED DEPLOYMENT', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    }
    if (careerHealth >= 60) {
      return { label: 'TACTICAL MOMENTUM', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' };
    }
    if (careerHealth >= 40) {
      return { label: 'FOUNDATION BUILDING', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    }
    return { label: 'DEVELOPING PROFILE', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' };
  }, [careerHealth]);

  const healthPercentage = careerHealth ?? 0;
  const strokeDashoffset = 251.2 - (251.2 * healthPercentage) / 100;

  return (
    <div className="hcc-panel hcc-panel-tactical p-6 rounded-2xl border border-white/10 bg-linear-to-b from-[#0e1524] to-[#090d16] shadow-2xl relative">
      {/* DECK HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-white/5 mb-6 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-slate-400 uppercase tracking-widest text-[11px] font-bold">
            Executive Career Signal
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-cyan-400 font-bold truncate max-w-[280px] sm:max-w-md">
            {targetRole || 'Target Career Not Specified'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span>WEIGHTED TELEMETRY ENGINE</span>
          <div className="group relative cursor-help">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200 transition-colors" />
            <div className="absolute right-0 top-6 w-64 p-2.5 rounded-lg bg-slate-900 border border-white/15 text-[11px] text-slate-300 font-sans shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
              <strong>Career Health Index:</strong> Readiness (30%), Match (25%), Skills & Resume Completeness (20%), Roadmap (15%), Interview Performance (10%).
            </div>
          </div>
        </div>
      </div>

      {/* THREE-COLUMN ASYMMETRIC PANORAMA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* LEFT: CAREER HEALTH ARC GAUGE (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950/60 border border-white/5 relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="text-slate-800 stroke-current"
                strokeWidth="7"
                fill="transparent"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-current text-emerald-400"
                strokeWidth="7"
                strokeDasharray="251.2"
                initial={{ strokeDashoffset: 251.2 }}
                animate={{ strokeDashoffset: careerHealth !== null ? strokeDashoffset : 251.2 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black font-mono text-white tracking-tight">
                {careerHealth !== null ? `${careerHealth}%` : '—'}
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Health Index
              </span>
            </div>
          </div>

          <div className="mt-3 text-center space-y-1">
            <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${healthTier.bg} ${healthTier.color} ${healthTier.border}`}>
              {healthTier.label}
            </span>
            <p className="text-[11px] text-slate-400 max-w-[200px] leading-tight">
              {careerHealth !== null
                ? 'Composite career operational readiness rating'
                : 'Awaiting sufficient skill & resume data for baseline'}
            </p>
          </div>
        </div>

        {/* CENTER: DUAL BENCHMARK MONITORS (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          {/* TARGET PATH MATCH RATE */}
          <div
            onClick={() => onNavigate('/careers')}
            className="p-4 rounded-xl bg-slate-950/60 border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200 font-mono">Target Path Match Rate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black font-mono text-cyan-300">
                  {isMatchEvaluated && matchScore !== null ? `${matchScore}%` : 'Awaiting Profile'}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </div>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-linear-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700"
                style={{ width: `${isMatchEvaluated && matchScore !== null ? matchScore : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1.5">
              <span>Vector Distance: {isMatchEvaluated ? 'Calibrated' : 'Pending Vector Extraction'}</span>
              <span>Requirements Fit</span>
            </div>
          </div>

          {/* CAREER READINESS SCORE */}
          <div
            onClick={() => onNavigate('/readiness')}
            className="p-4 rounded-xl bg-slate-950/60 border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-slate-200 font-mono">Career Readiness Score</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black font-mono text-purple-300">
                  {isReadinessEvaluated && readinessScore !== null ? `${readinessScore}%` : 'Unevaluated'}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-colors" />
              </div>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-linear-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700"
                style={{ width: `${isReadinessEvaluated && readinessScore !== null ? readinessScore : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1.5">
              <span>Market Baseline: {isReadinessEvaluated ? 'Benchmark Computed' : 'Awaiting Signals'}</span>
              <span>Readiness Level</span>
            </div>
          </div>
        </div>

        {/* RIGHT: SIGNAL MOMENTUM MATRIX (3 COLS) */}
        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-3">
          {/* VERIFIED SKILLS */}
          <div
            onClick={() => onNavigate('/skills')}
            className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Verified Skills
              </span>
              <strong className="text-lg font-black font-mono text-white group-hover:text-cyan-300 transition-colors">
                {totalSkills}
              </strong>
            </div>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>

          {/* ATS SCORE */}
          <div
            onClick={() => onNavigate('/resume')}
            className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Resume ATS Index
              </span>
              <strong className="text-lg font-black font-mono text-emerald-400">
                {atsScore !== null ? `${atsScore}/100` : 'No Resume'}
              </strong>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
