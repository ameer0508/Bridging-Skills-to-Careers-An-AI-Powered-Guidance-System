import { useEffect, useRef } from 'react';

/**
 * Keyboard focus for a panel that replaces the button that opened it (the recording and dictation
 * consent panels). Without this, opening or closing the panel removes the focused element and
 * focus falls back to the page. Opening moves focus into the panel; closing returns it to the
 * button, or to the surrounding container when the button is no longer shown.
 */
export function useDisclosureFocus(open: boolean) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      panelRef.current?.focus();
    } else if (wasOpen.current) {
      (triggerRef.current ?? containerRef.current)?.focus();
    }
    wasOpen.current = open;
  }, [open]);

  return { panelRef, triggerRef, containerRef };
}
