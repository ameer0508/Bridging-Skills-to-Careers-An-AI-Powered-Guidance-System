import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface RevealTextProps {
  text: string;
  className?: string;
  delay?: number;
  wordStagger?: number;
}

export const RevealText: React.FC<RevealTextProps> = ({
  text,
  className = '',
  delay = 0,
  wordStagger = 0.06,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const words = text.split(' ');

  if (prefersReducedMotion) {
    return <span className={className}>{text}</span>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: wordStagger,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
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
      className={`inline-flex flex-wrap gap-x-[0.25em] ${className}`}
    >
      {words.map((word, index) => (
        <motion.span key={index} variants={wordVariants} className="inline-block">
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
};

export default RevealText;
