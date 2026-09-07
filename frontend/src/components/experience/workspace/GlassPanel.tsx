import React from 'react';
import { motion } from 'framer-motion';

export interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  animateIn?: boolean;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = '',
  glowColor = 'rgba(99, 102, 241, 0.12)',
  animateIn = true,
}) => {
  const content = (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl transition-all duration-300 group hover:border-white/20 ${className}`}
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

  if (!animateIn) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      {content}
    </motion.div>
  );
};
