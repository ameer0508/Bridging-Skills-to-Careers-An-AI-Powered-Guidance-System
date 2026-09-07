import React, { useState, useRef, useEffect } from 'react';
import { SelectOption } from './Select';
import { Icon } from '../../primitives/Icon';

export interface MultiSelectProps {
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select options...',
  error,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter(v => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  const removeOption = (optValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optValue));
  };

  const selectedLabels = options.filter(o => value.includes(o.value));

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">{label}</label>}
      <div
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) setIsOpen(!isOpen);
          }
        }}
        className={`min-h-[40px] px-3 py-1.5 bg-[var(--input-bg)] border rounded-[var(--radius-md)] flex flex-wrap items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus)] ${
          error ? 'border-[var(--color-border-error)]' : 'border-[var(--input-border)] hover:border-[var(--input-border-hover)]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {selectedLabels.length === 0 && (
          <span className="text-sm text-[var(--input-placeholder)]">{placeholder}</span>
        )}
        {selectedLabels.map(opt => (
          <span
            key={opt.value}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] text-xs bg-[var(--color-interactive-secondary)] text-[var(--color-text-primary)]"
          >
            {opt.label}
            <button
              type="button"
              onClick={e => removeOption(opt.value, e)}
              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] focus:outline-none"
            >
              <Icon size={12}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </Icon>
            </button>
          </span>
        ))}
        <div className="ml-auto pointer-events-none text-[var(--color-text-tertiary)]">
          <Icon size="sm">
            <polyline points="6 9 12 15 18 9" />
          </Icon>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[var(--z-dropdown)] w-full mt-1 max-h-60 overflow-y-auto bg-[var(--color-bg-surface-raised)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] py-1">
          {options.map(opt => {
            const isSelected = value.includes(opt.value);
            return (
              <div
                key={opt.value}
                onClick={() => toggleOption(opt.value)}
                className={`px-3 py-2 text-sm flex items-center justify-between cursor-pointer hover:bg-[var(--color-interactive-secondary)] ${
                  isSelected ? 'text-[var(--color-interactive-primary)] font-semibold' : 'text-[var(--color-text-primary)]'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <Icon size="sm" color="var(--color-interactive-primary)">
                    <polyline points="20 6 9 17 4 12" />
                  </Icon>
                )}
              </div>
            );
          })}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-[var(--color-status-error-text)] font-medium">{error}</p>}
    </div>
  );
};

MultiSelect.displayName = 'MultiSelect';
