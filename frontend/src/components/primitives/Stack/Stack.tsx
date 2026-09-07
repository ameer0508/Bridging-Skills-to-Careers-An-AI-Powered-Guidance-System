import React from 'react';
import { Flex, FlexProps } from '../Flex';

export interface StackProps extends Omit<FlexProps, 'direction'> {
  direction?: 'column' | 'row';
  space?: string | number;
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ direction = 'column', space = 'var(--spacing-4)', gap, ...props }, ref) => {
    return <Flex ref={ref} direction={direction} gap={gap ?? space} {...props} />;
  }
);

Stack.displayName = 'Stack';
