/**
 * Returns the list inside an API payload that is either the list itself or an object holding it
 * under `key` (several endpoints have returned both shapes over time). Anything else gives [].
 */
export function listFrom<T = unknown>(payload: unknown, key: string): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const inner = (payload as Record<string, unknown>)[key];
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
}

/** The message of a thrown value, when it has one. */
export function messageOf(error: unknown, fallback: string): string {
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === 'string' && message ? message : fallback;
}
