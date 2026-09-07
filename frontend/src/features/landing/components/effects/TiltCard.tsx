import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = '',
  glowColor = 'rgba(99, 102, 241, 0.15)',
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const px = mouseX / width;
    const py = mouseY / height;

    const rY = (px - 0.5) * 12; // tilt angle
    const rX = (0.5 - py) * 12;

    setRotateX(rX);
    setRotateY(rY);
    setSpotlightPos({ x: (mouseX / width) * 100, y: (mouseY / height) * 100 });
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setSpotlightPos({ x: 50, y: 50 });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX,
        rotateY,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl transition-all duration-300 ${className}`}
    >
      {/* Spotlight Hover Glow Overlay */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(600px circle at ${spotlightPos.x}% ${spotlightPos.y}%, ${glowColor}, transparent 40%)`,
        }}
      />

      {/* Glass border sheen on hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 transition-opacity duration-300"
        style={{ opacity: isHovered ? 0.6 : 0 }}
      />

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
