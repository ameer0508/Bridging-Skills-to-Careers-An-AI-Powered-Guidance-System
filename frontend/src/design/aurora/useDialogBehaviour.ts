import type React from 'react';
import { useEffect, useRef } from 'react';

/**
 * Keyboard behaviour shared by every dialog and slide-over: focus moves into the panel when it
 * opens, Tab stays inside it, Escape closes it, and focus returns to what opened it.
 */
export function useDialogBehaviour(
  open: boolean,
  onClose: () => void,
  panelRef: React.RefObject<HTMLElement | null>,
  initialFocus?: React.RefObject<HTMLElement | null>,
) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => (initialFocus?.current ?? panelRef.current)?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key === 'Tab' && panelRef.current) {
        const items = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [open, panelRef, initialFocus]);
}
