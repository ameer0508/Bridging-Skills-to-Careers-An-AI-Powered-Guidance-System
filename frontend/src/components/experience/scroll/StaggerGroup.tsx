import React from 'react';
import { motion, Variants } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface StaggerGroupProps {
  children: React.ReactNode;
  staggerDelay?: number;
  initialDelay?: number;
  once?: boolean;
  className?: string;
  viewportAmount?: number;
}

export interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  yOffset?: number;
}

export const StaggerGroup: React.FC<StaggerGroupProps> = ({
  children,
  staggerDelay = 0.08,
  initialDelay = 0,
  once = true,
  className = '',
  viewportAmount = 0.1,
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: viewportAmount }}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className = '',
  yOffset = 20,
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
};

export default StaggerGroup;
