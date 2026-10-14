// Load and runtime measurements of the production build. Run against `vite preview`:
//   E2E_FRONTEND=preview E2E_TEST_FILE=./tools/perfProfile.mjs E2E_PERF_OUT=<file.json> node run.mjs
// Each route is loaded three times on a fresh page with a cold cache and 4x CPU slowdown (Chrome
// DevTools Protocol); the median is reported. Numbers are from this machine and this local stack
// only; they are not Lighthouse scores or field Core Web Vitals.
import fs from 'node:fs';
import { completeOnboarding, launchBrowser, register } from '../lib/harness.mjs';

const RUNS = 3;
const PUBLIC = ['/', '/login'];
const SIGNED_IN = ['/home', '/resume', '/careers', '/career-lab', '/applications', '/market', '/ai', '/settings'];
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

async function instrument(page) {
  await page.addInitScript(() => {
    window.__perf = { lcp: 0, longTasks: 0, longTaskMs: 0 };
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__perf.lcp = e.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        window.__perf.longTasks += 1;
        window.__perf.longTaskMs += e.duration;
      }
    }).observe({ type: 'longtask', buffered: true });
  });
}

async function loadOnce(context, url, settleMs) {
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await instrument(page);
  const api = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/v1/') && r.method() === 'GET') api.push(new URL(r.url()).pathname + new URL(r.url()).search);
  });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(settleMs);
  const m = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null;
    const res = performance.getEntriesByType('resource');
    const js = res.filter((r) => r.name.endsWith('.js'));
    const css = res.filter((r) => r.name.endsWith('.css'));
    return {
      fcp,
      lcp: window.__perf.lcp,
      domContentLoaded: nav.domContentLoadedEventEnd,
      load: nav.loadEventEnd,
      jsFiles: js.length,
      jsKB: js.reduce((s, r) => s + r.decodedBodySize, 0) / 1024,
      cssKB: css.reduce((s, r) => s + r.decodedBodySize, 0) / 1024,
      requests: res.length,
      longTasks: window.__perf.longTasks,
      longTaskMs: window.__perf.longTaskMs,
      chunks: js.map((r) => r.name.split('/').pop()),
    };
  });
  const counts = {};
  for (const p of api) counts[p] = (counts[p] || 0) + 1;
  m.apiCalls = api.length;
  m.duplicateApi = Object.entries(counts).filter(([, n]) => n > 1).map(([p, n]) => `${p} x${n}`);
  await page.close();
  return m;
}

async function scrollFps(context, url) {
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const result = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const frames = [];
        let last = performance.now();
        const end = last + 3000;
        const step = (t) => {
          frames.push(t - last);
          last = t;
          window.scrollBy(0, 40);
          if (t < end) requestAnimationFrame(step);
          else resolve({ frames: frames.length, fps: frames.length / 3, slowFrames: frames.filter((f) => f > 50).length });
        };
        requestAnimationFrame(step);
      }),
  );
  await page.close();
  return result;
}

export async function run({ webUrl }) {
  const { browser, channel } = await launchBrowser();
  console.log(`[perf] browser ${channel}`);
  const out = { channel, cpuThrottle: 4, runs: RUNS, routes: {} };
  const summarise = (runs) => {
    const keys = ['fcp', 'lcp', 'domContentLoaded', 'load', 'jsFiles', 'jsKB', 'cssKB', 'requests', 'longTasks', 'longTaskMs', 'apiCalls'];
    const s = Object.fromEntries(keys.map((k) => [k, Math.round(median(runs.map((r) => r[k] ?? 0)))]));
    s.duplicateApi = runs[0].duplicateApi;
    s.chunks = runs[0].chunks;
    return s;
  };
  try {
    const visitor = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    for (const route of PUBLIC) {
      const runs = [];
      for (let i = 0; i < RUNS; i++) runs.push(await loadOnce(visitor, webUrl + route, 1500));
      out.routes[route] = summarise(runs);
    }
    out.landingScroll = await scrollFps(visitor, webUrl + '/');
    await visitor.close();

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await register(page, webUrl, 'Perf Student', `perf.${Date.now()}@example.com`, 'Password123!');
    await completeOnboarding(page, 'Frontend Engineer');
    await page.close();
    for (const route of SIGNED_IN) {
      const runs = [];
      for (let i = 0; i < RUNS; i++) runs.push(await loadOnce(context, webUrl + route, 2500));
      out.routes[route] = summarise(runs);
    }
    out.homeScroll = await scrollFps(context, webUrl + '/home');
    await context.close();
  } finally {
    await browser.close();
  }
  for (const [route, s] of Object.entries(out.routes)) {
    console.log(`${route.padEnd(14)} FCP ${s.fcp} LCP ${s.lcp} load ${s.load} JS ${s.jsKB}KB/${s.jsFiles} CSS ${s.cssKB}KB req ${s.requests} long ${s.longTasks}/${s.longTaskMs}ms api ${s.apiCalls} dup ${s.duplicateApi.join(',') || '-'}`);
  }
  console.log(`scroll / ${JSON.stringify(out.landingScroll)}  /home ${JSON.stringify(out.homeScroll)}`);
  if (process.env.E2E_PERF_OUT) fs.writeFileSync(process.env.E2E_PERF_OUT, JSON.stringify(out, null, 2));
  return 0;
}
