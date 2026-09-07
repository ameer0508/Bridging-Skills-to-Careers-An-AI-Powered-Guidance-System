/**
 * SkillBridge — Experience Motion Architecture Tokens
 * Centralized motion physics, easing curves, durations, and timeline tokens.
 */

export const ExperiencePhysics = {
  springSnappy: { type: 'spring', stiffness: 450, damping: 28, mass: 0.8 },
  springGentle: { type: 'spring', stiffness: 220, damping: 22, mass: 1 },
  springBouncy: { type: 'spring', stiffness: 320, damping: 16, mass: 0.9 },
  springFloat: { type: 'spring', stiffness: 120, damping: 14, mass: 1.2 },
  springPress: { type: 'spring', stiffness: 500, damping: 30, mass: 0.5 },
} as const;

export const ExperienceDurations = {
  instant: 0,
  micro: 0.12,
  fast: 0.2,
  normal: 0.35,
  moderate: 0.5,
  slow: 0.8,
  organic: 1.2,
  ambient: 4.0,
} as const;

export const ExperienceEasing = {
  easeOutExpo: [0.16, 1, 0.3, 1] as [number, number, number, number],
  easeInOutExpo: [0.87, 0, 0.13, 1] as [number, number, number, number],
  easeOutBack: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  easeInOutCirc: [0.85, 0, 0.15, 1] as [number, number, number, number],
  linear: [0, 0, 1, 1] as [number, number, number, number],
} as const;

export const ExperienceTransitions = {
  fastEase: {
    duration: ExperienceDurations.fast,
    ease: ExperienceEasing.easeOutExpo,
  },
  normalEase: {
    duration: ExperienceDurations.normal,
    ease: ExperienceEasing.easeOutExpo,
  },
  moderateEase: {
    duration: ExperienceDurations.moderate,
    ease: ExperienceEasing.easeInOutExpo,
  },
  slowOrganic: {
    duration: ExperienceDurations.slow,
    ease: ExperienceEasing.easeOutExpo,
  },
} as const;

export const ExperienceTimeline = {
  staggerFast: 0.05,
  staggerNormal: 0.08,
  staggerSlow: 0.15,
  sequenceDelay: 0.2,
} as const;
