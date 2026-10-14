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
  confidence,
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
          bg: 'bg-rose-50 border-rose-200',
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <ShieldAlert className="w-5 h-5 text-rose-700" />,
          glow: 'from-rose-500/20 to-indigo-500/10',
        };
      case 'high':
        return {
          bg: 'bg-violet-50 border-aurora-violet/25',
          badge: 'bg-aurora-violet/[0.06] text-aurora-indigo border-aurora-violet/25',
          icon: <Brain className="w-5 h-5 text-aurora-indigo animate-pulse" />,
          glow: 'from-indigo-500/20 to-cyan-500/10',
        };
      case 'medium':
        return {
          bg: 'bg-amber-50 border-amber-200',
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <AlertTriangle className="w-5 h-5 text-amber-700" />,
          glow: 'from-amber-500/20 to-purple-500/10',
        };
      case 'info':
      default:
        return {
          bg: 'bg-cyan-50 border-aurora-violet/25',
          badge: 'bg-aurora-violet/[0.06] text-aurora-violet border-aurora-violet/25',
          icon: <CheckCircle2 className="w-5 h-5 text-aurora-violet" />,
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
          <div className="p-2.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line shrink-0">
            {style.icon}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${style.badge}`}>
                {priority} Priority
              </span>
              <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3 h-3" /> {typeof confidence === 'number' ? `${confidence}% of matched skills shown in a role or project` : 'From your resume evidence'}
              </span>
            </div>
            <h3 className="text-base font-bold text-aurora-ink tracking-tight">{title}</h3>
            <p className="text-xs sm:text-sm text-aurora-muted leading-relaxed max-w-2xl">
              {description}
            </p>

            {/* Evidence Tags */}
            {evidence.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {evidence.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-md bg-aurora-canvas/60 border border-aurora-line text-[11px] text-aurora-muted font-mono"
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
            className="py-2.5 px-4 rounded-xl bg-aurora-canvas hover:bg-white/20 border border-aurora-line text-xs font-semibold text-aurora-ink flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};
