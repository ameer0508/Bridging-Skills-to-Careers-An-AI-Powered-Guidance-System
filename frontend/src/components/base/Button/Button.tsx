import React from 'react';
import { Spinner } from '../Progress/Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--button-bg-primary)] text-[var(--button-text-primary)] hover:bg-[var(--button-bg-primary-hover)] active:bg-[var(--button-bg-primary-active)] shadow-sm focus-visible:outline-[var(--color-border-focus)]',
  secondary:
    'bg-[var(--button-bg-secondary)] border border-[var(--button-border-secondary)] text-[var(--button-text-secondary)] hover:bg-[var(--button-bg-secondary-hover)] focus-visible:outline-[var(--color-border-focus)]',
  ghost:
    'bg-[var(--button-bg-ghost)] text-[var(--button-text-ghost)] hover:bg-[var(--button-bg-ghost-hover)] focus-visible:outline-[var(--color-border-focus)]',
  destructive:
    'bg-[var(--button-bg-destructive)] text-[var(--button-text-destructive)] hover:bg-[var(--button-bg-destructive-hover)] focus-visible:outline-[var(--color-border-error)]',
  outline:
    'bg-transparent border border-[var(--color-border-default)] text-[var(--color-text-primary)] hover:bg-[var(--color-interactive-secondary-hover)] focus-visible:outline-[var(--color-border-focus)]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-[var(--radius-sm)]',
  md: 'h-10 px-4 text-sm gap-2 rounded-[var(--radius-md)]',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-[var(--radius-lg)]',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isButtonDisabled = disabled || isLoading;

    const baseClasses =
      'inline-flex items-center justify-center font-medium transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)] select-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer';

    const classes = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      fullWidth ? 'w-full' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={type}
        disabled={isButtonDisabled}
        aria-busy={isLoading}
        className={classes}
        {...props}
      >
        {isLoading && <Spinner size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
