/**
 * SkillBridge — Lighting System Profiles
 * Centralized lighting specifications for surfaces, cards, and interactive layers.
 */

export type LightingProfileName =
  | 'softAmbient'
  | 'heroSpotlight'
  | 'glassReflection'
  | 'surfaceReflection'
  | 'edgeGlow'
  | 'commandCenterGlow'
  | 'accentLighting';

export interface LightingProfile {
  name: LightingProfileName;
  description: string;
  boxShadow: {
    dark: string;
    light: string;
  };
  radialGlow?: {
    dark: string;
    light: string;
  };
  borderColor: {
    dark: string;
    light: string;
  };
  specularOpacity: number;
}

export const LightingProfiles: Record<LightingProfileName, LightingProfile> = {
  softAmbient: {
    name: 'softAmbient',
    description: 'Subdued background glow for secondary containers and cards',
    boxShadow: {
      dark: '0 8px 32px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
      light: '0 8px 30px -6px rgba(0, 0, 0, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
    },
    borderColor: {
      dark: 'rgba(255, 255, 255, 0.08)',
      light: 'rgba(0, 0, 0, 0.06)',
    },
    specularOpacity: 0.04,
  },
  heroSpotlight: {
    name: 'heroSpotlight',
    description: 'Intense focused radial glow for hero components and primary actions',
    boxShadow: {
      dark: '0 20px 50px -12px rgba(99, 102, 241, 0.3), 0 0 30px 0 rgba(168, 85, 247, 0.15)',
      light: '0 20px 40px -10px rgba(99, 102, 241, 0.2), 0 0 20px 0 rgba(168, 85, 247, 0.1)',
    },
    radialGlow: {
      dark: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.25), transparent 70%)',
      light: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15), transparent 70%)',
    },
    borderColor: {
      dark: 'rgba(129, 140, 248, 0.3)',
      light: 'rgba(99, 102, 241, 0.25)',
    },
    specularOpacity: 0.15,
  },
  glassReflection: {
    name: 'glassReflection',
    description: 'Crisp specular reflection for frosted glass panels',
    boxShadow: {
      dark: '0 12px 40px -10px rgba(0, 0, 0, 0.7), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)',
      light: '0 10px 30px -8px rgba(0, 0, 0, 0.06), inset 0 1px 1px 0 rgba(255, 255, 255, 0.8)',
    },
    borderColor: {
      dark: 'rgba(255, 255, 255, 0.12)',
      light: 'rgba(255, 255, 255, 0.5)',
    },
    specularOpacity: 0.12,
  },
  surfaceReflection: {
    name: 'surfaceReflection',
    description: 'Linear top-down specular gradient for elevated surfaces',
    boxShadow: {
      dark: '0 4px 20px -4px rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      light: '0 4px 16px -4px rgba(0, 0, 0, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.7)',
    },
    borderColor: {
      dark: 'rgba(255, 255, 255, 0.07)',
      light: 'rgba(0, 0, 0, 0.08)',
    },
    specularOpacity: 0.06,
  },
  edgeGlow: {
    name: 'edgeGlow',
    description: 'Perimeter rim illumination for active or focused states',
    boxShadow: {
      dark: '0 0 0 1px rgba(99, 102, 241, 0.6), 0 0 20px -4px rgba(99, 102, 241, 0.4)',
      light: '0 0 0 1px rgba(99, 102, 241, 0.5), 0 0 16px -4px rgba(99, 102, 241, 0.3)',
    },
    borderColor: {
      dark: 'rgba(99, 102, 241, 0.8)',
      light: 'rgba(99, 102, 241, 0.6)',
    },
    specularOpacity: 0.1,
  },
  commandCenterGlow: {
    name: 'commandCenterGlow',
    description: 'Pulsing core AI workspace aura',
    boxShadow: {
      dark: '0 0 80px -20px rgba(99, 102, 241, 0.35), 0 0 40px -10px rgba(168, 85, 247, 0.25)',
      light: '0 0 60px -15px rgba(99, 102, 241, 0.25), 0 0 30px -10px rgba(168, 85, 247, 0.15)',
    },
    radialGlow: {
      dark: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.1), transparent 75%)',
      light: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08), transparent 75%)',
    },
    borderColor: {
      dark: 'rgba(168, 85, 247, 0.4)',
      light: 'rgba(168, 85, 247, 0.3)',
    },
    specularOpacity: 0.2,
  },
  accentLighting: {
    name: 'accentLighting',
    description: 'Dynamic brand accent glow for highlights and notifications',
    boxShadow: {
      dark: '0 10px 30px -5px rgba(14, 165, 233, 0.3)',
      light: '0 10px 25px -5px rgba(14, 165, 233, 0.2)',
    },
    borderColor: {
      dark: 'rgba(56, 189, 248, 0.4)',
      light: 'rgba(14, 165, 233, 0.3)',
    },
    specularOpacity: 0.08,
  },
};
