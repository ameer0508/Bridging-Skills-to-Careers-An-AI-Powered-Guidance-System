import React from 'react';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'interactive';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  className?: string;
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className = '', children, onClick, ...props }, ref) => {
    const isInteractive = variant === 'interactive' || !!onClick;

    const variantClasses: Record<CardVariant, string> = {
      default:
        'bg-[var(--card-bg-default)] border border-[var(--card-border-default)] shadow-[var(--card-shadow-default)]',
      elevated:
        'bg-[var(--card-bg-elevated)] border border-[var(--card-border-default)] shadow-[var(--card-shadow-elevated)]',
      outlined:
        'bg-transparent border border-[var(--color-border-default)] shadow-none',
      interactive:
        'bg-[var(--card-bg-default)] border border-[var(--card-border-default)] shadow-[var(--card-shadow-default)] hover:border-[var(--card-border-hover)] hover:shadow-[var(--card-shadow-hover)] cursor-pointer transition-all duration-[var(--duration-fast)] ease-[var(--ease-default)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]',
    };

    return (
      <div
        ref={ref}
        role={isInteractive ? 'article' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          isInteractive
            ? e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
                }
              }
            : undefined
        }
        className={`rounded-[var(--card-radius)] p-[var(--card-padding)] ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`mb-4 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);

CardHeader.displayName = 'CardHeader';

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={className} {...props}>
    {children}
  </div>
);

CardBody.displayName = 'CardBody';

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);

CardFooter.displayName = 'CardFooter';
