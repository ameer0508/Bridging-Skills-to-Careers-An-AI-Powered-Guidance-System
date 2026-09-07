import React from 'react';

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: string | number;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const justifyMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const directionMap = {
  row: 'flex-row',
  column: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'column-reverse': 'flex-col-reverse',
};

const wrapMap = {
  nowrap: 'flex-nowrap',
  wrap: 'flex-wrap',
  'wrap-reverse': 'flex-wrap-reverse',
};

export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  (
    {
      direction = 'row',
      align = 'center',
      justify = 'start',
      wrap = 'nowrap',
      gap,
      inline = false,
      className = '',
      style,
      children,
      ...props
    },
    ref
  ) => {
    const displayClass = inline ? 'inline-flex' : 'flex';
    const classes = [
      displayClass,
      directionMap[direction],
      alignMap[align],
      justifyMap[justify],
      wrapMap[wrap],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const computedStyle: React.CSSProperties = {
      ...(gap !== undefined ? { gap: typeof gap === 'number' ? `${gap}px` : gap } : {}),
      ...style,
    };

    return (
      <div ref={ref} className={classes} style={computedStyle} {...props}>
        {children}
      </div>
    );
  }
);

Flex.displayName = 'Flex';
