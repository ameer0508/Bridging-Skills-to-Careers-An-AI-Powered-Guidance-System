import React from 'react';
import { Card, CardHeader, CardBody } from '../../../components/base/Card';
import { Icon } from '../../../components/primitives/Icon';
import { useNavigate } from 'react-router-dom';

export const QuickActionsPanel: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Upload Resume',
      desc: 'Parse PDF/DOCX to extract skills',
      to: '/resume',
      icon: (
        <Icon size="md" color="var(--color-status-info-text)">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </Icon>
      ),
    },
    {
      title: 'Skill Intelligence',
      desc: 'View normalized taxonomy graph',
      to: '/skills',
      icon: (
        <Icon size="md" color="var(--color-status-success-text)">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        </Icon>
      ),
    },
    {
      title: 'Career Matches',
      desc: 'Explore deterministic role fits',
      to: '/careers',
      icon: (
        <Icon size="md" color="var(--color-interactive-primary)">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </Icon>
      ),
    },
    {
      title: 'AI Career Architect',
      desc: 'Ask advisory & grounded insights',
      to: '/ai',
      icon: (
        <Icon size="md" color="var(--color-ai-accent)">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
        </Icon>
      ),
    },
  ];

  return (
    <Card variant="default">
      <CardHeader>
        <h3 className="text-sm font-bold text-[var(--color-text-primary)] font-display flex items-center gap-2">
          <Icon size="sm">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </Icon>
          Quick Operations
        </h3>
      </CardHeader>

      <CardBody>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map(act => (
            <button
              key={act.to}
              type="button"
              onClick={() => navigate(act.to)}
              className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-surface-sunken)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-interactive-secondary-hover)] transition-all text-left cursor-pointer group"
            >
              <div className="shrink-0">{act.icon}</div>
              <div className="truncate">
                <div className="text-xs font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-interactive-primary)] transition-colors">
                  {act.title}
                </div>
                <div className="text-[10px] text-[var(--color-text-tertiary)] truncate mt-0.5">
                  {act.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

QuickActionsPanel.displayName = 'QuickActionsPanel';
