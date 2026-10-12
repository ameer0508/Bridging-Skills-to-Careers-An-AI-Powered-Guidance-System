// Browser test for Application history (X8): save a job, record dated events, correct and remove
// them, add an application made elsewhere, see outcomes follow, set a reminder, and check that
// another account sees nothing. Run with
//   E2E_TEST_FILE=./tests/applications.mjs node run.mjs
import { Reporter, apiClient, bodyText, completeOnboarding, expect, gotoAndSettle, launchBrowser, register, watch } from '../lib/harness.mjs';

const PASSWORD = 'Password123!';
const daysAgo = (n) => {
  const d = new Date(Date.now() - n * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export async function run({ webUrl, apiUrl }) {
  const t = new Reporter();
  const stamp = Date.now();
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const log = watch(page, apiUrl);
  const api = apiClient(page, apiUrl);
  const history = () => page.getByTestId('application-history');
  const stage = async () => (await page.getByTestId('current-stage').innerText()).trim();
  const events = async () =>
    page.getByTestId('timeline-event').evaluateAll((els) => els.map((e) => `${e.dataset.status}:${e.dataset.origin}`));
  const addEvent = async (status, day) => {
    const form = page.getByRole('form', { name: 'Record an event' });
    await form.getByLabel('Stage').selectOption(status);
    await form.getByLabel('Date it happened').fill(day);
    await form.getByRole('button', { name: 'Add event' }).click();
    await page.waitForTimeout(900);
  };
  let jobId;

  try {
    await t.step('applications require sign-in', async () => {
      await gotoAndSettle(page, `${webUrl}/applications`, 1500);
      expect(new URL(page.url()).pathname !== '/applications', 'the page opened without signing in');
    });

    await t.step('register', async () => {
      await register(page, webUrl, 'History Tester', `history.a.${stamp}@example.com`, PASSWORD);
      await completeOnboarding(page, 'Data Analyst');
    });

    await t.step('with nothing tracked the sidebar opens an honest empty state', async () => {
      await page.getByRole('link', { name: /^Applications$/ }).first().click();
      await page.waitForURL('**/applications', { timeout: 15_000 });
      await page.getByTestId('applications-empty').waitFor({ timeout: 15_000 });
    });

    await t.step('a job saved from job search is listed as saved, not applied', async () => {
      await gotoAndSettle(page, `${webUrl}/job-agent`, 3000);
      await page.fill('input[placeholder^="Search by role"]', 'Stack');
      await page.getByRole('button', { name: 'Search Opportunities' }).click();
      await page.waitForTimeout(3000);
      await page.getByRole('button', { name: 'Save Role' }).first().click();
      await page.waitForTimeout(2000);
      await gotoAndSettle(page, `${webUrl}/applications`, 2000);
      const item = await page.getByTestId('application-list').innerText();
      expect(/Saved — not applied/.test(item) && /Demo listing/.test(item), `list item: ${item}`);
      await history().waitFor({ timeout: 15_000 });
      expect((await stage()) === 'Saved — not applied', `stage ${await stage()}`);
      expect(/not counted as an application/.test(await page.getByTestId('history-notes').innerText()), 'saved-only note missing');
      jobId = (await api('GET', '/applications')).data.applications[0].id;
    });

    await t.step('dated events are recorded with the date entered', async () => {
      await addEvent('applied', daysAgo(10));
      await addEvent('interviewing', daysAgo(3));
      expect((await stage()) === 'Interview', `stage ${await stage()}`);
      expect((await events()).join(' ') === 'saved:recorded applied:recorded interviewing:recorded' ||
        (await events()).join(' ') === 'applied:recorded interviewing:recorded saved:recorded', `events ${(await events()).join(' ')}`);
      const text = await page.getByTestId('timeline').innerText();
      expect(/date you entered/.test(text), 'the date source is not shown');
      const stored = (await api('GET', `/applications/${jobId}/history`)).data.timeline.find((e) => e.status === 'applied');
      expect(stored.occurredAt.slice(0, 10) === daysAgo(10) && stored.dateSource === 'user_stated', `stored ${JSON.stringify(stored)}`);
    });

    await t.step('a second event for the same stage on the same day is refused', async () => {
      await addEvent('interviewing', daysAgo(3));
      const alert = page.getByRole('form', { name: 'Record an event' }).getByRole('alert');
      await alert.waitFor({ timeout: 10_000 });
      expect(/already has/.test(await alert.innerText()), `message: ${await alert.innerText()}`);
      expect((await events()).filter((e) => e.startsWith('interviewing')).length === 1, 'a duplicate was stored');
    });

    await t.step('correcting a date is stored and stamped', async () => {
      await page.getByRole('button', { name: /^Correct Applied/ }).click();
      const form = page.getByRole('form', { name: 'Correct the applied event' });
      await form.getByLabel('Date it happened').fill(daysAgo(12));
      await form.getByRole('button', { name: 'Save' }).click();
      await page.waitForTimeout(900);
      const stored = (await api('GET', `/applications/${jobId}/history`)).data.timeline.find((e) => e.status === 'applied');
      expect(stored.occurredAt.slice(0, 10) === daysAgo(12) && stored.editedAt, `stored ${JSON.stringify(stored)}`);
      expect(/Corrected/.test(await page.getByTestId('timeline').innerText()), 'the correction stamp is not shown');
    });

    await t.step('removing an event recomputes the current stage', async () => {
      await addEvent('offer', daysAgo(1));
      expect((await stage()) === 'Offer', `stage ${await stage()}`);
      page.once('dialog', (d) => d.accept());
      await page.getByRole('button', { name: /^Remove Offer/ }).click();
      await page.waitForTimeout(900);
      expect((await stage()) === 'Interview', `after removal: ${await stage()}`);
      expect(!(await events()).some((e) => e.startsWith('offer')), 'the offer is still listed');
    });

    await t.step('an application made elsewhere can be added', async () => {
      await page.getByText('Add an application you made elsewhere').click();
      const form = page.getByRole('form', { name: 'Add an application' });
      await form.getByLabel('Job title').fill('Product Analyst');
      await form.getByLabel('Employer').fill('Elsewhere Ltd');
      await form.getByLabel(/Posting link/).fill('https://careers.example.com/product-analyst');
      await form.getByLabel(/Date you applied/).fill(daysAgo(5));
      await form.getByRole('button', { name: 'Add application' }).click();
      await page.waitForTimeout(1200);
      expect((await page.getByRole('heading', { name: 'Product Analyst' }).count()) === 1, 'the new application is not selected');
      expect((await stage()) === 'Applied', `stage ${await stage()}`);
      expect(/Added by you/.test(await page.getByTestId('application-list').innerText()), 'the manual entry is not labelled');
    });

    await t.step('an interview without a recorded application shows an inferred, unstored event', async () => {
      const saved = await api('POST', '/opportunities/save', {
        externalId: `infer-${stamp}`, provider: 'Manual entry', title: 'Support Analyst', company: 'Inferred Co', applicationUrl: 'https://jobs.example.com/x',
      });
      await api('PATCH', `/opportunities/saved/infer-${stamp}/status`, { status: 'interviewing' });
      await page.reload();
      await page.getByRole('button', { name: /Support Analyst/ }).click();
      await page.waitForTimeout(800);
      const inferred = page.locator('[data-testid="timeline-event"][data-origin="inferred"]');
      expect((await inferred.count()) === 1, 'no inferred event');
      expect(/inferred, not recorded/.test(await inferred.innerText()) && /Not recorded/.test(await inferred.innerText()), `inferred text: ${await inferred.innerText()}`);
      expect((await inferred.getByRole('button').count()) === 0, 'an inferred event can be edited or removed');
      return `saved ${saved.status}`;
    });

    await t.step('outcomes follow the recorded history', async () => {
      await page.getByRole('link', { name: 'application outcomes', exact: true }).click();
      await page.waitForURL('**/application-outcomes', { timeout: 15_000 });
      await page.getByTestId('outcome-scope').waitFor({ timeout: 15_000 });
      const scope = await page.getByTestId('outcome-scope').innerText();
      // The manual and inferred applications count; the demo-listing application is left out
      expect(/2 applications made/.test(scope) && /1 application to demo listings left out/.test(scope), `scope: ${scope}`);
      await page.getByLabel('Include demo listings').check();
      await page.getByRole('button', { name: 'Show outcomes' }).click();
      await page.waitForTimeout(800);
      const funnel = await page.getByTestId('funnel-table').innerText();
      expect(/Reached interview\s+2/.test(funnel) && /Reached offer\s+0/.test(funnel), `funnel: ${funnel}`);
    });

    await t.step('a follow-up reminder is set and cleared only by the user', async () => {
      await gotoAndSettle(page, `${webUrl}/applications`, 1500);
      await page.getByRole('button', { name: /Product Analyst/ }).click();
      const reminder = page.getByTestId('reminder');
      expect(/Off\./.test(await reminder.innerText()), 'a reminder exists without being set');
      const d = new Date(Date.now() + 2 * 86_400_000);
      const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T09:30`;
      await reminder.getByLabel('Remind me on').fill(local);
      await reminder.getByLabel('Note (optional)').fill('Ask about next steps');
      await reminder.getByRole('button', { name: 'Set reminder' }).click();
      await page.waitForTimeout(900);
      expect(/Set for .*Ask about next steps/.test(await reminder.innerText()), `reminder: ${await reminder.innerText()}`);
      expect(/Reminder set/.test(await page.getByTestId('application-list').innerText()), 'the list does not show the reminder');
      await reminder.getByRole('button', { name: 'Clear reminder' }).click();
      await page.waitForTimeout(900);
      expect(/Off\./.test(await reminder.innerText()), 'the reminder was not cleared');
    });

    await t.step('another account sees none of these applications', async () => {
      const other = await browser.newContext({ viewport: { width: 1366, height: 900 } });
      const otherPage = await other.newPage();
      const otherApi = apiClient(otherPage, apiUrl);
      await register(otherPage, webUrl, 'Other Tester', `history.b.${stamp}@example.com`, PASSWORD);
      await completeOnboarding(otherPage, 'Data Analyst');
      await gotoAndSettle(otherPage, `${webUrl}/applications`, 2000);
      await otherPage.getByTestId('applications-empty').waitFor({ timeout: 15_000 });
      const probe = await otherApi('GET', `/applications/${jobId}/history`);
      const write = await otherApi('POST', `/applications/${jobId}/events`, { status: 'rejected' });
      await other.close();
      expect(probe.status === 404 && write.status === 404, `other account got ${probe.status} / ${write.status}`);
    });

    await t.step('the page fits a phone screen', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.reload();
      await history().waitFor({ timeout: 15_000 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow <= 1, `page is ${overflow}px wider than the screen`);
    });

    await t.step('no unexpected API failures or console errors', async () => {
      // The duplicate step provokes one 409 on purpose
      const failed = log.failed.filter((f) => !/^409 POST \/applications\/[a-f0-9]+\/events$/.test(f));
      const consoleErrors = log.console.filter((c) => !/status of 409 \(Conflict\)|DUPLICATE_EVENT/.test(c));
      expect(failed.length === 0, `API failures: ${failed.join(', ')}`);
      expect(consoleErrors.length === 0, `console errors: ${consoleErrors.slice(0, 4).join(' | ')}`);
      expect(!/undefined|NaN/.test(await bodyText(page)), 'the page shows undefined or NaN');
    });
  } finally {
    await browser.close();
  }

  console.log(`\nSUMMARY ${t.results.length - t.failures}/${t.results.length} passed`);
  return t.failures;
}
