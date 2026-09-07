import React from 'react';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0 to 100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'ai';
  indeterminate?: boolean;
  label?: string;
  showValue?: boolean;
  className?: string;
}

const heightMap = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const variantColorMap = {
  primary: 'bg-[var(--color-interactive-primary)]',
  success: 'bg-[var(--color-status-success-text)]',
  warning: 'bg-[var(--color-status-warning-text)]',
  error: 'bg-[var(--color-status-error-text)]',
  ai: 'bg-[var(--color-ai-accent)]',
};

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'primary',
  indeterminate = false,
  label,
  showValue = false,
  className = '',
  ...props
}) => {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

  return (
    <div className={`w-full ${className}`} {...props}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
          {label && <span>{label}</span>}
          {showValue && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress bar'}
        className={`w-full ${heightMap[size]} bg-[var(--color-bg-surface-sunken)] rounded-[var(--radius-full)] overflow-hidden relative`}
      >
        {indeterminate ? (
          <div
            className={`h-full ${variantColorMap[variant]} w-1/3 animate-shimmer rounded-[var(--radius-full)]`}
          />
        ) : (
          <div
            className={`h-full ${variantColorMap[variant]} transition-all duration-[var(--duration-slow)] ease-[var(--ease-default)] rounded-[var(--radius-full)]`}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
};

Progress.displayName = 'Progress';
