import React from 'react';
import { Badge } from '../../../components/base/Badge';
import { Select } from '../../../components/base/Select';
import { Button } from '../../../components/base/Button';
import { Icon } from '../../../components/primitives/Icon';

export interface AIWorkspaceHeaderProps {
  careers?: Array<{ careerId: { _id: string; title: string } }>;
  selectedCareerId?: string;
  onSelectCareerContext?: (careerId: string) => void;
  onNewChat?: () => void;
}

export const AIWorkspaceHeader: React.FC<AIWorkspaceHeaderProps> = ({
  careers = [],
  selectedCareerId = '',
  onSelectCareerContext,
  onNewChat,
}) => {
  const careerOptions = [
    { value: '', label: 'General Career Context' },
    ...careers.map(c => ({
      value: c.careerId._id,
      label: `Target: ${c.careerId.title}`,
    })),
  ];

  return (
    <div className="h-[var(--topbar-height)] px-4 md:px-6 bg-[var(--color-bg-surface-raised)] border-b border-[var(--color-border-default)] flex items-center justify-between gap-4 shrink-0 rounded-t-[var(--radius-xl)]">
      <div className="flex items-center gap-3 truncate">
        <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-ai-accent-subtle)] border border-[hsl(185,66%,57%,0.20)] text-[var(--color-ai-accent)] flex items-center justify-center shrink-0">
          <Icon size="md">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
          </Icon>
        </div>

        <div className="truncate">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold font-display text-[var(--color-text-primary)] truncate">
              AI Career Architect
            </h2>
            <Badge variant="subtle" color="ai" size="sm">
              Grounded Evidence
            </Badge>
          </div>
          <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">
            Advisory grounded strictly in your verified platform data
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {careers.length > 0 && onSelectCareerContext && (
          <div className="hidden sm:block w-48">
            <Select
              options={careerOptions}
              value={selectedCareerId}
              onChange={e => onSelectCareerContext(e.target.value)}
              selectSize="sm"
            />
          </div>
        )}

        {onNewChat && (
          <Button
            variant="primary"
            size="sm"
            onClick={onNewChat}
            leftIcon={
              <Icon size="sm">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </Icon>
            }
          >
            New Chat
          </Button>
        )}
      </div>
    </div>
  );
};

AIWorkspaceHeader.displayName = 'AIWorkspaceHeader';
