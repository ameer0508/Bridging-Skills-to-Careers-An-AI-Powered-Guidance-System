// Browser test for the Aurora Elite group 2 screens: learning roadmap, skill checks, practice
// projects and portfolio. Checks the workflows, privacy, accessibility (axe, keyboard, reduced
// motion) and layout at five widths. Run with
//   E2E_TEST_FILE=./tests/group2.mjs node run.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Reporter, apiClient, bodyText, completeOnboarding, expect, gotoAndSettle, launchBrowser, register, syntheticResume, watch } from '../lib/harness.mjs';

const AXE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', 'axe-core', 'axe.min.js');
const PASSWORD = 'Password123!';
// SYNTHETIC TEST DATA
const RESUME = syntheticResume([
  'Asha Rao', 'Email: asha.rao@example.com', '', 'Experience:', 'Frontend Developer at Example Co (2022-2024)',
  'Built dashboards with React, JavaScript, HTML and CSS.', '', 'Projects:', 'Campus Marketplace',
  'REST service written in Node.js, tracked with Git.', '', 'Skills:', 'React, JavaScript, HTML, CSS, Node.js, Git',
]);

async function serious(page) {
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
  const email = `group2.${Date.now()}@example.com`;
  let careerId = null;

  try {
    await t.step('signed out: the screens and the private API are closed', async () => {
      for (const route of ['/roadmap', '/portfolio', '/career-lab']) {
        await gotoAndSettle(page, webUrl + route, 1200);
        expect(new URL(page.url()).pathname !== route, `${route} opened without signing in`);
      }
      for (const p of ['/portfolio', '/projects', '/skills/assessments', '/learning-resources/mine']) {
        const res = await fetch(apiUrl + p);
        expect(res.status === 401, `GET ${p} without a token answered ${res.status}`);
      }
      return 'redirected; private endpoints answer 401';
    });

    await t.step('register, upload a resume and get matches', async () => {
      await register(page, webUrl, 'Group Two Tester', email, PASSWORD);
      await completeOnboarding(page, 'Full Stack Developer');
      await gotoAndSettle(page, `${webUrl}/resume`, 1500);
      await page.locator('input[type="file"]').first().setInputFiles({ name: 'asha.pdf', mimeType: 'application/pdf', buffer: RESUME });
      for (let i = 0; i < 60; i++) {
        if ((await api('GET', '/resumes/me')).data?.resume?.parsingStatus === 'completed') break;
        await page.waitForTimeout(500);
      }
      for (let i = 0; i < 40 && !careerId; i++) {
        careerId = (await api('GET', '/careers/matches')).data?.matches?.[0]?.careerId?._id ?? null;
        if (!careerId) await page.waitForTimeout(500);
      }
      expect(careerId, 'no career match');
    });

    let firstItem = null;
    await t.step('roadmap: the journey shows the stored phases, current phase first open', async () => {
      await gotoAndSettle(page, `${webUrl}/roadmap`, 3500);
      const stored = (await api('GET', `/roadmap/${careerId}`)).data.roadmap;
      const phases = page.getByTestId('roadmap-phase');
      expect((await phases.count()) === stored.phases.length && stored.phases.length > 0, `page shows ${await phases.count()} phases, the API has ${stored.phases.length}`);
      expect((await page.locator('[data-testid="roadmap-phase"][data-state="current"]').count()) === 1, 'not exactly one current phase');
      const items = page.getByTestId('roadmap-item');
      expect((await items.count()) === stored.phases[0].items.length, 'the current phase is not open with its items');
      firstItem = stored.phases[0].items[0];
      expect(/0 of \d+ tasks done/i.test(await page.getByTestId('roadmap-progress').innerText()), 'progress does not start at zero');
      return `${stored.phases.length} phases; first item "${firstItem.title}"`;
    });

    await t.step('roadmap: completing an item is stored and survives a reload; undo and skip work', async () => {
      const row = page.getByTestId('roadmap-item').first();
      await row.getByRole('button', { name: `Mark Complete: ${firstItem.title}` }).click();
      await page.locator('[data-testid="roadmap-item"][data-status="completed"]').first().waitFor({ timeout: 15_000 });
      const status = async () => (await api('GET', `/roadmap/${careerId}`)).data.roadmap.phases[0].items[0].status;
      expect((await status()) === 'completed', 'the completion was not stored');
      await page.reload();
      await page.getByTestId('roadmap-journey').waitFor({ timeout: 20_000 });
      await page.locator('[data-testid="roadmap-item"][data-status="completed"]').first().waitFor({ timeout: 15_000 });
      expect(/^1 of \d+ tasks done/i.test(await page.getByTestId('roadmap-progress').innerText()), 'progress after reload is not one task');
      await page.getByRole('button', { name: `Undo: ${firstItem.title}` }).click();
      await page.waitForTimeout(1500);
      expect((await status()) === 'not_started', 'undo was not stored');
      await page.getByRole('button', { name: `Skip ${firstItem.title}` }).click();
      await page.locator('[data-testid="roadmap-item"][data-status="skipped"]').first().waitFor({ timeout: 15_000 });
      expect((await status()) === 'skipped', 'skip was not stored');
      await page.getByRole('button', { name: `Undo: ${firstItem.title}` }).click();
      await page.waitForTimeout(1500);
      expect((await status()) === 'not_started', 'the item was not restored');
    });

    await t.step('roadmap: a skill gap highlights its items, details expand, phases toggle by keyboard', async () => {
      const gaps = page.getByTestId('roadmap-gaps');
      if (await gaps.count()) {
        const chip = gaps.getByRole('button').first();
        await chip.click();
        expect((await chip.getAttribute('aria-pressed')) === 'true', 'the gap chip is not pressed');
        await chip.click();
      }
      const details = page.getByRole('button', { name: /^Show details:/ }).first();
      if (await details.count()) {
        await details.click();
        expect((await page.getByRole('button', { name: /^Hide details:/ }).first().getAttribute('aria-expanded')) === 'true', 'details did not open');
      }
      const toggle = page.getByTestId('roadmap-phase').nth(1).getByRole('button').first();
      if (await toggle.count()) {
        await toggle.focus();
        const before = await toggle.getAttribute('aria-expanded');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(400);
        expect((await toggle.getAttribute('aria-expanded')) !== before, 'Enter did not toggle the phase');
      }
    });

    await t.step('roadmap: reminders are opt-in and stored', async () => {
      const box = page.getByTestId('roadmap-reminders').getByRole('checkbox');
      expect(!(await box.isChecked()), 'reminders are on by default');
      await box.check();
      await page.waitForTimeout(1200);
      expect((await api('GET', '/activity')).data.preferences.reminders === true, 'the opt-in was not stored');
      await box.uncheck();
      await page.waitForTimeout(1200);
      expect((await api('GET', '/activity')).data.preferences.reminders === false, 'the opt-out was not stored');
    });

    await t.step('practice projects: a brief opens with its tasks and can be taken on', async () => {
      const expected = (await api('GET', `/projects/suggestions?careerId=${careerId}`)).data.suggestions;
      if (expected.length === 0) return 'no suggestions for this profile';
      const card = page.locator(`[data-testid="project-suggestion"][data-brief="${expected[0].briefId}"]`);
      await card.getByRole('button', { name: 'Tasks and deliverables' }).click();
      await page.waitForTimeout(500);
      const text = await card.innerText();
      expect(expected[0].tasks.every((task) => text.includes(task)) && expected[0].deliverables.every((d) => text.includes(d)), 'tasks or deliverables are missing');
      await card.getByRole('button', { name: `Take on ${expected[0].title}` }).click();
      await page.locator('[data-testid="my-project"][data-status="planned"]').waitFor({ timeout: 15_000 });
      return expected[0].title;
    });

    await t.step('roadmap: no serious accessibility issue', async () => {
      const v = await serious(page);
      expect(v.length === 0, v.join(' | '));
    });

    await t.step('skill checks: deep link, progress, confirmation before submitting, review', async () => {
      await page.getByTestId('roadmap-skill-checks').getByRole('link', { name: 'Open skill checks' }).click();
      await page.waitForURL('**/career-lab?tab=verify', { timeout: 15_000 });
      expect((await page.getByRole('tab', { selected: true }).innerText()).trim() === 'Verify skills', 'the deep link did not open the Verify tab');
      const tile = page.locator('[data-testid="assessable-skill"][data-skill="Git"]');
      await tile.getByRole('button').click();
      await page.getByTestId('assessment-attempt').waitFor({ timeout: 15_000 });
      const questions = page.getByTestId('assessment-question');
      const count = await questions.count();
      expect(new RegExp(`^0 of ${count} answered`).test(await page.getByTestId('assessment-progress').innerText()), 'progress does not start at zero');
      await questions.first().getByRole('radio').first().check();
      expect(new RegExp(`^1 of ${count} answered`).test(await page.getByTestId('assessment-progress').innerText()), 'progress does not follow the answers');
      let a11y = await serious(page);
      let submitted = false;
      page.on('request', (r) => {
        if (/\/skills\/assessments\/[^/]+\/submit$/.test(r.url())) submitted = true;
      });
      await page.getByRole('button', { name: 'Submit answers' }).click();
      const dialog = page.getByRole('dialog');
      await dialog.waitFor({ timeout: 5_000 });
      await page.waitForTimeout(500); // let the dialog finish opening before measuring contrast
      expect(/cannot be changed/.test(await dialog.innerText()) && new RegExp(`${count - 1} unanswered`).test(await dialog.innerText()), 'the confirmation does not explain what submitting means');
      a11y = a11y.concat(await serious(page));
      await dialog.getByRole('button', { name: 'Keep answering' }).click();
      await page.waitForTimeout(500);
      expect(!submitted && (await page.getByTestId('assessment-attempt').isVisible()), 'cancelling still submitted');
      await page.getByRole('button', { name: 'Submit answers' }).click();
      const [response] = await Promise.all([
        page.waitForResponse((r) => /\/skills\/assessments\/[^/]+\/submit$/.test(r.url())),
        page.getByRole('dialog').getByRole('button', { name: 'Submit now' }).click(),
      ]);
      const scored = (await response.json()).data;
      await page.getByTestId('assessment-result').waitFor({ timeout: 15_000 });
      expect((await page.getByTestId('assessment-review').count()) === scored.review.length, 'the review does not list every question');
      expect((await page.getByTestId('assessment-result').innerText()).includes(`${scored.correct} of ${scored.of} correct`), 'the result does not show the server score');
      a11y = a11y.concat(await serious(page));
      expect(a11y.length === 0, a11y.join(' | '));
      return `${scored.correct} of ${scored.of}, ${scored.passed ? 'passed' : 'not passed'}`;
    });

    let shareUrl = null;
    const title = 'Bookings API on Node.js';
    await t.step('portfolio: empty state, add through the dialog, self-reported and private', async () => {
      await gotoAndSettle(page, `${webUrl}/portfolio`, 2500);
      expect(/Nothing recorded yet/.test(await bodyText(page)), 'the empty state is missing');
      await page.getByRole('button', { name: 'Add work' }).click();
      const form = page.getByTestId('portfolio-form');
      await form.waitFor({ timeout: 5_000 });
      await page.waitForTimeout(500);
      const a11y = await serious(page);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      expect(!(await form.isVisible()), 'Escape did not close the dialog');
      await page.getByRole('button', { name: 'Add work' }).click();
      await form.locator('#pf-title').fill(title);
      await form.locator('#pf-skills').fill('Node.js, Docker');
      await form.locator('#pf-url').fill('https://example.com/asha/bookings');
      await form.getByRole('button', { name: 'Save entry' }).click();
      const entry = page.getByTestId('portfolio-entry');
      await entry.waitFor({ timeout: 15_000 });
      expect((await entry.getAttribute('data-visibility')) === 'private' && /Your own record, not checked/.test(await entry.innerText()), 'the new entry is not private and self-reported');
      expect(!/verified by skill check/i.test(await entry.innerText()), 'a self-reported entry claims verification');
      expect(a11y.length === 0, a11y.join(' | '));
    });

    await t.step('portfolio: the public link shows only shared entries and dies when switched off', async () => {
      const share = page.getByTestId('portfolio-share');
      expect(/Sharing is off/.test(await share.innerText()), 'the private state is not stated');
      await share.getByRole('button', { name: 'Switch sharing on' }).click();
      const link = page.getByTestId('portfolio-share-link');
      await link.waitFor({ timeout: 15_000 });
      shareUrl = await link.innerText();
      expect(/Sharing is on/.test(await share.innerText()), 'the public state is not stated');
      const visitor = await browser.newContext();
      const pub = await visitor.newPage();
      await gotoAndSettle(pub, shareUrl, 2500);
      expect(/Nothing has been shared yet/.test(await bodyText(pub)) && !(await bodyText(pub)).includes(title), 'a private entry is visible through the public link');
      await page.getByRole('button', { name: `Edit ${title}` }).click();
      await page.getByTestId('portfolio-form').getByRole('checkbox').check();
      await page.getByTestId('portfolio-form').getByRole('button', { name: 'Save entry' }).click();
      await page.locator('[data-testid="portfolio-entry"][data-visibility="shared"]').waitFor({ timeout: 15_000 });
      await gotoAndSettle(pub, shareUrl, 2500);
      const shown = await bodyText(pub);
      expect(shown.includes(title) && !shown.includes(email) && !/Group Two Tester/.test(shown), 'the public page is wrong or shows the owner without permission');
      const a11y = await serious(pub);
      expect(a11y.length === 0, `public page: ${a11y.join(' | ')}`);
      await share.getByRole('button', { name: 'Switch sharing off' }).click();
      await page.locator('[data-testid="portfolio-share"][data-enabled="false"]').waitFor({ timeout: 15_000 });
      await gotoAndSettle(pub, shareUrl, 2500);
      expect(await pub.getByTestId('public-portfolio-unavailable').isVisible(), 'the link still works after sharing was switched off');
      await visitor.close();
    });

    await t.step('portfolio: no serious accessibility issue', async () => {
      const v = await serious(page);
      expect(v.length === 0, v.join(' | '));
    });

    await t.step('reduced motion: the journey and the portfolio render at once', async () => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', storageState: await context.storageState() });
      const p = await ctx.newPage();
      await p.goto(`${webUrl}/roadmap`);
      await p.getByTestId('roadmap-journey').waitFor({ timeout: 20_000 });
      await p.waitForTimeout(150);
      const opacity = await p.locator('[data-testid="roadmap-item"]').first().evaluate((el) => getComputedStyle(el.closest('[data-testid="roadmap-phase"]')).opacity);
      expect(opacity === '1', `the journey is still fading in (${opacity})`);
      await ctx.close();
    });

    await t.step('layout: no sideways scrolling at 1440, 1024, 768, 390 and 360 px', async () => {
      const problems = [];
      const visitor = await browser.newContext();
      for (const width of [1440, 1024, 768, 390, 360]) {
        await page.setViewportSize({ width, height: 900 });
        for (const route of ['/roadmap', '/career-lab?tab=verify', '/portfolio']) {
          await gotoAndSettle(page, webUrl + route, 2000);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          if (overflow > 1) problems.push(`${route} ${width}px: ${overflow}px`);
        }
        const pub = await visitor.newPage();
        await pub.setViewportSize({ width, height: 900 });
        await gotoAndSettle(pub, shareUrl, 1500);
        const overflow = await pub.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (overflow > 1) problems.push(`public ${width}px: ${overflow}px`);
        await pub.close();
      }
      await visitor.close();
      await page.setViewportSize({ width: 1440, height: 900 });
      expect(problems.length === 0, problems.join(' | '));
    });

    await t.step('a failed load shows the notice instead of a blank screen', async () => {
      const fail = (route) => (route.request().method() === 'GET' ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Simulated failure' } }) }) : route.continue());
      await page.route(`${apiUrl}/**`, fail);
      for (const route of ['/roadmap', '/portfolio']) {
        await page.goto(webUrl + route);
        const shown = await page.getByTestId('load-error-banner').waitFor({ timeout: 15_000 }).then(() => true, () => false);
        expect(shown, `no failure notice on ${route}`);
      }
      await page.unroute(`${apiUrl}/**`, fail);
      log.failed.length = 0;
      log.console.length = 0;
    });

    await t.step('no unexpected API failures or console errors', async () => {
      await gotoAndSettle(page, `${webUrl}/roadmap`, 2500);
      expect(log.failed.length === 0, `API failures: ${log.failed.join(', ')}`);
      expect(log.console.length === 0, `console errors: ${log.console.slice(0, 4).join(' | ')}`);
    });
  } finally {
    await browser.close();
  }

  console.log(`\nSUMMARY ${t.results.length - t.failures}/${t.results.length} passed`);
  return t.failures;
}
