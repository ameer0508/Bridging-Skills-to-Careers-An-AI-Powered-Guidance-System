// Browser test for Stage E (product-wide polish): claims on every signed-in route, the sign-in and
// registration pages, the assistant's stated answer source, Settings figures, dialog keyboard
// behaviour, readable error states, the tablet layout and reduced motion. Run with
//   E2E_TEST_FILE=./tests/polish.mjs node run.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Reporter, bodyText, completeOnboarding, expect, gotoAndSettle, launchBrowser, register, watch } from '../lib/harness.mjs';

const AXE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', 'axe-core', 'axe.min.js');
const PASSWORD = 'Password123!';
const ROUTES = [
  '/home', '/resume', '/careers', '/readiness', '/career-lab', '/roadmap', '/portfolio', '/interview-agent', '/interviews',
  '/exams', '/job-agent', '/opportunities', '/opportunity-agent', '/applications', '/application-outcomes', '/market',
  '/market/salaries', '/ai', '/agent', '/resume-language', '/employer-postings', '/settings', '/profile', '/activity',
  '/analytics', '/brand', '/career-domains', '/career-os', '/coding', '/diagnostics', '/digital-twin', '/events', '/features',
  '/github', '/graph', '/learning-agent', '/linkedin', '/memory', '/networking-agent', '/opensource', '/ops', '/orchestrator',
  '/recommendations', '/resume-agent', '/skills', '/portfolio-demo',
];
// Claims the product cannot back: unverified "verified", invented liveness, named providers,
// invented confidence and status figures, and hiring outcomes
const FORBIDDEN = [
  /Verified Skills?\b/, /Verified Competenc/, /Gemini/, /Real-?time (?!systems)/i, /Live Telemetry/i, /Core Synchronized/,
  /AI Gateway Connected/, /Predictive AI/, /Ranked by ROI/, /Telemetry Synced/, /hiring probability/i, /guaranteed (placement|job|hire|interview|offer)/i,
  /placement rate/i, /Live Synced/i, /Vector Match/i, /256-Bit/i, /Production Hardened/i, /Security & Safety Index/,
  /Connected Vault & SSO/, /Mathematical Convergence/, /status code \d{3}/, /Live Sync/i, /Single sign-on/i, /Encrypted file/i,
  /recruiter callback/i, /skill vector/i, /Identity Verification/i, /AI Rationale/i, /neural guidance/i, /Chronologically ordered/i,
];

async function serious(page) {
  await page.waitForTimeout(400);
  await page.addScriptTag({ path: AXE });
  return page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, resultTypes: ['violations'] });
    return r.violations.filter((v) => ['serious', 'critical'].includes(v.impact)).map((v) => `${v.id} (${v.nodes.length}) ${v.nodes[0]?.target.join(' ')}`);
  });
}

export async function run({ webUrl, apiUrl }) {
  const t = new Reporter();
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const log = watch(page, apiUrl);
  const dialogs = [];
  page.on('dialog', async (d) => {
    dialogs.push(d.message());
    await d.dismiss();
  });

  try {
    await t.step('sign-in page: honest copy, no browser pop-ups, and an honest password-reset note', async () => {
      await gotoAndSettle(page, `${webUrl}/login`, 1500);
      const text = await bodyText(page);
      const hit = FORBIDDEN.find((re) => re.test(text));
      expect(!hit, `the sign-in page says ${hit}`);
      expect(!/Remember this device/i.test(text), 'a "remember this device" option that does nothing is shown');
      await page.getByRole('button', { name: 'Forgot password?' }).click();
      const note = page.getByRole('status').filter({ hasText: /not available/ });
      await note.waitFor({ timeout: 5000 });
      expect(/ask whoever runs this SkillBridge installation/.test(await note.innerText()), 'the reset note does not say what to do');
      expect(dialogs.length === 0, `a browser dialog opened: ${dialogs.join(' | ')}`);
    });

    await t.step('registration: the storage agreement is required, with an inline message', async () => {
      await gotoAndSettle(page, `${webUrl}/register`, 1500);
      await page.fill('input[placeholder="John Doe"]', 'Polish Tester');
      await page.fill('input[type="email"]', `polish.refused.${Date.now()}@example.com`);
      for (const field of await page.locator('input[type="password"]').all()) await field.fill(PASSWORD);
      await page.locator('input[type="checkbox"]').last().uncheck();
      await page.click('button[type="submit"]');
      const alert = page.locator('#terms-error');
      await alert.waitFor({ timeout: 5000 });
      expect((await alert.getAttribute('role')) === 'alert', 'the message is not announced');
      expect(new URL(page.url()).pathname === '/register', 'the account was created without the agreement');
      expect(dialogs.length === 0, `a browser dialog opened: ${dialogs.join(' | ')}`);
    });

    await t.step('register and onboard', async () => {
      await register(page, webUrl, 'Polish Tester', `polish.${Date.now()}@example.com`, PASSWORD);
      await completeOnboarding(page, 'Frontend Engineer');
    });

    await t.step('no unsupported claim on any signed-in route', async () => {
      const problems = [];
      for (const route of ROUTES) {
        await gotoAndSettle(page, webUrl + route, 2200);
        const text = await bodyText(page);
        for (const re of FORBIDDEN) if (re.test(text)) problems.push(`${route}: ${re}`);
        if (/Something went wrong|Unexpected Application Error/.test(text)) problems.push(`${route}: error screen`);
      }
      expect(problems.length === 0, problems.join(' | '));
    });

    await t.step('assistant: states who answers, from the real availability check', async () => {
      await gotoAndSettle(page, `${webUrl}/ai`, 3000);
      const source = page.getByTestId('assistant-source');
      await page.waitForFunction(() => document.querySelector('[data-testid="assistant-source"]')?.getAttribute('data-ai-live') !== 'unknown', null, { timeout: 15_000 });
      // The test stack has no language model, so the built-in rules answer
      expect((await source.getAttribute('data-ai-live')) === 'false', 'the stub stack is reported as having a language model');
      expect(/built-in rules/.test(await source.innerText()), `source: ${await source.innerText()}`);
    });

    await t.step('settings: figures come from the account, and Commands opens the command palette', async () => {
      await gotoAndSettle(page, `${webUrl}/settings`, 2500);
      const text = await bodyText(page);
      expect(/Account overview/.test(text) && /Skills on your profile/.test(text), 'the account overview is missing');
      expect(!/SSO|Personalization\s+\d|Safety Index/.test(text), 'an invented figure is shown');
      await page.getByRole('button', { name: /Commands/ }).first().click();
      await page.getByRole('dialog', { name: 'Search pages' }).waitFor({ timeout: 5000 });
      expect(dialogs.length === 0, `a browser dialog opened instead: ${dialogs.join(' | ')}`);
      await page.keyboard.press('Escape');
    });

    await t.step('dialog keyboard: focus moves in, Tab stays in, Escape closes, focus returns', async () => {
      await gotoAndSettle(page, `${webUrl}/profile`, 2500);
      const opener = page.getByRole('button', { name: 'Edit Identity' }).first();
      await opener.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Edit professional identity' });
      await dialog.waitFor({ timeout: 5000 });
      await page.waitForTimeout(150);
      expect(await dialog.evaluate((d) => d.contains(document.activeElement)), 'focus did not move into the dialog');
      for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
      expect(await dialog.evaluate((d) => d.contains(document.activeElement)), 'Tab left the dialog');
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'detached', timeout: 5000 });
      expect(await opener.evaluate((b) => b === document.activeElement), 'focus did not return to the button that opened the dialog');
      for (const v of await serious(page)) expect(false, `profile: ${v}`);
    });

    await t.step('error states: plain words, a retry, and no raw status codes', async () => {
      await page.route('**/api/v1/analytics**', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"success":false}' }));
      await gotoAndSettle(page, `${webUrl}/analytics`, 3000);
      const alert = page.getByRole('alert').filter({ has: page.getByRole('heading', { name: 'Progress analytics could not be loaded' }) });
      await alert.waitFor({ timeout: 10_000 });
      const text = await alert.innerText();
      expect(/server had a problem/.test(text) && !/status code/.test(text), `error text: ${text}`);
      expect((await alert.getByRole('button', { name: 'Try again' }).count()) === 1, 'no retry button');
      await page.unroute('**/api/v1/analytics**');
    });

    await t.step('tablet (768 px): navigation is a drawer and the content keeps its width', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await gotoAndSettle(page, `${webUrl}/profile`, 2500);
      const menu = page.getByRole('button', { name: 'Open navigation' });
      expect(await menu.isVisible(), 'the navigation button is hidden at 768 px');
      const clipped = await page.evaluate(() => {
        const main = document.getElementById('main-content');
        return main.scrollWidth - main.clientWidth;
      });
      expect(clipped <= 1, `content is cut off by ${clipped}px`);
      await menu.click();
      const nav = page.getByRole('dialog', { name: 'Navigation' });
      await nav.waitFor({ timeout: 5000 });
      await nav.getByRole('link', { name: /Career Readiness/ }).click();
      await page.waitForURL('**/readiness', { timeout: 10_000 });
      await page.setViewportSize({ width: 1440, height: 900 });
    });

    await t.step('reduced motion: no looping animation keeps running', async () => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', storageState: await context.storageState() });
      const p = await ctx.newPage();
      const problems = [];
      for (const route of ['/home', '/ai', '/recommendations', '/orchestrator', '/skills']) {
        await gotoAndSettle(p, webUrl + route, 2500);
        const looping = await p.evaluate(() =>
          document
            .getAnimations()
            .filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity)
            .map((a) => (a.effect?.target?.getAttribute?.('class') || '').slice(0, 60)),
        );
        if (looping.length) problems.push(`${route}: ${looping.length} looping (${looping[0]})`);
      }
      await ctx.close();
      expect(problems.length === 0, problems.join(' | '));
    });

    await t.step('no unexpected API failures or console errors', async () => {
      // The deliberate 500 for the error-state step is expected
      const failed = log.failed.filter((f) => !/^500 GET \/analytics/.test(f));
      const consoleErrors = log.console.filter((m) => !/500/.test(m));
      expect(failed.length === 0, `API failures: ${failed.join(', ')}`);
      expect(consoleErrors.length === 0, `console errors: ${consoleErrors.slice(0, 4).join(' | ')}`);
    });
  } finally {
    await browser.close();
  }

  console.log(`\nSUMMARY ${t.results.length - t.failures}/${t.results.length} passed`);
  return t.failures;
}
