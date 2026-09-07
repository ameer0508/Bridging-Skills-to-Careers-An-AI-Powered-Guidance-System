import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface ElevatedCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  elevation?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  className?: string;
}

export const ElevatedCard = React.forwardRef<HTMLDivElement, ElevatedCardProps>(
  (
    {
      children,
      elevation = 'md',
      interactive = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();

    const elevationShadows = {
      sm: 'shadow-md dark:shadow-neutral-950/40',
      md: 'shadow-lg dark:shadow-neutral-950/60',
      lg: 'shadow-xl dark:shadow-neutral-950/80',
    };

    return (
      <motion.div
        ref={ref}
        whileHover={
          interactive && !prefersReducedMotion
            ? { y: -6, scale: 1.005, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }
            : undefined
        }
        whileTap={interactive && !prefersReducedMotion ? { scale: 0.99, y: -2 } : undefined}
        className={`rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 transition-shadow duration-300 ${elevationShadows[elevation]} ${
          interactive ? 'cursor-pointer' : ''
        } ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

ElevatedCard.displayName = 'ElevatedCard';

export default ElevatedCard;
