import React from 'react';
import { Icon } from '../../primitives/Icon';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'static' | 'removable' | 'interactive';
  onRemove?: () => void;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  (
    {
      variant = 'static',
      onRemove,
      onClick,
      icon,
      disabled = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isInteractive = variant === 'interactive' || !!onClick;
    const isRemovable = variant === 'removable' || !!onRemove;

    const baseClasses =
      'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-[var(--radius-full)] bg-[var(--color-interactive-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] select-none transition-colors duration-[var(--duration-fast)]';

    const interactiveClasses = isInteractive
      ? 'hover:bg-[var(--color-interactive-secondary-hover)] hover:border-[var(--color-border-strong)] cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]'
      : '';

    const disabledClasses = disabled ? 'opacity-50 pointer-events-none cursor-not-allowed' : '';

    return (
      <span
        ref={ref}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive && !disabled ? 0 : undefined}
        onClick={!disabled ? onClick : undefined}
        onKeyDown={e => {
          if (isInteractive && !disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick?.();
          }
        }}
        className={`${baseClasses} ${interactiveClasses} ${disabledClasses} ${className}`}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
        {isRemovable && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onRemove?.();
            }}
            disabled={disabled}
            aria-label="Remove chip"
            className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] focus:outline-none rounded-full p-0.5"
          >
            <Icon size={12}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </Icon>
          </button>
        )}
      </span>
    );
  }
);

Chip.displayName = 'Chip';
