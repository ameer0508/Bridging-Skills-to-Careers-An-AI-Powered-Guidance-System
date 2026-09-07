import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../../../components/base/Card';
import { Button } from '../../../components/base/Button';
import { Dialog } from '../../../components/base/Modal/Dialog';
import { Icon } from '../../../components/primitives/Icon';

export interface DangerZoneCardProps {
  onConfirmLogout: () => void;
}

export const DangerZoneCard: React.FC<DangerZoneCardProps> = ({ onConfirmLogout }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Card variant="default" className="border-[var(--color-status-error-border)] bg-[var(--color-status-error-bg)]/20">
        <CardHeader>
          <h3 className="text-base font-bold font-display text-[var(--color-status-error-text)] flex items-center gap-2">
            <Icon size="sm">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </Icon>
            Danger Zone
          </h3>
        </CardHeader>

        <CardBody className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                Revoke All Active Sessions & Log Out
              </span>
              <span className="text-[10px] text-[var(--color-text-tertiary)] block">
                Immediately revokes refresh tokens and clears local storage session state across devices.
              </span>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
            >
              Terminate Session
            </Button>
          </div>
        </CardBody>
      </Card>

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={() => {
          setIsDialogOpen(false);
          onConfirmLogout();
        }}
        title="Confirm Session Termination"
        description="Are you sure you want to terminate your current session? You will be signed out immediately and redirected to the login page."
        confirmLabel="Yes, Terminate Session"
        variant="destructive"
      />
    </>
  );
};

DangerZoneCard.displayName = 'DangerZoneCard';
