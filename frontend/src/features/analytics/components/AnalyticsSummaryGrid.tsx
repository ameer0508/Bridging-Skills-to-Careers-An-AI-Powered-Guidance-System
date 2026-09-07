import React from 'react';
import { Card } from '../../../components/base/Card';
import { Icon } from '../../../components/primitives/Icon';

export interface MetricsSummaryData {
  currentMetrics: {
    averageReadinessScore: number;
    totalSkills: number;
    totalGaps: number;
    completedRoadmapItems: number;
  };
  trends: {
    readinessGrowth: number;
    skillsAdded: number;
    gapsClosed: number;
    itemsCompleted: number;
  };
}

export const AnalyticsSummaryGrid: React.FC<MetricsSummaryData> = ({
  currentMetrics,
  trends,
}) => {
  const readinessIsPositive = trends.readinessGrowth >= 0;
  const skillsIsPositive = trends.skillsAdded >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Avg Readiness Score */}
      <Card variant="default" className="p-5 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider block mb-1">
            Avg Readiness Score
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-[var(--color-text-primary)]">
              {currentMetrics.averageReadinessScore}%
            </span>
            <span
              className={`text-xs font-bold ${
                readinessIsPositive
                  ? 'text-[var(--color-status-success-text)]'
                  : 'text-[var(--color-status-error-text)]'
              }`}
            >
              {readinessIsPositive ? '↑' : '↓'} {Math.abs(trends.readinessGrowth)}%
            </span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[hsl(226,84%,57%,0.10)] border border-[hsl(226,84%,57%,0.20)] text-[var(--color-interactive-primary)] flex items-center justify-center shrink-0">
          <Icon size="md">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </Icon>
        </div>
      </Card>

      {/* 2. Total Verified Skills */}
      <Card variant="default" className="p-5 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider block mb-1">
            Total Verified Skills
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-[var(--color-text-primary)]">
              {currentMetrics.totalSkills}
            </span>
            <span
              className={`text-xs font-bold ${
                skillsIsPositive
                  ? 'text-[var(--color-status-success-text)]'
                  : 'text-[var(--color-status-error-text)]'
              }`}
            >
              {skillsIsPositive ? '↑' : '↓'} {Math.abs(trends.skillsAdded)}
            </span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-status-success-bg)] border border-[var(--color-status-success-border)] text-[var(--color-status-success-text)] flex items-center justify-center shrink-0">
          <Icon size="md">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          </Icon>
        </div>
      </Card>

      {/* 3. Critical Gaps Remaining */}
      <Card variant="default" className="p-5 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider block mb-1">
            Gaps Remaining
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-[var(--color-text-primary)]">
              {currentMetrics.totalGaps}
            </span>
            <span className="text-xs font-bold text-[var(--color-status-success-text)]">
              Closed {trends.gapsClosed}
            </span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-status-warning-bg)] border border-[var(--color-status-warning-border)] text-[var(--color-status-warning-text)] flex items-center justify-center shrink-0">
          <Icon size="md">
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </Icon>
        </div>
      </Card>

      {/* 4. Completed Roadmap Actions */}
      <Card variant="default" className="p-5 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider block mb-1">
            Completed Actions
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-[var(--color-text-primary)]">
              {currentMetrics.completedRoadmapItems}
            </span>
            <span className="text-xs font-bold text-[var(--color-ai-text)]">
              +{trends.itemsCompleted} period
            </span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-ai-accent-subtle)] border border-[hsl(185,66%,57%,0.20)] text-[var(--color-ai-accent)] flex items-center justify-center shrink-0">
          <Icon size="md">
            <polyline points="20 6 9 17 4 12" />
          </Icon>
        </div>
      </Card>
    </div>
  );
};

AnalyticsSummaryGrid.displayName = 'AnalyticsSummaryGrid';
