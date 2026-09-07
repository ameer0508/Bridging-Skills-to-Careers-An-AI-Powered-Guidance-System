import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const variantClasses = {
    text: 'h-4 w-full rounded-[var(--radius-sm)]',
    circle: 'rounded-full shrink-0',
    rect: 'rounded-[var(--radius-md)] w-full h-24',
  };

  const computedStyle: React.CSSProperties = {
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...style,
  };

  return (
    <div
      role="status"
      aria-label="Loading content..."
      className={`animate-shimmer bg-[var(--color-bg-surface-raised)] border border-[var(--color-border-subtle)] ${variantClasses[variant]} ${className}`}
      style={computedStyle}
      {...props}
    />
  );
};

Skeleton.displayName = 'Skeleton';
