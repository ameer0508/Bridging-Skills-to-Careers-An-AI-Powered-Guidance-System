// Browser test for Salary Insights (C3): real salary insights say DATA UNAVAILABLE until a
// licensed source exists; synthetic salaries appear only in a labelled demonstration mode, one
// market (country, currency, period) at a time. Run with
//   E2E_TEST_FILE=./tests/salaries.mjs node run.mjs
import { Reporter, bodyText, completeOnboarding, expect, gotoAndSettle, launchBrowser, register, watch } from '../lib/harness.mjs';
import { importFixture } from '../lib/marketData.mjs';

const PASSWORD = 'Password123!';

export async function run({ webUrl, apiUrl, tmpDir }) {
  const t = new Reporter();
  const email = `salary.${Date.now()}@example.com`;
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const log = watch(page, apiUrl);
  const show = async () => {
    await page.getByRole('button', { name: 'Show salaries' }).click();
    await page.waitForTimeout(600);
  };
  const groupTitles = async () => (await page.getByTestId('salary-group-title').allInnerTexts()).map((s) => s.trim());

  try {
    await t.step('salary insights require sign-in', async () => {
      await gotoAndSettle(page, `${webUrl}/market/salaries`, 1500);
      expect(new URL(page.url()).pathname !== '/market/salaries', 'the salary page opened without signing in');
    });

    await t.step('register', async () => {
      await register(page, webUrl, 'Salary Tester', email, PASSWORD);
      await completeOnboarding(page, 'Data Analyst');
    });

    await t.step('the sidebar opens Salary Insights', async () => {
      await page.getByRole('link', { name: /Salary Insights/ }).first().click();
      await page.waitForURL('**/market/salaries', { timeout: 15_000 });
      await page.getByRole('heading', { name: 'Salary Insights', level: 1 }).waitFor({ timeout: 15_000 });
    });

    await t.step('without a licensed source real salaries say DATA UNAVAILABLE', async () => {
      const panel = page.getByTestId('salary-unavailable');
      await panel.waitFor({ timeout: 15_000 });
      const text = await panel.innerText();
      expect(/DATA UNAVAILABLE/.test(text), 'the unavailable heading is missing');
      expect(/No salary figure is estimated/.test(text), 'the reason is not explained');
      expect((await page.getByTestId('salary-summary-table').count()) === 0, 'a salary table is shown with no source');
      expect(!(await page.getByTestId('synthetic-banner').isVisible()), 'a synthetic banner appeared on the sourced view');
    });

    await t.step('operator imports the synthetic fixture', async () => {
      const result = importFixture(tmpDir, email);
      expect(result.dataset === 'synthetic_fixture', `stored as ${result.dataset}`);
      return `${result.counts.inserted} stored`;
    });

    await t.step('real salaries stay unavailable after the fixture import', async () => {
      await page.reload();
      await page.getByTestId('salary-unavailable').waitFor({ timeout: 15_000 });
      expect((await page.getByTestId('salary-group-title').count()) === 0, 'synthetic salaries leaked into the sourced view');
    });

    await t.step('demonstration mode is labelled and keeps each market separate', async () => {
      await page.getByRole('radio', { name: /Synthetic demonstration/ }).click();
      await page.getByTestId('synthetic-banner').waitFor({ timeout: 15_000 });
      expect(/SYNTHETIC TEST DATA/.test(await page.getByTestId('synthetic-banner').innerText()), 'the banner does not say SYNTHETIC TEST DATA');
      await page.getByTestId('salary-group-title').first().waitFor({ timeout: 15_000 });
      const titles = await groupTitles();
      expect(titles.length === 2, `expected 2 markets, got ${titles.join(' | ')}`);
      expect(titles.includes('India · INR · per year') && titles.includes('United Kingdom · GBP · per year'), `markets: ${titles.join(' | ')}`);
      return titles.join(' | ');
    });

    await t.step('each market shows medians with their sample sizes, quartiles, bands and provenance', async () => {
      const india = page.locator('[data-testid="salary-summary-table"]').first();
      const text = (await india.innerText()).replace(/\s+/g, ' ');
      expect(/Median range midpoint ₹[\d,]+ \d+ complete ranges/.test(text), `India summary: ${text.slice(0, 200)}`);
      expect(/25th–75th percentile\) ₹[\d,]+ – ₹[\d,]+/.test(text), 'quartiles are missing');
      expect(/"From" figures \(minimum only\)|“From” figures \(minimum only\)/.test(text), 'one-bound figures are not listed apart');
      await page.getByText('View bands as a table').first().click();
      const bands = await page.getByTestId('salary-distribution-table').first().locator('tbody tr').count();
      expect(bands >= 1 && bands <= 6, `${bands} bands`);
      const provenance = await page.getByTestId('salary-provenance').first().innerText();
      expect(/SkillBridge synthetic fixture/.test(provenance) && /Licence:/.test(provenance) && /Collected/.test(provenance), `provenance: ${provenance}`);
    });

    await t.step('currency filter shows one market and counts the rest', async () => {
      await page.getByLabel('Currency').selectOption('GBP');
      await show();
      const titles = await groupTitles();
      expect(titles.length === 1 && titles[0] === 'United Kingdom · GBP · per year', `markets: ${titles.join(' | ')}`);
      expect(/Other currency or period \d+/.test(await bodyText(page)), 'other-currency count missing');
    });

    await t.step('a period with no salaries says so instead of showing figures', async () => {
      await page.getByLabel('Currency').selectOption('');
      await page.getByLabel('Pay period').selectOption('HOUR');
      await show();
      await page.getByTestId('salary-insufficient').waitFor({ timeout: 15_000 });
      expect(/none states a usable salary/.test(await page.getByTestId('salary-insufficient').innerText()), 'the reason is not stated');
      expect((await page.getByTestId('salary-group-title').count()) === 0, 'a group was shown for an empty period');
    });

    await t.step('exclusions are listed with counts', async () => {
      const text = (await page.getByTestId('salary-exclusions').innerText()).replace(/\s+/g, ' ');
      expect(/No salary stated \d+/.test(text) && /No publication date \d+/.test(text), `exclusions: ${text}`);
    });

    await t.step('an unknown skill shows an error message', async () => {
      await page.getByLabel('Pay period').selectOption('');
      await page.getByLabel('Skill', { exact: true }).fill('NotARealSkill');
      await show();
      await page.getByRole('alert').filter({ hasText: 'not a recognised skill' }).waitFor({ timeout: 15_000 });
    });

    await t.step('the page fits a phone screen', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole('button', { name: 'Clear' }).click();
      await page.getByTestId('salary-group-title').first().waitFor({ timeout: 15_000 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow <= 1, `page is ${overflow}px wider than the screen`);
    });

    await t.step('no unexpected API failures or console errors', async () => {
      const failed = log.failed.filter((f) => !/^400 GET \/market\/salaries\?.*skill=NotARealSkill/.test(f));
      const consoleErrors = log.console.filter((c) => !/status of 400 \(Bad Request\)|NotARealSkill/.test(c));
      expect(failed.length === 0, `API failures: ${failed.join(', ')}`);
      expect(consoleErrors.length === 0, `console errors: ${consoleErrors.slice(0, 4).join(' | ')}`);
    });
  } finally {
    await browser.close();
  }

  console.log(`\nSUMMARY ${t.results.length - t.failures}/${t.results.length} passed`);
  return t.failures;
}
