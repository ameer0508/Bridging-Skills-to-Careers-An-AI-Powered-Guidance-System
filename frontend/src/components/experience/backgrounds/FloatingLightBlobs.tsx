import React from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface FloatingLightBlobsProps {
  count?: number;
  className?: string;
}

export const FloatingLightBlobs: React.FC<FloatingLightBlobsProps> = ({
  count = 3,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();

  const blobs = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: 250 + (i % 3) * 100,
    top: `${(i * 30) % 80}%`,
    left: `${(i * 35) % 85}%`,
    duration: 18 + i * 5,
    delay: i * 2,
    color:
      i % 3 === 0
        ? 'rgba(99, 102, 241, 0.18)'
        : i % 3 === 1
        ? 'rgba(168, 85, 247, 0.15)'
        : 'rgba(56, 189, 248, 0.15)',
  }));

  return (
    <div aria-hidden="true" className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {blobs.map((blob) => (
        <div
          key={blob.id}
          className={`absolute rounded-full filter blur-[70px] ${
            prefersReducedMotion ? '' : 'animate-[sb-aurora_20s_ease-in-out_infinite]'
          }`}
          style={{
            width: `${blob.size}px`,
            height: `${blob.size}px`,
            top: blob.top,
            left: blob.left,
            backgroundColor: blob.color,
            animationDuration: `${blob.duration}s`,
            animationDelay: `${blob.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

export default FloatingLightBlobs;
