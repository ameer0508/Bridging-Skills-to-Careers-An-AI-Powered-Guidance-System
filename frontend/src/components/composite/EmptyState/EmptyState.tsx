import React from 'react';
import { Icon } from '../../primitives/Icon';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = (
    <Icon size="xl" color="#515b80">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </Icon>
  ),
  action,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'p-6 max-w-sm',
    md: 'p-10 max-w-md',
    lg: 'p-16 max-w-lg',
  };

  return (
    <div className={`mx-auto text-center flex flex-col items-center justify-center bg-[var(--color-bg-surface-sunken)] border border-aurora-line rounded-[var(--radius-xl)] ${sizeClasses[size]} ${className}`}>
      {icon && <div className="mb-4 text-aurora-muted">{icon}</div>}
      <h3 className="text-base font-bold text-aurora-ink mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-aurora-muted leading-relaxed max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};

EmptyState.displayName = 'EmptyState';
