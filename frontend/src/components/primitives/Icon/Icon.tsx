import React from 'react';

export type IconSize = 'sm' | 'md' | 'lg' | 'xl' | number;

export interface IconProps extends React.SVGAttributes<SVGElement> {
  size?: IconSize;
  color?: string;
  className?: string;
  children?: React.ReactNode;
  'aria-label'?: string;
}

const sizeMap: Record<string, number> = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 'md', color = 'currentColor', className = '', children, 'aria-label': ariaLabel, ...props }, ref) => {
    const dimension = typeof size === 'number' ? size : sizeMap[size] || 20;
    const isDecorative = !ariaLabel;

    return (
      <svg
        ref={ref}
        width={dimension}
        height={dimension}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden={isDecorative}
        aria-label={ariaLabel}
        role={ariaLabel ? 'img' : undefined}
        className={`inline-block shrink-0 align-middle ${className}`}
        {...props}
      >
        {children}
      </svg>
    );
  }
);

Icon.displayName = 'Icon';
