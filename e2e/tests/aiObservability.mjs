// Browser test for AI observability (X11). Run with
//   E2E_TEST_FILE=./tests/aiObservability.mjs node run.mjs
// The e2e AI service is the fake one; the real audit log is tested in ai/tests/test_observability.py.
import { Reporter, apiClient, completeOnboarding, expect, gotoAndSettle, launchBrowser, register, watch } from '../lib/harness.mjs';
import { setRole } from '../lib/admin.mjs';

const PASSWORD = 'Password123!';

export async function run({ webUrl, apiUrl, tmpDir }) {
  const t = new Reporter();
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  let page = await context.newPage();
  let log = watch(page, apiUrl);
  const api = apiClient(page, apiUrl);
  const email = `obs.${Date.now()}@example.com`;

  try {
    await t.step('register a regular user', async () => {
      await register(page, webUrl, 'Observability Tester', email, PASSWORD);
      await completeOnboarding(page, 'Software Engineer');
    });

    await t.step('a regular user has no sidebar entry and the API refuses them', async () => {
      expect((await page.getByRole('link', { name: /AI Observability/ }).count()) === 0, 'the entry is shown to a non-administrator');
      for (const p of ['/ai-observability/summary', '/ai-observability/events', '/ai-observability/providers']) {
        const r = await api('GET', p);
        expect(r.status === 403, `${p} returned ${r.status}`);
      }
      await gotoAndSettle(page, `${webUrl}/ai-observability`, 1500);
      expect((await page.getByTestId('observability-error').innerText()).includes('Administrator access is required'), 'the page does not say access is refused');
      expect((await page.getByTestId('provider-stats').count()) === 0, 'data shown to a non-administrator');
    });

    await t.step('an administrator sees the sidebar entry, policy, statistics and events', async () => {
      setRole(tmpDir, email, 'admin');
      // The role shown in the app comes with the next sign-in; a fresh browser session signs in
      const userLog = log;
      expect(userLog.console.every(m => /403/.test(m)) && userLog.failed.every(p => p.startsWith('403 GET /ai-observability/')), `unexpected problems as a user: ${[...userLog.failed, ...userLog.console].join(' | ')}`);
      await context.close();
      const adminContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
      page = await adminContext.newPage();
      log = watch(page, apiUrl);
      await page.goto(`${webUrl}/login`);
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/home', { timeout: 20_000 });
      await page.getByRole('link', { name: /AI Observability/ }).first().click();
      await page.waitForURL('**/ai-observability', { timeout: 15_000 });
      await page.getByTestId('provider-policy').waitFor({ timeout: 15_000 });
      const policy = await page.getByTestId('provider-policy').innerText();
      expect(/openai/.test(policy) && /refused: blocked/.test(policy), `policy: ${policy}`);
      const stats = await page.getByTestId('provider-stats').innerText();
      expect(/mock/.test(stats) && /12 ms \/ 12 ms/.test(stats) && /chat_architect/.test(stats), `stats: ${stats}`);
      expect((await page.getByText(/kept for 14 days/).count()) === 1, 'the retention period is not stated');
      expect(/success/.test(await page.getByTestId('audit-events').innerText()), 'events are not listed');
    });

    await t.step('changing the window asks for that window', async () => {
      const req = page.waitForRequest(r => r.url().includes('/ai-observability/summary') && r.url().includes('windowHours=168'));
      await page.getByLabel('Time window', { exact: true }).selectOption('168');
      await req;
    });

    await t.step('the page fits a phone screen', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow <= 1, `page is ${overflow}px wider than the screen`);
    });

    await t.step('no API failures or console errors as an administrator', async () => {
      expect(log.failed.length === 0, `API failures: ${log.failed.join(', ')}`);
      expect(log.console.length === 0, `console errors: ${log.console.slice(0, 4).join(' | ')}`);
    });
  } finally {
    await browser.close();
  }

  console.log(`\nSUMMARY ${t.results.length - t.failures}/${t.results.length} passed`);
  return t.failures;
}
