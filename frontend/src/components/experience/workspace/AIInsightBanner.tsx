import React from 'react';
import { motion } from 'framer-motion';
import { Brain, AlertTriangle, CheckCircle2, ArrowRight, ShieldAlert } from 'lucide-react';

export type InsightPriority = 'critical' | 'high' | 'medium' | 'info';

export interface AIInsightBannerProps {
  title: string;
  description: string;
  confidence?: number;
  priority?: InsightPriority;
  evidence?: string[];
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const AIInsightBanner: React.FC<AIInsightBannerProps> = ({
  title,
  description,
  confidence = 98.4,
  priority = 'high',
  evidence = [],
  actionLabel,
  onAction,
  className = '',
}) => {
  const getPriorityStyle = () => {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-rose-950/40 border-rose-500/40',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
          glow: 'from-rose-500/20 to-indigo-500/10',
        };
      case 'high':
        return {
          bg: 'bg-indigo-950/40 border-indigo-500/40',
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          icon: <Brain className="w-5 h-5 text-indigo-400 animate-pulse" />,
          glow: 'from-indigo-500/20 to-cyan-500/10',
        };
      case 'medium':
        return {
          bg: 'bg-amber-950/40 border-amber-500/40',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          glow: 'from-amber-500/20 to-purple-500/10',
        };
      case 'info':
      default:
        return {
          bg: 'bg-cyan-950/40 border-cyan-500/40',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          icon: <CheckCircle2 className="w-5 h-5 text-cyan-400" />,
          glow: 'from-cyan-500/20 to-indigo-500/10',
        };
    }
  };

  const style = getPriorityStyle();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl p-5 sm:p-6 ${style.bg} ${className}`}
    >
      {/* Background Glow */}
      <div className={`absolute inset-0 bg-linear-to-r ${style.glow} opacity-60 pointer-events-none`} />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/10 shrink-0">
            {style.icon}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase tracking-wider ${style.badge}`}>
                {priority} Priority
              </span>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3 h-3" /> {confidence}% Confidence
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              {description}
            </p>

            {/* Evidence Tags */}
            {evidence.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {evidence.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-md bg-slate-950/80 border border-white/10 text-[11px] text-slate-300 font-mono"
                  >
                    • {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Action */}
        {actionLabel && onAction && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAction}
            className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};
