import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Cpu, Activity, Zap, AlertCircle, ShieldCheck } from 'lucide-react';

export type AICoreState = 'IDLE' | 'ANALYZING' | 'RETRIEVING' | 'ORCHESTRATING' | 'GENERATING' | 'COMPLETED' | 'ERROR';

interface NeuralAICoreProps {
  state: AICoreState;
  targetRole: string;
  activeCareerDomain?: string;
  onClick?: () => void;
}

export const NeuralAICore: React.FC<NeuralAICoreProps> = ({
  state,
  targetRole,
  activeCareerDomain = 'Cross-Domain Technology',
  onClick,
}) => {
  const stateConfig: Record<
    AICoreState,
    {
      label: string;
      glowColor: string;
      borderColor: string;
      icon: React.ReactNode;
      speedClass: string;
      pulseClass: string;
    }
  > = {
    IDLE: {
      label: 'Core Synchronized',
      glowColor: 'rgba(6, 182, 212, 0.45)',
      borderColor: 'border-cyan-400/50',
      icon: <Sparkles className="w-8 h-8 text-aurora-violet" />,
      speedClass: 'animate-ring-cw',
      pulseClass: 'animate-neural-core',
    },
    ANALYZING: {
      label: 'Context Analysis',
      glowColor: 'rgba(139, 92, 246, 0.65)',
      borderColor: 'border-purple-400/70',
      icon: <Cpu className="w-8 h-8 text-aurora-violet animate-spin" />,
      speedClass: 'animate-ring-cw-fast',
      pulseClass: 'scale-105 filter drop-shadow-[0_0_35px_rgba(168,85,247,0.8)]',
    },
    RETRIEVING: {
      label: 'Retrieving Telemetry',
      glowColor: 'rgba(59, 130, 246, 0.65)',
      borderColor: 'border-blue-400/70',
      icon: <Activity className="w-8 h-8 text-sky-800 animate-pulse" />,
      speedClass: 'animate-ring-ccw',
      pulseClass: 'scale-105',
    },
    ORCHESTRATING: {
      label: 'Orchestrating Subsystems',
      glowColor: 'rgba(168, 85, 247, 0.75)',
      borderColor: 'border-purple-400/80',
      icon: <Zap className="w-8 h-8 text-aurora-violet animate-bounce" />,
      speedClass: 'animate-ring-cw-fast',
      pulseClass: 'scale-110 filter drop-shadow-[0_0_40px_rgba(168,85,247,0.9)]',
    },
    GENERATING: {
      label: 'Synthesizing Advisory',
      glowColor: 'rgba(6, 182, 212, 0.8)',
      borderColor: 'border-cyan-300',
      icon: <Sparkles className="w-8 h-8 text-aurora-violet animate-pulse" />,
      speedClass: 'animate-ring-cw-fast',
      pulseClass: 'scale-110 filter drop-shadow-[0_0_40px_rgba(34,211,238,0.95)]',
    },
    COMPLETED: {
      label: 'Orchestration Ready',
      glowColor: 'rgba(16, 185, 129, 0.55)',
      borderColor: 'border-emerald-400/60',
      icon: <ShieldCheck className="w-8 h-8 text-emerald-700" />,
      speedClass: 'animate-ring-cw',
      pulseClass: 'scale-100 filter drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]',
    },
    ERROR: {
      label: 'Degraded State',
      glowColor: 'rgba(239, 68, 68, 0.65)',
      borderColor: 'border-red-500/70',
      icon: <AlertCircle className="w-8 h-8 text-rose-700" />,
      speedClass: 'animate-ring-cw',
      pulseClass: 'scale-95',
    },
  };

  const current = stateConfig[state] || stateConfig.IDLE;

  return (
    <div
      onClick={onClick}
      className="relative flex flex-col items-center justify-center cursor-pointer select-none group"
    >
      {/* Outer Halo Flare */}
      <div
        className="absolute w-72 h-72 rounded-full pointer-events-none transition-all duration-700 blur-2xl"
        style={{ background: current.glowColor }}
      />

      {/* Layer 1: Outer Hexagonal Reticle SVG */}
      <svg
        className={`absolute w-64 h-64 pointer-events-none ${current.speedClass}`}
        viewBox="0 0 200 200"
      >
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
        <circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke="rgba(6, 182, 212, 0.25)"
          strokeWidth="1.5"
          strokeDasharray="16 32 8 16"
        />
        {/* Precision corner ticks */}
        <line x1="100" y1="4" x2="100" y2="14" stroke="rgba(6, 182, 212, 0.6)" strokeWidth="2" />
        <line x1="100" y1="186" x2="100" y2="196" stroke="rgba(6, 182, 212, 0.6)" strokeWidth="2" />
        <line x1="4" y1="100" x2="14" y2="100" stroke="rgba(6, 182, 212, 0.6)" strokeWidth="2" />
        <line x1="186" y1="100" x2="196" y2="100" stroke="rgba(6, 182, 212, 0.6)" strokeWidth="2" />
      </svg>

      {/* Layer 2: Counter-Rotating Secondary Flux Ring */}
      <svg
        className="absolute w-52 h-52 pointer-events-none animate-ring-ccw"
        viewBox="0 0 160 160"
      >
        <circle
          cx="80"
          cy="80"
          r="72"
          fill="none"
          stroke="rgba(139, 92, 246, 0.3)"
          strokeWidth="1.5"
          strokeDasharray="30 20 10 20"
        />
        <circle
          cx="80"
          cy="80"
          r="66"
          fill="none"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1"
          strokeDasharray="3 6"
        />
      </svg>

      {/* Layer 3: Central Physical Holographic Core Node */}
      <motion.div
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        className={`relative z-10 w-36 h-36 rounded-full p-[2px] transition-all duration-500 shadow-2xl ${current.pulseClass}`}
        style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.8), rgba(99, 102, 241, 0.8), rgba(168, 85, 247, 0.8))',
        }}
      >
        <div className="w-full h-full rounded-full bg-aurora-canvas/60 backdrop-blur-xl border border-aurora-line flex flex-col items-center justify-center p-3 text-center shadow-inner relative overflow-hidden">
          {/* Inner Light Reflection */}
          <div className="absolute top-0 inset-x-0 h-1/2 bg-linear-to-b from-white/15 to-transparent pointer-events-none rounded-t-full" />

          {/* Dynamic State Icon */}
          <div className="mb-1 relative z-10">{current.icon}</div>

          {/* Core Title */}
          <span className="font-display font-black text-[13px] text-aurora-ink tracking-wider uppercase">
            AI Core
          </span>

          {/* Subsystem State */}
          <span className="text-[10px] text-aurora-violet truncate max-w-[100px] block mt-0.5">
            {current.label}
          </span>
        </div>
      </motion.div>

      {/* State Badge & Target Career Ribbon below Core */}
      <div className="relative z-10 mt-5 flex flex-col items-center gap-1.5 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.04] border border-aurora-line backdrop-blur-md shadow-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-aurora-ink tracking-wide">{targetRole}</span>
          <span className="text-aurora-muted text-[10px]">|</span>
          <span className="text-aurora-muted text-[11px]">{activeCareerDomain}</span>
        </div>
      </div>
    </div>
  );
};

export default NeuralAICore;
