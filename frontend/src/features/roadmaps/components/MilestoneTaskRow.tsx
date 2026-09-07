import React from 'react';
import { Badge } from '../../../components/base/Badge';
import { Button } from '../../../components/base/Button';
import { Checkbox } from '../../../components/base/Checkbox';
import { Icon } from '../../../components/primitives/Icon';

export interface MilestoneTaskRowProps {
  itemId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  estimatedDuration: string;
  difficulty: string;
  prerequisites?: string[];
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  onStatusChange: (itemId: string, newStatus: string) => void;
}

export const MilestoneTaskRow: React.FC<MilestoneTaskRowProps> = ({
  itemId,
  title,
  description,
  category,
  priority,
  estimatedDuration,
  difficulty,
  prerequisites = [],
  status,
  onStatusChange,
}) => {
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';

  return (
    <div
      className={`p-4 rounded-[var(--radius-lg)] border transition-all duration-[var(--duration-fast)] ${
        isCompleted
          ? 'bg-[var(--color-status-success-bg)]/30 border-[var(--color-status-success-border)]/50 opacity-80'
          : isInProgress
            ? 'bg-[var(--color-interactive-primary)]/5 border-[var(--color-interactive-primary)]/30 shadow-sm'
            : 'bg-[var(--color-bg-surface-sunken)] border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="pt-0.5">
          <Checkbox
            checked={isCompleted}
            onChange={() => onStatusChange(itemId, isCompleted ? 'not_started' : 'completed')}
            aria-label={`Mark ${title} as ${isCompleted ? 'incomplete' : 'completed'}`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-[var(--color-text-tertiary)] tracking-wider">
                {category}
              </span>
              <Badge
                variant="subtle"
                color={isCompleted ? 'success' : isInProgress ? 'primary' : 'default'}
                size="sm"
              >
                {status.replace('_', ' ')}
              </Badge>
              {priority && (
                <Badge variant="outlined" color={priority === 'High' || priority === 'Highest' ? 'warning' : 'info'} size="sm">
                  {priority}
                </Badge>
              )}
            </div>

            <span className="text-[10px] text-[var(--color-text-tertiary)] font-medium">
              {estimatedDuration} • {difficulty}
            </span>
          </div>

          <h4
            className={`text-sm font-bold ${
              isCompleted
                ? 'line-through text-[var(--color-text-tertiary)]'
                : 'text-[var(--color-text-primary)]'
            }`}
          >
            {title}
          </h4>

          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
            {description}
          </p>

          {prerequisites.length > 0 && (
            <div className="text-[10px] text-[var(--color-text-tertiary)] pt-1">
              <span className="font-semibold text-[var(--color-status-warning-text)]">Requires: </span>
              {prerequisites.join(', ')}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-1.5 self-center">
          {!isCompleted && !isInProgress && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onStatusChange(itemId, 'in_progress')}
            >
              Start
            </Button>
          )}

          {!isCompleted && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onStatusChange(itemId, 'completed')}
            >
              Done
            </Button>
          )}

          {isCompleted && (
            <span className="text-xs text-[var(--color-status-success-text)] font-semibold flex items-center gap-1">
              <Icon size="sm">
                <polyline points="20 6 9 17 4 12" />
              </Icon>
              Completed
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

MilestoneTaskRow.displayName = 'MilestoneTaskRow';
