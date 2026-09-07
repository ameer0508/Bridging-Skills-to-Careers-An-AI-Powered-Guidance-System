import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label?: string;
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  label,
  className = '',
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      whileHover={!prefersReducedMotion ? { scale: 1.08, y: -2 } : undefined}
      whileTap={!prefersReducedMotion ? { scale: 0.92 } : undefined}
      className={`fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 p-4 font-medium text-white rounded-full bg-linear-to-r from-indigo-600 to-violet-600 shadow-xl shadow-indigo-600/30 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 cursor-pointer ${className}`}

      {...props}
    >
      <span className="shrink-0">{icon}</span>
      {label && <span className="pr-1 text-sm font-medium">{label}</span>}
    </motion.button>
  );
};

export default FloatingActionButton;
