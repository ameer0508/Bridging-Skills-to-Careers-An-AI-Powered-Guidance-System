import React from 'react';
import { Card, CardHeader, CardBody } from '../../../components/base/Card';
import { Badge } from '../../../components/base/Badge';
import { Icon } from '../../../components/primitives/Icon';

export interface AnalyticsEvent {
  _id: string;
  eventType: string;
  createdAt: string | number | Date;
  details?: {
    fileName?: string;
    skillName?: string;
  };
}

export interface ActivityTimelineProps {
  events: AnalyticsEvent[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ events }) => {
  return (
    <Card variant="default">
      <CardHeader>
        <h3 className="text-base font-bold font-display text-[var(--color-text-primary)] flex items-center gap-2">
          <Icon size="sm">
            <path d="M12 8v4l3 3" />
            <circle cx="12" cy="12" r="10" />
          </Icon>
          Platform Event Log
        </h3>
      </CardHeader>

      <CardBody>
        {events.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--color-text-tertiary)] italic">
            No system activity logged for this period.
          </div>
        ) : (
          <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-[var(--color-border-subtle)]">
            {events.map(evt => (
              <div key={evt._id} className="relative flex items-start gap-3 pl-0.5">
                <div className="w-6 h-6 rounded-full bg-[var(--color-interactive-primary)]/10 border border-[var(--color-interactive-primary)]/30 text-[var(--color-interactive-primary)] flex items-center justify-center shrink-0 z-10 mt-0.5">
                  <Icon size={12}>
                    <polyline points="20 6 9 17 4 12" />
                  </Icon>
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="subtle" color="primary" size="sm">
                      {evt.eventType.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
                      {new Date(evt.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {evt.details?.fileName && (
                    <p className="text-xs text-[var(--color-text-secondary)] font-medium">
                      File: <span className="font-semibold text-[var(--color-text-primary)]">{evt.details.fileName}</span>
                    </p>
                  )}

                  {evt.details?.skillName && (
                    <p className="text-xs text-[var(--color-text-secondary)] font-medium">
                      Skill Verified: <span className="font-semibold text-[var(--color-interactive-primary)]">{evt.details.skillName}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

ActivityTimeline.displayName = 'ActivityTimeline';
