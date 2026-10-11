import React, { useRef, useState, useCallback } from 'react';

export interface SpotlightSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  spotlightColor?: string;
  spotlightRadius?: number;
  className?: string;
  children: React.ReactNode;
}

export const SpotlightSurface: React.FC<SpotlightSurfaceProps> = ({
  spotlightColor = 'rgba(226, 179, 87, 0.08)',
  spotlightRadius = 350,
  className = '',
  children,
  ...props
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setOpacity(1);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setOpacity(0);
  }, []);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[rgba(13,18,30,0.7)] backdrop-blur-2xl transition-all duration-300 ${className}`}
      {...props}
    >
      {/* Specular Top Razor Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-10" />

      {/* Dynamic Cursor Spotlight Layer */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0"
        style={{
          opacity,
          background: `radial-gradient(${spotlightRadius}px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
};
