import React from 'react';
import { Icon } from '../../primitives/Icon';
import { Button } from '../../base/Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this section. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`p-8 text-center bg-[var(--color-status-error-bg)] border border-[var(--color-status-error-border)] rounded-[var(--radius-xl)] max-w-md mx-auto flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[var(--color-status-error-bg)] border border-[var(--color-status-error-border)] flex items-center justify-center text-[var(--color-status-error-text)] mb-4">
        <Icon size="lg">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </Icon>
      </div>
      <h3 className="text-base font-bold text-[var(--color-status-error-text)] mb-2">{title}</h3>
      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-6 max-w-xs">{message}</p>
      {onRetry && (
        <Button variant="destructive" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};

ErrorState.displayName = 'ErrorState';
