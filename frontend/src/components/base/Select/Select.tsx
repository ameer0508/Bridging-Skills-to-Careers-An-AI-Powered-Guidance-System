import React from 'react';
import { Icon } from '../../primitives/Icon';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  label?: string;
  helperText?: string;
  error?: string;
  selectSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 px-2.5 pr-8 text-xs rounded-[var(--radius-sm)]',
  md: 'h-10 px-3.5 pr-9 text-sm rounded-[var(--radius-md)]',
  lg: 'h-12 px-4 pr-10 text-base rounded-[var(--radius-lg)]',
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      label,
      helperText,
      error,
      selectSize = 'md',
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
    const selectId = id || generatedId;
    const helperId = `${selectId}-helper`;

    const baseClasses =
      'w-full appearance-none bg-[var(--input-bg)] border text-[var(--input-text)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

    const borderClass = error
      ? 'border-[var(--input-border-error)] focus:ring-[var(--input-border-error)]'
      : 'border-[var(--input-border)] hover:border-[var(--input-border-hover)]';

    return (
      <div className={`${fullWidth ? 'w-full' : 'inline-block'} ${className}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5"
          >
            {label}
            {required && <span className="text-[var(--color-status-error-text)] ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={helperText || error ? helperId : undefined}
            className={`${baseClasses} ${borderClass} ${sizeClasses[selectSize]}`}
            {...props}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 pointer-events-none text-[var(--color-text-tertiary)] flex items-center">
            <Icon size="sm">
              <polyline points="6 9 12 15 18 9" />
            </Icon>
          </div>
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

Select.displayName = 'Select';
