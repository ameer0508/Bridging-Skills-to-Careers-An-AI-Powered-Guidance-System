import React from 'react';

export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <span ref={ref} className={`sr-only ${className}`} {...props}>
        {children}
      </span>
    );
  }
);

VisuallyHidden.displayName = 'VisuallyHidden';
