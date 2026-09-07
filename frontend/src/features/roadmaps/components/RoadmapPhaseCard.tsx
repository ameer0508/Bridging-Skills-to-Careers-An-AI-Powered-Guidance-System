import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../../../components/base/Card';
import { Badge } from '../../../components/base/Badge';
import { Progress } from '../../../components/base/Progress';
import { Icon } from '../../../components/primitives/Icon';
import { MilestoneTaskRow, MilestoneTaskRowProps } from './MilestoneTaskRow';

export interface RoadmapPhaseData {
  _id: string;
  title: string;
  order: number;
  objective: string;
  skillsGained: string[];
  estimatedCompletionTime: string;
  items: Omit<MilestoneTaskRowProps, 'onStatusChange'>[];
}

export interface RoadmapPhaseCardProps {
  phase: RoadmapPhaseData;
  onStatusChange: (itemId: string, newStatus: string) => void;
}

export const RoadmapPhaseCard: React.FC<RoadmapPhaseCardProps> = ({
  phase,
  onStatusChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const totalItems = phase.items.length;
  const completedItems = phase.items.filter(i => i.status === 'completed').length;
  const phaseProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <Card variant="default" className="relative overflow-hidden">
      <CardHeader className="mb-0 pb-4 border-b border-[var(--color-border-subtle)]">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="subtle" color="primary">
              Phase {phase.order}
            </Badge>
            <Badge variant="outlined" color="info">
              Est: {phase.estimatedCompletionTime}
            </Badge>
          </div>
          <h3 className="text-lg font-bold font-display text-[var(--color-text-primary)]">
            {phase.title}
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            {phase.objective}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Collapse phase' : 'Expand phase'}
          className="p-2 rounded-[var(--radius-md)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-interactive-secondary-hover)] transition-colors cursor-pointer"
        >
          <Icon size="md" className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </Icon>
        </button>
      </CardHeader>

      <CardBody className="space-y-4 pt-4">
        {/* Phase Progress Bar & Skills Gained */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[var(--color-text-secondary)]">Phase Progress</span>
            <span className="text-[var(--color-status-success-text)]">{phaseProgress}% ({completedItems}/{totalItems} tasks)</span>
          </div>
          <Progress value={phaseProgress} variant="success" size="sm" showValue={false} />

          {phase.skillsGained.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-2">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] mr-1">
                Skills Unlocked:
              </span>
              {phase.skillsGained.map(skill => (
                <span
                  key={skill}
                  className="px-2 py-0.5 text-[10px] font-bold bg-[hsl(226,84%,57%,0.10)] text-[var(--primitive-primary-400)] border border-[hsl(226,84%,57%,0.20)] rounded-[var(--radius-sm)]"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Task Rows */}
        {isExpanded && (
          <div className="space-y-3 pt-2 animate-fade-in">
            {phase.items.map(item => (
              <MilestoneTaskRow
                key={item.itemId}
                {...item}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

RoadmapPhaseCard.displayName = 'RoadmapPhaseCard';
