import React, { useState } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface PrimaryCTAProps extends Omit<HTMLMotionProps<'button'>, 'onClick'> {
  children: React.ReactNode;
  isLoading?: boolean;
  isSuccess?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  fullWidth?: boolean;
  className?: string;
}

export const PrimaryCTA = React.forwardRef<HTMLButtonElement, PrimaryCTAProps>(
  (
    {
      children,
      isLoading = false,
      isSuccess = false,
      onClick,
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple = { id: Date.now(), x, y };

      setRipples((prev) => [...prev, newRipple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 600);

      onClick?.(e);
    };

    return (
      <motion.button
        ref={ref}
        onClick={handleClick}
        disabled={disabled || isLoading}
        whileHover={!prefersReducedMotion && !disabled ? { scale: 1.02, y: -1 } : undefined}
        whileTap={!prefersReducedMotion && !disabled ? { scale: 0.98 } : undefined}
        className={`relative overflow-hidden inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white rounded-xl bg-linear-to-r from-indigo-600 via-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
          fullWidth ? 'w-full' : ''
        } ${className}`}
        {...props}
      >
        {/* Shimmer Border Overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-20 bg-linear-to-r from-transparent via-white to-transparent -translate-x-full animate-[sb-shimmer_3s_infinite]"
        />


        {/* Click Ripple Array */}
        {!prefersReducedMotion &&
          ripples.map((ripple) => (
            <span
              key={ripple.id}
              className="absolute pointer-events-none rounded-full bg-white/40 animate-[sb-ripple_0.6s_ease-out]"
              style={{
                left: ripple.x - 20,
                top: ripple.y - 20,
                width: 40,
                height: 40,
              }}
            />
          ))}

        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
        ) : isSuccess ? (
          <Check className="w-5 h-5 text-emerald-300 shrink-0" />
        ) : null}

        <span className="relative z-10">{isSuccess ? 'Completed' : children}</span>
      </motion.button>
    );
  }
);

PrimaryCTA.displayName = 'PrimaryCTA';

export default PrimaryCTA;
