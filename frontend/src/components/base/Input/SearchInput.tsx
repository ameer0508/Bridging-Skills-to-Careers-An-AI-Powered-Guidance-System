import React from 'react';
import { Input, InputProps } from './Input';
import { Icon } from '../../primitives/Icon';

export interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onClear, rightIcon, placeholder = 'Search...', ...props }, ref) => {
    const searchIcon = (
      <Icon size="sm">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </Icon>
    );

    const hasValue = value !== undefined && value !== '';

    const clearButton = hasValue ? (
      <button
        type="button"
        onClick={onClear}
        className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] focus:outline-none cursor-pointer"
        aria-label="Clear search"
      >
        <Icon size="sm">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </Icon>
      </button>
    ) : (
      rightIcon
    );

    return (
      <Input
        ref={ref}
        type="search"
        placeholder={placeholder}
        leftIcon={searchIcon}
        rightIcon={clearButton}
        value={value}
        onChange={onChange}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';
