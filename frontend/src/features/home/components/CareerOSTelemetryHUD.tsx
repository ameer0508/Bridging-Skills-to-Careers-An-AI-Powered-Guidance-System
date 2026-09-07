import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

interface CareerOSTelemetryHUDProps {
  userName?: string;
  targetRole?: string;
  readinessScore?: number;
  matchScore?: number;
  totalSkills?: number;
  activePhaseTitle?: string;
  hasData: boolean;
  onPrimaryAction: () => void;
}

export const CareerOSTelemetryHUD: React.FC<CareerOSTelemetryHUDProps> = ({
  userName = 'Developer',
  targetRole = 'Target Career Blueprint',
  readinessScore,
  matchScore,
  totalSkills = 0,
  activePhaseTitle,
  hasData,
  onPrimaryAction,
}) => {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-slate-950/80 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
      {/* Ambient Radial Lights */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-linear-to-bl from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-linear-to-tr from-cyan-500/20 via-indigo-500/10 to-transparent blur-3xl" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Greeting & Status */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono font-bold text-indigo-300 tracking-wider uppercase">
              {hasData ? 'CareerOS Telemetry Active' : 'Profile Initialization Mode'}
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Welcome Back, <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-purple-300 to-cyan-400">{userName}</span>.
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Target Blueprint: <span className="text-cyan-300 font-bold">{targetRole}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-slate-400">
            {readinessScore !== undefined && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Readiness: {readinessScore}%</span>
              </span>
            )}
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-white/10">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>{totalSkills} Vector Skills</span>
            </span>
          </div>
        </div>

        {/* Right Column: Key Metric Matrix & CTA */}
        <div className="lg:col-span-5 flex flex-col items-start lg:items-end justify-between gap-4">
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 text-center space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                Match Rate
              </span>
              <span className="font-display text-xl sm:text-2xl font-bold text-cyan-400">
                {matchScore !== undefined ? `${matchScore}%` : 'Pending'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 text-center space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                Current Phase
              </span>
              <span className="font-display text-xl sm:text-2xl font-bold text-indigo-400 truncate block">
                {activePhaseTitle ? activePhaseTitle.split(':')[0] : 'Phase 1'}
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPrimaryAction}
            className="w-full py-3 px-5 rounded-xl font-bold text-xs text-white bg-linear-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>{hasData ? 'Open Active Milestone Roadmap' : 'Upload Resume to Activate AI'}</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default CareerOSTelemetryHUD;
