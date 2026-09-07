import React from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '../../../components/base/Card';
import { Badge } from '../../../components/base/Badge';
import { Button } from '../../../components/base/Button';
import { Icon } from '../../../components/primitives/Icon';
import { useNavigate } from 'react-router-dom';

export interface RecommendationSummaryProps {
  title?: string;
  category?: string;
  priority?: string;
  reason?: string;
  impactScore?: number;
  estimatedTime?: string;
  hasRecommendations?: boolean;
}

export const RecommendationSummary: React.FC<RecommendationSummaryProps> = ({
  title = 'No active recommendations',
  category = 'Action',
  priority = 'High',
  reason = 'Complete your skill assessment to generate prioritized recommendations.',
  impactScore = 0,
  estimatedTime = '15 mins',
  hasRecommendations = true,
}) => {
  const navigate = useNavigate();

  const priorityColor =
    priority === 'Highest' ? 'error' : priority === 'High' ? 'warning' : 'info';

  return (
    <Card variant="default" className="flex flex-col h-full">
      <CardHeader className="mb-2">
        <Badge variant="subtle" color="warning" icon={
          <Icon size="sm">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </Icon>
        }>
          Top Priority Action
        </Badge>
        {hasRecommendations && (
          <Badge variant="outlined" color={priorityColor}>
            {priority} Priority
          </Badge>
        )}
      </CardHeader>

      <CardBody className="flex-1 space-y-3">
        <div>
          <span className="text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider block">
            {category}
          </span>
          <h4 className="text-base font-bold text-[var(--color-text-primary)] mt-0.5">
            {title}
          </h4>
        </div>

        <div className="p-3 bg-[var(--color-bg-surface-sunken)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] text-xs text-[var(--color-text-secondary)] leading-relaxed">
          <span className="font-semibold text-[var(--color-text-primary)] block mb-0.5">Why this matters:</span>
          {reason}
        </div>

        {hasRecommendations && (
          <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
            <span>Est. Time: <strong className="text-[var(--color-text-primary)]">{estimatedTime}</strong></span>
            <span>Impact: <strong className="text-[var(--color-status-success-text)]">+{impactScore} pts</strong></span>
          </div>
        )}
      </CardBody>

      <CardFooter>
        <span className="text-xs text-[var(--color-text-tertiary)] font-medium">
          Priority Matrix
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/recommendations')}
          rightIcon={
            <Icon size="sm">
              <polyline points="9 18 15 12 9 6" />
            </Icon>
          }
        >
          View Action Center
        </Button>
      </CardFooter>
    </Card>
  );
};

RecommendationSummary.displayName = 'RecommendationSummary';
