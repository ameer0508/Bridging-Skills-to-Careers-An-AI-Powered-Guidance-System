import React from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface MovingGradientProps {
  className?: string;
  from?: string;
  via?: string;
  to?: string;
  height?: string;
}

export const MovingGradient: React.FC<MovingGradientProps> = ({
  className = '',
  from = '#6366f1',
  via = '#a855f7',
  to = '#0ea5e9',
  height = '4px',
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className={`w-full overflow-hidden ${className}`}
      style={{ height }}
    >
      <div
        className={`w-[200%] h-full ${
          prefersReducedMotion ? '' : 'animate-[sb-shimmer_4s_linear_infinite]'
        }`}
        style={{
          background: `linear-gradient(90deg, ${from}, ${via}, ${to}, ${from})`,
          backgroundSize: '200% 100%',
        }}
      />
    </div>
  );
};

export default MovingGradient;
