import React from 'react';
import { Button, ButtonProps } from './Button';

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

const iconButtonSizeClasses = {
  sm: 'w-8 h-8 p-0',
  md: 'w-10 h-10 p-0',
  lg: 'w-12 h-12 p-0',
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'md', className = '', 'aria-label': ariaLabel, ...props }, ref) => {
    const sizeClass = iconButtonSizeClasses[size];

    return (
      <Button
        ref={ref}
        size={size}
        aria-label={ariaLabel}
        className={`${sizeClass} ${className}`}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';
