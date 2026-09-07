import React from 'react';
import { Card } from '../../../components/base/Card';
import { Badge } from '../../../components/base/Badge';
import { Button } from '../../../components/base/Button';
import { Icon } from '../../../components/primitives/Icon';

export type PeriodType = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface AnalyticsWorkspaceHeaderProps {
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  onExport?: () => void;
}

export const AnalyticsWorkspaceHeader: React.FC<AnalyticsWorkspaceHeaderProps> = ({
  period,
  onPeriodChange,
  onExport,
}) => {
  const periods: { id: PeriodType; label: string }[] = [
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'quarterly', label: 'Quarterly' },
    { id: 'yearly', label: 'Yearly' },
  ];

  return (
    <Card variant="elevated" className="p-6 md:p-8 bg-gradient-to-r from-[var(--color-bg-surface-raised)] to-[var(--color-bg-surface)] border-[var(--color-border-default)]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2">
            <Badge variant="subtle" color="primary" icon={
              <Icon size="sm">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </Icon>
            }>
              Progress Intelligence
            </Badge>
            <Badge variant="outlined" color="ai">
              Empirical Analytics
            </Badge>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold font-display text-[var(--color-text-primary)] tracking-tight">
            Growth & Performance Intelligence
          </h1>

          <p className="text-xs md:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Deterministic progress tracking derived from verified platform data. Evaluate your skill growth velocity, readiness trends, and milestone velocity over time.
          </p>
        </div>

        {/* Action Controls: Period Selector + Export */}
        <div className="flex items-center gap-3 self-stretch md:self-auto shrink-0 justify-between md:justify-end">
          <div className="flex bg-[var(--color-bg-surface-sunken)] p-1 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]">
            {periods.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPeriodChange(p.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-colors cursor-pointer ${
                  period === p.id
                    ? 'bg-[var(--color-interactive-primary)] text-[var(--color-text-on-primary)] shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={onExport || (() => window.print())}
            leftIcon={
              <Icon size="sm">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </Icon>
            }
          >
            Export Report
          </Button>
        </div>
      </div>
    </Card>
  );
};

AnalyticsWorkspaceHeader.displayName = 'AnalyticsWorkspaceHeader';
