import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface HoverCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowGradient?: string;
  className?: string;
}

export const HoverCard: React.FC<HoverCardProps> = ({
  children,
  glowGradient = 'from-indigo-500 via-purple-500 to-pink-500',
  className = '',
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState<boolean>(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative group rounded-xl p-px transition-all duration-300 ${className}`}
      {...props}
    >
      {!prefersReducedMotion && (
        <div
          aria-hidden="true"
          className={`absolute -inset-0.5 rounded-xl bg-linear-to-r ${glowGradient} opacity-0 blur transition duration-300 group-hover:opacity-70`}
        />
      )}

      <motion.div
        animate={
          isHovered && !prefersReducedMotion
            ? { y: -2 }
            : { y: 0 }
        }
        className="relative rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default HoverCard;
