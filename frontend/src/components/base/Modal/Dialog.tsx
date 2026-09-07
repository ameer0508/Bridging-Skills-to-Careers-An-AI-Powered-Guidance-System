import React from 'react';
import { Modal } from './Modal';
import { Button } from '../Button';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'destructive';
  isLoading?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false,
}) => {
  const footer = (
    <>
      <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
        {cancelLabel}
      </Button>
      <Button
        variant={variant === 'destructive' ? 'destructive' : 'primary'}
        size="sm"
        onClick={onConfirm}
        isLoading={isLoading}
      >
        {confirmLabel}
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" footer={footer}>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{description}</p>
    </Modal>
  );
};

Dialog.displayName = 'Dialog';
