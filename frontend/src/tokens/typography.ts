/**
 * SkillBridge — Typography Tokens (TypeScript Constants)
 */

export const fontFamilies = {
  sans: "var(--font-sans)",
  display: "var(--font-display)",
  mono: "var(--font-mono)",
} as const;

export const fontSizes = {
  display: "var(--font-size-display)",
  h1: "var(--font-size-h1)",
  h2: "var(--font-size-h2)",
  h3: "var(--font-size-h3)",
  h4: "var(--font-size-h4)",
  bodyLg: "var(--font-size-body-lg)",
  body: "var(--font-size-body)",
  bodySm: "var(--font-size-body-sm)",
  caption: "var(--font-size-caption)",
  label: "var(--font-size-label)",
  labelSm: "var(--font-size-label-sm)",
  code: "var(--font-size-code)",
} as const;

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 800,
} as const;

export const lineHeights = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;
