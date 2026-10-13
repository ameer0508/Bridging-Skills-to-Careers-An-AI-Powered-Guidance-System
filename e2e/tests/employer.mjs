// Browser test for first-party employer postings (docs/EMPLOYER_POSTINGS.md). Every organization
// and posting is SYNTHETIC TEST DATA. Run with
//   E2E_TEST_FILE=./tests/employer.mjs node run.mjs
import { Reporter, apiClient, completeOnboarding, expect, gotoAndSettle, launchBrowser, register, watch } from '../lib/harness.mjs';

const PASSWORD = 'Password123!';
const DESCRIPTION =
  'Build weekly sales dashboards in Excel and Power BI, write SQL against the warehouse and explain results to the sales team. SYNTHETIC TEST DATA.';

export async function run({ webUrl, apiUrl }) {
  const t = new Reporter();
  const stamp = Date.now();
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
  const log = watch(page, apiUrl);
  const api = apiClient(page, apiUrl);
  const seeker = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
  const seekerLog = watch(seeker, apiUrl);
  const seekerApi = apiClient(seeker, apiUrl);

  try {
    await t.step('the page is reached from the sidebar and starts empty', async () => {
      await register(page, webUrl, 'Employer Tester', `employer.${stamp}@example.com`, PASSWORD);
      await completeOnboarding(page, 'Data Analyst');
      await page.getByRole('link', { name: /Employer Postings/ }).first().click();
      await page.waitForURL('**/employer-postings', { timeout: 15_000 });
      await page.getByTestId('openings-empty').waitFor({ timeout: 15_000 });
      expect(/self-declared/.test(await page.getByTestId('employer-disclosure').innerText()), 'no disclosure');
      expect((await page.getByRole('tab', { name: 'Review reports' }).count()) === 0, 'a non-administrator sees the review tab');
    });

    await t.step('an organization is saved, a draft created, and unknown skills kept apart', async () => {
      await page.getByRole('tab', { name: 'Post a job' }).click();
      await page.getByLabel('Organization name').fill('Example Analytics (SYNTHETIC)');
      await page.getByLabel('Website (https, optional)').fill('https://example.com');
      await page.getByRole('button', { name: 'Save organization' }).click();
      await page.getByTestId('organization-summary').waitFor({ timeout: 10_000 });
      expect(/e-mail domain matches the website/.test(await page.getByTestId('organization-summary').innerText()), 'the domain signal is not shown');
      await page.getByLabel('Job title').fill('Data Analyst');
      await page.getByLabel(/^Skills/).fill('SQL, Excel, Wizardry');
      await page.getByLabel(/^Description/).fill(DESCRIPTION);
      await page.getByLabel('City').fill('Pune');
      await page.getByLabel('State or union territory').selectOption('Maharashtra');
      await page.getByLabel('Minimum').fill('400000');
      await page.getByLabel('Maximum').fill('700000');
      await page.getByRole('button', { name: 'Save draft' }).click();
      const draft = page.getByTestId('own-posting').first();
      await draft.waitFor({ timeout: 10_000 });
      expect((await draft.getAttribute('data-status')) === 'draft', 'not saved as a draft');
      expect(/not recognised, so not analysed: Wizardry/.test(await draft.innerText()), 'the unknown skill is not reported');
    });

    await t.step('publishing shows the full terms and needs all three confirmations', async () => {
      await page.getByRole('button', { name: 'Publish…' }).click();
      const terms = page.getByTestId('publish-terms');
      await terms.waitFor({ timeout: 10_000 });
      const text = await terms.innerText();
      expect(/employer-contribution-v1/.test(text) && /withdraw/i.test(text) && /does not verify/.test(text), `terms: ${text.slice(0, 200)}`);
      expect((await terms.locator('li').count()) === 7, 'the seven uses are not listed');
      const publish = terms.getByRole('button', { name: 'Publish' });
      expect(await publish.isDisabled(), 'publishable without confirming');
      await terms.getByLabel('I am authorised to post jobs for this organization.').check();
      await terms.getByLabel('This is a real, open position.').check();
      expect(await publish.isDisabled(), 'publishable with two of three confirmations');
      await terms.getByLabel('I grant the uses listed above.').check();
      await publish.click();
      await page.waitForFunction(() => document.querySelector('[data-testid="own-posting"]')?.getAttribute('data-status') === 'open', null, { timeout: 10_000 });
      expect(/included in market data/.test(await page.getByTestId('own-posting').first().innerText()), 'not shown as included in market data');
      const mine = (await api('GET', '/employer/postings/mine')).data.postings;
      expect(mine[0].consent?.uses.length === 7, 'consent not stored');
    });

    await t.step('another user sees it labelled as self-declared, filters it and reports it', async () => {
      await register(seeker, webUrl, 'Seeker Tester', `seeker.${stamp}@example.com`, PASSWORD);
      await completeOnboarding(seeker, 'Data Analyst');
      await gotoAndSettle(seeker, `${webUrl}/employer-postings`, 2000);
      const opening = seeker.getByTestId('opening');
      await opening.first().waitFor({ timeout: 15_000 });
      const text = await opening.first().innerText();
      expect(/Data Analyst/.test(text) && /Example Analytics/.test(text) && /₹4,00,000 – ₹7,00,000 a year/.test(text), `opening: ${text.slice(0, 300)}`);
      expect((await seeker.getByTestId('self-declared').count()) === 1, 'no self-declared label');
      await seeker.getByLabel('Skill', { exact: true }).fill('Kubernetes');
      await seeker.getByRole('button', { name: 'Filter' }).click();
      await seeker.getByTestId('openings-empty').waitFor({ timeout: 10_000 });
      await seeker.getByLabel('Skill', { exact: true }).fill('SQL');
      await seeker.getByRole('button', { name: 'Filter' }).click();
      await opening.first().waitFor({ timeout: 10_000 });
      await seeker.getByRole('button', { name: 'Report' }).click();
      await seeker.getByLabel('Reason').selectOption('misleading');
      await seeker.getByRole('button', { name: 'Send report' }).click();
      await seeker.getByText('The report was recorded').waitFor({ timeout: 10_000 });
      expect((await seekerApi('POST', `/employer/postings/${(await seekerApi('GET', '/employer/postings')).data.postings[0].id}/reports`, { reason: 'other' })).status === 409, 'a second report by the same user was accepted');
    });

    await t.step('closing and withdrawing take the posting off the list', async () => {
      await page.getByRole('button', { name: 'Close' }).click();
      await page.waitForFunction(() => document.querySelector('[data-testid="own-posting"]')?.getAttribute('data-status') === 'closed', null, { timeout: 10_000 });
      expect((await seekerApi('GET', '/employer/postings')).data.postings.length === 0, 'a closed posting is still listed');
      expect(/included in market data/.test(await page.getByTestId('own-posting').first().innerText()), 'a closed posting should stay in market history');
      page.once('dialog', (d) => d.accept());
      await page.getByRole('button', { name: 'Withdraw' }).click();
      await page.waitForFunction(() => document.querySelector('[data-testid="own-posting"]')?.getAttribute('data-status') === 'withdrawn', null, { timeout: 10_000 });
      expect(/not in market data/.test(await page.getByTestId('own-posting').first().innerText()), 'a withdrawn posting is still in market data');
    });

    await t.step('the page fits a phone screen', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow <= 1, `page is ${overflow}px wider than the screen`);
    });

    await t.step('no unexpected API failures or console errors', async () => {
      const failed = [...log.failed, ...seekerLog.failed.filter((f) => !/^409 POST \/employer\/postings\/[a-f0-9]+\/reports$/.test(f))];
      expect(failed.length === 0, `API failures: ${failed.join(', ')}`);
      const consoleErrors = [...log.console, ...seekerLog.console].filter((c) => !/status of 409/.test(c));
      expect(consoleErrors.length === 0, `console errors: ${consoleErrors.slice(0, 4).join(' | ')}`);
    });
  } finally {
    await browser.close();
  }

  console.log(`\nSUMMARY ${t.results.length - t.failures}/${t.results.length} passed`);
  return t.failures;
}
