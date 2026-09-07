import React from 'react';
import { Card } from '../../../components/base/Card';
import { Button } from '../../../components/base/Button';
import { Badge } from '../../../components/base/Badge';
import { Icon } from '../../../components/primitives/Icon';
import { useNavigate } from 'react-router-dom';

export interface WelcomeHeroProps {
  userName?: string;
  topCareerTitle?: string;
  readinessScore?: number;
  readinessTier?: string;
  hasResume?: boolean;
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({
  userName = 'Career Explorer',
  topCareerTitle,
  readinessScore = 0,
  readinessTier = 'Evaluating',
  hasResume = true,
}) => {
  const navigate = useNavigate();

  return (
    <Card variant="elevated" className="relative overflow-hidden bg-gradient-to-r from-[var(--color-bg-surface-raised)] to-[var(--color-bg-surface)] border-[var(--color-border-default)] p-6 md:p-8">
      {/* Decorative ambient background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-interactive-primary)]/5 rounded-full blur-[var(--blur-xl)] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2">
            <Badge variant="subtle" color="ai" icon={
              <Icon size="sm">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </Icon>
            }>
              AI Career Intelligence
            </Badge>
            {topCareerTitle && (
              <Badge variant="outlined" color="primary">
                Target: {topCareerTitle}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold font-display text-[var(--color-text-primary)] tracking-tight">
            Welcome back, {userName}
          </h1>

          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {hasResume
              ? `Your career alignment is actively tracked. Current Readiness: ${readinessScore}% (${readinessTier}). Explore your next recommended actions below.`
              : 'Upload your resume to generate deterministic career matches, skill gap analysis, and personalized roadmaps.'}
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(hasResume ? '/ai' : '/resume')}
              leftIcon={
                <Icon size="sm">
                  {hasResume ? (
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  ) : (
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  )}
                </Icon>
              }
            >
              {hasResume ? 'Consult AI Architect' : 'Upload Resume Now'}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/careers')}
            >
              View Career Matches
            </Button>
          </div>
        </div>

        {/* Quick Readiness Score Widget */}
        {hasResume && (
          <div className="shrink-0 flex items-center gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface-sunken)] border border-[var(--color-border-subtle)] w-full md:w-auto">
            <div className="text-center">
              <div className="text-3xl font-extrabold font-display text-[var(--color-interactive-primary)]">
                {readinessScore}%
              </div>
              <div className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider mt-0.5">
                Readiness Score
              </div>
            </div>
            <div className="h-8 w-[1px] bg-[var(--color-border-subtle)]" />
            <div>
              <div className="text-xs font-semibold text-[var(--color-text-primary)]">
                {readinessTier}
              </div>
              <div className="text-[10px] text-[var(--color-text-secondary)]">
                Verified Fit
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

WelcomeHero.displayName = 'WelcomeHero';
