import React, { useEffect } from 'react';
import { Portal } from '../../primitives/Portal';
import { Icon } from '../../primitives/Icon';

export type DrawerPosition = 'right' | 'left' | 'bottom';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  position?: DrawerPosition;
  size?: string;
  className?: string;
  children: React.ReactNode;
}

const positionClasses: Record<DrawerPosition, string> = {
  right: 'right-0 top-0 bottom-0 animate-slide-in-right',
  left: 'left-0 top-0 bottom-0 -translate-x-full animate-slide-in-left',
  bottom: 'bottom-0 left-0 right-0 max-h-[85vh] rounded-t-[var(--radius-xl)]',
};

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  position = 'right',
  size = '380px',
  className = '',
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const style: React.CSSProperties =
    position === 'bottom'
      ? { height: size }
      : { width: size, maxWidth: '100vw' };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[var(--z-modal)] bg-[var(--modal-backdrop)] backdrop-blur-[var(--blur-sm)] animate-fade-in"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === 'string' ? title : 'Drawer'}
          style={style}
          onClick={e => e.stopPropagation()}
          className={`fixed bg-[var(--color-bg-surface-raised)] border-[var(--color-border-default)] shadow-[var(--shadow-xl)] flex flex-col overflow-hidden ${
            position === 'right' ? 'border-l' : position === 'left' ? 'border-r' : 'border-t'
          } ${positionClasses[position]} ${className}`}
        >
          {title && (
            <div className="px-6 py-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] p-1 rounded-full hover:bg-[var(--color-interactive-secondary-hover)] transition-colors"
              >
                <Icon size="md">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </Icon>
              </button>
            </div>
          )}
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">{children}</div>
        </div>
      </div>
    </Portal>
  );
};

Drawer.displayName = 'Drawer';
