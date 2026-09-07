import React from 'react';
import { motion } from 'framer-motion';

export interface PremiumSectionProps {
  title: string;
  subtitle?: string;
  badge?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const PremiumSection: React.FC<PremiumSectionProps> = ({
  title,
  subtitle,
  badge,
  headerAction,
  children,
  className = '',
}) => {
  return (
    <section className={`space-y-5 ${className}`}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {badge && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                {badge}
              </span>
            )}
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
              {title}
            </h2>
          </div>
          {subtitle && <p className="text-xs sm:text-sm text-slate-400">{subtitle}</p>}
        </div>

        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      {/* Section Body */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    </section>
  );
};
