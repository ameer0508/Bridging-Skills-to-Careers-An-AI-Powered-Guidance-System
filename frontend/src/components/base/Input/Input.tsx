import React from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  inputSize?: InputSize;
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'h-8 px-2.5 text-xs rounded-[var(--radius-sm)]',
  md: 'h-10 px-3.5 text-sm rounded-[var(--radius-md)]',
  lg: 'h-12 px-4 text-base rounded-[var(--radius-lg)]',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      inputSize = 'md',
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      required,
      id,
      className = '',
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const helperId = `${inputId}-helper`;

    const baseInputClasses =
      'w-full bg-[var(--input-bg)] border text-[var(--input-text)] placeholder:[var(--input-placeholder)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] disabled:opacity-50 disabled:cursor-not-allowed';

    const borderClass = error
      ? 'border-[var(--input-border-error)] focus:ring-[var(--input-border-error)]'
      : 'border-[var(--input-border)] hover:border-[var(--input-border-hover)]';

    const paddingLeft = leftIcon ? (inputSize === 'sm' ? 'pl-8' : inputSize === 'lg' ? 'pl-11' : 'pl-9') : '';
    const paddingRight = rightIcon ? (inputSize === 'sm' ? 'pr-8' : inputSize === 'lg' ? 'pr-11' : 'pr-9') : '';

    return (
      <div className={`${fullWidth ? 'w-full' : 'inline-block'} ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5"
          >
            {label}
            {required && <span className="text-[var(--color-status-error-text)] ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center justify-center text-[var(--color-text-tertiary)] pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={helperText || error ? helperId : undefined}
            className={`${baseInputClasses} ${borderClass} ${sizeClasses[inputSize]} ${paddingLeft} ${paddingRight}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center justify-center text-[var(--color-text-tertiary)]">
              {rightIcon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p
            id={helperId}
            className={`mt-1 text-xs ${
              error ? 'text-[var(--color-status-error-text)] font-medium' : 'text-[var(--color-text-tertiary)]'
            }`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
