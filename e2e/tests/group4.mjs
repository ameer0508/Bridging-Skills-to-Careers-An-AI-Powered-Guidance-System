// Browser test for the Aurora Elite group 4 screens: job search, opportunities, applications,
// outcomes, market evidence and salary insights. Checks the workflows and, above all, that the
// pages say what is real, what is a sample, what is the student's own record and what is
// unavailable. Run with
//   E2E_TEST_FILE=./tests/group4.mjs node run.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Reporter, apiClient, bodyText, completeOnboarding, expect, gotoAndSettle, launchBrowser, register, syntheticResume, watch } from '../lib/harness.mjs';

const AXE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', 'axe-core', 'axe.min.js');
const PASSWORD = 'Password123!';
// SYNTHETIC TEST DATA
const RESUME = syntheticResume([
  'Asha Rao', 'Email: asha.rao@example.com', '', 'Experience:', 'Frontend Developer at Example Co (2022-2024)',
  'Built dashboards with React, JavaScript, HTML and CSS.', '', 'Skills:', 'React, JavaScript, HTML, CSS, Node.js, Git, SQL',
]);
const ROUTES = ['/job-agent', '/opportunities', '/applications', '/application-outcomes', '/market', '/market/salaries'];
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

async function serious(page) {
  await page.waitForTimeout(450);
  await page.addScriptTag({ path: AXE });
  return page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, resultTypes: ['violations'] });
    return r.violations.filter((v) => ['serious', 'critical'].includes(v.impact)).map((v) => `${v.id} (${v.nodes.length}) ${v.nodes[0]?.target.join(' ')}`);
  });
}

export async function run({ webUrl, apiUrl }) {
  const t = new Reporter();
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const log = watch(page, apiUrl);
  const api = apiClient(page, apiUrl);
  const a11y = [];
  const scan = async (label) => {
    for (const v of await serious(page)) a11y.push(`${label}: ${v}`);
  };

  try {
    await t.step('signed out: the screens and the private API are closed', async () => {
      for (const route of ROUTES) {
        await gotoAndSettle(page, webUrl + route, 1000);
        expect(new URL(page.url()).pathname !== route, `${route} opened without signing in`);
      }
      for (const p of ['/opportunities/saved', '/applications/outcomes', '/market/history']) {
        const res = await fetch(apiUrl + p);
        expect(res.status === 401, `GET ${p} without a token answered ${res.status}`);
      }
    });

    await t.step('register and upload a resume', async () => {
      await register(page, webUrl, 'Group Four Tester', `group4.${Date.now()}@example.com`, PASSWORD);
      await completeOnboarding(page, 'Frontend Engineer');
      await gotoAndSettle(page, `${webUrl}/resume`, 1500);
      await page.locator('input[type="file"]').first().setInputFiles({ name: 'asha.pdf', mimeType: 'application/pdf', buffer: RESUME });
      for (let i = 0; i < 60; i++) {
        if ((await api('GET', '/resumes/me')).data?.resume?.parsingStatus === 'completed') break;
        await page.waitForTimeout(500);
      }
    });

    await t.step('outcomes before any application: empty, never 0%', async () => {
      await gotoAndSettle(page, `${webUrl}/application-outcomes`, 2500);
      await page.getByTestId('outcomes-empty').waitFor({ timeout: 15_000 });
      expect((await page.getByTestId('rate-card').count()) === 0, 'a rate is shown with no applications');
      expect(!/\b0%/.test(await bodyText(page)), 'an empty history is shown as 0%');
      await scan('outcomes empty');
    });

    await t.step('job search: sample listings are labelled, no invented claims', async () => {
      await gotoAndSettle(page, `${webUrl}/job-agent`, 3000);
      await page.fill('input[placeholder^="Search by role"]', 'Developer Engineer Analyst');
      await page.getByRole('button', { name: 'Search Opportunities' }).click();
      await page.waitForTimeout(3000);
      const notice = await page.getByTestId('job-source-notice').innerText();
      expect(/Demo listings/.test(notice) && /not real vacancies/.test(notice), `source notice: ${notice}`);
      const text = await bodyText(page);
      expect(!/hiring probability|urgent hiring|trending|high demand|verified employer|Skills Verified|Verified Competencies/i.test(text), 'an invented claim is on the job search page');
      expect(/Sample listing, no real date/.test(text), 'sample listings are not labelled in the list');
      await scan('job search');
    });

    await t.step('saving a job persists, with notes and a reminder', async () => {
      await page.getByRole('button', { name: 'Save Role' }).first().click();
      const tracker = page.getByTestId('application-tracker');
      await tracker.waitFor({ timeout: 15_000 });
      expect(/Demo listing/.test(await tracker.innerText()), 'the saved demo listing lost its label');
      await page.fill('#tracker-notes', 'Asked a friend about the team.');
      await page.getByRole('button', { name: 'Save notes' }).click();
      await page.waitForTimeout(1500);
      await page.fill('#tracker-reminder-date', new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10));
      await page.fill('#tracker-reminder-note', 'Check the posting');
      await page.getByRole('button', { name: 'Set reminder' }).click();
      await page.waitForTimeout(1500);
      await page.reload();
      await page.waitForTimeout(3000);
      const saved = (await api('GET', '/opportunities/saved')).data.savedOpportunities;
      expect(saved.length === 1 && saved[0].status === 'saved' && saved[0].notes === 'Asked a friend about the team.' && saved[0].reminderNote === 'Check the posting', `stored ${JSON.stringify(saved[0] ?? null).slice(0, 200)}`);
    });

    await t.step('applications: saved is not applied; an application added elsewhere is labelled', async () => {
      await gotoAndSettle(page, `${webUrl}/applications`, 2500);
      expect(/Saved — not applied/.test(await page.getByTestId('application-list').innerText()), 'the saved job is shown as applied');
      await scan('applications');
      await page.getByText('Add an application you made elsewhere').click();
      const form = page.getByRole('form', { name: 'Add an application' });
      const before = (await api('GET', '/opportunities/saved')).data.savedOpportunities.length;
      await form.getByRole('button', { name: 'Add application' }).click();
      await page.waitForTimeout(800);
      // The browser's own validation stops an empty submission and marks the field
      const missing = await form.getByLabel('Job title').evaluate((el) => el.validity.valueMissing || el.getAttribute('aria-invalid') === 'true');
      const shown = (await form.getByRole('alert').count()) > 0;
      expect(missing || shown, 'an empty form gave no validation message');
      expect((await api('GET', '/opportunities/saved')).data.savedOpportunities.length === before, 'an empty application was stored');
      await form.getByLabel('Job title').fill('Product Analyst');
      await form.getByLabel('Employer').fill('Elsewhere Ltd');
      await form.getByLabel(/Posting link/).fill('https://careers.example.com/product-analyst');
      await form.getByLabel(/Date you applied/).fill(daysAgo(5));
      await form.getByRole('button', { name: 'Add application' }).click();
      await page.waitForTimeout(1500);
      expect((await page.getByRole('heading', { name: 'Product Analyst' }).count()) === 1, 'the new application is not selected');
      expect(/Added by you/.test(await page.getByTestId('application-list').innerText()), 'the manual entry is not labelled as the student\'s own record');
    });

    await t.step('outcomes: one application counts, the saved job does not, and the sample is flagged', async () => {
      await gotoAndSettle(page, `${webUrl}/application-outcomes`, 2500);
      await page.getByTestId('outcome-scope').waitFor({ timeout: 15_000 });
      const scope = await page.getByTestId('outcome-scope').innerText();
      expect(/1 application made/.test(scope) && /1 saved job is not marked as applied/.test(scope), `scope: ${scope}`);
      const cards = page.getByTestId('rate-card');
      if (await cards.count()) {
        const first = await cards.first().innerText();
        expect(/0 of 1/.test(first) && /Too few applications to compare/.test(first), `rate card: ${first}`);
      }
      await scan('outcomes');
    });

    await t.step('market evidence: unavailable, not zero; synthetic data is labelled and separate', async () => {
      await gotoAndSettle(page, `${webUrl}/market`, 3000);
      const text = await bodyText(page);
      expect(/No licensed market data source is registered/.test(text), 'the missing source is not explained');
      expect(/Distinct postings\s*Unavailable/.test(text), 'missing market data is shown as a number');
      await scan('market');
      await page.getByRole('radio', { name: /Synthetic test data/ }).click();
      await page.getByRole('button', { name: 'Show history' }).click();
      await page.getByTestId('synthetic-banner').waitFor({ timeout: 15_000 });
      expect(/describe no real jobs/.test(await page.getByTestId('synthetic-banner').innerText()), 'synthetic data is not labelled');
      await scan('market synthetic');
    });

    await t.step('salary insights: unavailable without a source, never a figure', async () => {
      await gotoAndSettle(page, `${webUrl}/market/salaries`, 3000);
      const text = await bodyText(page);
      expect(/Data unavailable/i.test(text) && /No salary figure is estimated/.test(text), 'the salary page does not say salaries are unavailable');
      expect(!/₹\s?\d|\$\s?\d|\d+\s?LPA/.test(text), 'a salary figure is shown without a source');
      await scan('salaries');
    });

    await t.step('opportunities page: honest header and no provider claims', async () => {
      await gotoAndSettle(page, `${webUrl}/opportunities`, 3000);
      const text = await bodyText(page);
      expect(!/RapidAPI|Autonomous|Verified Skills|Executing live/i.test(text), 'an old claim is on the opportunities page');
      expect(/not a hiring prediction/.test(text), 'the header does not explain the match score');
      await scan('opportunities');
    });

    await t.step('keyboard: job filters respond to Enter and focus stays visible', async () => {
      await gotoAndSettle(page, `${webUrl}/job-agent`, 2500);
      const remote = page.getByRole('button', { name: /Remote Only/ });
      await remote.focus();
      const before = await remote.getAttribute('aria-pressed');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(800);
      const after = await remote.getAttribute('aria-pressed');
      expect(before !== after || before === null, 'Enter did not toggle the remote filter');
      const outline = await page.evaluate(() => {
        const s = getComputedStyle(document.activeElement);
        return s.outlineStyle !== 'none' || s.boxShadow !== 'none';
      });
      expect(outline, 'the focused filter has no visible focus style');
    });

    await t.step('no serious accessibility issue on any screen', async () => {
      expect(a11y.length === 0, a11y.join(' | '));
    });

    await t.step('reduced motion: the pages render at once', async () => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', storageState: await context.storageState() });
      const p = await ctx.newPage();
      await p.goto(`${webUrl}/applications`);
      await p.getByTestId('application-list').waitFor({ timeout: 20_000 });
      const opacity = await p.getByTestId('application-list').evaluate((el) => getComputedStyle(el).opacity);
      expect(opacity === '1', `the list is still fading in (${opacity})`);
      await ctx.close();
    });

    await t.step('layout: no sideways scrolling at 1440, 1024, 768, 390 and 360 px', async () => {
      const problems = [];
      for (const width of [1440, 1024, 768, 390, 360]) {
        await page.setViewportSize({ width, height: 900 });
        for (const route of ROUTES) {
          await gotoAndSettle(page, webUrl + route, 1600);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          if (overflow > 1) problems.push(`${route} ${width}px: ${overflow}px`);
        }
      }
      await page.setViewportSize({ width: 1440, height: 900 });
      expect(problems.length === 0, problems.join(' | '));
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
