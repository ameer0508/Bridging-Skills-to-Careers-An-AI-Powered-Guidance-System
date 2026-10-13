import { useCallback, useRef, useState } from 'react';

/**
 * Error text for a live region (C3), used with ErrorRegion. Every error gets a new id, so the
 * same message given twice in a row is rendered as a new node and announced twice.
 */
export function useAnnouncedError() {
  const [state, setState] = useState<{ text: string; id: number } | null>(null);
  const counter = useRef(0);
  const setError = useCallback((text: string | null) => {
    counter.current += 1;
    setState(text ? { text, id: counter.current } : null);
  }, []);
  return { error: state?.text ?? null, errorId: state?.id ?? 0, setError };
}
