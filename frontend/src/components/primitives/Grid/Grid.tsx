import React from 'react';

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: number | string;
  rows?: number | string;
  gap?: string | number;
  columnGap?: string | number;
  rowGap?: string | number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  className?: string;
  children?: React.ReactNode;
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  (
    {
      columns,
      rows,
      gap,
      columnGap,
      rowGap,
      align,
      justify,
      className = '',
      style,
      children,
      ...props
    },
    ref
  ) => {
    const computedStyle: React.CSSProperties = {
      display: 'grid',
      ...(columns !== undefined
        ? { gridTemplateColumns: typeof columns === 'number' ? `repeat(${columns}, minmax(0, 1fr))` : columns }
        : {}),
      ...(rows !== undefined
        ? { gridTemplateRows: typeof rows === 'number' ? `repeat(${rows}, minmax(0, 1fr))` : rows }
        : {}),
      ...(gap !== undefined ? { gap: typeof gap === 'number' ? `${gap}px` : gap } : {}),
      ...(columnGap !== undefined ? { columnGap: typeof columnGap === 'number' ? `${columnGap}px` : columnGap } : {}),
      ...(rowGap !== undefined ? { rowGap: typeof rowGap === 'number' ? `${rowGap}px` : rowGap } : {}),
      ...(align ? { alignItems: align } : {}),
      ...(justify ? { justifyContent: justify } : {}),
      ...style,
    };

    return (
      <div ref={ref} className={className} style={computedStyle} {...props}>
        {children}
      </div>
    );
  }
);

Grid.displayName = 'Grid';
