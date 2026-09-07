import React, { useState } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '../../../components/base/Card';
import { Badge } from '../../../components/base/Badge';
import { Button } from '../../../components/base/Button';
import { ProgressRing } from '../../../components/base/Progress/ProgressRing';
import { Checkbox } from '../../../components/base/Checkbox';
import { Icon } from '../../../components/primitives/Icon';
import { useNavigate } from 'react-router-dom';

export interface CareerMatchData {
  id: string;
  careerId: {
    _id: string;
    title: string;
    category: string;
    description: string;
  };
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  confidence: number;
  relatedCareers?: Array<{
    career: {
      _id: string;
      title: string;
      category: string;
    };
    score: number;
  }>;
}

export interface CareerMatchCardProps {
  match: CareerMatchData;
  isCompared?: boolean;
  onToggleCompare?: () => void;
}

export const CareerMatchCard: React.FC<CareerMatchCardProps> = ({
  match,
  isCompared = false,
  onToggleCompare,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const { careerId, matchScore, confidence, strengths, weaknesses, matchingSkills, missingSkills, relatedCareers } = match;

  const confidenceColor = confidence >= 85 ? 'success' : confidence >= 70 ? 'info' : 'warning';

  return (
    <Card variant="default" className="relative overflow-hidden transition-all duration-[var(--duration-fast)] hover:border-[var(--color-border-strong)]">
      {/* Visual Fit Gauge Indicator Bar */}
      <div
        className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-[var(--color-interactive-primary)] to-[var(--color-status-success-text)] opacity-80"
        style={{ height: `${matchScore}%` }}
      />

      {/* Card Top */}
      <CardHeader className="mb-4 pl-3">
        <div className="flex items-start gap-4">
          {onToggleCompare && (
            <div className="pt-1">
              <Checkbox
                checked={isCompared}
                onChange={onToggleCompare}
                aria-label={`Compare ${careerId.title}`}
              />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="subtle" color="primary">
                {careerId.category}
              </Badge>
              <Badge variant="outlined" color={confidenceColor}>
                {confidence}% Confidence
              </Badge>
            </div>
            <h2 className="text-xl font-bold font-display text-[var(--color-text-primary)]">
              {careerId.title}
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mt-1 max-w-2xl line-clamp-2">
              {careerId.description}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <ProgressRing value={matchScore} size={64} strokeWidth={6} variant="primary" />
          <span className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider mt-1">
            Role Alignment
          </span>
        </div>
      </CardHeader>

      <CardBody className="pl-3 space-y-4">
        {/* Core Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[var(--color-bg-surface-sunken)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] text-xs">
          <div>
            <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold block">
              Verified Strengths
            </span>
            <span className="font-bold text-[var(--color-status-success-text)] text-sm">
              {matchingSkills.length} Skills
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold block">
              Skill Gaps
            </span>
            <span className="font-bold text-[var(--color-status-error-text)] text-sm">
              {missingSkills.length} Skills
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold block">
              Recommendation Fit
            </span>
            <span className="font-bold text-[var(--color-interactive-primary)] text-sm">
              {matchScore >= 80 ? 'Strong Fit' : matchScore >= 60 ? 'Moderate Fit' : 'Target Fit'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold block">
              Evidence Level
            </span>
            <span className="font-bold text-[var(--color-ai-text)] text-sm">
              {confidence >= 80 ? 'High Rigor' : 'Medium Rigor'}
            </span>
          </div>
        </div>

        {/* Expandable Explainability Details (Why this fit?) */}
        {isExpanded && (
          <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-4 animate-fade-in">
            {/* Strengths & Weaknesses Detailed Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[var(--color-status-success-bg)]/40 border border-[var(--color-status-success-border)]/50 rounded-[var(--radius-md)]">
                <h4 className="text-xs font-bold text-[var(--color-status-success-text)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Icon size="sm">
                    <polyline points="20 6 9 17 4 12" />
                  </Icon>
                  Why you match this role
                </h4>
                <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                  {strengths.length > 0 ? (
                    strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[var(--color-status-success-text)] shrink-0">•</span>
                        <span>{s.replace('✓ ', '')}</span>
                      </li>
                    ))
                  ) : (
                    <li className="italic text-[var(--color-text-tertiary)]">No explicit strength highlights.</li>
                  )}
                </ul>
              </div>

              <div className="p-4 bg-[var(--color-status-error-bg)]/40 border border-[var(--color-status-error-border)]/50 rounded-[var(--radius-md)]">
                <h4 className="text-xs font-bold text-[var(--color-status-error-text)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Icon size="sm">
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </Icon>
                  Gaps reducing score
                </h4>
                <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                  {weaknesses.length > 0 ? (
                    weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[var(--color-status-error-text)] shrink-0">•</span>
                        <span>{w.replace('! ', '').replace('- ', '')}</span>
                      </li>
                    ))
                  ) : (
                    <li className="italic text-[var(--color-status-success-text)]">No major skill gaps detected!</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Skill Tags */}
            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-[var(--color-text-tertiary)] tracking-wider block mb-1">
                  Matching Verified Skills ({matchingSkills.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {matchingSkills.map(skill => (
                    <span
                      key={skill}
                      className="px-2 py-1 text-xs font-medium bg-[var(--color-status-success-bg)] text-[var(--color-status-success-text)] border border-[var(--color-status-success-border)] rounded-[var(--radius-sm)]"
                    >
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>

              {missingSkills.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-[var(--color-text-tertiary)] tracking-wider block mb-1">
                    Missing Target Skills ({missingSkills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {missingSkills.map(skill => (
                      <span
                        key={skill}
                        className="px-2 py-1 text-xs font-medium bg-[var(--color-status-error-bg)] text-[var(--color-status-error-text)] border border-[var(--color-status-error-border)] rounded-[var(--radius-sm)]"
                      >
                        ! {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Similar Roles */}
            {relatedCareers && relatedCareers.length > 0 && (
              <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)]">
                  Similar Roles:
                </span>
                <div className="flex flex-wrap gap-2">
                  {relatedCareers.map((rc, i) => (
                    <span
                      key={i}
                      className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-surface-sunken)] px-2 py-0.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)]"
                      title={`Similarity score: ${rc.score}%`}
                    >
                      {rc.career.title} ({rc.score}%)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardBody>

      <CardFooter className="pl-3 flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold text-[var(--color-interactive-primary)] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>{isExpanded ? 'Hide Fit Analysis' : 'Explain Why This Matches'}</span>
          <Icon size="sm" className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </Icon>
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/roadmap')}
          >
            View Roadmap
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/ai')}
            leftIcon={
              <Icon size="sm">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83" />
              </Icon>
            }
          >
            Discuss with AI
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

CareerMatchCard.displayName = 'CareerMatchCard';
