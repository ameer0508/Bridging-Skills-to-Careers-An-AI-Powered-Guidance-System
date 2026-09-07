import React, { useEffect, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface CountUpNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  value,
  duration = 1500,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [current, setCurrent] = useState<number>(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setCurrent(value);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const updateCounter = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out expo curve: 1 - Math.pow(2, -10 * progress)
      const easeValue = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setCurrent(easeValue * value);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCounter);
      }
    };

    animationFrameId = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration, prefersReducedMotion]);

  return (
    <span className={`tabular-nums font-bold ${className}`}>
      {prefix}
      {current.toFixed(decimals)}
      {suffix}
    </span>
  );
};

export default CountUpNumber;
