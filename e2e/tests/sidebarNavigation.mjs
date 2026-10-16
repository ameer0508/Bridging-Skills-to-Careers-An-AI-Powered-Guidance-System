// Sidebar navigation without page refreshes, and the AI waiting indicator.
//
//   E2E_TEST_FILE=./tests/sidebarNavigation.mjs pnpm test:e2e
//
// Regression for "a sidebar page sometimes does not appear until the browser is refreshed": a page
// whose code chunk failed to download once stayed on the error screen for the rest of the tab,
// because React.lazy remembered the failed import and the error card could only reload. A marker
// on window proves that no step below relies on a full page reload.
import crypto from 'node:crypto';
import { Reporter, completeOnboarding, expect, launchBrowser, register, watch } from '../lib/harness.mjs';

const PASSWORD = 'Password123!';
// Must equal JWT_ACCESS_SECRET in run.mjs (test-only, used nowhere else)
const E2E_ACCESS_SECRET = 'e2e-access-secret-not-used-anywhere-else';
const b64url = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');
const signHs256 = (payload) => {
  const head = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}`;
  return `${head}.${crypto.createHmac('sha256', E2E_ACCESS_SECRET).update(head).digest('base64url')}`;
};

export async function run({ webUrl, apiUrl, aiControl }) {
  const t = new Reporter();
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const log = watch(page, apiUrl);

  const view = () => page.evaluate(() => {
    const main = document.querySelector('main');
    return {
      path: location.pathname,
      heading: main?.querySelector('h1, h2')?.textContent.trim() || '',
      sig: main?.querySelector('h1, h2')?.textContent.trim() || (main?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 120),
      busy: !!main?.querySelector('[aria-busy="true"]'),
      errorCard: !!document.querySelector('[data-testid="error-boundary"]'),
      marker: window.__sbNoReload === true,
    };
  });
  /** Clicks a sidebar link and waits until that page (not the previous one) is on screen. */
  const go = async (href, { timeout = 15_000 } = {}) => {
    const before = await view();
    await page.locator(`nav a[href="${href}"]`).first().click();
    const deadline = Date.now() + timeout;
    let v;
    do {
      await page.waitForTimeout(150);
      v = await view();
      if (v.errorCard) break;
      if (v.path === href && !v.busy && v.sig && (v.sig !== before.sig || href === before.path)) return v;
    } while (Date.now() < deadline);
    throw new Error(`${href}: shown ${JSON.stringify(v)} after ${timeout} ms (previous page "${before.sig}")`);
  };
  const markNoReload = () => page.evaluate(() => { window.__sbNoReload = true; });
  const stillNoReload = async () => expect((await view()).marker, 'the page was reloaded');

  try {
    let links = [];
    await t.step('right after registering, the sidebar lists its destinations', async () => {
      await register(page, webUrl, 'Navigation Synthetic', `nav.${Date.now()}@example.com`, PASSWORD);
      await completeOnboarding(page, 'Backend Developer');
      await page.waitForTimeout(1000);
      await markNoReload();
      links = await page.$$eval('nav a[href^="/"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))]);
      expect(links.length >= 20, `only ${links.length} sidebar links`);
      return `${links.length} destinations`;
    });

    await t.step('a page whose code fails to download recovers with "Try again", without a reload', async () => {
      let blocking = true;
      const isAnalytics = (url) => /AnalyticsWorkspace/.test(url);
      await page.route('**/*', (route) => (blocking && isAnalytics(route.request().url())
        ? route.fulfill({ status: 404, body: 'gone' })
        : route.continue()));
      await page.locator('nav a[href="/analytics"]').first().click();
      await page.getByTestId('error-boundary').waitFor({ timeout: 20_000 });
      expect((await page.getByTestId('error-boundary-reason').getAttribute('data-reason')) === 'chunk', 'the card does not say the page could not be loaded');
      blocking = false;
      await page.getByRole('button', { name: 'Try again' }).click();
      await page.getByText('See Your Career Development Unfold Over Time').first().waitFor({ timeout: 15_000 });
      expect(!(await view()).errorCard, 'the error card is still shown');
      await go('/home');
      await go('/analytics');
      await stillNoReload();
      await page.unroute('**/*');
      return 'error card → Try again → page shown; leaving and coming back works';
    });

    await t.step('a page that failed while away also loads on a later visit', async () => {
      let blocking = true;
      await page.route('**/*', (route) => (blocking && /ExamsHomePage/.test(route.request().url())
        ? route.fulfill({ status: 404, body: 'gone' })
        : route.continue()));
      await page.locator('nav a[href="/exams"]').first().click();
      await page.getByTestId('error-boundary').waitFor({ timeout: 20_000 }).catch(() => {});
      blocking = false;
      await go('/home');
      const v = await go('/exams');
      await page.unroute('**/*');
      await stillNoReload();
      return `second visit shows "${v.heading}"`;
    });

    await t.step('a page whose code cannot be loaded at all stays contained; other pages keep working', async () => {
      // Every request for this page's chunk fails, including the cache-busting retries
      await page.route('**/*', (route) => (/CareerDomains/.test(route.request().url())
        ? route.fulfill({ status: 404, body: 'gone' })
        : route.continue()));
      await page.locator('nav a[href="/career-domains"]').first().click();
      await page.getByTestId('error-boundary').waitFor({ timeout: 20_000 });
      const reason = await page.getByTestId('error-boundary-reason').getAttribute('data-reason');
      await go('/home');
      await go('/careers');
      expect(!(await view()).errorCard, 'the error card followed the user to other pages');
      await page.unroute('**/*');
      // With the network back, the page loads on the next visit
      const v = await go('/career-domains');
      await stillNoReload();
      return `card (${reason}) on the broken page only; /home and /careers fine; next visit shows "${v.sig.slice(0, 30)}"`;
    });

    await t.step('every sidebar destination renders on its first click, without a refresh', async () => {
      const shown = [];
      for (const href of links) shown.push(`${href}: ${(await go(href)).heading.slice(0, 30)}`);
      await stillNoReload();
      return `${shown.length} pages`;
    });

    await t.step('switching back and forth between pages keeps working', async () => {
      for (let i = 0; i < 3; i++) for (const href of ['/careers', '/readiness', '/roadmap', '/home']) await go(href);
      await stillNoReload();
    });

    await t.step('rapid clicks end on the page that was clicked last', async () => {
      for (const href of ['/skills', '/careers', '/readiness', '/roadmap', '/portfolio']) {
        await page.locator(`nav a[href="${href}"]`).first().click();
        await page.waitForTimeout(100);
      }
      await page.waitForTimeout(3000);
      const v = await view();
      expect(v.path === '/portfolio' && !v.errorCard && !v.busy && /point to/i.test(v.heading), `ended on ${JSON.stringify(v)}`);
    });

    await t.step('browser back and forward show the matching pages', async () => {
      const trail = [];
      for (const href of ['/skills', '/careers', '/readiness']) trail.push(await go(href));
      await page.goBack(); await page.waitForTimeout(2000);
      expect((await view()).heading === trail[1].heading, 'back did not show the previous page');
      await page.goBack(); await page.waitForTimeout(2000);
      expect((await view()).heading === trail[0].heading, 'second back did not show the page before');
      await page.goForward(); await page.waitForTimeout(2000);
      expect((await view()).heading === trail[1].heading, 'forward did not show the next page');
      await stillNoReload();
    });

    await t.step('directly opening a URL renders that page', async () => {
      await page.goto(`${webUrl}/readiness`);
      await page.waitForTimeout(3000);
      const v = await view();
      expect(v.path === '/readiness' && v.heading && !v.errorCard && !v.busy, JSON.stringify(v));
      await markNoReload();
    });

    await t.step('with an expired session, sidebar pages still load (the session is refreshed)', async () => {
      const user = JSON.parse(await page.evaluate(() => localStorage.getItem('sb-user')));
      const expired = signHs256({ userId: user.id || user._id, role: user.role || 'user', iat: Math.floor(Date.now() / 1000) - 3600, exp: Math.floor(Date.now() / 1000) - 60 });
      await page.evaluate((v) => { localStorage.setItem('sb-access-token', v); localStorage.setItem('skillbridge-auth-token', v); }, expired);
      // Coming back to the app after the access token expired
      await page.goto(`${webUrl}/home`);
      await page.waitForTimeout(3000);
      await markNoReload();
      await go('/skills');
      await go('/careers');
      const now = await page.evaluate(() => localStorage.getItem('sb-access-token'));
      expect(now && now !== expired, 'the expired access token is still in use');
      await stillNoReload();
    });

    await t.step('a slow API shows a loading state, then the page', async () => {
      await page.route('**/api/v1/readiness*', async (route) => { await new Promise((r) => setTimeout(r, 2500)); await route.continue(); });
      await page.locator('nav a[href="/readiness"]').first().click();
      let sawLoading = false;
      for (let i = 0; i < 15 && !sawLoading; i++) {
        await page.waitForTimeout(100);
        const v = await view();
        sawLoading = v.path === '/readiness' && (v.busy || /loading|checking|fetching/i.test(await page.locator('main').innerText()));
      }
      await page.waitForTimeout(3500);
      const v = await view();
      await page.unroute('**/api/v1/readiness*');
      expect(v.path === '/readiness' && v.heading && !v.errorCard && !v.busy, `after the slow response: ${JSON.stringify(v)}`);
      return sawLoading ? 'loading state seen, then the page' : 'page shown after the slow response (no separate loading state caught)';
    });

    await t.step('pages without data show their empty states, not errors', async () => {
      const empty = [];
      for (const href of ['/roadmap', '/portfolio', '/applications']) {
        const v = await go(href);
        expect(!v.errorCard, `${href} fell into the error boundary`);
        empty.push(`${href}: ${v.heading.slice(0, 40)}`);
      }
      return empty.join('; ');
    });

    await t.step('on a phone, the sidebar opens, navigates and gets out of the way', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(800);
      const drawer = page.getByTestId('mobile-navigation');
      for (const href of ['/careers', '/skills', '/readiness']) {
        await page.getByRole('button', { name: 'Open navigation' }).click();
        await page.getByRole('dialog', { name: 'Navigation' }).waitFor({ timeout: 5000 });
        const before = await view();
        await page.getByRole('dialog', { name: 'Navigation' }).locator(`a[href="${href}"]`).click();
        await page.waitForTimeout(1500);
        const v = await view();
        expect(v.path === href && v.sig !== before.sig && !v.errorCard, `${href}: ${JSON.stringify(v)}`);
        expect((await drawer.getAttribute('data-open')) === 'false', `${href}: the drawer is still open`);
        const covered = await page.evaluate(() => !!document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)?.closest('[data-testid="mobile-navigation"]'));
        expect(!covered, `${href}: the closed drawer still covers the page`);
      }
      // The page underneath takes taps again: the menu button opens the drawer once more
      await page.getByRole('button', { name: 'Open navigation' }).click({ timeout: 3000 });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
      await page.setViewportSize({ width: 1366, height: 900 });
      await page.waitForTimeout(800);
      return '3 taps through the drawer; closed and out of the way after each';
    });

    await t.step('AI chat: an honest waiting indicator with elapsed time, gone when the reply arrives', async () => {
      await aiControl({ chat: { mode: 'slow', delayMs: 3500, reply: 'A reply after a wait.' } });
      await go('/ai');
      const input = page.locator('textarea[placeholder^="Ask your AI Career Architect"]');
      await input.fill('What should I learn next?');
      await input.press('Enter');
      const pending = page.getByTestId('chat-pending');
      await pending.waitFor({ timeout: 10_000 });
      const text = await pending.innerText();
      expect(/AI is thinking\.\.\. Running locally\. Responses may take longer depending on system load\./.test(text), `indicator text: ${text}`);
      expect(!/40 seconds/.test(text), 'the old fixed promise is still shown');
      await page.waitForTimeout(2200);
      const seconds = Number(await page.getByTestId('chat-pending-elapsed').getAttribute('data-seconds'));
      expect(seconds >= 2, `elapsed time did not advance (${seconds} s)`);
      await page.locator('[data-testid="chat-message"][data-source="ai"]').first().waitFor({ timeout: 20_000 });
      expect((await pending.count()) === 0, 'the indicator is still shown after the reply');
      await aiControl({ chat: { mode: 'unavailable' } });
      await input.fill('And after that?');
      await input.press('Enter');
      await page.locator('[data-testid="chat-message"][data-source="fallback"]').first().waitFor({ timeout: 20_000 });
      expect((await pending.count()) === 0, 'the indicator is still shown after a failure');
      await aiControl({ chat: { mode: 'ok' } });
      return `indicator shown with ${seconds}+ s elapsed; removed after the reply and after a failure`;
    });

    await t.step('when shared code also failed, the next visit recovers with a single automatic reload', async () => {
      // A fresh tab, so nothing is cached yet; the same signed-in session
      const tab = await context.newPage();
      let loads = 0;
      // 'load' fires only for full page loads, not for in-app route changes
      tab.on('load', () => { loads += 1; });
      await tab.goto(`${webUrl}/home`);
      await tab.waitForTimeout(3000);
      let blocking = true;
      // The page's chunk and every shared chunk it needs fail, as in a dropped connection
      await tab.route('**/*', (route) => {
        const url = route.request().url();
        const isLazyChunk = /\/assets\/(?!index-)[^/]+\.js|\/src\/(workspaces|features|components)\//.test(url);
        return blocking && isLazyChunk ? route.fulfill({ status: 404, body: 'gone' }) : route.continue();
      });
      await tab.locator('nav a[href="/analytics"]').first().click();
      await tab.getByTestId('error-boundary').waitFor({ timeout: 20_000 });
      const loadsBefore = loads;
      blocking = false;
      await tab.locator('nav a[href="/home"]').first().click();
      await tab.waitForTimeout(2000);
      await tab.locator('nav a[href="/analytics"]').first().click();
      await tab.getByText('See Your Career Development Unfold Over Time').first().waitFor({ timeout: 25_000 });
      const reloads = loads - loadsBefore;
      await tab.close();
      expect(reloads <= 1, `${reloads} reloads`);
      return reloads === 1 ? 'page shown after exactly one automatic reload' : 'page shown without a reload';
    });

    await t.step('no unexpected console errors', async () => {
      // The deliberate download failures above log their own errors
      const errors = log.console.filter((e) => !/Failed to load resource|dynamically imported module|ErrorBoundary caught|Importing a module script failed|error loading dynamically imported/i.test(e));
      expect(errors.length === 0, errors.slice(0, 3).join(' | '));
    });
  } finally {
    await browser.close();
  }
  console.log(`\nSUMMARY ${t.results.length - t.failures}/${t.results.length} passed`);
  return t.failures;
}
