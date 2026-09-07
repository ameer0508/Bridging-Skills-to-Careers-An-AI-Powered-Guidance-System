import React from 'react';

export type BadgeVariant = 'filled' | 'outlined' | 'subtle' | 'dot';
export type BadgeColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'ai';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  color?: BadgeColor;
  size?: BadgeSize;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

const colorVariantStyles: Record<BadgeColor, Record<BadgeVariant, string>> = {
  default: {
    filled: 'bg-[var(--primitive-neutral-700)] text-[var(--primitive-neutral-50)]',
    outlined: 'border border-[var(--color-border-default)] text-[var(--color-text-secondary)]',
    subtle: 'bg-[var(--primitive-neutral-800)] text-[var(--color-text-secondary)]',
    dot: 'text-[var(--color-text-secondary)]',
  },
  primary: {
    filled: 'bg-[var(--color-interactive-primary)] text-[var(--color-text-on-primary)]',
    outlined: 'border border-[var(--color-interactive-primary)] text-[var(--color-interactive-primary)]',
    subtle: 'bg-[hsl(226,84%,57%,0.12)] text-[var(--primitive-primary-400)] border border-[hsl(226,84%,57%,0.2)]',
    dot: 'text-[var(--primitive-primary-400)]',
  },
  success: {
    filled: 'bg-[var(--primitive-success-600)] text-[var(--color-text-on-success)]',
    outlined: 'border border-[var(--color-status-success-border)] text-[var(--color-status-success-text)]',
    subtle: 'bg-[var(--color-status-success-bg)] text-[var(--color-status-success-text)] border border-[var(--color-status-success-border)]',
    dot: 'text-[var(--color-status-success-text)]',
  },
  warning: {
    filled: 'bg-[var(--primitive-warning-600)] text-[var(--primitive-neutral-950)]',
    outlined: 'border border-[var(--color-status-warning-border)] text-[var(--color-status-warning-text)]',
    subtle: 'bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning-text)] border border-[var(--color-status-warning-border)]',
    dot: 'text-[var(--color-status-warning-text)]',
  },
  error: {
    filled: 'bg-[var(--color-interactive-destructive)] text-[var(--color-text-on-error)]',
    outlined: 'border border-[var(--color-status-error-border)] text-[var(--color-status-error-text)]',
    subtle: 'bg-[var(--color-status-error-bg)] text-[var(--color-status-error-text)] border border-[var(--color-status-error-border)]',
    dot: 'text-[var(--color-status-error-text)]',
  },
  info: {
    filled: 'bg-[var(--primitive-info-600)] text-[var(--primitive-neutral-50)]',
    outlined: 'border border-[var(--color-status-info-border)] text-[var(--color-status-info-text)]',
    subtle: 'bg-[var(--color-status-info-bg)] text-[var(--color-status-info-text)] border border-[var(--color-status-info-border)]',
    dot: 'text-[var(--color-status-info-text)]',
  },
  ai: {
    filled: 'bg-[var(--primitive-ai-600)] text-[var(--primitive-neutral-950)]',
    outlined: 'border border-[var(--color-ai-accent)] text-[var(--color-ai-accent)]',
    subtle: 'bg-[var(--color-ai-accent-subtle)] text-[var(--color-ai-accent)] border border-[hsl(185,66%,57%,0.2)]',
    dot: 'text-[var(--color-ai-accent)]',
  },
};

const dotColorMap: Record<BadgeColor, string> = {
  default: 'bg-[var(--color-text-tertiary)]',
  primary: 'bg-[var(--color-interactive-primary)]',
  success: 'bg-[var(--color-status-success-text)]',
  warning: 'bg-[var(--color-status-warning-text)]',
  error: 'bg-[var(--color-status-error-text)]',
  info: 'bg-[var(--color-status-info-text)]',
  ai: 'bg-[var(--color-ai-accent)]',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-1.5 py-0.5 rounded-[var(--radius-sm)] font-bold tracking-wider uppercase',
  md: 'text-xs px-2.5 py-1 rounded-[var(--radius-md)] font-semibold',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'subtle', color = 'default', size = 'md', icon, className = '', children, ...props }, ref) => {
    const isDot = variant === 'dot';

    const classes = [
      'inline-flex items-center gap-1.5 select-none font-medium',
      sizeClasses[size],
      colorVariantStyles[color][variant],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <span ref={ref} className={classes} {...props}>
        {isDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColorMap[color]}`} />}
        {icon && <span className="shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
