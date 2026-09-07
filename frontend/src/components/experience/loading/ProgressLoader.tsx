import React from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface ProgressLoaderProps {
  progress?: number; // 0 to 100, undefined for indeterminate
  height?: number;
  showLabel?: boolean;
  className?: string;
}

export const ProgressLoader: React.FC<ProgressLoaderProps> = ({
  progress,
  height = 6,
  showLabel = false,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const isIndeterminate = progress === undefined;

  return (
    <div className={`w-full ${className}`}>
      {showLabel && !isIndeterminate && (
        <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
          <span>Processing...</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div
        className="w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
        style={{ height: `${height}px` }}
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-400 transition-all duration-300 ${
            isIndeterminate && !prefersReducedMotion
              ? 'w-1/3 animate-[sb-shimmer_1.5s_infinite_linear]'
              : ''
          }`}
          style={{
            width: isIndeterminate ? undefined : `${Math.min(100, Math.max(0, progress))}%`,
          }}
        />
      </div>
    </div>
  );
};

export default ProgressLoader;
