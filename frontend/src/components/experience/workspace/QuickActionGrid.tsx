import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export interface ActionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  shortcut?: string;
  onClick: () => void;
  color?: string;
}

export interface QuickActionGridProps {
  actions: ActionItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({
  actions,
  columns = 3,
  className = '',
}) => {
  const getColClass = () => {
    switch (columns) {
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      case 3:
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  };

  return (
    <div className={`grid ${getColClass()} gap-4 ${className}`}>
      {actions.map((action, idx) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.06, duration: 0.4 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={action.onClick}
            className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-white/20 backdrop-blur-xl text-left transition-all duration-300 group flex items-start justify-between cursor-pointer"
          >
            <div className="space-y-3">
              <div
                className={`w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-white/10 ${
                  action.color || 'text-cyan-400'
                } group-hover:scale-110 transition-transform`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                  <span>{action.title}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">{action.subtitle}</p>
              </div>
            </div>

            {action.shortcut && (
              <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400">
                {action.shortcut}
              </kbd>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
