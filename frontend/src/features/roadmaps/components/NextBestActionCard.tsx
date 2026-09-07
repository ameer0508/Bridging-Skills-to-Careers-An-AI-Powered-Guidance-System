import React from 'react';
import { Card } from '../../../components/base/Card';
import { Badge } from '../../../components/base/Badge';
import { Button } from '../../../components/base/Button';
import { Icon } from '../../../components/primitives/Icon';

export interface NextBestActionProps {
  itemId: string;
  title: string;
  category: string;
  priority: string;
  estimatedDuration: string;
  difficulty: string;
  careerRelevance?: string;
  expectedOutcome?: string;
  prerequisites?: string[];
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  onMarkDone: (id: string) => void;
  onStart: (id: string) => void;
}

export const NextBestActionCard: React.FC<NextBestActionProps> = ({
  itemId,
  title,
  category,
  priority,
  estimatedDuration,
  difficulty,
  careerRelevance,
  expectedOutcome,
  prerequisites = [],
  status,
  onMarkDone,
  onStart,
}) => {
  const priorityColor = priority === 'High' || priority === 'Highest' ? 'warning' : 'info';

  return (
    <Card variant="elevated" className="relative overflow-hidden bg-gradient-to-br from-[var(--color-bg-surface-raised)] to-[var(--color-bg-surface)] border-[var(--color-interactive-primary)]/40 p-6 shadow-[var(--shadow-glow-primary)]">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="filled" color="primary" icon={
            <Icon size="sm">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </Icon>
          }>
            Focus Today (Next Best Action)
          </Badge>
          <Badge variant="outlined" color={priorityColor}>
            {priority} Priority
          </Badge>
        </div>
        <span className="text-xs font-semibold text-[var(--color-text-tertiary)]">
          Est. {estimatedDuration} • {difficulty}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider block">
            {category}
          </span>
          <h3 className="text-xl font-bold font-display text-[var(--color-text-primary)] mt-0.5">
            {title}
          </h3>
        </div>

        {careerRelevance && (
          <div className="p-3 bg-[var(--color-bg-surface-sunken)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] text-xs text-[var(--color-text-secondary)] leading-relaxed">
            <strong className="text-[var(--color-text-primary)] block mb-0.5">Career Relevance:</strong>
            {careerRelevance}
          </div>
        )}

        {expectedOutcome && (
          <div className="text-xs text-[var(--color-status-success-text)] font-medium flex items-center gap-1.5">
            <Icon size="sm">
              <polyline points="20 6 9 17 4 12" />
            </Icon>
            <span>Expected Outcome: {expectedOutcome}</span>
          </div>
        )}

        {prerequisites.length > 0 && (
          <div className="text-xs text-[var(--color-text-tertiary)]">
            <span className="font-semibold text-[var(--color-status-warning-text)]">Prerequisites Met: </span>
            {prerequisites.join(', ')}
          </div>
        )}

        <div className="pt-2 flex items-center justify-between border-t border-[var(--color-border-subtle)]">
          <span className="text-xs text-[var(--color-text-tertiary)] font-medium">
            Status: <strong className="text-[var(--color-interactive-primary)] font-semibold uppercase text-[10px]">{status.replace('_', ' ')}</strong>
          </span>

          <div className="flex items-center gap-2">
            {status === 'not_started' && (
              <Button variant="secondary" size="sm" onClick={() => onStart(itemId)}>
                Start Learning
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={() => onMarkDone(itemId)}>
              Mark Completed
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

NextBestActionCard.displayName = 'NextBestActionCard';
