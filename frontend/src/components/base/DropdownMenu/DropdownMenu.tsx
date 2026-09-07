import React, { useState, useRef, useEffect } from 'react';
import { Portal } from '../../primitives/Portal';

export interface DropdownMenuItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface DropdownMenuProps {
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
  className?: string;
  children: React.ReactElement;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  items,
  align = 'left',
  className = '',
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const toggle = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const top = rect.bottom + 4;
      const left = align === 'right' ? rect.right : rect.left;
      setCoords({ top, left });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
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
            ref={menuRef}
            style={{ top: coords.top, left: coords.left }}
            role="menu"
            className={`fixed z-[var(--z-dropdown)] min-w-[180px] bg-[var(--color-bg-surface-raised)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] py-1 animate-scale-in ${
              align === 'right' ? '-translate-x-full' : ''
            } ${className}`}
          >
            {items.map(item => (
              <button
                key={item.key}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick?.();
                    setIsOpen(false);
                  }
                }}
                className={`w-full px-3 py-2 text-xs font-medium text-left flex items-center justify-between gap-3 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  item.danger
                    ? 'text-[var(--color-status-error-text)] hover:bg-[var(--color-status-error-bg)]'
                    : 'text-[var(--color-text-primary)] hover:bg-[var(--color-interactive-secondary-hover)]'
                }`}
              >
                <span className="flex items-center gap-2">
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </span>
                {item.shortcut && (
                  <span className="text-[10px] font-mono text-[var(--color-text-tertiary)]">
                    {item.shortcut}
                  </span>
                )}
              </button>
            ))}
          </div>
        </Portal>
      )}
    </>
  );
};

DropdownMenu.displayName = 'DropdownMenu';
