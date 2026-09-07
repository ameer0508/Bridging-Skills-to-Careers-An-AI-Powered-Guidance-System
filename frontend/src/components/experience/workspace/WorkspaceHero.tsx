import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowUpRight, TrendingUp, ShieldCheck } from 'lucide-react';
import { TiltCard } from '../../../features/landing/components/effects/TiltCard';

export interface QuickStat {
  label: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
}

export interface WorkspaceHeroProps {
  greeting?: string;
  userName?: string;
  title: string;
  description: string;
  aiSummary?: string;
  stats?: QuickStat[];
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const WorkspaceHero: React.FC<WorkspaceHeroProps> = ({
  greeting = 'Welcome back',
  userName,
  title,
  description,
  aiSummary,
  stats = [],
  primaryAction,
  className = '',
}) => {
  return (
    <TiltCard glowColor="rgba(99, 102, 241, 0.25)" className={`p-6 sm:p-8 md:p-10 ${className}`}>
      {/* Background Gradient Mesh */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-linear-to-br from-indigo-500/20 via-purple-500/10 to-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* Left Column: Greeting & Summary */}
        <div className="space-y-4 max-w-2xl">
          {/* Eyebrow greeting */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{greeting}{userName ? `, ${userName}` : ''}</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">OS v1.0 Sync</span>
          </div>

          {/* Main Title */}
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {title}
          </h1>

          {/* Subtitle description */}
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {description}
          </p>

          {/* AI Summary Banner */}
          {aiSummary && (
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/10 flex items-center gap-3 text-xs text-slate-200">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="font-medium flex-1">{aiSummary}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
          )}
        </div>

        {/* Right Column: Quick Stats & Primary Action */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-4 shrink-0">
          {stats.length > 0 && (
            <div className="grid grid-cols-2 gap-3 min-w-60">
              {stats.map((stat, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 flex flex-col">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <span className="text-xl font-bold text-white font-mono mt-1">
                    {stat.value}
                  </span>
                  {stat.change && (
                    <span className={`text-[10px] flex items-center gap-1 mt-1 font-semibold ${stat.isPositive !== false ? 'text-emerald-400' : 'text-rose-400'}`}>
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {primaryAction && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={primaryAction.onClick}
              className="py-3 px-5 rounded-xl bg-linear-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 font-semibold text-xs text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>{primaryAction.label}</span>
              <ArrowUpRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    </TiltCard>
  );
};
