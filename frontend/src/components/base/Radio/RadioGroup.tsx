/* eslint-disable react-refresh/only-export-components */
import React from 'react';

export interface RadioGroupProps {
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children: React.ReactNode;
}

export const RadioGroupContext = React.createContext<{
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}>({ name: '' });

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  defaultValue,
  onChange,
  label,
  orientation = 'vertical',
  className = '',
  children,
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  const currentValue = value !== undefined ? value : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (value === undefined) setInternalValue(val);
    onChange?.(val);
  };

  return (
    <RadioGroupContext.Provider value={{ name, value: currentValue, onChange: handleChange }}>
      <div role="radiogroup" aria-label={label} className={`flex ${orientation === 'vertical' ? 'flex-col gap-2' : 'flex-row gap-4'} ${className}`}>
        {label && <span className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">{label}</span>}
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
};

RadioGroup.displayName = 'RadioGroup';
