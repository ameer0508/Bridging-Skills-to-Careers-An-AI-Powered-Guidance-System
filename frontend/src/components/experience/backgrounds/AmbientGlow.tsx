import React from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface AmbientGlowProps {
  color?: string;
  size?: number | string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  className?: string;
  blur?: number;
  pulse?: boolean;
}

export const AmbientGlow: React.FC<AmbientGlowProps> = ({
  color = 'rgba(99, 102, 241, 0.25)',
  size = 400,
  position = 'top-right',
  className = '',
  blur = 80,
  pulse = true,
}) => {
  const prefersReducedMotion = useReducedMotion();

  const positionClasses = {
    'top-left': '-top-20 -left-20',
    'top-right': '-top-20 -right-20',
    'bottom-left': '-bottom-20 -left-20',
    'bottom-right': '-bottom-20 -right-20',
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  };

  return (
    <div
      aria-hidden="true"
      className={`absolute pointer-events-none rounded-full transition-opacity ${positionClasses[position]} ${
        pulse && !prefersReducedMotion ? 'animate-[sb-glow-pulse_6s_ease-in-out_infinite]' : ''
      } ${className}`}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        background: color,
        filter: `blur(${blur}px)`,
      }}
    />
  );
};

export default AmbientGlow;
