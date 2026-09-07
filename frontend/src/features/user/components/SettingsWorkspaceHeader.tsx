import React from 'react';
import { Card } from '../../../components/base/Card';
import { Badge } from '../../../components/base/Badge';
import { Icon } from '../../../components/primitives/Icon';

export const SettingsWorkspaceHeader: React.FC = () => {
  return (
    <Card variant="elevated" className="p-6 md:p-8 bg-gradient-to-r from-[var(--color-bg-surface-raised)] to-[var(--color-bg-surface)] border-[var(--color-border-default)]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <Badge variant="subtle" color="primary" icon={
              <Icon size="sm">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </Icon>
            }>
              Account Management
            </Badge>
            <Badge variant="outlined" color="success">
              Active Session
            </Badge>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold font-display text-[var(--color-text-primary)] tracking-tight">
            Settings & Preferences
          </h1>

          <p className="text-xs md:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Manage your personal profile, workspace appearance, notification preferences, and session security.
          </p>
        </div>
      </div>
    </Card>
  );
};

SettingsWorkspaceHeader.displayName = 'SettingsWorkspaceHeader';
