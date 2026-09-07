import React from 'react';
import { Text, TextProps } from '../Text';

export interface HeadingProps extends Omit<TextProps, 'variant'> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const levelVariantMap: Record<number, TextProps['variant']> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'bodyLg',
  6: 'body',
};

const levelTagMap: Record<number, React.ElementType> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h5',
  6: 'h6',
};

export const Heading = React.forwardRef<HTMLElement, HeadingProps>(
  ({ level = 2, as, children, ...props }, ref) => {
    const Component = as || levelTagMap[level];
    const variant = levelVariantMap[level];

    return (
      <Text ref={ref} as={Component} variant={variant} weight="bold" {...props}>
        {children}
      </Text>
    );
  }
);

Heading.displayName = 'Heading';
