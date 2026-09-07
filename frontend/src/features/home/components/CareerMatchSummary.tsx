import React from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '../../../components/base/Card';
import { Badge } from '../../../components/base/Badge';
import { Button } from '../../../components/base/Button';
import { ProgressRing } from '../../../components/base/Progress/ProgressRing';
import { Icon } from '../../../components/primitives/Icon';
import { useNavigate } from 'react-router-dom';

export interface CareerMatchSummaryProps {
  careerId?: string;
  title?: string;
  category?: string;
  matchScore?: number;
  description?: string;
  matchingSkills?: string[];
  missingSkills?: string[];
  confidence?: number;
}

export const CareerMatchSummary: React.FC<CareerMatchSummaryProps> = ({
  title = 'No Career Match Yet',
  category = 'General',
  matchScore = 0,
  description = 'Upload your resume to calculate deterministic career fit scores.',
  matchingSkills = [],
  missingSkills = [],
  confidence = 0,
}) => {
  const navigate = useNavigate();

  return (
    <Card variant="default" className="flex flex-col h-full">
      <CardHeader className="mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="subtle" color="primary">
            {category}
          </Badge>
          <Badge variant="outlined" color="info">
            {confidence}% Confidence
          </Badge>
        </div>
        <ProgressRing value={matchScore} size={48} strokeWidth={5} variant="primary" />
      </CardHeader>

      <CardBody className="flex-1 space-y-3">
        <div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-display">
            {title}
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2 mt-1">
            {description}
          </p>
        </div>

        {/* Matching Skills */}
        {matchingSkills.length > 0 && (
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--color-status-success-text)] tracking-wider block mb-1.5">
              Verified Strengths ({matchingSkills.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {matchingSkills.slice(0, 4).map(skill => (
                <span
                  key={skill}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-[var(--color-status-success-bg)] text-[var(--color-status-success-text)] border border-[var(--color-status-success-border)] rounded-[var(--radius-sm)]"
                >
                  ✓ {skill}
                </span>
              ))}
              {matchingSkills.length > 4 && (
                <span className="px-2 py-0.5 text-[10px] text-[var(--color-text-tertiary)]">
                  +{matchingSkills.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Missing Skills / Gaps */}
        {missingSkills.length > 0 && (
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--color-status-warning-text)] tracking-wider block mb-1.5">
              Gaps to Close ({missingSkills.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.slice(0, 3).map(skill => (
                <span
                  key={skill}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning-text)] border border-[var(--color-status-warning-border)] rounded-[var(--radius-sm)]"
                >
                  ! {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardBody>

      <CardFooter>
        <span className="text-xs text-[var(--color-text-tertiary)] font-medium">
          Deterministic alignment
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/careers')}
          rightIcon={
            <Icon size="sm">
              <polyline points="9 18 15 12 9 6" />
            </Icon>
          }
        >
          View All Matches
        </Button>
      </CardFooter>
    </Card>
  );
};

CareerMatchSummary.displayName = 'CareerMatchSummary';
