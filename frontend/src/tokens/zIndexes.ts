/**
 * SkillBridge — Z-Index Tokens (TypeScript Constants)
 */

export const zIndexes = {
  base: 'var(--z-base)',
  sticky: 'var(--z-sticky)',
  sidebar: 'var(--z-sidebar)',
  dropdown: 'var(--z-dropdown)',
  overlay: 'var(--z-overlay)',
  modal: 'var(--z-modal)',
  toast: 'var(--z-toast)',
  top: 'var(--z-top)',
} as const;

export const zIndexNumbers = {
  base: 0,
  sticky: 100,
  sidebar: 200,
  dropdown: 300,
  overlay: 400,
  modal: 500,
  toast: 600,
  top: 700,
} as const;
