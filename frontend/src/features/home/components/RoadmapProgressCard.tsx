import React from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '../../../components/base/Card';
import { Progress } from '../../../components/base/Progress';
import { Button } from '../../../components/base/Button';
import { Badge } from '../../../components/base/Badge';
import { Icon } from '../../../components/primitives/Icon';
import { useNavigate } from 'react-router-dom';

export interface RoadmapProgressCardProps {
  careerTitle?: string;
  progressPercentage?: number;
  activePhaseTitle?: string;
  totalPhases?: number;
  completedItemsCount?: number;
  totalItemsCount?: number;
}

export const RoadmapProgressCard: React.FC<RoadmapProgressCardProps> = ({
  careerTitle = 'Active Career Roadmap',
  progressPercentage = 0,
  activePhaseTitle = 'Phase 1: Foundation',
  totalPhases = 3,
  completedItemsCount = 0,
  totalItemsCount = 0,
}) => {
  const navigate = useNavigate();

  return (
    <Card variant="default" className="flex flex-col h-full">
      <CardHeader className="mb-3">
        <Badge variant="subtle" color="success">
          Roadmap In Progress
        </Badge>
        <span className="text-xl font-extrabold font-display text-[var(--color-status-success-text)]">
          {progressPercentage}%
        </span>
      </CardHeader>

      <CardBody className="flex-1 space-y-4">
        <div>
          <h3 className="text-base font-bold text-[var(--color-text-primary)] font-display">
            {careerTitle}
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Current Stage: <span className="font-semibold text-[var(--color-text-primary)]">{activePhaseTitle}</span> ({totalPhases} total phases)
          </p>
        </div>

        <Progress
          value={progressPercentage}
          variant="success"
          size="md"
          showValue={false}
        />

        <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] pt-1">
          <span>Action Items</span>
          <span className="font-semibold text-[var(--color-text-primary)]">
            {completedItemsCount} / {totalItemsCount} Completed
          </span>
        </div>
      </CardBody>

      <CardFooter>
        <span className="text-xs text-[var(--color-text-tertiary)] font-medium">
          Sequenced by dependencies
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/roadmap')}
          rightIcon={
            <Icon size="sm">
              <polyline points="9 18 15 12 9 6" />
            </Icon>
          }
        >
          Continue Roadmap
        </Button>
      </CardFooter>
    </Card>
  );
};

RoadmapProgressCard.displayName = 'RoadmapProgressCard';
