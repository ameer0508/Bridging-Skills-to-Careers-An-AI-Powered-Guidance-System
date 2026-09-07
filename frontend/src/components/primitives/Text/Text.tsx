import React from 'react';

export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'bodyLg'
  | 'body'
  | 'bodySm'
  | 'caption'
  | 'label'
  | 'labelSm'
  | 'code';

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'disabled'
  | 'inverse'
  | 'link'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'ai';

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  variant?: TextVariant;
  color?: TextColor;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold' | 'black';
  align?: 'left' | 'center' | 'right' | 'justify';
  truncate?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const variantStyles: Record<TextVariant, string> = {
  display: 'text-[length:var(--font-size-display)] font-extrabold tracking-[var(--letter-spacing-tight)] leading-[var(--line-height-tight)] font-display',
  h1: 'text-[length:var(--font-size-h1)] font-bold tracking-[var(--letter-spacing-tight)] leading-[var(--line-height-tight)] font-display',
  h2: 'text-[length:var(--font-size-h2)] font-semibold leading-[var(--line-height-tight)] font-display',
  h3: 'text-[length:var(--font-size-h3)] font-semibold leading-[var(--line-height-tight)]',
  h4: 'text-[length:var(--font-size-h4)] font-medium leading-[var(--line-height-normal)]',
  bodyLg: 'text-[length:var(--font-size-body-lg)] leading-[var(--line-height-relaxed)]',
  body: 'text-[length:var(--font-size-body)] leading-[var(--line-height-normal)]',
  bodySm: 'text-[length:var(--font-size-body-sm)] leading-[var(--line-height-normal)]',
  caption: 'text-[length:var(--font-size-caption)] leading-[var(--line-height-normal)]',
  label: 'text-[length:var(--font-size-label)] font-medium leading-none',
  labelSm: 'text-[length:var(--font-size-label-sm)] font-medium uppercase tracking-[var(--letter-spacing-wide)] leading-none',
  code: 'text-[length:var(--font-size-code)] font-mono',
};

const colorStyles: Record<TextColor, string> = {
  primary: 'text-[var(--color-text-primary)]',
  secondary: 'text-[var(--color-text-secondary)]',
  tertiary: 'text-[var(--color-text-tertiary)]',
  disabled: 'text-[var(--color-text-disabled)]',
  inverse: 'text-[var(--color-text-inverse)]',
  link: 'text-[var(--color-text-link)] hover:underline cursor-pointer',
  success: 'text-[var(--color-status-success-text)]',
  warning: 'text-[var(--color-status-warning-text)]',
  error: 'text-[var(--color-status-error-text)]',
  info: 'text-[var(--color-status-info-text)]',
  ai: 'text-[var(--color-ai-text)]',
};

const weightStyles = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  black: 'font-extrabold',
};

const alignStyles = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

export const Text = React.forwardRef<HTMLElement, TextProps>(
  (
    {
      as: Component = 'p',
      variant = 'body',
      color = 'primary',
      weight,
      align,
      truncate = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const classes = [
      variantStyles[variant],
      colorStyles[color],
      weight ? weightStyles[weight] : '',
      align ? alignStyles[align] : '',
      truncate ? 'truncate' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <Component ref={ref} className={classes} {...props}>
        {children}
      </Component>
    );
  }
);

Text.displayName = 'Text';
