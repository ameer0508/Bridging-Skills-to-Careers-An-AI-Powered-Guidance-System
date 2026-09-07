import React from 'react';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  className?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, checked, disabled, id, className = '', onChange, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className={`inline-flex items-center gap-2 select-none ${className}`}>
        <div className="relative flex items-center justify-center">
          <input
            ref={ref}
            type="radio"
            id={inputId}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="peer sr-only"
            {...props}
          />
          <div className="w-4 h-4 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface-sunken)] transition-colors duration-[var(--duration-fast)] flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-border-focus)] peer-checked:border-[var(--color-interactive-primary)] peer-disabled:opacity-50 peer-disabled:cursor-not-allowed cursor-pointer">
            <div className="w-2 h-2 rounded-full bg-[var(--color-interactive-primary)] scale-0 peer-checked:scale-100 transition-transform duration-[var(--duration-fast)]" />
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

Radio.displayName = 'Radio';
