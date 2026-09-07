/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Portal } from '../../primitives/Portal';
import { Icon } from '../../primitives/Icon';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  variant?: ToastVariant;
  message: React.ReactNode;
  duration?: number;
}

interface ToastContextProps {
  toast: (options: Omit<ToastMessage, 'id'>) => void;
  success: (message: React.ReactNode) => void;
  error: (message: React.ReactNode) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ variant = 'info', message, duration = 4000 }: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts(prev => [...prev.slice(-2), { id, variant, message, duration }]);

      if (duration > 0 && variant !== 'error') {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((msg: React.ReactNode) => addToast({ variant: 'success', message: msg }), [addToast]);
  const error = useCallback((msg: React.ReactNode) => addToast({ variant: 'error', message: msg, duration: 0 }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error }}>
      {children}
      <Portal>
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-[var(--z-toast)] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        >
          {toasts.map(t => (
            <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
          ))}
        </div>
      </Portal>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onClose: () => void }> = ({ toast, onClose }) => {
  const variantStyles: Record<ToastVariant, { bg: string; border: string; text: string }> = {
    info: {
      bg: 'bg-[var(--color-bg-surface-raised)]',
      border: 'border-[var(--color-status-info-border)]',
      text: 'text-[var(--color-status-info-text)]',
    },
    success: {
      bg: 'bg-[var(--color-bg-surface-raised)]',
      border: 'border-[var(--color-status-success-border)]',
      text: 'text-[var(--color-status-success-text)]',
    },
    warning: {
      bg: 'bg-[var(--color-bg-surface-raised)]',
      border: 'border-[var(--color-status-warning-border)]',
      text: 'text-[var(--color-status-warning-text)]',
    },
    error: {
      bg: 'bg-[var(--color-bg-surface-raised)]',
      border: 'border-[var(--color-status-error-border)]',
      text: 'text-[var(--color-status-error-text)]',
    },
  };

  const style = variantStyles[toast.variant || 'info'];

  return (
    <div
      className={`pointer-events-auto p-3.5 rounded-[var(--radius-lg)] border shadow-[var(--shadow-lg)] flex items-center justify-between gap-3 text-xs font-medium text-[var(--color-text-primary)] animate-slide-in-right ${style.bg} ${style.border}`}
    >
      <div className="flex items-center gap-2.5">
        <span className={style.text}>
          <Icon size="sm">
            <circle cx="12" cy="12" r="10" />
          </Icon>
        </span>
        <div>{toast.message}</div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] focus:outline-none p-1"
        aria-label="Dismiss toast"
      >
        <Icon size={12}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </Icon>
      </button>
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
