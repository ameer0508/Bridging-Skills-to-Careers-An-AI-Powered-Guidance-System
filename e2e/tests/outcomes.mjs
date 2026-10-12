// Browser test for Application Outcomes (C6). Run with
//   E2E_TEST_FILE=./tests/outcomes.mjs node run.mjs
import { Reporter, apiClient, completeOnboarding, expect, gotoAndSettle, launchBrowser, register, watch } from '../lib/harness.mjs';

const PASSWORD = 'Password123!';

export async function run({ webUrl, apiUrl }) {
  const t = new Reporter();
  const stamp = Date.now();
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const log = watch(page, apiUrl);
  const api = apiClient(page, apiUrl);
  const show = async () => {
    await page.getByRole('button', { name: 'Show outcomes' }).click();
    await page.waitForTimeout(800);
  };

  /** Tracks a job as the signed-in user, moving it through the given statuses. */
  const track = async (id, statuses, isSample = false) => {
    const saved = await api('POST', '/opportunities/save', {
      externalId: id, provider: 'Manual entry', title: `Role ${id}`, company: 'Example Employer',
      applicationUrl: 'https://jobs.example.com/apply', isSample,
    });
    expect(saved.status === 201, `could not save ${id}: ${saved.status}`);
    for (const status of statuses) {
      const res = await api('PATCH', `/opportunities/saved/${id}/status`, { status });
      expect(res.status === 200, `could not move ${id} to ${status}`);
    }
  };

  try {
    await t.step('application outcomes require sign-in', async () => {
      await gotoAndSettle(page, `${webUrl}/application-outcomes`, 1500);
      expect(new URL(page.url()).pathname !== '/application-outcomes', 'the page opened without signing in');
    });

    await t.step('register', async () => {
      await register(page, webUrl, 'Outcome Tester', `outcomes.a.${stamp}@example.com`, PASSWORD);
      await completeOnboarding(page, 'Data Analyst');
    });

    await t.step('with no applications an honest empty state is shown', async () => {
      await page.getByRole('link', { name: /Application Outcomes/ }).first().click();
      await page.waitForURL('**/application-outcomes', { timeout: 15_000 });
      await page.getByTestId('outcomes-empty').waitFor({ timeout: 15_000 });
      expect((await page.getByTestId('rate-card').count()) === 0, 'rates are shown with no applications');
    });

    await t.step('tracked applications produce rates with their counts', async () => {
      await track(`e2e-a-${stamp}`, ['applied', 'interviewing', 'offer']);
      await track(`e2e-b-${stamp}`, ['applied', 'rejected']);
      await track(`e2e-c-${stamp}`, []);
      await track(`e2e-d-${stamp}`, ['applied', 'offer'], true);
      await page.reload();
      await page.getByTestId('rate-cards').waitFor({ timeout: 15_000 });
      const cards = await page.getByTestId('rate-card').allInnerTexts();
      expect(/Applied → interview\s*1 of 2\s*\(50%\)/.test(cards[0]), `applied→interview card: ${cards[0]}`);
      expect(/Too few applications to compare/.test(cards[0]), 'the small sample is not flagged');
      expect(/1 of 1/.test(cards[1]), `interview→offer card: ${cards[1]}`);
      const scope = await page.getByTestId('outcome-scope').innerText();
      expect(/2 applications made/.test(scope), `scope: ${scope}`);
      expect(/1 saved job is not marked as applied/.test(scope), 'the saved-only job is not explained');
      expect(/1 application to demo listings left out/.test(scope), 'the demo exclusion is not explained');
      const funnel = await page.getByTestId('funnel-table').innerText();
      expect(/Rejected\s+1/.test(funnel) && /Reached offer\s+1/.test(funnel), `funnel table: ${funnel}`);
    });

    await t.step('demo listings can be included and are then labelled', async () => {
      await page.getByLabel('Include demo listings').check();
      await show();
      await page.getByTestId('demo-included-banner').waitFor({ timeout: 15_000 });
      expect(/3 applications made/.test(await page.getByTestId('outcome-scope').innerText()), 'demo application not included');
      await page.getByLabel('Include demo listings').uncheck();
      await show();
    });

    await t.step('the monthly table lists this month', async () => {
      await page.getByText('View as table').click();
      const rows = await page.getByTestId('monthly-table').locator('tbody tr').allInnerTexts();
      const cells = rows[0]?.trim().split(/\s+/).slice(-3) ?? [];
      expect(rows.length === 1 && cells.join(',') === '2,1,1', `monthly rows: ${rows.join(' | ')}`);
    });

    await t.step('a period without applications shows the empty state', async () => {
      await page.getByLabel('Applied from').fill('2025-01');
      await page.getByLabel('Applied to').fill('2025-12');
      await show();
      await page.getByTestId('outcomes-empty').waitFor({ timeout: 15_000 });
    });

    await t.step('the page fits a phone screen', async () => {
      await page.getByLabel('Applied from').fill('');
      await page.getByLabel('Applied to').fill('');
      await show();
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByTestId('rate-cards').waitFor({ timeout: 15_000 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow <= 1, `page is ${overflow}px wider than the screen`);
    });

    await t.step('another account sees none of these applications', async () => {
      const other = await browser.newContext({ viewport: { width: 1366, height: 900 } });
      const otherPage = await other.newPage();
      await register(otherPage, webUrl, 'Other Tester', `outcomes.b.${stamp}@example.com`, PASSWORD);
      await completeOnboarding(otherPage, 'Data Analyst');
      await gotoAndSettle(otherPage, `${webUrl}/application-outcomes`, 1500);
      await otherPage.getByTestId('outcomes-empty').waitFor({ timeout: 15_000 });
      const scope = await otherPage.getByTestId('outcome-scope').innerText();
      expect(/^0 applications made/.test(scope.trim()), `scope for the other account: ${scope}`);
      expect(!/saved jobs? (is|are) not marked|demo listings left out/.test(scope), "the other user's records are counted here");
      await other.close();
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
