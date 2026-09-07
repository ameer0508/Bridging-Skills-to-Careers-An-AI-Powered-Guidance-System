import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  className?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      fullWidth = false,
      disabled,
      required,
      id,
      className = '',
      rows = 4,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const helperId = `${textareaId}-helper`;

    const baseClasses =
      'w-full p-3 text-sm bg-[var(--input-bg)] border text-[var(--input-text)] placeholder:[var(--input-placeholder)] rounded-[var(--radius-md)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] disabled:opacity-50 disabled:cursor-not-allowed resize-y';

    const borderClass = error
      ? 'border-[var(--input-border-error)] focus:ring-[var(--input-border-error)]'
      : 'border-[var(--input-border)] hover:border-[var(--input-border-hover)]';

    return (
      <div className={`${fullWidth ? 'w-full' : 'inline-block'} ${className}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5"
          >
            {label}
            {required && <span className="text-[var(--color-status-error-text)] ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={helperText || error ? helperId : undefined}
          className={`${baseClasses} ${borderClass}`}
          {...props}
        />
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

Textarea.displayName = 'Textarea';
