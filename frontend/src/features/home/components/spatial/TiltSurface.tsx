import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export interface TiltSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  maxRotation?: number;
  perspective?: number;
  className?: string;
  children: React.ReactNode;
}

export const TiltSurface: React.FC<TiltSurfaceProps> = ({
  maxRotation = 3.5,
  perspective = 1000,
  className = '',
  children,
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springConfig = { damping: 20, stiffness: 200 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  const rotateX = useTransform(smoothY, [0, 1], [maxRotation, -maxRotation]);
  const rotateY = useTransform(smoothX, [0, 1], [-maxRotation, maxRotation]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width;
    const relativeY = (e.clientY - rect.top) / rect.height;
    x.set(relativeX);
    y.set(relativeY);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <div style={{ perspective: `${perspective}px` }} className="relative w-full">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className={`relative transition-shadow duration-300 ${className}`}
        {...(props as any)}
      >
        {children}
      </motion.div>
    </div>
  );
};
