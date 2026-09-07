import React from 'react';
import { Modal } from '../../../components/base/Modal';
import { Badge } from '../../../components/base/Badge';
import { ProgressRing } from '../../../components/base/Progress/ProgressRing';
import { Button } from '../../../components/base/Button';
import { CareerMatchData } from './CareerMatchCard';
import { useNavigate } from 'react-router-dom';

export interface CareerComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMatches: CareerMatchData[];
}

export const CareerComparisonModal: React.FC<CareerComparisonModalProps> = ({
  isOpen,
  onClose,
  selectedMatches,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Comparing ${selectedMatches.length} Selected Roles`}
      size="lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedMatches.map(m => (
          <div
            key={m.id}
            className="p-4 bg-[var(--color-bg-surface-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge variant="subtle" color="primary">
                  {m.careerId.category}
                </Badge>
                <ProgressRing value={m.matchScore} size={42} strokeWidth={4} variant="primary" />
              </div>

              <h4 className="text-base font-bold font-display text-[var(--color-text-primary)] mb-1">
                {m.careerId.title}
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                {m.careerId.description}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-[var(--color-border-subtle)] text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-[var(--color-status-success-text)] block mb-1">
                  Verified Skills ({m.matchingSkills.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {m.matchingSkills.slice(0, 3).map(s => (
                    <span
                      key={s}
                      className="px-1.5 py-0.5 text-[10px] bg-[var(--color-status-success-bg)] text-[var(--color-status-success-text)] rounded-[var(--radius-sm)]"
                    >
                      ✓ {s}
                    </span>
                  ))}
                  {m.matchingSkills.length > 3 && (
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">
                      +{m.matchingSkills.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-[var(--color-status-error-text)] block mb-1">
                  Gaps ({m.missingSkills.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {m.missingSkills.slice(0, 3).map(s => (
                    <span
                      key={s}
                      className="px-1.5 py-0.5 text-[10px] bg-[var(--color-status-error-bg)] text-[var(--color-status-error-text)] rounded-[var(--radius-sm)]"
                    >
                      ! {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => {
                onClose();
                navigate('/roadmap');
              }}
            >
              Select Roadmap
            </Button>
          </div>
        ))}
      </div>
    </Modal>
  );
};

CareerComparisonModal.displayName = 'CareerComparisonModal';
