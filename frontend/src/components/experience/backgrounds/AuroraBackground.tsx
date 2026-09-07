import React from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface AuroraBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  opacity?: number;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  className = '',
  children,
  opacity = 0.4,
}) => {
  const { resolvedTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`relative overflow-hidden w-full h-full ${className}`}>
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{ opacity }}
      >
        <div
          className={`absolute -top-1/2 -left-1/2 w-[200%] h-[200%] ${
            prefersReducedMotion ? '' : 'animate-[sb-aurora_25s_ease-in-out_infinite]'
          }`}
          style={{
            background: isDark
              ? 'radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.12), rgba(14, 165, 233, 0.08), transparent 70%)'
              : 'radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, 0.12), rgba(192, 132, 252, 0.1), rgba(56, 189, 248, 0.06), transparent 70%)',
          }}
        />
        <div
          className={`absolute -top-1/4 -right-1/4 w-[150%] h-[150%] ${
            prefersReducedMotion ? '' : 'animate-[sb-aurora_35s_ease-in-out_infinite_reverse]'
          }`}
          style={{
            background: isDark
              ? 'radial-gradient(circle at 60% 40%, rgba(236, 72, 153, 0.12), rgba(99, 102, 241, 0.08), transparent 60%)'
              : 'radial-gradient(circle at 60% 40%, rgba(244, 114, 182, 0.1), rgba(129, 140, 248, 0.06), transparent 60%)',
          }}
        />
      </div>
      {children}
    </div>
  );
};

export default AuroraBackground;
