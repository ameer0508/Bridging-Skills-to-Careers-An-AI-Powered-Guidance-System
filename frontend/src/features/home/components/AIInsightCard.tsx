import React from 'react';
import { Card } from '../../../components/base/Card';
import { Badge } from '../../../components/base/Badge';
import { Button } from '../../../components/base/Button';
import { Icon } from '../../../components/primitives/Icon';
import { useNavigate } from 'react-router-dom';

export interface AIInsightCardProps {
  insightText?: string;
  suggestedPrompt?: string;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({
  insightText = 'Your verified technical background displays a 78% overlap with Senior Fullstack Roles. Focus on system design and containerization to achieve high-tier readiness.',
  suggestedPrompt = 'What specific projects can I build to demonstrate Cloud Infrastructure skills?',
}) => {
  const navigate = useNavigate();

  return (
    <Card variant="elevated" className="relative overflow-hidden bg-gradient-to-br from-[var(--color-ai-surface)] to-[var(--color-bg-surface-raised)] border-[var(--color-ai-accent)]/30 p-6 shadow-[var(--shadow-glow-ai)]">
      <div className="flex items-start justify-between gap-4 mb-3">
        <Badge variant="subtle" color="ai" icon={
          <Icon size="sm">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </Icon>
        }>
          AI Architect Briefing
        </Badge>
        <span className="text-[10px] font-mono text-[var(--color-ai-text)] opacity-80 uppercase tracking-wider">
          Grounded In Evidence
        </span>
      </div>

      <p className="text-xs md:text-sm text-[var(--color-text-primary)] leading-relaxed mb-4">
        "{insightText}"
      </p>

      <div className="p-3 bg-[var(--color-bg-app)]/60 border border-[var(--color-ai-accent)]/20 rounded-[var(--radius-md)] flex items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]">
        <div className="flex items-center gap-2 truncate">
          <Icon size="sm" className="text-[var(--color-ai-accent)] shrink-0">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </Icon>
          <span className="italic truncate">{suggestedPrompt}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/ai')}
          className="shrink-0 text-[var(--color-ai-accent)] hover:text-white"
        >
          Ask AI
        </Button>
      </div>
    </Card>
  );
};

AIInsightCard.displayName = 'AIInsightCard';
