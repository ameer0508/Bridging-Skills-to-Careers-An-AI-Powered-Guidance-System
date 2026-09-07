import React, { useState } from 'react';
import { Portal } from '../../primitives/Portal';

export interface TooltipProps {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  children: React.ReactElement;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  delay = 200,
  className = '',
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetRef = React.useRef<HTMLElement | null>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (targetRef.current) {
        const rect = targetRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;

        if (position === 'top') {
          top = rect.top - 8;
          left = rect.left + rect.width / 2;
        } else if (position === 'bottom') {
          top = rect.bottom + 8;
          left = rect.left + rect.width / 2;
        } else if (position === 'left') {
          top = rect.top + rect.height / 2;
          left = rect.left - 8;
        } else if (position === 'right') {
          top = rect.top + rect.height / 2;
          left = rect.right + 8;
        }

        setCoords({ top, left });
        setVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  const positionClasses = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2',
  };

  return (
    <>
      {React.cloneElement(children, {
        ref: (node: HTMLElement) => {
          targetRef.current = node;
          const childRef = (children as React.ReactElement & { ref?: React.Ref<unknown> }).ref;
          if (typeof childRef === 'function') childRef(node);
          else if (childRef) childRef.current = node;
        },
        onMouseEnter: (e: React.MouseEvent) => {
          children.props.onMouseEnter?.(e);
          showTooltip();
        },
        onMouseLeave: (e: React.MouseEvent) => {
          children.props.onMouseLeave?.(e);
          hideTooltip();
        },
        onFocus: (e: React.FocusEvent) => {
          children.props.onFocus?.(e);
          showTooltip();
        },
        onBlur: (e: React.FocusEvent) => {
          children.props.onBlur?.(e);
          hideTooltip();
        },
      })}
      {visible && content && (
        <Portal>
          <div
            role="tooltip"
            style={{ top: coords.top, left: coords.left }}
            className={`fixed z-[var(--z-top)] px-2.5 py-1 text-xs font-medium text-[var(--tooltip-text)] bg-[var(--tooltip-bg)] rounded-[var(--tooltip-radius)] shadow-md pointer-events-none transition-opacity duration-[var(--duration-fast)] ${positionClasses[position]} ${className}`}
          >
            {content}
          </div>
        </Portal>
      )}
    </>
  );
};

Tooltip.displayName = 'Tooltip';
