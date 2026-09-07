/**
 * SkillBridge — Breakpoint Tokens (TypeScript Constants)
 */

export const breakpoints = {
  sm: 768,
  md: 1024,
  lg: 1440,
  xl: 1920,
} as const;

export const mediaQueries = {
  sm: '(min-width: 768px)',
  md: '(min-width: 1024px)',
  lg: '(min-width: 1440px)',
  xl: '(min-width: 1920px)',
  mobileOnly: '(max-width: 767px)',
  tabletOnly: '(min-width: 768px) and (max-width: 1023px)',
  laptopOnly: '(min-width: 1024px) and (max-width: 1439px)',
  desktop: '(min-width: 1440px)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
} as const;
