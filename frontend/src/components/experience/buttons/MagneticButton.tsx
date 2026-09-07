import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  magneticStrength?: number;
  className?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  magneticStrength = 0.3,
  className = '',
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || prefersReducedMotion) return;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = (e.clientX - centerX) * magneticStrength;
    const distanceY = (e.clientY - centerY) * magneticStrength;
    setPosition({ x: distanceX, y: distanceY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 350, damping: 20, mass: 0.5 }}
      className={`relative inline-flex items-center justify-center font-medium rounded-lg px-5 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default MagneticButton;
