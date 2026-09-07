/**
 * SkillBridge — Motion Tokens (TypeScript Constants)
 */

export const durations = {
  instant: 0,
  fast: 100,
  normal: 200,
  moderate: 300,
  slow: 400,
  gentle: 600,
} as const;

export const easings = {
  default: 'cubic-bezier(0, 0, 0.2, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  linear: 'linear',
} as const;

export const framerEasings = {
  easeOutExpo: [0.16, 1, 0.3, 1] as const,
  easeInOutExpo: [0.87, 0, 0.13, 1] as const,
  springSnappy: { type: 'spring', stiffness: 400, damping: 25 } as const,
  springGentle: { type: 'spring', stiffness: 200, damping: 20 } as const,
  springBouncy: { type: 'spring', stiffness: 300, damping: 15 } as const,
  smoothTransition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } as const,
};

export const cssDurations = {
  instant: 'var(--duration-instant)',
  fast: 'var(--duration-fast)',
  normal: 'var(--duration-normal)',
  moderate: 'var(--duration-moderate)',
  slow: 'var(--duration-slow)',
  gentle: 'var(--duration-gentle)',
} as const;

