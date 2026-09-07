import React from 'react';

export interface BoxProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  className?: string;
  children?: React.ReactNode;
}

export const Box = React.forwardRef<HTMLElement, BoxProps>(
  ({ as: Component = 'div', className = '', children, ...props }, ref) => {
    return (
      <Component ref={ref} className={className} {...props}>
        {children}
      </Component>
    );
  }
);

Box.displayName = 'Box';
