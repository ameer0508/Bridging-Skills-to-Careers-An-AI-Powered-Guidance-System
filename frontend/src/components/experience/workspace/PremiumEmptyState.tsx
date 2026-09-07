import React from 'react';
import { motion } from 'framer-motion';
import { Plus, FolderPlus } from 'lucide-react';
import { GlassPanel } from './GlassPanel';

export interface PremiumEmptyStateProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const PremiumEmptyState: React.FC<PremiumEmptyStateProps> = ({
  title,
  description,
  icon: Icon = FolderPlus,
  primaryAction,
  secondaryAction,
  className = '',
}) => {
  return (
    <GlassPanel className={`p-8 sm:p-12 text-center flex flex-col items-center justify-center ${className}`}>
      {/* Animated Floating AI Icon Container */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="w-16 h-16 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-950/50 mb-5"
      >
        <Icon className="w-8 h-8" />
      </motion.div>

      <div className="max-w-md space-y-2 mb-6">
        <h3 className="font-display text-xl font-bold text-white tracking-tight">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {primaryAction && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={primaryAction.onClick}
            className="py-2.5 px-5 rounded-xl bg-linear-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{primaryAction.label}</span>
          </motion.button>
        )}

        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="py-2.5 px-4 rounded-xl bg-slate-950/80 border border-white/10 hover:border-white/20 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </GlassPanel>
  );
};
