import React from 'react';

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  maxHeight?: string | number;
  className?: string;
  children: React.ReactNode;
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ maxHeight, className = '', children, style, ...props }, ref) => {
    const computedStyle: React.CSSProperties = {
      overflowY: 'auto',
      overflowX: 'hidden',
      ...(maxHeight !== undefined
        ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }
        : {}),
      ...style,
    };

    return (
      <div ref={ref} className={`relative custom-scrollbar ${className}`} style={computedStyle} {...props}>
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';
