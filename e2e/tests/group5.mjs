// Browser test for the Aurora Elite group 5 screens (AI assistant, language and OCR, employer
// postings, administration, settings) and for every remaining signed-in route: with the
// temporary dark container gone, each one must render on the light design, with no large dark
// surface, no serious accessibility issue and no sideways scrolling. Run with
//   E2E_TEST_FILE=./tests/group5.mjs node run.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Reporter, apiClient, bodyText, completeOnboarding, expect, gotoAndSettle, launchBrowser, register, watch } from '../lib/harness.mjs';
import { setRole } from '../lib/admin.mjs';

const AXE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', 'axe-core', 'axe.min.js');
const PASSWORD = 'Password123!';
const GROUP5 = ['/ai', '/agent', '/resume-language', '/employer-postings', '/settings', '/profile'];
// Every signed-in route not covered by the group 1 to 4 tests
const REMAINING = [
  '/activity', '/analytics', '/brand', '/career-domains', '/career-os', '/coding', '/diagnostics', '/digital-twin', '/events',
  '/features', '/github', '/graph', '/learning-agent', '/linkedin', '/memory', '/networking-agent', '/opensource', '/ops',
  '/orchestrator', '/recommendations', '/resume-agent', '/skills', '/portfolio-demo',
];

async function serious(page) {
  await page.waitForTimeout(450);
  await page.addScriptTag({ path: AXE });
  return page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, resultTypes: ['violations'] });
    return r.violations.filter((v) => ['serious', 'critical'].includes(v.impact)).map((v) => `${v.id} (${v.nodes.length}) ${v.nodes[0]?.target.join(' ')}`);
  });
}

// Large, mostly opaque, dark backgrounds: the signature of a screen still in the old design
const darkSurfaces = (page) =>
  page.evaluate(() => {
    const found = [];
    for (const el of document.querySelectorAll('main *, [role="dialog"] *')) {
      const r = el.getBoundingClientRect();
      if (r.width * r.height < 40_000 || r.width === 0) continue;
      const m = getComputedStyle(el).backgroundColor.match(/rgba?\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:[, /]+([\d.]+))?/);
      if (!m) continue;
      const alpha = m[4] === undefined ? 1 : Number(m[4]);
      const lum = (0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) / 255;
      if (alpha >= 0.5 && lum < 0.3) found.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 3).join('.')}`);
    }
    return found.slice(0, 3);
  });

export async function run({ webUrl, apiUrl, tmpDir }) {
  const t = new Reporter();
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const log = watch(page, apiUrl);
  const api = apiClient(page, apiUrl);
  const email = `group5.${Date.now()}@example.com`;
  const a11y = [];
  const scan = async (label) => {
    for (const v of await serious(page)) a11y.push(`${label}: ${v}`);
  };

  try {
    await t.step('signed out: the group 5 screens and the administrator API are closed', async () => {
      for (const route of [...GROUP5, '/ai-observability']) {
        await gotoAndSettle(page, webUrl + route, 1000);
        expect(new URL(page.url()).pathname !== route, `${route} opened without signing in`);
      }
      const res = await fetch(`${apiUrl}/ai-observability/summary`);
      expect(res.status === 401, `the administrator API answered ${res.status} without a token`);
    });

    await t.step('register', async () => {
      await register(page, webUrl, 'Group Five Tester', email, PASSWORD);
      await completeOnboarding(page, 'Data Analyst');
    });

    await t.step('the old dark container is gone and the page theme is light', async () => {
      await gotoAndSettle(page, `${webUrl}/settings`, 2500);
      expect((await page.locator('.sb-legacy-dark, [data-theme-boundary="legacy-dark"]').count()) === 0, 'a legacy dark container is still rendered');
      expect(await page.evaluate(() => document.documentElement.classList.contains('light')), 'the document is not in the light theme');
    });

    await t.step('group 5 screens render on the light design without serious issues', async () => {
      const problems = [];
      for (const route of GROUP5) {
        await gotoAndSettle(page, webUrl + route, 2500);
        const text = await bodyText(page);
        if (/Something went wrong|Unexpected Application Error/i.test(text)) problems.push(`${route}: error screen`);
        const dark = await darkSurfaces(page);
        if (dark.length) problems.push(`${route}: dark surface ${dark.join(', ')}`);
        await scan(route);
      }
      expect(problems.length === 0, problems.join(' | '));
    });

    await t.step('language guidance: Hindi is chosen and kept after a reload', async () => {
      await gotoAndSettle(page, `${webUrl}/resume-language`, 2500);
      await page.getByLabel('Language of this page').selectOption('hi');
      await page.waitForFunction(() => document.querySelector('[data-testid="resume-language-page"]')?.getAttribute('lang') === 'hi', null, { timeout: 10_000 });
      await page.reload();
      await page.getByTestId('guidance-intro').waitFor({ timeout: 15_000 });
      expect(/देवनागरी/.test(await page.getByTestId('guidance-intro').innerText()), 'the language choice did not persist');
      expect((await api('GET', '/languages/settings')).data.uiLanguage === 'hi', 'not stored on the account');
      await scan('language hindi');
    });

    await t.step('employer postings: the self-declared disclosure is shown and nothing is invented', async () => {
      await gotoAndSettle(page, `${webUrl}/employer-postings`, 2500);
      await page.getByTestId('openings-empty').waitFor({ timeout: 15_000 });
      expect(/self-declared/.test(await page.getByTestId('employer-disclosure').innerText()), 'no disclosure');
      expect((await page.getByRole('tab', { name: 'Review reports' }).count()) === 0, 'a non-administrator sees the review tab');
      expect(!/verified employer/i.test(await bodyText(page)), 'an employer is called verified');
    });

    await t.step('settings: an edited target role is saved and kept after a reload', async () => {
      await gotoAndSettle(page, `${webUrl}/settings`, 2500);
      await page.getByRole('button', { name: 'Edit Preferences' }).click();
      await page.getByPlaceholder('e.g. Lead Security Architect').fill('Business Intelligence Analyst');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      await page.waitForTimeout(2000);
      await page.reload();
      await page.waitForTimeout(2500);
      const me = (await api('GET', '/users/me')).data;
      const role = me?.targetRole ?? me?.user?.targetRole;
      expect(role === 'Business Intelligence Analyst', `stored target role: ${role}`);
      expect(/Business Intelligence Analyst/.test(await bodyText(page)), 'the saved role is not shown after a reload');
    });

    await t.step('every remaining route renders on the light design without serious issues', async () => {
      const problems = [];
      for (const route of REMAINING) {
        await gotoAndSettle(page, webUrl + route, 2500);
        const text = await bodyText(page);
        if (/Something went wrong|Unexpected Application Error/i.test(text)) problems.push(`${route}: error screen`);
        const dark = await darkSurfaces(page);
        if (dark.length) problems.push(`${route}: dark surface ${dark.join(', ')}`);
        await scan(route);
      }
      expect(problems.length === 0, problems.join(' | '));
    });

    await t.step('a regular user cannot open administration', async () => {
      expect((await page.getByRole('link', { name: /AI Observability/ }).count()) === 0, 'a regular user sees the administration entry');
      await gotoAndSettle(page, `${webUrl}/ai-observability`, 2500);
      expect((await page.getByTestId('observability-error').innerText()).includes('Administrator access is required'), 'the page does not say access is refused');
      expect((await page.getByTestId('provider-stats').count()) === 0, 'data shown to a non-administrator');
      expect(!log.failed.some((p) => p.includes('/ai-observability/')), `refused requests sent: ${log.failed.join(', ')}`);
      expect((await page.getByTestId('load-error-banner').count()) === 0, 'a "could not be loaded, try again" notice is shown for a refusal');
      await scan('ai observability refused');
    });

    await t.step('an administrator sees AI observability on the light design', async () => {
      setRole(tmpDir, email, 'admin');
      // The role reaches the app with the next sign-in, so a fresh browser session signs in
      const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const admin = await adminContext.newPage();
      const adminLog = watch(admin, apiUrl);
      await admin.goto(`${webUrl}/login`);
      await admin.fill('input[type="email"]', email);
      await admin.fill('input[type="password"]', PASSWORD);
      await admin.click('button[type="submit"]');
      await admin.waitForURL('**/home', { timeout: 20_000 });
      await admin.getByRole('link', { name: /AI Observability/ }).first().click();
      await admin.waitForURL('**/ai-observability', { timeout: 15_000 });
      await admin.getByTestId('provider-stats').waitFor({ timeout: 15_000 });
      const dark = await darkSurfaces(admin);
      expect(dark.length === 0, `dark surface ${dark.join(', ')}`);
      for (const v of await serious(admin)) a11y.push(`ai observability admin: ${v}`);
      await gotoAndSettle(admin, `${webUrl}/employer-postings`, 2500);
      expect((await admin.getByRole('tab', { name: 'Review reports' }).count()) === 1, 'an administrator has no review tab');
      await admin.getByRole('tab', { name: 'Review reports' }).click();
      await admin.waitForTimeout(1500);
      const reviewDark = await darkSurfaces(admin);
      expect(reviewDark.length === 0, `dark surface on the review tab ${reviewDark.join(', ')}`);
      for (const v of await serious(admin)) a11y.push(`employer review: ${v}`);
      expect(adminLog.failed.length === 0 && adminLog.console.length === 0, `administrator problems: ${[...adminLog.failed, ...adminLog.console].join(' | ')}`);
      await adminContext.close();
    });

    await t.step('no serious accessibility issue on any screen', async () => {
      expect(a11y.length === 0, a11y.join(' | '));
    });

    await t.step('reduced motion: the settings page renders at once', async () => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', storageState: await context.storageState() });
      const p = await ctx.newPage();
      await p.goto(`${webUrl}/settings`);
      const button = p.getByRole('button', { name: 'Edit Preferences' });
      await button.waitFor({ timeout: 20_000 });
      const opacity = await button.evaluate((el) => {
        let o = 1;
        for (let n = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
        return o;
      });
      expect(opacity === 1, `the page is still fading in (${opacity})`);
      await ctx.close();
    });

    await t.step('layout: no sideways scrolling at 1440, 1024, 768, 390 and 360 px', async () => {
      const problems = [];
      for (const width of [1440, 1024, 768, 390, 360]) {
        await page.setViewportSize({ width, height: 900 });
        for (const route of GROUP5) {
          await gotoAndSettle(page, webUrl + route, 1600);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          if (overflow > 1) problems.push(`${route} ${width}px: ${overflow}px`);
        }
      }
      await page.setViewportSize({ width: 1440, height: 900 });
      expect(problems.length === 0, problems.join(' | '));
    });

    await t.step('no unexpected API failures or console errors', async () => {
      // The refused administrator page is expected to log its 403s
      const failed = log.failed.filter((f) => !f.startsWith('403 GET /ai-observability/'));
      const consoleErrors = log.console.filter((m) => !/403/.test(m));
      expect(failed.length === 0, `API failures: ${failed.join(', ')}`);
      expect(consoleErrors.length === 0, `console errors: ${consoleErrors.slice(0, 4).join(' | ')}`);
    });
  } finally {
    await browser.close();
  }

  console.log(`\nSUMMARY ${t.results.length - t.failures}/${t.results.length} passed`);
  return t.failures;
}
