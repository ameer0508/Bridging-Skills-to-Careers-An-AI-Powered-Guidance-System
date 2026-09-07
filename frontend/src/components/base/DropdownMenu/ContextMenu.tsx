import React, { useState, useEffect, useRef } from 'react';
import { DropdownMenuItem } from './DropdownMenu';
import { Portal } from '../../primitives/Portal';

export interface ContextMenuProps {
  items: DropdownMenuItem[];
  children: React.ReactNode;
  className?: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ items, children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setCoords({ x: e.clientX, y: e.clientY });
    setIsOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
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
    <div onContextMenu={handleContextMenu} className={className}>
      {children}
      {isOpen && (
        <Portal>
          <div
            ref={menuRef}
            style={{ top: coords.y, left: coords.x }}
            role="menu"
            className="fixed z-[var(--z-dropdown)] min-w-[180px] bg-[var(--color-bg-surface-raised)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] py-1 animate-scale-in"
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
    </div>
  );
};

ContextMenu.displayName = 'ContextMenu';
