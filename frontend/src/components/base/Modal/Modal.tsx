import React, { useEffect, useRef } from 'react';
import { Portal } from '../../primitives/Portal';
import { Icon } from '../../primitives/Icon';

export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  size?: ModalSize;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md w-full',
  md: 'max-w-xl w-full',
  lg: 'max-w-3xl w-full',
  full: 'max-w-[90vw] max-h-[90vh] w-full h-full',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
  children,
  footer,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-[var(--modal-backdrop)] backdrop-blur-[var(--blur-md)] animate-fade-in"
        onClick={e => {
          if (closeOnBackdropClick && e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === 'string' ? title : 'Modal Dialog'}
          className={`bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-[var(--modal-radius)] shadow-[var(--modal-shadow)] flex flex-col overflow-hidden animate-scale-in ${sizeClasses[size]} ${className}`}
        >
          {title && (
            <div className="px-6 py-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
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
          {footer && (
            <div className="px-6 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
};

Modal.displayName = 'Modal';
