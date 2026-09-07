import React from 'react';
import { Card, CardHeader, CardBody } from '../../../components/base/Card';
import { Badge } from '../../../components/base/Badge';
import { Icon } from '../../../components/primitives/Icon';

export interface AnalyticsInsight {
  _id: string;
  type: 'growth' | 'achievement' | 'advisory' | string;
  title: string;
  description: string;
}

export interface ProgressInsightsPanelProps {
  insights: AnalyticsInsight[];
}

export const ProgressInsightsPanel: React.FC<ProgressInsightsPanelProps> = ({ insights }) => {
  return (
    <Card variant="default" className="flex flex-col h-full">
      <CardHeader className="mb-4">
        <h3 className="text-base font-bold font-display text-[var(--color-text-primary)] flex items-center gap-2">
          <Icon size="sm" className="text-[var(--color-ai-accent)]">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
          </Icon>
          Empirical Insights
        </h3>
      </CardHeader>

      <CardBody className="flex-1 overflow-y-auto max-h-72 space-y-3 custom-scrollbar pr-1">
        {insights.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--color-text-tertiary)] italic">
            Not enough historical data to synthesize insights yet. Check back after completing roadmap actions.
          </div>
        ) : (
          insights.map(ins => {
            const badgeColor =
              ins.type === 'growth'
                ? 'success'
                : ins.type === 'achievement'
                  ? 'warning'
                  : 'ai';

            return (
              <div
                key={ins._id}
                className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-bg-surface-sunken)] border border-[var(--color-border-subtle)] space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="subtle" color={badgeColor} size="sm">
                    {ins.type}
                  </Badge>
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)] truncate">
                    {ins.title}
                  </h4>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {ins.description}
                </p>
              </div>
            );
          })
        )}
      </CardBody>
    </Card>
  );
};

ProgressInsightsPanel.displayName = 'ProgressInsightsPanel';
