import React from 'react';
import { Icon } from '../../primitives/Icon';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  indeterminate?: boolean;
  error?: string;
  className?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      indeterminate = false,
      error,
      checked,
      disabled,
      id,
      className = '',
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const internalRef = React.useRef<HTMLInputElement | null>(null);

    React.useImperativeHandle(ref, () => internalRef.current!);

    React.useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    return (
      <div className={`inline-flex items-center gap-2 select-none ${className}`}>
        <div className="relative flex items-center justify-center">
          <input
            ref={internalRef}
            type="checkbox"
            id={inputId}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            aria-invalid={!!error}
            className="peer sr-only"
            {...props}
          />
          <div
            className={`w-4 h-4 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface-sunken)] transition-colors duration-[var(--duration-fast)] flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-border-focus)] peer-checked:bg-[var(--color-interactive-primary)] peer-checked:border-[var(--color-interactive-primary)] peer-disabled:opacity-50 peer-disabled:cursor-not-allowed cursor-pointer ${
              error ? 'border-[var(--color-border-error)]' : ''
            }`}
          >
            {checked && !indeterminate && (
              <Icon size={12} color="var(--color-text-on-primary)">
                <polyline points="20 6 9 17 4 12" />
              </Icon>
            )}
            {indeterminate && (
              <Icon size={12} color="var(--color-text-on-primary)">
                <line x1="5" y1="12" x2="19" y2="12" />
              </Icon>
            )}
          </div>
        </div>
        {label && (
          <label
            htmlFor={inputId}
            className={`text-sm text-[var(--color-text-primary)] cursor-pointer ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
