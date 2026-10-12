import React from 'react';

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  tier?: 'sunken' | 'base' | 'elevated' | 'floating';
  glowBorder?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  tier = 'base',
  glowBorder = false,
  className = '',
  children,
  ...props
}) => {
  const tierClasses = {
    sunken: 'bg-[rgba(10,14,24,0.45)] backdrop-blur-md border-white/[0.04] shadow-inner',
    base: 'bg-[rgba(13,18,30,0.7)] backdrop-blur-xl border-white/[0.07] shadow-xl',
    elevated: 'bg-[rgba(18,25,42,0.85)] backdrop-blur-2xl border-white/[0.12] shadow-2xl',
    floating: 'bg-[rgba(24,34,56,0.95)] backdrop-blur-3xl border-white/[0.18] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)]',
  };

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-300 overflow-hidden ${tierClasses[tier]} ${
        glowBorder ? 'hover:border-amber-400/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]' : ''
      } ${className}`}
      {...props}
    >
      {/* Razor Specular Top-Edge Reflection */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};
