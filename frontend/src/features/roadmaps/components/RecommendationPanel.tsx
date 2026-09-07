import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../../../components/base/Card';
import { Badge } from '../../../components/base/Badge';
import { Button } from '../../../components/base/Button';
import { Icon } from '../../../components/primitives/Icon';

export interface RecommendationItem {
  _id: string;
  title: string;
  category: string;
  priority: string;
  reason: string;
  impact: number;
  difficulty: string;
  estimatedTime: string;
  status: string; // active, saved_for_later, completed, dismissed
}

export interface RecommendationPanelProps {
  recommendations: RecommendationItem[];
  onUpdateStatus: (id: string, newStatus: string) => void;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  recommendations,
  onUpdateStatus,
}) => {
  const [filter, setFilter] = useState<string>('active');

  const filtered = recommendations.filter(r => r.status === filter);

  const tabs = [
    { id: 'active', label: 'Active Suggestions' },
    { id: 'saved_for_later', label: 'Saved' },
    { id: 'completed', label: 'Completed' },
    { id: 'dismissed', label: 'Dismissed' },
  ];

  return (
    <Card variant="default">
      <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--color-text-primary)] font-display flex items-center gap-2">
            <Icon size="sm" className="text-[var(--color-status-warning-text)]">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </Icon>
            Action Center Recommendations
          </h3>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            Intelligently prioritized actions computed from your readiness gaps.
          </p>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-[var(--color-bg-surface-sunken)] p-1 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] overflow-x-auto custom-scrollbar">
          {tabs.map(t => {
            const count = recommendations.filter(r => r.status === t.id).length;
            const isActive = filter === t.id;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-[var(--radius-sm)] transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[var(--color-bg-surface-raised)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {t.label} ({count})
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardBody>
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-[var(--color-bg-surface-sunken)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)]">
            <p className="text-xs text-[var(--color-text-tertiary)]">
              No recommendations in "{filter.replace('_', ' ')}".
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(rec => (
              <div
                key={rec._id}
                className="p-4 bg-[var(--color-bg-surface-sunken)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <Badge variant="subtle" color="warning" size="sm">
                      {rec.category}
                    </Badge>
                    <Badge
                      variant="outlined"
                      color={rec.priority === 'Highest' ? 'error' : 'info'}
                      size="sm"
                    >
                      {rec.priority} Priority
                    </Badge>
                    <span className="text-[10px] text-[var(--color-status-success-text)] font-semibold">
                      +{rec.impact} pts Impact
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {rec.title}
                  </h4>

                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {rec.reason}
                  </p>

                  <span className="text-[10px] text-[var(--color-text-tertiary)] block">
                    Est. Time: {rec.estimatedTime} • Difficulty: {rec.difficulty}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {filter === 'active' && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onUpdateStatus(rec._id, 'completed')}
                      >
                        Complete
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onUpdateStatus(rec._id, 'saved_for_later')}
                      >
                        Save
                      </Button>
                    </>
                  )}
                  {filter !== 'active' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUpdateStatus(rec._id, 'active')}
                    >
                      Move to Active
                    </Button>
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

RecommendationPanel.displayName = 'RecommendationPanel';
