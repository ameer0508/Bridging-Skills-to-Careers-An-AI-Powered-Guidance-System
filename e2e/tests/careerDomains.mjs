// Browser test for the proposed career domains preview (E1). Run with
//   E2E_TEST_FILE=./tests/careerDomains.mjs node run.mjs
import { Reporter, apiClient, completeOnboarding, expect, gotoAndSettle, launchBrowser, register, watch } from '../lib/harness.mjs';

const PASSWORD = 'Password123!';

export async function run({ webUrl, apiUrl }) {
  const t = new Reporter();
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const log = watch(page, apiUrl);
  const api = apiClient(page, apiUrl);

  try {
    await t.step('the preview requires sign-in', async () => {
      await gotoAndSettle(page, `${webUrl}/career-domains`, 1500);
      expect(new URL(page.url()).pathname !== '/career-domains', 'opened without signing in');
    });

    await t.step('register', async () => {
      await register(page, webUrl, 'Domains Tester', `domains.${Date.now()}@example.com`, PASSWORD);
      await completeOnboarding(page, 'Software Engineer');
    });

    await t.step('the page says the roles are a preview, not part of matches yet', async () => {
      await page.getByRole('link', { name: /More Career Domains/ }).first().click();
      await page.waitForURL('**/career-domains', { timeout: 15_000 });
      const banner = await page.getByTestId('preview-banner').innerText();
      expect(/not yet part of your career matches, readiness, recommendations or roadmaps/.test(banner), `banner: ${banner}`);
    });

    await t.step('each role shows its O*NET basis and which skills are not yet recognised', async () => {
      expect((await page.getByTestId('domain-role').count()) === 6, 'six roles expected');
      const marketing = await page.getByTestId('domain-role').filter({ hasText: 'Digital Marketing Analyst' }).innerText();
      expect(/O\*NET-SOC 13-1161\.01/.test(marketing) && /In Demand/.test(marketing), `marketing card: ${marketing.slice(0, 200)}`);
      expect((await page.getByTestId('not-recognised').count()) >= 20, 'proposed skills are not flagged');
      expect(/SkillBridge editorial/.test(await page.getByTestId('domain-role').filter({ hasText: 'Embedded Systems Engineer' }).innerText()), 'editorial choices are not labelled');
      const attribution = await page.getByTestId('onet-attribution').innerText();
      expect(/O\*NET 31\.0 Database/.test(attribution) && /has not approved, endorsed, or tested/.test(attribution), 'attribution incomplete');
      expect((await page.getByTestId('onet-attribution').locator('a[href="https://creativecommons.org/licenses/by/4.0/"]').count()) === 1, 'no licence link');
    });

    await t.step('without skill evidence every role shows 0/100 and says why', async () => {
      const preview = page.getByTestId('domain-preview');
      expect(/No skill evidence yet/.test(await preview.innerText()), 'the empty state is not explained');
      const stored = (await api('GET', '/career-domains/preview')).data;
      expect(stored.careers.every((c) => c.score === 0) && (await preview.locator('tbody tr').count()) === 6, 'unexpected preview scores');
    });

    await t.step('the page fits a phone screen', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow <= 1, `page is ${overflow}px wider than the screen`);
    });

    await t.step('no unexpected API failures or console errors', async () => {
      expect(log.failed.length === 0, `API failures: ${log.failed.join(', ')}`);
      expect(log.console.length === 0, `console errors: ${log.console.slice(0, 4).join(' | ')}`);
    });
  } finally {
    await browser.close();
  }

  console.log(`\nSUMMARY ${t.results.length - t.failures}/${t.results.length} passed`);
  return t.failures;
}
