// Browser test for the optional local-AI explanation of a career match (Phase 1). Run with
//   E2E_TEST_FILE=./tests/careerExplanation.mjs node run.mjs
// The stub AI service stands in for the AI service; no model runs here.
import { Reporter, apiClient, completeOnboarding, expect, gotoAndSettle, launchBrowser, register, syntheticResume, watch } from '../lib/harness.mjs';

const PASSWORD = 'Password123!';
// SYNTHETIC TEST DATA
const RESUME = syntheticResume([
  'Riya Synthetic',
  'Email: riya.synthetic@example.com',
  '',
  'Experience:',
  'Junior Backend Developer at Example Labs (2023-2025)',
  'Built REST APIs with Python, Flask and PostgreSQL; wrote tests with pytest.',
  '',
  'Skills:',
  'Python, Flask, SQL, PostgreSQL, Git, JavaScript, React',
]);
const EXPLANATION = 'Your match reflects which requirements are evidenced and which are missing. Adding the missing ones first would raise it most.';

export async function run({ webUrl, apiUrl, aiControl }) {
  const t = new Reporter();
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const log = watch(page, apiUrl);
  const api = apiClient(page, apiUrl);
  const posts = [];
  page.on('request', (r) => {
    if (r.method() === 'POST' && /\/careers\/[^/]+\/explanation$/.test(r.url())) posts.push(r.url());
  });
  const modelCalls = async () => (await aiControl()).explain.payloads;
  let matches = [];

  const openDetails = async (title) => {
    await gotoAndSettle(page, `${webUrl}/careers`, 2000);
    await page.getByRole('button', { name: `Explain ${title}` }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ timeout: 10_000 });
    await dialog.getByTestId('career-explanation').waitFor({ timeout: 10_000 });
    return dialog;
  };
  const closeDialog = async () => {
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 10_000 });
  };

  try {
    await t.step('register and upload a resume', async () => {
      await register(page, webUrl, 'Explain Tester', `explain.${Date.now()}@example.com`, PASSWORD);
      await completeOnboarding(page, 'Backend Developer');
      await gotoAndSettle(page, `${webUrl}/resume`, 1500);
      await page.locator('input[type="file"]').first().setInputFiles({ name: 'riya.pdf', mimeType: 'application/pdf', buffer: RESUME });
      for (let i = 0; i < 60; i++) {
        if ((await api('GET', '/resumes/me')).data?.resume?.parsingStatus === 'completed') break;
        await page.waitForTimeout(500);
      }
      for (let i = 0; i < 40; i++) {
        matches = ((await api('GET', '/careers/matches')).data?.matches ?? []).filter((m) => (m.breakdown ?? []).length > 0);
        if (matches.length >= 2) break;
        await page.waitForTimeout(500);
      }
      expect(matches.length >= 2, `need two matches with a breakdown, got ${matches.length}`);
      return matches.slice(0, 2).map((m) => `${m.careerId.title} ${m.matchScore}%`).join(', ');
    });

    const first = () => matches[0];
    const second = () => matches[1];

    await t.step('opening a match shows the optional button and never asks the model', async () => {
      const dialog = await openDetails(first().careerId.title);
      const button = dialog.getByRole('button', { name: 'Explain with local AI' });
      await button.waitFor({ timeout: 10_000 });
      expect((await dialog.getByRole('heading').first().innerText()).includes(`${first().matchScore}% match`), 'the verified score is shown');
      expect((await modelCalls()) === 0 && posts.length === 0, 'no explanation was requested');
      await closeDialog();
    });

    await t.step('navigating around and reopening never asks the model', async () => {
      for (const path of ['/readiness', '/roadmap', '/recommendations', '/careers']) await gotoAndSettle(page, `${webUrl}${path}`, 1200);
      await page.goBack();
      await page.goForward();
      await openDetails(first().careerId.title);
      await closeDialog();
      expect((await modelCalls()) === 0 && posts.length === 0, `requests: model ${await modelCalls()}, POST ${posts.length}`);
    });

    await t.step('keyboard: the explanation is written, labelled and focused; the score is unchanged', async () => {
      await aiControl({ explain: { mode: 'slow', delayMs: 2500, text: EXPLANATION } });
      const dialog = await openDetails(first().careerId.title);
      const button = dialog.getByRole('button', { name: 'Explain with local AI' });
      await button.focus();
      await page.keyboard.press('Enter');
      const pending = dialog.getByTestId('explanation-pending');
      await pending.waitFor({ timeout: 5_000 });
      expect(/Running locally/.test(await pending.innerText()), 'the local-AI waiting message is shown');
      expect((await dialog.getByTestId('career-explanation').getAttribute('aria-busy')) === 'true', 'the region is marked busy');
      await page.waitForFunction(() => Number(document.querySelector('[data-testid="explanation-pending-elapsed"]')?.getAttribute('data-seconds')) >= 1, null, { timeout: 5_000 });
      const result = dialog.getByTestId('explanation-result');
      await result.waitFor({ timeout: 15_000 });
      expect((await dialog.getByTestId('explanation-text').innerText()).trim() === EXPLANATION, 'the explanation text');
      expect((await dialog.getByTestId('explanation-attribution').innerText()).includes('Written by local AI · fake-explainer'), 'provider and model label');
      expect(/can contain mistakes/.test(await dialog.getByTestId('explanation-warning').innerText()), 'the warning');
      expect(await page.evaluate(() => document.activeElement?.textContent?.trim() === 'Local AI explanation'), 'focus moved to the explanation');
      expect((await dialog.getByRole('heading').first().innerText()).includes(`${first().matchScore}% match`), 'score unchanged');
      const stored = (await api('GET', '/careers/matches')).data.matches.find((m) => m.careerId._id === first().careerId._id);
      expect(stored.matchScore === first().matchScore && JSON.stringify(stored.breakdown) === JSON.stringify(first().breakdown), 'the stored match is unchanged');
      expect((await modelCalls()) === 1, 'one model call');
    });

    await t.step('keyboard: the facts given to the model can be inspected', async () => {
      const dialog = page.getByRole('dialog');
      const summary = dialog.getByRole('button', { name: 'Facts given to the model' });
      await summary.focus();
      await page.keyboard.press('Enter');
      const facts = dialog.getByTestId('explanation-facts');
      await facts.waitFor({ timeout: 5_000 });
      const text = await facts.innerText();
      expect(text.includes(`Match score: ${first().matchScore}/100`), `facts: ${text}`);
      await closeDialog();
    });

    await t.step('reopening shows the saved explanation without asking the model again', async () => {
      const dialog = await openDetails(first().careerId.title);
      await dialog.getByTestId('explanation-result').waitFor({ timeout: 10_000 });
      expect((await dialog.getByRole('button', { name: 'Explain with local AI' }).count()) === 0, 'no button while a current explanation is shown');
      expect((await modelCalls()) === 1, `model calls: ${await modelCalls()}`);
      await closeDialog();
    });

    for (const [mode, title] of [
      ['busy', 'The local AI is busy.'],
      ['unavailable', 'The local AI is not available right now.'],
      ['timeout', 'The local AI took too long to answer.'],
      ['rejected', 'The explanation was not shown.'],
    ]) {
      await t.step(`${mode}: a distinct, announced message, nothing shown as an explanation`, async () => {
        await aiControl({ explain: { mode } });
        const dialog = await openDetails(second().careerId.title);
        await dialog.getByRole('button', { name: 'Explain with local AI' }).click();
        const error = dialog.getByTestId('explanation-error');
        await error.waitFor({ timeout: 10_000 });
        expect((await error.getAttribute('role')) === 'alert', 'announced as an alert');
        expect((await error.innerText()).includes(title), `message: ${await error.innerText()}`);
        expect((await dialog.getByRole('button', { name: 'Try again' }).count()) === 1, 'a retry button');
        expect((await dialog.getByTestId('explanation-result').count()) === 0, 'no explanation shown');
        await closeDialog();
      });
    }

    await t.step('phone width: the panel fits and works', async () => {
      await aiControl({ explain: { mode: 'ok', text: EXPLANATION } });
      await page.setViewportSize({ width: 390, height: 844 });
      const dialog = await openDetails(second().careerId.title);
      const button = dialog.getByRole('button', { name: 'Explain with local AI' });
      await button.scrollIntoViewIfNeeded();
      const box = await button.boundingBox();
      expect(box && box.x >= 0 && box.x + box.width <= 390, `button outside the screen: ${JSON.stringify(box)}`);
      await button.click();
      await dialog.getByTestId('explanation-result').waitFor({ timeout: 10_000 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow <= 0, `page scrolls sideways by ${overflow}px`);
      await closeDialog();
      await page.setViewportSize({ width: 1366, height: 900 });
    });

    await t.step('no unexpected errors', async () => {
      const unexpected = log.failed.filter((f) => !/\/explanation$/.test(f));
      expect(unexpected.length === 0, `failed requests: ${unexpected.join('; ')}`);
      // The failures this test provoked on purpose, as the browser and the dev-mode API client log them
      const consoleErrors = log.console.filter((c) => !/status of (422|503|504)/.test(c)
        && !/\[API Error\].*code: (AI_BUSY|AI_UNAVAILABLE|AI_TIMEOUT|EXPLANATION_REJECTED)/.test(c));
      expect(consoleErrors.length === 0, `console errors: ${consoleErrors.join('; ')}`);
    });
  } finally {
    await browser.close();
  }
  console.log(`\nSUMMARY ${t.results.length - t.failures}/${t.results.length} passed`);
  return t.failures;
}
