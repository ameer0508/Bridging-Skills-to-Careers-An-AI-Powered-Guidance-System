import React from 'react';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const trackSizeClasses = {
  sm: 'w-7 h-4 p-0.5',
  md: 'w-10 h-6 p-1',
  lg: 'w-12 h-7 p-1',
};

const thumbSizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const translateClasses = {
  sm: 'translate-x-3',
  md: 'translate-x-4',
  lg: 'translate-x-5',
};

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, size = 'md', checked, disabled, id, className = '', onChange, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className={`inline-flex items-center gap-2 select-none ${className}`}>
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="checkbox"
            role="switch"
            id={inputId}
            checked={checked}
            aria-checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="peer sr-only"
            {...props}
          />
          <div
            className={`${trackSizeClasses[size]} rounded-full bg-[var(--color-bg-surface-sunken)] border border-[var(--color-border-default)] transition-colors duration-[var(--duration-normal)] ease-[var(--ease-default)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-border-focus)] peer-checked:bg-[var(--color-interactive-primary)] peer-checked:border-[var(--color-interactive-primary)] peer-disabled:opacity-50 peer-disabled:cursor-not-allowed cursor-pointer flex items-center`}
          >
            <div
              className={`${thumbSizeClasses[size]} rounded-full bg-white shadow-sm transition-transform duration-[var(--duration-normal)] ease-[var(--ease-default)] transform ${
                checked ? translateClasses[size] : 'translate-x-0'
              }`}
            />
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

Switch.displayName = 'Switch';
