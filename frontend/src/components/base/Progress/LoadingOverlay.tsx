import React from 'react';
import { Spinner } from './Spinner';

export interface LoadingOverlayProps {
  visible?: boolean;
  message?: string;
  className?: string;
  children?: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible = true,
  message,
  className = '',
  children,
}) => {
  if (!visible) return <>{children}</>;

  return (
    <div className={`relative min-h-[100px] w-full ${className}`}>
      {children}
      <div
        className="absolute inset-0 z-[var(--z-overlay)] flex flex-col items-center justify-center bg-[var(--color-bg-surface-overlay)] backdrop-blur-[var(--blur-sm)] rounded-[inherit] transition-opacity duration-[var(--duration-normal)]"
        aria-busy="true"
        aria-live="polite"
      >
        <Spinner size={32} />
        {message && (
          <p className="mt-3 text-sm font-medium text-[var(--color-text-secondary)]">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

LoadingOverlay.displayName = 'LoadingOverlay';
