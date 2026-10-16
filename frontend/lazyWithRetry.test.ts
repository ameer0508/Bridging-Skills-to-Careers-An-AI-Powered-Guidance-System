// Run: npx tsx --test frontend/lazyWithRetry.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RELOAD_GUARD_MS, deployedEntryScript, failedChunkUrl, importWithRetry, isChunkLoadError, type LoaderDeps } from './src/routes/lazyWithRetry';

const ORIGIN = 'http://localhost:3000';
const CHUNK = `${ORIGIN}/assets/AnalyticsWorkspace-old.js`;
const chunkError = (url = CHUNK) => new TypeError(`Failed to fetch dynamically imported module: ${url}`);

function deps(overrides: Partial<LoaderDeps> = {}) {
  const store = new Map<string, string>();
  const d = {
    reloads: 0,
    sleeps: [] as number[],
    imported: [] as string[],
    store,
    sleep: async (ms: number) => { d.sleeps.push(ms); },
    importUrl: async (url: string): Promise<unknown> => { d.imported.push(url); throw chunkError(url); },
    origin: ORIGIN,
    currentEntry: () => '/assets/index-OLD.js',
    deployedEntry: async () => '/assets/index-OLD.js',
    reachable: async (_url: string) => false,
    clock: 1_000_000,
    now: () => d.clock,
    reload: () => { d.reloads += 1; },
    storage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); } },
    ...overrides,
  };
  return d;
}
const failing = async () => { throw chunkError(); };

test('recognises the errors browsers raise for a missing or unloadable chunk', () => {
  for (const message of [
    'Failed to fetch dynamically imported module: /assets/x.js',
    'Importing a module script failed.',
    'error loading dynamically imported module: http://localhost:3000/assets/x.js',
    'Loading chunk 42 failed.',
  ]) assert.equal(isChunkLoadError(new TypeError(message)), true, message);
  assert.equal(isChunkLoadError(new Error('Cannot read properties of undefined')), false);
});

test('only this app\'s own scripts on this origin are ever re-imported', () => {
  assert.equal(failedChunkUrl(chunkError(), ORIGIN), CHUNK);
  assert.equal(failedChunkUrl(chunkError(`${CHUNK}?v=1`), ORIGIN), CHUNK, 'an existing query is dropped');
  assert.equal(failedChunkUrl(chunkError(`${ORIGIN}/src/workspaces/A.tsx`), ORIGIN), `${ORIGIN}/src/workspaces/A.tsx`);
  assert.equal(failedChunkUrl(chunkError('https://evil.example/assets/x.js'), ORIGIN), null, 'another origin');
  assert.equal(failedChunkUrl(chunkError(`${ORIGIN}/api/v1/users/me`), ORIGIN), null, 'not a script of the app');
  assert.equal(failedChunkUrl(new TypeError('Importing a module script failed.'), ORIGIN), null, 'no URL in the message');
});

test('a chunk that failed once is fetched again under a fresh URL, without a reload', async () => {
  const d = deps({ importUrl: async (url: string) => { d.imported.push(url); return { default: 'Page' }; } });
  const mod = await importWithRetry(failing, d);
  assert.deepEqual(mod, { default: 'Page' });
  assert.equal(d.imported.length, 1);
  assert.match(d.imported[0], /^http:\/\/localhost:3000\/assets\/AnalyticsWorkspace-old\.js\?retry=/);
  assert.equal(d.reloads, 0);
});

test('a page that imports fine needs no retry', async () => {
  const d = deps();
  assert.deepEqual(await importWithRetry(async () => ({ default: 'Page' }), d), { default: 'Page' });
  assert.equal(d.imported.length, 0);
});

test('an ordinary error in the page module is not retried and causes no reload', async () => {
  const d = deps();
  await assert.rejects(importWithRetry(async () => { throw new Error('bug in the page'); }, d), /bug in the page/);
  assert.equal(d.imported.length, 0);
  assert.equal(d.reloads, 0);
});

test('offline (the chunk cannot be reached): reported, never reloaded', async () => {
  const d = deps();
  await assert.rejects(importWithRetry(failing, d), /dynamically imported module/);
  assert.deepEqual(d.sleeps, [400, 1200], 'two cache-busting retries');
  assert.equal(d.reloads, 0, 'unreachable: a reload would fail too, so the page explains instead');
});

test('reachable again but still refused in this page (a remembered failed dependency): one reload', async () => {
  const d = deps({ reachable: async () => true });
  await assert.rejects(importWithRetry(failing, d));
  assert.equal(d.reloads, 1);
  await assert.rejects(importWithRetry(failing, d));
  assert.equal(d.reloads, 1, 'not again within the guard window');
  d.clock += RELOAD_GUARD_MS + 1;
  await assert.rejects(importWithRetry(failing, d));
  assert.equal(d.reloads, 2, 'allowed again after the window');
});

test('without session storage nothing reloads (no loop protection, so no automatic reload)', async () => {
  const d = deps({ reachable: async () => true, storage: null });
  await assert.rejects(importWithRetry(failing, d));
  assert.equal(d.reloads, 0);
});

test('a newer build reloads the page once to fetch its chunks, and never loops', async () => {
  const d = deps({ deployedEntry: async () => '/assets/index-NEW.js' });
  await assert.rejects(importWithRetry(failing, d));
  assert.equal(d.reloads, 1);
  await assert.rejects(importWithRetry(failing, d));
  assert.equal(d.reloads, 1, 'a second failure for the same new build does not reload again');
});

test('if the deployed entry cannot be read, nothing is reloaded', async () => {
  const d = deps({ deployedEntry: async () => null });
  await assert.rejects(importWithRetry(failing, d));
  assert.equal(d.reloads, 0);
});

test('reads the entry script from the deployed index.html', async () => {
  const html = '<!doctype html><script type="module" crossorigin src="/assets/index-DVVPO1xL.js"></script>';
  const fake = (async () => ({ ok: true, text: async () => html })) as unknown as typeof fetch;
  assert.equal(await deployedEntryScript(fake), '/assets/index-DVVPO1xL.js');
  const broken = (async () => { throw new Error('offline'); }) as unknown as typeof fetch;
  assert.equal(await deployedEntryScript(broken), null);
});
