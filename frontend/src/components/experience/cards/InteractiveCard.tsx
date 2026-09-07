import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface InteractiveCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  active?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
}

export const InteractiveCard = React.forwardRef<HTMLDivElement, InteractiveCardProps>(
  ({ children, active = false, onClick, className = '', ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
      }
    };

    return (
      <motion.div
        ref={ref}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        whileHover={!prefersReducedMotion ? { y: -3, scale: 1.01 } : undefined}
        whileTap={!prefersReducedMotion ? { scale: 0.98 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`rounded-xl p-6 cursor-pointer outline-none transition-colors border ${
          active
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md shadow-indigo-500/10'
            : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-indigo-300 dark:hover:border-indigo-700'
        } focus-visible:ring-2 focus-visible:ring-indigo-500 ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

InteractiveCard.displayName = 'InteractiveCard';

export default InteractiveCard;
