import React from 'react';
import { motion } from 'framer-motion';
import { Mic, ArrowRight, Activity, Play } from 'lucide-react';
import { MagneticButton } from './MagneticButton';

export interface SpatialInterviewChamberProps {
  interviews: {
    total: number;
    completed: number;
    averageScore: number | null;
    latestScore: number | null;
    isEvaluated: boolean;
    latestWeaknesses?: string[];
  };
  onNavigate: (route: string) => void;
}

export const SpatialInterviewChamber: React.FC<SpatialInterviewChamberProps> = ({
  interviews,
  onNavigate,
}) => {
  const safeInterviews = interviews || {
    total: 0,
    completed: 0,
    averageScore: null,
    latestScore: null,
    isEvaluated: false,
    latestWeaknesses: [],
  };

  const displayScore = safeInterviews.averageScore !== null ? Math.round(safeInterviews.averageScore) : null;
  const strokeDash = displayScore !== null ? (displayScore / 100) * 251 : 0; // r=40 -> 2*PI*40 = 251.3

  // Simulated audio waveform frequencies for the AI coaching chamber
  const waveformHeights = [14, 28, 42, 22, 38, 52, 30, 18, 46, 32, 24, 48, 16, 34, 44, 20];

  return (
    <div className="spatial-glass-blade p-6 sm:p-10 space-y-8 relative overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-white/[0.06] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-cyan-300 font-semibold">
              Simulation Chamber
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Interview Preparation
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Real-time vocal and architectural practice chamber with AI interview agents.
          </p>
        </div>

        <MagneticButton
          onClick={() => onNavigate('/interview-agent')}
          className="catalyst-magnetic-btn group text-xs py-2.5 px-5 self-start sm:self-center shadow-[0_0_25px_rgba(245,158,11,0.3)]"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Open Interview Studio</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </MagneticButton>
      </div>

      {/* The Acoustic Chamber Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left: Waveform Soundstage */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-black/40 border border-white/[0.06] flex flex-col justify-between space-y-6 relative overflow-hidden">
          {/* Subtle Ambient Acoustic Pulse */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
              <Mic className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Acoustic Telemetry Channel</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              FREQUENCY: 44.1 kHz
            </span>
          </div>

          {/* Animated Equalizer Waveform */}
          <div className="h-24 flex items-end justify-center gap-1.5 sm:gap-2 px-4">
            {waveformHeights.map((h, i) => (
              <motion.div
                key={i}
                animate={{
                  height: [h, Math.max(8, (h * 1.5) % 64), h * 0.7, h],
                }}
                transition={{
                  duration: 1.2 + (i % 5) * 0.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-2 sm:w-2.5 rounded-full bg-gradient-to-t from-cyan-500/40 via-cyan-400 to-amber-300/80 shadow-[0_0_10px_rgba(34,211,238,0.4)]"
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 border-t border-white/[0.05] pt-4">
            <div className="flex items-center gap-4">
              <span>
                Simulations Conducted: <strong className="text-white">{safeInterviews.total}</strong>
              </span>
              <span>•</span>
              <span>
                Completed Rounds: <strong className="text-emerald-400">{safeInterviews.completed}</strong>
              </span>
            </div>
            {safeInterviews.latestScore !== null && (
              <span className="text-amber-300 font-mono">
                Latest Score: {Math.round(safeInterviews.latestScore)}%
              </span>
            )}
          </div>
        </div>

        {/* Right: Circular Competency Gauge & Diagnostics */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-black/40 border border-white/[0.06] flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Readiness Gauge</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {safeInterviews.isEvaluated ? 'BENCHMARKED' : 'PENDING'}
            </span>
          </div>

          {/* Circular Score Instrument */}
          <div className="flex items-center justify-center relative py-2">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#interviewGaugeGradient)"
                  strokeWidth="8"
                  strokeDasharray="251.3"
                  strokeDashoffset={251.3 - strokeDash}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="interviewGaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-white tracking-tight">
                  {displayScore !== null ? `${displayScore}%` : '—'}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-mono">
                  {displayScore !== null ? 'Avg Score' : 'Awaiting'}
                </span>
              </div>
            </div>
          </div>

          {/* Coaching Diagnostics */}
          <div className="space-y-1.5 text-xs">
            {safeInterviews.latestWeaknesses && safeInterviews.latestWeaknesses.length > 0 ? (
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase">Focus Area:</span>
                <p className="text-slate-300 font-medium truncate">
                  {safeInterviews.latestWeaknesses[0]}
                </p>
              </div>
            ) : (
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Enter the simulation chamber to stress-test your communication, system design, and algorithmic reasoning.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
