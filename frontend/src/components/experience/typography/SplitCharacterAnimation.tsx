import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface SplitCharacterAnimationProps {
  text: string;
  className?: string;
  delay?: number;
}

export const SplitCharacterAnimation: React.FC<SplitCharacterAnimationProps> = ({
  text,
  className = '',
  delay = 0,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const characters = Array.from(text);

  if (prefersReducedMotion) {
    return <span className={className}>{text}</span>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: delay,
      },
    },
  };

  const charVariants = {
    hidden: { opacity: 0, y: 20, rotateX: -90 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={containerVariants}
      className={`inline-flex flex-wrap ${className}`}
    >
      {characters.map((char, index) => (
        <motion.span key={index} variants={charVariants} className="inline-block">
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  );
};

export default SplitCharacterAnimation;
