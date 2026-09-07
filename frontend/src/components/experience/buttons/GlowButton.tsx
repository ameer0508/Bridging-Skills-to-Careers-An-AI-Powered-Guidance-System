import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface GlowButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode;
  glowColor?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  (
    {
      children,
      glowColor = 'rgba(99, 102, 241, 0.5)',
      size = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs rounded-md',
      md: 'px-5 py-2.5 text-sm rounded-lg',
      lg: 'px-7 py-3.5 text-base rounded-xl',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={!prefersReducedMotion ? { scale: 1.03 } : undefined}
        whileTap={!prefersReducedMotion ? { scale: 0.97 } : undefined}
        className={`relative inline-flex items-center justify-center font-semibold text-white bg-linear-to-r from-indigo-600 to-violet-600 shadow-md outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 ${sizeClasses[size]} ${className}`}

        style={{
          boxShadow: `0 0 20px -3px ${glowColor}`,
        }}
        {...props}
      >
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </motion.button>
    );
  }
);

GlowButton.displayName = 'GlowButton';

export default GlowButton;
