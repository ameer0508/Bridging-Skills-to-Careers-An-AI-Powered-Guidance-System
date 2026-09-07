import React from 'react';

export interface AnimatedGradientTextProps {
  children: React.ReactNode;
  gradient?: string;
  className?: string;
}

export const AnimatedGradientText: React.FC<AnimatedGradientTextProps> = ({
  children,
  gradient = 'from-indigo-500 via-purple-500 to-sky-400',
  className = '',
}) => {
  return (
    <span
      className={`animated-gradient-text bg-gradient-to-r ${gradient} font-extrabold ${className}`}
    >
      {children}
    </span>
  );
};

export default AnimatedGradientText;
