import React, { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

/**
 * A card that leans slightly towards the pointer, with a soft glow under it. The pointer is tracked
 * in motion values, so moving the mouse never re-renders the card's content; with reduced motion
 * the card stays flat.
 */
export const TiltCard: React.FC<TiltCardProps> = ({ children, className = '', glowColor = 'rgba(99, 102, 241, 0.15)' }) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();
  const rotateX = useSpring(0, { stiffness: 300, damping: 30 });
  const rotateY = useSpring(0, { stiffness: 300, damping: 30 });
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const glowOpacity = useSpring(0, { stiffness: 200, damping: 30 });
  const glow = useMotionTemplate`radial-gradient(600px circle at ${glowX}% ${glowY}%, ${glowColor}, transparent 40%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    glowX.set(px * 100);
    glowY.set(py * 100);
    if (!reduce) {
      rotateY.set((px - 0.5) * 4);
      rotateX.set((0.5 - py) * 4);
    }
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    glowOpacity.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => glowOpacity.set(1)}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className={`relative overflow-hidden rounded-2xl border border-aurora-line bg-white shadow-aurora-sm ${className}`}
    >
      <motion.div aria-hidden="true" className="pointer-events-none absolute -inset-px" style={{ opacity: glowOpacity, background: glow }} />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
