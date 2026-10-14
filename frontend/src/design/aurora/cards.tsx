import React from 'react';

/**
 * Light (Aurora Elite) versions of components/base/Card with the same names and props, so a
 * migrated screen changes only its import.
 */
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: string }>(
  ({ variant: _variant, className = '', children, ...props }, ref) => (
    <div ref={ref} className={`rounded-[28px] border border-aurora-line bg-white p-5 shadow-aurora-sm sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  )
);
Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`mb-4 flex items-center justify-between gap-3 ${className}`} {...props}>
    {children}
  </div>
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`text-aurora-ink ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`mt-4 flex items-center gap-2 border-t border-aurora-line pt-4 ${className}`} {...props}>
    {children}
  </div>
);
