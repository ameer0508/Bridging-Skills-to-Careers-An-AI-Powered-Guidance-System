import React from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface PulseLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const PulseLoader: React.FC<PulseLoaderProps> = ({
  size = 'md',
  color = 'bg-indigo-600',
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();

  const sizeMap = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`rounded-full ${color} ${sizeMap[size]} ${
            prefersReducedMotion ? 'opacity-70' : 'animate-[sb-typing-dot_1.4s_infinite]'
          }`}
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
};

export default PulseLoader;
