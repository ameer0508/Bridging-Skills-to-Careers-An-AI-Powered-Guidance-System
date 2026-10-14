import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  blur?: 'sm' | 'md' | 'lg';
  glowColor?: string;
  hoverEffect?: boolean;
  className?: string;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      children,
      blur = 'md',
      glowColor = 'rgba(99, 102, 241, 0.15)',
      hoverEffect = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();

    const blurMap = {
      sm: '',
      md: '',
      lg: '',
    };

    return (
      <motion.div
        ref={ref}
        whileHover={
          hoverEffect && !prefersReducedMotion
            ? { y: -4, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }
            : undefined
        }
        className={`relative overflow-hidden rounded-xl border border-aurora-line dark:border-aurora-line light:border-black/10 bg-aurora-canvas dark:bg-neutral-900/40 light:bg-white/80 shadow-lg ${blurMap[blur]} ${className}`}
        style={{
          boxShadow: hoverEffect ? `0 10px 30px -10px ${glowColor}` : undefined,
        }}
        {...props}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none bg-linear-to-br from-white/10 via-transparent to-transparent opacity-50"

        />
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
