import React from 'react';
import { Icon } from '../../primitives/Icon';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  onClose?: () => void;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<AlertVariant, { bg: string; border: string; text: string; iconColor: string }> = {
  info: {
    bg: 'bg-[var(--color-status-info-bg)]',
    border: 'border-[var(--color-status-info-border)]',
    text: 'text-[var(--color-status-info-text)]',
    iconColor: 'var(--color-status-info-text)',
  },
  success: {
    bg: 'bg-[var(--color-status-success-bg)]',
    border: 'border-[var(--color-status-success-border)]',
    text: 'text-[var(--color-status-success-text)]',
    iconColor: 'var(--color-status-success-text)',
  },
  warning: {
    bg: 'bg-[var(--color-status-warning-bg)]',
    border: 'border-[var(--color-status-warning-border)]',
    text: 'text-[var(--color-status-warning-text)]',
    iconColor: 'var(--color-status-warning-text)',
  },
  error: {
    bg: 'bg-[var(--color-status-error-bg)]',
    border: 'border-[var(--color-status-error-border)]',
    text: 'text-[var(--color-status-error-text)]',
    iconColor: 'var(--color-status-error-text)',
  },
};

const defaultIcons: Record<AlertVariant, React.ReactNode> = {
  info: (
    <Icon size="md">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </Icon>
  ),
  success: (
    <Icon size="md">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </Icon>
  ),
  warning: (
    <Icon size="md">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </Icon>
  ),
  error: (
    <Icon size="md">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </Icon>
  ),
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    { variant = 'info', title, onClose, icon, className = '', children, ...props },
    ref
  ) => {
    const style = variantStyles[variant];

    return (
      <div
        ref={ref}
        role="alert"
        className={`p-4 rounded-[var(--radius-md)] border flex items-start gap-3 ${style.bg} ${style.border} ${style.text} ${className}`}
        {...props}
      >
        <div className="shrink-0 mt-0.5" style={{ color: style.iconColor }}>
          {icon || defaultIcons[variant]}
        </div>
        <div className="flex-1 text-sm leading-relaxed">
          {title && <h4 className="font-bold mb-1">{title}</h4>}
          <div>{children}</div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close alert"
            className="shrink-0 p-1 rounded-full hover:opacity-80 focus:outline-none"
          >
            <Icon size="sm">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </Icon>
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';
