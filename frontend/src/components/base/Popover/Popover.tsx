import React, { useState, useRef, useEffect } from 'react';
import { Portal } from '../../primitives/Portal';

export interface PopoverProps {
  content: React.ReactNode;
  position?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  className?: string;
  children: React.ReactElement;
}

export const Popover: React.FC<PopoverProps> = ({
  content,
  position = 'bottom-start',
  className = '',
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const toggle = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let top = rect.bottom + window.scrollY + 6;
      let left = rect.left + window.scrollX;

      if (position === 'bottom-end') {
        left = rect.right + window.scrollX;
      } else if (position === 'top-start') {
        top = rect.top + window.scrollY - 6;
      }

      setCoords({ top, left });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const posClass = position === 'bottom-end' ? '-translate-x-full' : position === 'top-start' ? '-translate-y-full' : '';

  return (
    <>
      {React.cloneElement(children, {
        ref: (node: HTMLElement) => {
          triggerRef.current = node;
          const childRef = (children as React.ReactElement & { ref?: React.Ref<unknown> }).ref;
          if (typeof childRef === 'function') childRef(node);
          else if (childRef) childRef.current = node;
        },
        onClick: (e: React.MouseEvent) => {
          children.props.onClick?.(e);
          toggle();
        },
      })}
      {isOpen && (
        <Portal>
          <div
            ref={popoverRef}
            style={{ top: coords.top, left: coords.left }}
            className={`fixed z-[var(--z-dropdown)] bg-[var(--color-bg-surface-raised)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-4 animate-scale-in ${posClass} ${className}`}
          >
            {content}
          </div>
        </Portal>
      )}
    </>
  );
};

Popover.displayName = 'Popover';
