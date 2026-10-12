import React from 'react';
import { motion } from 'framer-motion';

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
  // Separate layout/grid classes for outer element so grid and flex containers work reliably
  const classTokens = className.split(/\s+/).filter(Boolean);
  const layoutClasses: string[] = [];
  const innerClasses: string[] = [];

  classTokens.forEach((token) => {
    if (
      token.includes('col-span') ||
      token.includes('row-span') ||
      token.startsWith('flex-') ||
      token.startsWith('order-') ||
      token.startsWith('self-')
    ) {
      layoutClasses.push(token);
    } else {
      innerClasses.push(token);
    }
  });

  const content = (
    <div
      className={`w-full relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl transition-all duration-300 group hover:border-white/20 ${innerClasses.join(' ')}`}
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
      initial={{ opacity: 0, y: 15 }}
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
