import React from 'react';
import { Card } from '../../../components/base/Card';
import { Badge } from '../../../components/base/Badge';
import { Button } from '../../../components/base/Button';
import { Icon } from '../../../components/primitives/Icon';
import { useNavigate } from 'react-router-dom';

export interface CareerWorkspaceHeaderProps {
  totalMatches?: number;
  topFitScore?: number;
  avgConfidence?: number;
}

export const CareerWorkspaceHeader: React.FC<CareerWorkspaceHeaderProps> = ({
  totalMatches = 0,
  topFitScore = 0,
  avgConfidence = 0,
}) => {
  const navigate = useNavigate();

  return (
    <Card variant="elevated" className="p-6 md:p-8 bg-gradient-to-r from-[var(--color-bg-surface-raised)] to-[var(--color-bg-surface)] border-[var(--color-border-default)]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <Badge variant="subtle" color="primary" icon={
              <Icon size="sm">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </Icon>
            }>
              Deterministic Career Engine
            </Badge>
            <Badge variant="outlined" color="ai">
              Explainable AI (XAI)
            </Badge>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold font-display text-[var(--color-text-primary)] tracking-tight">
            Career Intelligence
          </h1>

          <p className="text-xs md:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Deterministic role alignments computed strictly from your verified skill evidence graph. No random percentages—every match is traceable to explicit skills and gaps.
          </p>

          <div className="pt-1 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/resume')}
              leftIcon={
                <Icon size="sm">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </Icon>
              }
            >
              Update Resume
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/ai')}
              leftIcon={
                <Icon size="sm">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                </Icon>
              }
            >
              Consult AI Architect
            </Button>
          </div>
        </div>

        {/* Quick Summary Strip */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-[var(--color-bg-surface-sunken)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] w-full md:w-auto shrink-0 text-center">
          <div className="px-3 py-1">
            <div className="text-xl font-bold font-display text-[var(--color-interactive-primary)]">
              {totalMatches}
            </div>
            <div className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider mt-0.5">
              Matches
            </div>
          </div>
          <div className="px-3 py-1 border-x border-[var(--color-border-subtle)]">
            <div className="text-xl font-bold font-display text-[var(--color-status-success-text)]">
              {topFitScore}%
            </div>
            <div className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider mt-0.5">
              Top Fit
            </div>
          </div>
          <div className="px-3 py-1">
            <div className="text-xl font-bold font-display text-[var(--color-ai-accent)]">
              {avgConfidence}%
            </div>
            <div className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] tracking-wider mt-0.5">
              Avg Conf.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

CareerWorkspaceHeader.displayName = 'CareerWorkspaceHeader';
