import React from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface AnimatedMeshGradientProps {
  className?: string;
  intensity?: 'soft' | 'medium' | 'vibrant';
  children?: React.ReactNode;
}

export const AnimatedMeshGradient: React.FC<AnimatedMeshGradientProps> = ({
  className = '',
  intensity = 'medium',
  children,
}) => {
  const { resolvedTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const isDark = resolvedTheme === 'dark';

  const opacityMap = {
    soft: isDark ? 0.25 : 0.15,
    medium: isDark ? 0.4 : 0.25,
    vibrant: isDark ? 0.65 : 0.45,
  };

  return (
    <div className={`relative overflow-hidden w-full h-full ${className}`}>
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{ opacity: opacityMap[intensity] }}
      >
        <div
          className={`absolute inset-0 ${
            prefersReducedMotion ? '' : 'animate-[sb-mesh-spin_30s_linear_infinite]'
          }`}
          style={{
            backgroundImage: isDark
              ? `radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.4) 0px, transparent 50%),
                 radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.35) 0px, transparent 50%),
                 radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.3) 0px, transparent 50%),
                 radial-gradient(at 0% 100%, rgba(236, 72, 153, 0.3) 0px, transparent 50%)`
              : `radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.25) 0px, transparent 50%),
                 radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.2) 0px, transparent 50%),
                 radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.2) 0px, transparent 50%),
                 radial-gradient(at 0% 100%, rgba(244, 114, 182, 0.2) 0px, transparent 50%)`,
            filter: 'blur(60px)',
          }}
        />
      </div>
      {children}
    </div>
  );
};

export default AnimatedMeshGradient;
