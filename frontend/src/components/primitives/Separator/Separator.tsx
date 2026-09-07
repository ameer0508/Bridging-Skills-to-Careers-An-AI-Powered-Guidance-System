import React from 'react';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
  className?: string;
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ orientation = 'horizontal', decorative = true, className = '', ...props }, ref) => {
    const isHorizontal = orientation === 'horizontal';

    const classes = [
      'bg-[var(--color-border-subtle)] shrink-0',
      isHorizontal ? 'h-[1px] w-full my-2' : 'w-[1px] h-full mx-2',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={ref}
        role={decorative ? 'none' : 'separator'}
        aria-orientation={decorative ? undefined : orientation}
        className={classes}
        {...props}
      />
    );
  }
);

Separator.displayName = 'Separator';
