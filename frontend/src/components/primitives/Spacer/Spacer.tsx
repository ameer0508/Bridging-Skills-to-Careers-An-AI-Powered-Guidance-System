import React from 'react';

export interface SpacerProps {
  size?: number | string;
  axis?: 'horizontal' | 'vertical' | 'both';
  className?: string;
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 'var(--spacing-4)',
  axis = 'vertical',
  className = '',
}) => {
  const dimension = typeof size === 'number' ? `${size}px` : size;

  const style: React.CSSProperties = {
    width: axis === 'vertical' ? '1px' : dimension,
    height: axis === 'horizontal' ? '1px' : dimension,
    flexShrink: 0,
  };

  return <div style={style} className={className} aria-hidden="true" />;
};

Spacer.displayName = 'Spacer';
