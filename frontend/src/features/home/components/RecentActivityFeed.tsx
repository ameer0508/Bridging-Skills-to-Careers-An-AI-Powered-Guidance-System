import React from 'react';
import { Card, CardHeader, CardBody } from '../../../components/base/Card';
import { Icon } from '../../../components/primitives/Icon';

export interface ActivityEvent {
  id: string;
  title: string;
  timestamp: string;
  category: 'resume' | 'skill' | 'career' | 'roadmap';
}

export interface RecentActivityFeedProps {
  events?: ActivityEvent[];
}

const defaultEvents: ActivityEvent[] = [
  {
    id: '1',
    title: 'Career readiness score recalculated (+5%)',
    timestamp: '2 hours ago',
    category: 'career',
  },
  {
    id: '2',
    title: 'Completed roadmap item: Advanced System Architecture',
    timestamp: '1 day ago',
    category: 'roadmap',
  },
  {
    id: '3',
    title: 'Extracted 18 verified technical skills from resume',
    timestamp: '3 days ago',
    category: 'skill',
  },
  {
    id: '4',
    title: 'Resume uploaded and parsed successfully',
    timestamp: '3 days ago',
    category: 'resume',
  },
];

const categoryIconMap = {
  resume: (
    <Icon size="sm" color="var(--color-status-info-text)">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    </Icon>
  ),
  skill: (
    <Icon size="sm" color="var(--color-status-success-text)">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Icon>
  ),
  career: (
    <Icon size="sm" color="var(--color-interactive-primary)">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </Icon>
  ),
  roadmap: (
    <Icon size="sm" color="var(--color-ai-accent)">
      <polyline points="20 6 9 17 4 12" />
    </Icon>
  ),
};

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  events = defaultEvents,
}) => {
  return (
    <Card variant="default">
      <CardHeader>
        <h3 className="text-sm font-bold text-[var(--color-text-primary)] font-display flex items-center gap-2">
          <Icon size="sm">
            <polyline points="12 8 12 12 14 14" />
            <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
          </Icon>
          Recent System Activity
        </h3>
      </CardHeader>

      <CardBody>
        <div className="space-y-3 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[1px] before:bg-[var(--color-border-subtle)]">
          {events.map(event => (
            <div key={event.id} className="relative flex items-start gap-3 pl-1">
              <div className="w-7 h-7 rounded-full bg-[var(--color-bg-surface-sunken)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0 z-10">
                {categoryIconMap[event.category]}
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                  {event.title}
                </p>
                <span className="text-[10px] text-[var(--color-text-tertiary)] block mt-0.5">
                  {event.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

RecentActivityFeed.displayName = 'RecentActivityFeed';
