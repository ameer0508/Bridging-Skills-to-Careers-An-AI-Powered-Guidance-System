import React from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import { useExperience } from '../../../contexts/ExperienceContext';
import { LightingProfileName, LightingProfiles } from '../../../tokens/lightingProfiles';

export interface LightingSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  profile?: LightingProfileName;
  children: React.ReactNode;
  className?: string;
}

export const LightingSurface = React.forwardRef<HTMLDivElement, LightingSurfaceProps>(
  ({ profile, children, className = '', style, ...props }, ref) => {
    const { resolvedTheme } = useTheme();
    const { activeLightingProfile, reducedMotion, lowPerformanceMode } = useExperience();

    const selectedProfileName = profile || activeLightingProfile;
    const config = LightingProfiles[selectedProfileName] || LightingProfiles.softAmbient;
    const isDark = resolvedTheme === 'dark';

    const boxShadow = isDark ? config.boxShadow.dark : config.boxShadow.light;
    const borderColor = isDark ? config.borderColor.dark : config.borderColor.light;
    const radialGlow = config.radialGlow ? (isDark ? config.radialGlow.dark : config.radialGlow.light) : undefined;

    return (
      <div
        ref={ref}
        className={`relative overflow-hidden transition-all duration-300 ${className}`}
        style={{
          boxShadow,
          borderColor,
          ...style,
        }}
        {...props}
      >
        {/* Specular Radial Background Glow */}
        {radialGlow && !reducedMotion && !lowPerformanceMode && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-opacity duration-500"
            style={{ background: radialGlow }}
          />
        )}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

LightingSurface.displayName = 'LightingSurface';

export default LightingSurface;
