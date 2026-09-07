import React from 'react';
import { Sparkles, Zap, Clock, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { SpotlightCard } from '../cards/SpotlightCard';
import { Button } from '../../base/Button';

export interface PriorityItem {
  _id?: string;
  title: string;
  category: string;
  priority: 'high' | 'medium' | 'critical' | 'low' | string;
  reason?: string;
  impact?: number;
  estimatedTime?: string;
  status?: string;
}

export interface AIPrioritiesPanelProps {
  priorities?: PriorityItem[];
  onExecute?: (item: PriorityItem) => void;
  className?: string;
}

export const AIPrioritiesPanel: React.FC<AIPrioritiesPanelProps> = ({
  priorities = [],
  onExecute,
  className = '',
}) => {
  const activePriorities = priorities.slice(0, 3);

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    }
  };

  return (
    <SpotlightCard className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              AI Action Priorities
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Highest impact steps synthesized by your Career Architect
            </p>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold">
          {activePriorities.length} Active
        </span>
      </div>

      {/* Content */}
      {activePriorities.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-dashed border-neutral-200 dark:border-neutral-800">
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
          <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            All High Priorities Addressed
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            Your career recommendations are fully up to date. Keep advancing your learning roadmap to generate new milestones.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activePriorities.map((item, index) => (
            <div
              key={item._id || index}
              className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 hover:border-indigo-500/40 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityBadgeClass(
                        item.priority
                      )}`}
                    >
                      {item.priority} Priority
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {item.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {item.title}
                  </h4>
                  {item.reason && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                      {item.reason}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-[11px] text-neutral-500 dark:text-neutral-400 pt-1">
                    {item.estimatedTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        {item.estimatedTime}
                      </span>
                    )}
                    {item.impact && (
                      <span className="flex items-center gap-1 font-semibold text-emerald-500">
                        <Zap className="w-3 h-3" />
                        +{item.impact}% Impact
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExecute?.(item)}
                  className="shrink-0 text-xs gap-1"
                >
                  <span>Execute</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </SpotlightCard>
  );
};

export default AIPrioritiesPanel;
