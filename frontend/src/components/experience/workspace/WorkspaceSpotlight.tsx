import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import { TiltCard } from '../../../features/landing/components/effects/TiltCard';

export interface WorkspaceSpotlightProps {
  badge?: string;
  title: string;
  description: string;
  impactScore?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const WorkspaceSpotlight: React.FC<WorkspaceSpotlightProps> = ({
  badge = 'Critical Recommendation Spotlight',
  title,
  description,
  impactScore = '+12% Career Match Increase',
  actionLabel = 'Execute Action Plan',
  onAction,
  className = '',
}) => {
  return (
    <TiltCard glowColor="rgba(14, 165, 233, 0.25)" className={`p-6 sm:p-8 ${className}`}>
      {/* Background Animated Gradient Pulse */}
      <div className="absolute -inset-1 rounded-2xl bg-linear-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 opacity-70 blur-xl animate-pulse pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{badge}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold">
              {impactScore}
            </span>
          </div>

          <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
            {title}
          </h3>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            {description}
          </p>
        </div>

        {actionLabel && onAction && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onAction}
            className="py-3 px-6 rounded-xl bg-linear-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 font-bold text-xs text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>{actionLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </TiltCard>
  );
};
