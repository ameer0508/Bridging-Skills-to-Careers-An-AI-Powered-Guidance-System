import React from 'react';
import { Card, CardHeader, CardBody } from '../../../components/base/Card';
import { Badge } from '../../../components/base/Badge';
import { Button } from '../../../components/base/Button';
import { Icon } from '../../../components/primitives/Icon';

export interface SecuritySettingsProps {
  userId?: string;
  email?: string;
  role?: string;
  accountStatus?: string;
  authProvider?: string;
  onLogout: () => void;
  isLoggingOut?: boolean;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  userId = 'N/A',
  email = 'N/A',
  role = 'User',
  accountStatus = 'Active',
  authProvider: _authProvider = 'local',
  onLogout,
  isLoggingOut = false,
}) => {
  const providerLabel = 'Local Password Authentication';

  return (
    <Card variant="default">
      <CardHeader>
        <h3 className="text-base font-bold font-display text-aurora-ink">
          Account Security & Active Session
        </h3>
      </CardHeader>

      <CardBody className="space-y-4">
        <div className="p-4 bg-[var(--color-bg-surface-sunken)] border border-aurora-line rounded-2xl space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-aurora-muted">Account ID</span>
            <span className="text-aurora-ink">{userId}</span>
          </div>
          <div className="flex justify-between items-center border-t border-aurora-line pt-2">
            <span className="text-aurora-muted">Email Address</span>
            <span className="font-semibold text-aurora-ink">{email}</span>
          </div>
          <div className="flex justify-between items-center border-t border-aurora-line pt-2">
            <span className="text-aurora-muted">Authentication Provider</span>
            <Badge variant="subtle" color="primary" size="sm">
              {providerLabel}
            </Badge>
          </div>
          <div className="flex justify-between items-center border-t border-aurora-line pt-2">
            <span className="text-aurora-muted">Security Role</span>
            <Badge variant="subtle" color="primary" size="sm">
              {role}
            </Badge>
          </div>
          <div className="flex justify-between items-center border-t border-aurora-line pt-2">
            <span className="text-aurora-muted">Account Status</span>
            <Badge variant="subtle" color="success" size="sm">
              {accountStatus}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-xs font-bold text-aurora-ink block">
              Active Session Token
            </span>
            <span className="text-[10px] text-aurora-muted block">
              JWT Bearer with automated refresh token rotation
            </span>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={onLogout}
            isLoading={isLoggingOut}
            leftIcon={
              <Icon size="sm">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </Icon>
            }
          >
            Sign Out Session
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

SecuritySettings.displayName = 'SecuritySettings';
