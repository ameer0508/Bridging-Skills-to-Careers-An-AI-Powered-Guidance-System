// Browser test for Market Evidence (C1): sourced history is unavailable until a licensed source
// exists, and synthetic fixture data is always labelled as test data. Run with
//   E2E_TEST_FILE=./tests/market.mjs node run.mjs
import { Reporter, bodyText, completeOnboarding, expect, gotoAndSettle, launchBrowser, register, watch } from '../lib/harness.mjs';
import { importFixture } from '../lib/marketData.mjs';

const PASSWORD = 'Password123!';

export async function run({ webUrl, apiUrl, tmpDir }) {
  const t = new Reporter();
  const email = `market.${Date.now()}@example.com`;
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const log = watch(page, apiUrl);
  const heading = (name) => page.getByRole('heading', { name });

  try {
    await t.step('market evidence requires sign-in', async () => {
      await gotoAndSettle(page, `${webUrl}/market`, 1500);
      expect(new URL(page.url()).pathname !== '/market', 'the market page opened without signing in');
    });

    await t.step('register', async () => {
      await register(page, webUrl, 'Market Tester', email, PASSWORD);
      await completeOnboarding(page, 'Data Analyst');
    });

    await t.step('the sidebar opens Market Evidence', async () => {
      await page.getByRole('link', { name: /Market Evidence/ }).first().click();
      await page.waitForURL('**/market', { timeout: 15_000 });
      await heading('Market Evidence').waitFor({ timeout: 15_000 });
    });

    await t.step('without a licensed source no market history is shown or invented', async () => {
      await page.getByTestId('insufficient-data').waitFor({ timeout: 15_000 });
      const text = await bodyText(page);
      expect(/No market history to show/.test(text), 'the empty state heading is missing');
      expect(/No licensed market data source is registered/.test(text), 'the reason is not explained');
      expect(!(await page.getByTestId('synthetic-banner').isVisible()), 'a synthetic banner appeared on the sourced view');
      expect((await page.getByTestId('history-table').count()) === 0, 'a history table is shown with no records');
    });

    let counts;
    await t.step('without a licensed source no skill trends are mined', async () => {
      await page.getByTestId('skill-trends-empty').waitFor({ timeout: 15_000 });
      const text = await page.getByTestId('skill-trends-empty').innerText();
      expect(/no real postings to mine/.test(text), `skill trends empty state: ${text}`);
      expect((await page.getByTestId('skill-trends-table').count()) === 0, 'a skill table is shown with no records');
    });

    await t.step('without a licensed source the forecast says FORECAST UNAVAILABLE', async () => {
      const panel = page.getByTestId('forecast-unavailable');
      await panel.waitFor({ timeout: 15_000 });
      const text = await panel.innerText();
      expect(/FORECAST UNAVAILABLE/.test(text) && /No licensed market data source/.test(text), `forecast panel: ${text}`);
      expect((await page.getByTestId('forecast-table').count()) === 0, 'a forecast table is shown with no source');
    });

    await t.step('operator imports the synthetic fixture', async () => {
      const result = importFixture(tmpDir, email);
      counts = result.counts;
      expect(result.dataset === 'synthetic_fixture', `stored as ${result.dataset}`);
      expect(counts.inserted > 100 && counts.duplicates === 1 && counts.rejected === 1, `unexpected counts ${JSON.stringify(counts)}`);
      return `${counts.inserted} stored, ${counts.duplicates} duplicate, ${counts.rejected} rejected`;
    });

    await t.step('sourced view is still empty after the fixture import', async () => {
      await page.reload();
      await page.getByTestId('insufficient-data').waitFor({ timeout: 15_000 });
      expect(/No market history to show/.test(await bodyText(page)), 'synthetic data leaked into the sourced view');
    });

    await t.step('synthetic data is shown with a test-data label, counts and its source', async () => {
      await page.getByRole('radio', { name: /Synthetic test data/ }).click();
      await page.getByTestId('synthetic-banner').waitFor({ timeout: 15_000 });
      await heading(/Postings published per month/).waitFor({ timeout: 15_000 });
      const text = await bodyText(page);
      expect(/describe no real jobs/.test(text), 'the banner does not say the data is not real');
      expect(/SkillBridge synthetic fixture/.test(await page.getByTestId('market-sources').innerText()), 'the source is not listed');
      expect(/Undated \(not counted\) 1/.test(text), 'the undated posting is not reported');
      await page.getByText('View as table').click();
      expect((await page.getByTestId('history-table').locator('tbody tr').count()) === 12, 'the table does not list 12 months');
    });

    await t.step('skill trends show shares with their denominators and test-backed changes', async () => {
      const table = page.getByTestId('skill-trends-table');
      await table.waitFor({ timeout: 15_000 });
      const scope = await page.getByTestId('skill-trends-scope').innerText();
      expect(/Shares are out of \d+ dated postings/.test(scope), `scope: ${scope}`);
      const row = async (skill) => (await table.locator('tbody tr').filter({ has: page.getByRole('rowheader', { name: skill, exact: true }) }).innerText()).replace(/\s+/g, ' ');
      const kubernetes = await row('Kubernetes');
      expect(/20 of \d+/.test(kubernetes) && /Higher share in the recent half/.test(kubernetes), `Kubernetes row: ${kubernetes}`);
      const python = await row('Python');
      expect(/No clear change/.test(python), `Python row: ${python}`);
      expect(/SYNTHETIC TEST DATA/.test(await page.getByTestId('skill-trends').innerText()), 'the trend section is not labelled synthetic');
      await page.getByLabel('Group by').selectOption('month');
      await page.waitForTimeout(600);
      expect(/2026-09 \(\d+\)/.test(await page.getByTestId('skill-trends-scope').innerText()), 'monthly periods are not listed');
    });

    await t.step('twelve synthetic months are too few to forecast, and no number is shown', async () => {
      await page.getByLabel('Country').selectOption('IN');
      await page.getByRole('button', { name: 'Show history' }).click();
      const panel = page.getByTestId('forecast-unavailable');
      await panel.getByText('SYNTHETIC TEST DATA', { exact: true }).waitFor({ timeout: 15_000 });
      const text = await panel.innerText();
      expect(/FORECAST UNAVAILABLE/.test(text) && /at least 24 are needed/.test(text), `forecast panel: ${text}`);
      expect((await page.getByTestId('forecast-table').count()) === 0, 'a forecast is shown from 12 months');
      await page.getByLabel('Country').selectOption({ label: 'All countries' });
    });

    await t.step('a skill with too few postings is reported as insufficient', async () => {
      await page.getByLabel('Skill', { exact: true }).fill('kubernetes');
      await page.getByRole('button', { name: 'Show history' }).click();
      await heading('Not enough data to read a trend').waitFor({ timeout: 15_000 });
      const text = await bodyText(page);
      expect(/at least 30 are needed/.test(text), 'the minimum is not stated');
      expect(/Raw monthly counts \(too few to read as a trend\) mentioning Kubernetes/.test(text), 'the chart is not labelled as raw counts');
    });

    await t.step('an unknown skill shows an error message', async () => {
      await page.getByLabel('Skill', { exact: true }).fill('NotARealSkill');
      await page.getByRole('button', { name: 'Show history' }).click();
      await page.getByRole('alert').filter({ hasText: 'not a recognised skill' }).first().waitFor({ timeout: 15_000 });
    });

    await t.step('the page fits a phone screen', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByLabel('Skill', { exact: true }).fill('');
      await page.getByRole('button', { name: 'Show history' }).click();
      await page.getByTestId('synthetic-banner').waitFor({ timeout: 15_000 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow <= 1, `page is ${overflow}px wider than the screen`);
    });

    await t.step('no unexpected API failures or console errors', async () => {
      const failed = log.failed.filter((f) => !/^400 GET \/market\/(history\?.*skill|skill-trends\?.*skills|forecast\?.*skill)=NotARealSkill/.test(f));
      // The unknown-skill step provokes one 400 on purpose; the browser and the app both log it
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
