// Browser test for the careers added with E1. Run with
//   E2E_TEST_FILE=./tests/careerDomains.mjs node run.mjs
import { Reporter, apiClient, completeOnboarding, expect, gotoAndSettle, launchBrowser, register, syntheticResume, watch } from '../lib/harness.mjs';

const PASSWORD = 'Password123!';
// SYNTHETIC TEST DATA: a QA engineer whose tools exist only in the E1 lexicon additions
const RESUME = syntheticResume([
  'Asha Rao',
  'Email: asha.rao@example.com',
  '',
  'Experience:',
  'Test Engineer at Example Labs (2022-2024)',
  'Automated UI tests with Playwright and Appium; load tests with JMeter; API checks in Python.',
  '',
  'Skills:',
  'Playwright, Appium, JMeter, Python, Git, SQL',
]);

export async function run({ webUrl, apiUrl }) {
  const t = new Reporter();
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const log = watch(page, apiUrl);
  const api = apiClient(page, apiUrl);

  try {
    await t.step('the page requires sign-in', async () => {
      await gotoAndSettle(page, `${webUrl}/career-domains`, 1500);
      expect(new URL(page.url()).pathname !== '/career-domains', 'opened without signing in');
    });

    await t.step('register and upload a QA resume', async () => {
      await register(page, webUrl, 'Domains Tester', `domains.${Date.now()}@example.com`, PASSWORD);
      await completeOnboarding(page, 'QA Automation Engineer');
      await gotoAndSettle(page, `${webUrl}/resume`, 1500);
      await page.locator('input[type="file"]').first().setInputFiles({ name: 'asha-qa.pdf', mimeType: 'application/pdf', buffer: RESUME });
      for (let i = 0; i < 60; i++) {
        const resume = (await api('GET', '/resumes/me')).data?.resume;
        if (resume?.parsingStatus === 'completed') break;
        await page.waitForTimeout(500);
      }
      for (let i = 0; i < 40; i++) {
        if (((await api('GET', '/careers/matches')).data?.matches ?? []).length) break;
        await page.waitForTimeout(500);
      }
    });

    await t.step('the new career is in the ordinary matches, with the US-source caveat', async () => {
      const matches = (await api('GET', '/careers/matches')).data.matches;
      const qa = matches.find((m) => m.careerId.title === 'QA Automation Engineer');
      expect(qa && qa.matchScore > 0, `QA Automation Engineer not matched: ${matches.map((m) => m.careerId.title).join(', ')}`);
      await gotoAndSettle(page, `${webUrl}/careers`, 2500);
      const note = page.getByTestId('career-source-note').first();
      await note.waitFor({ timeout: 15_000 });
      expect(/O\*NET-SOC 15-1253\.00/.test(await note.innerText()) && /not a measure of hiring demand in India/.test(await note.innerText()), 'the source caveat is missing on the card');
      return `QA Automation Engineer ${qa.matchScore}`;
    });

    await t.step('the domains page shows the stored matches, not a separate preview', async () => {
      await page.getByRole('link', { name: /More Career Domains/ }).first().click();
      await page.waitForURL('**/career-domains', { timeout: 15_000 });
      await page.getByTestId('domain-matches').waitFor({ timeout: 15_000 });
      expect((await page.getByTestId('preview-banner').count()) === 0, 'the old preview banner is still shown');
      expect(/United States/.test(await page.getByTestId('source-scope').innerText()), 'the US-source caveat is missing');
      const stored = (await api('GET', '/careers/matches')).data.matches.find((m) => m.careerId.title === 'QA Automation Engineer');
      const row = await page.locator('tr[data-role="QA Automation Engineer"]').innerText();
      expect(row.includes(`${stored.matchScore}/100`), `row "${row}" does not show the stored ${stored.matchScore}`);
    });

    await t.step('each role shows its O*NET basis and the attribution', async () => {
      expect((await page.getByTestId('domain-role').count()) === 6, 'six roles expected');
      const marketing = await page.getByTestId('domain-role').filter({ hasText: 'Digital Marketing Analyst' }).innerText();
      expect(/O\*NET-SOC 13-1161\.01/.test(marketing) && /In Demand/.test(marketing), `marketing card: ${marketing.slice(0, 200)}`);
      expect((await page.getByTestId('not-recognised').count()) === 0, 'skills are still flagged as not recognised');
      const attribution = await page.getByTestId('onet-attribution').innerText();
      expect(/O\*NET 31\.0 Database/.test(attribution) && /has not approved, endorsed, or tested/.test(attribution), 'attribution incomplete');
      expect((await page.getByTestId('onet-attribution').locator('a[href="https://creativecommons.org/licenses/by/4.0/"]').count()) === 1, 'no licence link');
    });

    await t.step('learning resources for the role link to official documentation', async () => {
      const qa = (await api('GET', '/careers/matches')).data.matches.find((m) => m.careerId.title === 'QA Automation Engineer');
      const resources = (await api('GET', `/learning-resources?careerId=${qa.careerId._id}`)).data;
      const urls = resources.groups.flatMap((g) => g.resources.map((r) => r.url));
      expect(urls.includes('https://www.selenium.dev/documentation/webdriver/getting_started/'), `no Selenium link among ${urls.length}`);
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
