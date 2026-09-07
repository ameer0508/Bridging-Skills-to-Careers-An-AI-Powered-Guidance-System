import React from 'react';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'home' | 'default' | 'settings' | 'full';
  className?: string;
  children?: React.ReactNode;
}

const sizeClassMap = {
  home: 'workspace-content--home',
  default: 'workspace-content',
  settings: 'workspace-content--settings',
  full: 'w-full px-4 sm:px-6 lg:px-8',
};

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ size = 'default', className = '', children, ...props }, ref) => {
    const classes = [sizeClassMap[size], className].filter(Boolean).join(' ');
    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';
