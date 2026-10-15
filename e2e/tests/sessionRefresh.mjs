// Browser session lifecycle: an expired access token is refreshed without the user noticing, a
// tampered one ends the session, and signing out makes the refresh token useless.
//
//   E2E_TEST_FILE=./tests/sessionRefresh.mjs pnpm test:e2e
//
// Runs against the isolated stack started by run.mjs, whose JWT secret is the test-only value
// below, so an expired token can be signed the way the backend signs real ones.
import crypto from 'node:crypto';
import { Reporter, apiClient, bodyText, completeOnboarding, expect, gotoAndSettle, launchBrowser, register, watch } from '../lib/harness.mjs';

const PASSWORD = 'Password123!';
// Must equal JWT_ACCESS_SECRET in run.mjs (test-only, used nowhere else)
const E2E_ACCESS_SECRET = 'e2e-access-secret-not-used-anywhere-else';

const b64url = (value) => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');
function signHs256(payload, secret) {
  const head = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}`;
  return `${head}.${crypto.createHmac('sha256', secret).update(head).digest('base64url')}`;
}

export async function run({ webUrl, apiUrl }) {
  const t = new Reporter();
  const email = `session.${Date.now()}@example.com`;
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
  const log = watch(page, apiUrl);
  const api = apiClient(page, apiUrl);
  const token = () => page.evaluate(() => localStorage.getItem('sb-access-token'));
  const setToken = (value) => page.evaluate((v) => {
    localStorage.setItem('sb-access-token', v);
    localStorage.setItem('skillbridge-auth-token', v);
  }, value);

  try {
    let userId = null;
    let role = 'user';
    await t.step('register and land on the dashboard', async () => {
      await register(page, webUrl, 'Session Synthetic', email, PASSWORD);
      await completeOnboarding(page, 'Backend Developer');
      const user = JSON.parse(await page.evaluate(() => localStorage.getItem('sb-user')));
      userId = user.id || user._id || user.userId;
      role = user.role || role;
      expect(userId, 'no user id stored for the session');
    });

    await t.step('an expired access token is refreshed and the page still loads', async () => {
      const expired = signHs256({ userId, role, iat: Math.floor(Date.now() / 1000) - 3600, exp: Math.floor(Date.now() / 1000) - 60 }, E2E_ACCESS_SECRET);
      const expiredCheck = await fetch(`${apiUrl}/users/me`, { headers: { Authorization: `Bearer ${expired}` } });
      const code = (await expiredCheck.json()).error?.code;
      expect(expiredCheck.status === 401 && code === 'TOKEN_EXPIRED', `the backend answered ${expiredCheck.status} ${code} for the expired token`);

      await setToken(expired);
      const refreshes = [];
      page.on('response', (r) => { if (r.url().endsWith('/auth/refresh')) refreshes.push(r.status()); });
      await gotoAndSettle(page, `${webUrl}/profile`, 4000);
      const fresh = await token();
      expect(new URL(page.url()).pathname === '/profile', `sent to ${new URL(page.url()).pathname}`);
      expect(refreshes.includes(200), `refresh responses: ${refreshes.join(',') || 'none'}`);
      expect(fresh && fresh !== expired, 'the expired token is still in use');
      expect((await api('GET', '/users/me')).status === 200, 'the new token does not work');
      expect(/Session Synthetic/.test(await bodyText(page)), 'the profile did not load after the refresh');
      return `refresh ${refreshes.join(',')}; new token in use`;
    });

    await t.step('a tampered access token ends the session instead of being refreshed', async () => {
      const valid = await token();
      const [head, , sig] = valid.split('.');
      await setToken(`${head}.${b64url({ userId, role: 'admin', exp: Math.floor(Date.now() / 1000) + 600 })}.${sig}`);
      await gotoAndSettle(page, `${webUrl}/profile`, 4000);
      expect(new URL(page.url()).pathname === '/login', `stayed on ${new URL(page.url()).pathname} with a tampered token`);
      const stored = await page.evaluate(() => JSON.stringify(localStorage));
      expect(!/eyJ[A-Za-z0-9_-]{10,}\./.test(stored), 'tokens are still stored');
    });

    let refreshToken = null;
    await t.step('signing in again works', async () => {
      await page.goto(`${webUrl}/login`);
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/home', { timeout: 20_000 });
      refreshToken = await page.evaluate(() => localStorage.getItem('sb-refresh-token'));
      expect(refreshToken, 'no refresh token stored');
    });

    await t.step('after signing out, the old refresh token cannot start a new session', async () => {
      await gotoAndSettle(page, `${webUrl}/profile`, 2500);
      await page.getByRole('button', { name: /Sign Out Session/ }).click();
      await page.getByRole('button', { name: 'Terminate Session' }).click();
      await page.waitForTimeout(2500);
      const res = await fetch(`${apiUrl}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
      expect(res.status === 401, `refresh after sign-out returned ${res.status}`);
      await gotoAndSettle(page, `${webUrl}/home`, 2000);
      expect(new URL(page.url()).pathname !== '/home', 'home still opens after signing out');
    });

    await t.step('no unexpected console errors', async () => {
      // The tampered-token step makes the API answer INVALID_TOKEN on purpose
      const errors = log.console.filter((e) => !/Failed to load resource/.test(e) && !/INVALID_TOKEN/.test(e));
      expect(errors.length === 0, errors.slice(0, 3).join(' | '));
    });
  } finally {
    await browser.close();
  }
  console.log(`\nSUMMARY ${t.results.length - t.failures}/${t.results.length} passed`);
  return t.failures;
}
