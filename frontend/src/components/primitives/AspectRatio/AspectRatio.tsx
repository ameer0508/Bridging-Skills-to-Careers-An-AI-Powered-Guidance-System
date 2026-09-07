import React from 'react';

export interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  ratio?: number; // e.g. 16 / 9 = 1.7777, 1 / 1 = 1, 4 / 3 = 1.333
  className?: string;
  children: React.ReactNode;
}

export const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ ratio = 16 / 9, className = '', children, style, ...props }, ref) => {
    const paddingBottom = `${(1 / ratio) * 100}%`;

    return (
      <div
        ref={ref}
        className={`relative w-full ${className}`}
        style={{ paddingBottom, ...style }}
        {...props}
      >
        <div className="absolute inset-0 w-full h-full">{children}</div>
      </div>
    );
  }
);

AspectRatio.displayName = 'AspectRatio';
