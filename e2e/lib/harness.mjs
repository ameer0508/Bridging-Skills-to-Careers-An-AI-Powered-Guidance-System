// Small helpers shared by the smoke tests: browser launch, a step runner that records
// PASS/FAIL with the evidence it saw, and an API client that reuses the signed-in user's token.
import { chromium } from 'playwright-core';

/**
 * Launches an installed browser. No browser download is needed: the first channel that is
 * present on the machine is used. Set E2E_BROWSER_CHANNEL to force one (msedge, chrome, chromium).
 */
export async function launchBrowser({ channel: only, args } = {}) {
  const channels = only ? [only] : [process.env.E2E_BROWSER_CHANNEL, 'msedge', 'chrome', 'chromium'].filter(Boolean);
  const errors = [];
  for (const channel of channels) {
    try {
      const browser = await chromium.launch({ channel, args, headless: process.env.E2E_HEADED !== '1' });
      return { browser, channel };
    } catch (error) {
      errors.push(`${channel}: ${String(error.message).split('\n')[0]}`);
    }
  }
  throw new Error(`No usable browser found. Install Microsoft Edge or Google Chrome, or set E2E_BROWSER_CHANNEL.\n${errors.join('\n')}`);
}

export class Reporter {
  results = [];

  async step(name, fn) {
    const started = Date.now();
    try {
      const detail = await fn();
      this.record(name, true, detail, started);
    } catch (error) {
      this.record(name, false, String(error.message).replace(/\s+/g, ' ').slice(0, 400), started);
    }
  }

  record(name, ok, detail, started) {
    this.results.push({ name, ok, detail: detail || '' });
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}  (${seconds}s)`);
  }

  get failures() {
    return this.results.filter((r) => !r.ok).length;
  }
}

export function expect(condition, message) {
  if (!condition) throw new Error(message);
}

/** Collects browser console errors and failed API responses for one page. */
export function watch(page, apiUrl) {
  const log = { console: [], failed: [] };
  page.on('console', (m) => {
    if (m.type() === 'error') log.console.push(m.text().slice(0, 240));
  });
  page.on('pageerror', (e) => log.console.push(`PAGEERROR ${String(e.message).slice(0, 240)}`));
  page.on('response', (r) => {
    if (r.url().startsWith(apiUrl) && r.status() >= 400) {
      log.failed.push(`${r.status()} ${r.request().method()} ${r.url().slice(apiUrl.length)}`);
    }
  });
  return log;
}

/**
 * Calls the API as the user signed in on `page`, using the bearer token the app itself sends.
 * Used to check stored state behind what the screen shows.
 */
export function apiClient(page, apiUrl) {
  let authorization = null;
  page.on('request', (r) => {
    const header = r.headers().authorization;
    if (header) authorization = header;
  });
  return async (method, path, body) => {
    const headers = { 'Content-Type': 'application/json' };
    if (authorization) headers.Authorization = authorization;
    const res = await fetch(apiUrl + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    let json = null;
    try {
      json = await res.json();
    } catch {
      // not JSON (e.g. a file download)
    }
    return { status: res.status, json, data: json?.data, headers: res.headers };
  };
}

export const bodyText = async (page) => (await page.locator('body').innerText()).replace(/\s+/g, ' ');

export async function gotoAndSettle(page, url, ms = 2500) {
  await page.goto(url);
  await page.waitForTimeout(ms);
}

export async function register(page, webUrl, name, email, password) {
  await page.goto(`${webUrl}/register`);
  await page.fill('input[placeholder="John Doe"]', name);
  await page.fill('input[type="email"]', email);
  for (const field of await page.locator('input[type="password"]').all()) await field.fill(password);
  for (const box of await page.locator('input[type="checkbox"]').all()) await box.check().catch(() => {});
  await page.click('button[type="submit"]');
  await page.waitForURL('**/home', { timeout: 30_000 });
}

export async function completeOnboarding(page, role) {
  await page.getByText('Software Engineering', { exact: false }).first().click();
  await page.getByText('Continue to Specializations').click();
  await page.getByText('Define Target Role').click();
  await page.locator('input[type="text"]').last().fill(role);
  await page.getByText('ACTIVATE CAREER INTELLIGENCE').click();
  await page.waitForTimeout(1500);
}

/** A file the upload validator accepts as a PDF; the stub AI service reads its text. */
export function syntheticResume(lines) {
  return Buffer.from(`%PDF-1.4\n${lines.join('\n')}\n`, 'utf8');
}
