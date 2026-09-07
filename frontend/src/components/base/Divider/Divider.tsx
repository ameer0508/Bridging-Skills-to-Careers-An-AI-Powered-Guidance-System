import React from 'react';
import { Separator, SeparatorProps } from '../../primitives/Separator';

export interface DividerProps extends SeparatorProps {
  label?: React.ReactNode;
}

export const Divider: React.FC<DividerProps> = ({ label, className = '', ...props }) => {
  if (!label) {
    return <Separator className={className} {...props} />;
  }

  return (
    <div className={`flex items-center my-4 ${className}`}>
      <div className="flex-grow h-[1px] bg-[var(--color-border-subtle)]" />
      <span className="px-3 text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
        {label}
      </span>
      <div className="flex-grow h-[1px] bg-[var(--color-border-subtle)]" />
    </div>
  );
};

Divider.displayName = 'Divider';
