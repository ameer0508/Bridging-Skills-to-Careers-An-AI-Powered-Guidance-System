import { createElement, type ComponentType } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Lazy-loaded pages that recover from a failed code-chunk download without a page refresh.
 *
 * React.lazy remembers a failed import for the life of the tab: one dropped download (a network
 * blip, or a tab opened before the frontend was rebuilt, whose old hashed chunk no longer exists)
 * left that page on the error screen until the user reloaded. Browsers also remember a failed
 * import() for the same URL for the life of the page (measured in Edge 155: re-importing the same
 * chunk keeps failing after the network is back; the same file with a query string loads). So a
 * failed chunk is retried under a cache-busting URL, taken from the browser's own error message.
 * A failure is shown, but only until "Try again" (resetFailedLazyPages) or the next navigation.
 * Two cases cannot be repaired inside the page, so it reloads once (guarded so it cannot loop):
 * a newer build is deployed (its chunks have new names), or the chunk is reachable again but a
 * shared dependency's failed download is still remembered by the browser. When the chunk cannot
 * be reached at all (offline), nothing reloads and the page explains the failure.
 */

export const CHUNK_RETRY_DELAYS_MS = [400, 1200];
const RELOAD_GUARD_KEY = 'sb-chunk-reload';
// At most one automatic reload per target in this window, so a persistent fault cannot loop
export const RELOAD_GUARD_MS = 5 * 60 * 1000;

/** Errors browsers raise when a dynamically imported module cannot be fetched or evaluated. */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk [\w-]+ failed|ChunkLoadError|Unable to preload CSS/i.test(message);
}

/** The entry script the running page was loaded with, e.g. "/assets/index-AbC123.js". */
export function currentEntryScript(doc: Pick<Document, 'querySelector'> = document): string | null {
  const el = doc.querySelector('script[type="module"][src*="/assets/index-"]') as HTMLScriptElement | null;
  return el ? new URL(el.src, 'http://x').pathname : null;
}

/** The entry script named by the server's current index.html, or null when it cannot be read. */
export async function deployedEntryScript(fetchImpl: typeof fetch = fetch): Promise<string | null> {
  try {
    const res = await fetchImpl(`/index.html?check=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const match = (await res.text()).match(/<script[^>]+type="module"[^>]+src="([^"]*\/assets\/index-[^"]+\.js)"/);
    return match ? new URL(match[1], 'http://x').pathname : null;
  } catch {
    return null;
  }
}

/**
 * The chunk URL named in a dynamic-import error, when it is a script of this app on this origin
 * (built chunks under /assets/, or source modules under /src/ in development). Anything else is
 * never re-imported.
 */
export function failedChunkUrl(error: unknown, origin: string): string | null {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/(https?:\/\/[^\s'"]+|\/(?:assets|src)\/[^\s'"]+)/);
  if (!match) return null;
  try {
    const url = new URL(match[1], origin);
    if (url.origin !== origin || !/^\/(assets|src)\//.test(url.pathname) || !/\.(m?js|tsx?|jsx)$/.test(url.pathname)) return null;
    url.search = '';
    return url.toString();
  } catch {
    return null;
  }
}

export interface LoaderDeps {
  sleep: (ms: number) => Promise<void>;
  /** Imports a module by URL (used to retry a failed chunk under a cache-busting query). */
  importUrl: (url: string) => Promise<unknown>;
  origin: string;
  currentEntry: () => string | null;
  deployedEntry: () => Promise<string | null>;
  /** Whether the chunk can be downloaded now (bypassing caches). */
  reachable: (url: string) => Promise<boolean>;
  reload: () => void;
  storage: Pick<Storage, 'getItem' | 'setItem'> | null;
  now: () => number;
}

const defaultDeps = (): LoaderDeps => ({
  sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
  importUrl: url => import(/* @vite-ignore */ url),
  origin: window.location.origin,
  currentEntry: () => currentEntryScript(),
  deployedEntry: () => deployedEntryScript(),
  reachable: async url => {
    try {
      return (await fetch(url, { cache: 'no-store' })).ok;
    } catch {
      return false;
    }
  },
  reload: () => window.location.reload(),
  now: () => Date.now(),
  storage: (() => {
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  })(),
});

/**
 * Runs an import with retries. On a final chunk-load failure it checks whether a newer build is
 * deployed: if so, it reloads once (a reload is the only way to obtain that build's chunks) and
 * otherwise rethrows, so the page's error boundary can offer "Try again".
 */
export async function importWithRetry<T>(factory: () => Promise<T>, deps: LoaderDeps = defaultDeps()): Promise<T> {
  let lastError: unknown;
  try {
    return await factory();
  } catch (error) {
    lastError = error;
    if (!isChunkLoadError(error)) throw error;
  }
  // The browser will not fetch the same URL again, so retry under a fresh query string
  const chunk = failedChunkUrl(lastError, deps.origin);
  for (let attempt = 0; chunk && attempt < CHUNK_RETRY_DELAYS_MS.length; attempt++) {
    await deps.sleep(CHUNK_RETRY_DELAYS_MS[attempt]);
    try {
      return (await deps.importUrl(`${chunk}?retry=${Date.now()}-${attempt}`)) as T;
    } catch (error) {
      lastError = error;
      if (!isChunkLoadError(error)) throw error;
    }
  }
  const running = deps.currentEntry();
  const deployed = await deps.deployedEntry();
  const newerBuild = !!(running && deployed && running !== deployed);
  // Reachable again, but the browser keeps refusing it in this page: a remembered failed dependency
  const stuckInThisPage = !newerBuild && !!chunk && (await deps.reachable(chunk));
  if (newerBuild || stuckInThisPage) {
    const target = newerBuild ? `build:${deployed}` : `chunk:${chunk}`;
    if (mayReload(target, deps)) {
      deps.reload();
      // The reload replaces the page; until then the boundary shows its message
    }
  }
  throw lastError;
}

/** True at most once per target within RELOAD_GUARD_MS (recorded in sessionStorage). */
function mayReload(target: string, deps: LoaderDeps): boolean {
  if (!deps.storage) return false;
  try {
    const last = JSON.parse(deps.storage.getItem(RELOAD_GUARD_KEY) || 'null') as { target: string; at: number } | null;
    if (last && last.target === target && deps.now() - last.at < RELOAD_GUARD_MS) return false;
    deps.storage.setItem(RELOAD_GUARD_KEY, JSON.stringify({ target, at: deps.now() }));
    return true;
  } catch {
    return false;
  }
}

// Failed pages, so that "Try again" can make all of them download afresh
const failedPages = new Set<() => void>();

/** Lets every page whose code failed to download try again on its next render. */
export function resetFailedLazyPages(): void {
  for (const reset of failedPages) reset();
  failedPages.clear();
}

/**
 * A drop-in for React.lazy. A failed download is reported to the page's error boundary and kept
 * until "Try again" or the next navigation; it is not replaced at once, because React renders a
 * failed component a second time before showing the boundary, and a fresh attempt there would
 * keep the page on its loading state instead of explaining the failure.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<P extends Record<string, any> = Record<string, never>>(
  factory: () => Promise<{ default: ComponentType<P> }>
): ComponentType<P> {
  let status: 'idle' | 'pending' | 'done' | 'error' = 'idle';
  let pending: Promise<void> | null = null;
  let Loaded: ComponentType<P> | null = null;
  let failure: unknown = null;
  let failedAtLocation: string | null = null;

  const reset = () => {
    if (status === 'error') {
      status = 'idle';
      failure = null;
      failedAtLocation = null;
    }
  };
  const load = () => {
    status = 'pending';
    pending = importWithRetry(factory).then(
      module => {
        Loaded = module.default;
        status = 'done';
      },
      error => {
        failure = error;
        status = 'error';
        failedPages.add(reset);
      }
    );
  };

  const Retrying = (props: P) => {
    const { key } = useLocation();
    // A new navigation since the failure: try the download again
    if (status === 'error' && failedAtLocation !== null && failedAtLocation !== key) reset();
    if (status === 'done' && Loaded) return createElement(Loaded, props);
    if (status === 'error') {
      if (failedAtLocation === null) failedAtLocation = key;
      throw failure;
    }
    if (status === 'idle') load();
    // Suspends until the download settles (the same promise on every render)
    throw pending;
  };
  Retrying.displayName = 'LazyWithRetry';
  return Retrying;
}
