import React from 'react';

export interface SkeletonShimmerProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export const SkeletonShimmer: React.FC<SkeletonShimmerProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  className = '',
}) => {
  return (
    <div
      aria-hidden="true"
      className={`animate-shimmer overflow-hidden relative rounded-md bg-neutral-200/80 dark:bg-neutral-800/80 ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
      }}
    />
  );
};

export default SkeletonShimmer;
