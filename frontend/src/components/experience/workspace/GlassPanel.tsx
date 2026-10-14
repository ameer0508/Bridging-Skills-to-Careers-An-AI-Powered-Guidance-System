import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  animateIn?: boolean;
  /** Makes the whole panel an accessible button (click, Enter or Space). */
  onClick?: () => void;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = '',
  glowColor = 'rgba(99, 102, 241, 0.12)',
  animateIn = true,
  onClick,
}) => {
  // With reduced motion the panel is shown at once, whether or not it has scrolled into view
  const reducedMotion = useReducedMotion();
  const interactive = onClick
    ? {
        role: 'button' as const,
        tabIndex: 0,
        onClick,
        onKeyDown: (event: React.KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
          }
        },
      }
    : {};
  // Classes that place the panel inside its parent's grid or flex row go on the outer element;
  // everything else, including the panel's own flex direction, stays on the panel itself
  const ITEM_CLASS = /^(col-span|col-start|col-end|row-span|row-start|row-end|order|self|justify-self|place-self|basis|grow|shrink|flex-(1|auto|initial|none)$)/;
  const classTokens = className.split(/\s+/).filter(Boolean);
  const layoutClasses: string[] = [];
  const innerClasses: string[] = [];

  classTokens.forEach((token) => {
    const utility = token.slice(token.lastIndexOf(':') + 1);
    if (ITEM_CLASS.test(utility)) {
      layoutClasses.push(token);
    } else {
      innerClasses.push(token);
    }
  });

  const content = (
    <div
      className={`w-full relative overflow-hidden rounded-2xl border border-aurora-line bg-white shadow-aurora-sm transition-colors duration-300 group hover:border-aurora-lavender/60 ${innerClasses.join(' ')}`}
    >
      {/* Reflection Glow */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at 50% 0%, ${glowColor}, transparent 50%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );

  const outerClass = `w-full ${layoutClasses.join(' ')}`.trim();

  if (!animateIn) {
    return (
      <div className={outerClass} {...interactive}>
        {content}
      </div>
    );
  }

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={outerClass}
      {...interactive}
    >
      {content}
    </motion.div>
  );
};
