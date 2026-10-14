/** Class names for Aurora Elite buttons and button-styled links. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const buttonBase =
  'group relative inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[transform,box-shadow,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] disabled:opacity-60';
const buttonSize = { md: 'h-11 px-5 text-sm', lg: 'h-13 px-7 text-[15px]' } as const;
const buttonVariant: Record<ButtonVariant, string> = {
  primary: 'text-white shadow-aurora-md hover:-translate-y-0.5 hover:shadow-aurora-lg [background:var(--aurora-gradient-action)]',
  secondary: 'border border-aurora-line bg-white text-aurora-ink shadow-aurora-sm hover:-translate-y-0.5 hover:border-aurora-lavender hover:shadow-aurora-md',
  ghost: 'text-aurora-ink hover:bg-white/70',
};

export const auroraButtonClass = (variant: ButtonVariant = 'primary', size: keyof typeof buttonSize = 'md') =>
  `${buttonBase} ${buttonSize[size]} ${buttonVariant[variant]}`;

export type ButtonSize = keyof typeof buttonSize;
