// Browser test for the exam pilots (E2 GATE CS, E3 SSC CGL Tier-I, E4 progress and plans). Run with
//   E2E_TEST_FILE=./tests/exams.mjs node run.mjs
import { Reporter, apiClient, bodyText, completeOnboarding, expect, gotoAndSettle, launchBrowser, register, watch } from '../lib/harness.mjs';

const PASSWORD = 'Password123!';

export async function run({ webUrl, apiUrl }) {
  const t = new Reporter();
  const stamp = Date.now();
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  page.on('dialog', (d) => d.accept());
  const log = watch(page, apiUrl);
  const api = apiClient(page, apiUrl);
  const tab = (name) => page.getByRole('tab', { name });

  /** Answers every visible question through the UI: first option, first box, or a number. */
  const answerVisible = async () => {
    const cards = page.getByTestId('exam-question');
    for (let i = 0; i < (await cards.count()); i++) {
      const card = cards.nth(i);
      if ((await card.locator('input[type=radio]').count()) > 0) await card.locator('input[type=radio]').first().check();
      else if ((await card.locator('input[type=checkbox]').count()) > 0) await card.locator('input[type=checkbox]').first().check();
      else {
        await card.getByLabel('Numerical answer').fill('12');
        await card.getByRole('button', { name: 'Save answer' }).click();
      }
      await page.waitForTimeout(250);
    }
  };
  let gateAttemptId;

  try {
    await t.step('exam practice requires sign-in', async () => {
      await gotoAndSettle(page, `${webUrl}/exams`, 1500);
      expect(new URL(page.url()).pathname !== '/exams', 'the page opened without signing in');
    });

    await t.step('register', async () => {
      await register(page, webUrl, 'Exam Tester', `exams.${stamp}@example.com`, PASSWORD);
      await completeOnboarding(page, 'Software Engineer');
    });

    await t.step('the sidebar lists both pilots with their official sources', async () => {
      await page.getByRole('link', { name: /Exam Practice/ }).first().click();
      await page.waitForURL('**/exams', { timeout: 15_000 });
      const list = page.getByTestId('exam-list');
      await list.waitFor({ timeout: 15_000 });
      const text = await list.innerText();
      expect(/GATE 2026: Computer Science/.test(text) && /SSC Combined Graduate Level Examination 2026/.test(text), `list: ${text.slice(0, 200)}`);
      expect((await list.locator('a[href^="https://gate2026.iitg.ac.in/"]').count()) >= 1 && (await list.locator('a[href^="https://ssc.gov.in/"]').count()) === 1, 'official links missing');
    });

    await t.step('the GATE syllabus shows sources with dates, the official pattern and limited-content flags', async () => {
      await page.getByRole('link', { name: 'Open GATE CS 2026' }).click();
      await page.waitForURL('**/exams/gate-cs-2026', { timeout: 15_000 });
      expect(/not affiliated/.test(await page.getByTestId('exam-disclaimer').innerText()), 'no disclaimer');
      const sources = await page.getByTestId('exam-sources').innerText();
      expect(/Read by SkillBridge on 2026-10-12/.test(sources) && /2025-08-08/.test(sources), `sources: ${sources}`);
      expect(/1\/3 mark/.test(await bodyText(page)), 'the official marking is not shown');
      expect((await page.getByTestId('limited-content').count()) > 0, 'thin topics are not flagged');
    });

    await t.step('an untimed set hides answers until submission, then shows marks and explanations', async () => {
      await tab('Practice').click();
      await page.getByTestId('attempts-empty').waitFor({ timeout: 15_000 });
      await page.getByLabel('Databases').check();
      await page.getByLabel('Questions').fill('4');
      await page.getByRole('button', { name: 'Start' }).click();
      await page.getByTestId('attempt').waitFor({ timeout: 15_000 });
      expect((await page.getByTestId('exam-question').count()) === 4, 'four questions expected');
      expect(!/Answer:/.test(await page.getByTestId('attempt').innerText()), 'answers visible before submission');
      await answerVisible();
      gateAttemptId = (await api('GET', '/exams/gate-cs-2026/attempts')).data.attempts[0].id;
      const saved = (await api('GET', `/exams/attempts/${gateAttemptId}`)).data;
      expect(saved.questions.every((q) => q.response !== null), 'not every answer was saved');
      await page.getByRole('button', { name: 'Submit' }).click();
      await page.getByTestId('attempt-score').waitFor({ timeout: 15_000 });
      const done = (await api('GET', `/exams/attempts/${gateAttemptId}`)).data;
      const sum = Math.round(done.questions.reduce((s, q) => s + q.marksAwarded, 0) * 100) / 100;
      expect(done.score.marks === sum, `score ${done.score.marks} vs question marks ${sum}`);
      expect((await page.getByTestId('attempt-score').innerText()).includes(`${done.score.marks} of ${done.score.maxMarks} marks`), 'the stored score is not the one shown');
      expect((await page.getByTestId('question-result').count()) === 4, 'results per question missing');
      return `${done.score.marks}/${done.score.maxMarks}`;
    });

    await t.step('progress shows the topic with its counts and a status only after enough answers', async () => {
      await page.getByRole('button', { name: 'Back' }).click();
      // The list first shows the cached row ("in progress") and refetches after the submission
      const listed = await page.getByTestId('attempt-history').getByText(/marks/).first().waitFor({ timeout: 10_000 }).then(() => true, () => false);
      expect(listed, 'the submitted attempt is not listed with its marks');
      await tab('Progress').click();
      const row = page.locator('tr[data-topic="db-core"]');
      await row.waitFor({ timeout: 15_000 });
      const text = (await row.innerText()).replace(/\s+/g, ' ');
      expect(/of 4/.test(text) && /(Strength|Weak|Developing)/.test(text), `db row: ${text}`);
      expect(/Not practised/.test((await page.locator('tr[data-topic="cn-core"]').innerText())), 'an unpractised topic is labelled');
      await page.getByTestId('exam-recommendations').waitFor({ timeout: 5000 });
    });

    await t.step('a study plan fits the weekly hours and keeps completed items when updated', async () => {
      await tab('Study plan').click();
      await page.getByTestId('plan-empty').waitFor({ timeout: 15_000 });
      await page.getByLabel('Hours you can study per week').fill('6');
      await page.getByRole('button', { name: 'Create plan' }).click();
      const first = page.getByTestId('plan-item').first();
      await first.waitFor({ timeout: 15_000 });
      await first.locator('input[type=checkbox]').check();
      await page.waitForTimeout(800);
      const before = (await api('GET', '/exams/gate-cs-2026/plan')).data.plan;
      const doneItem = before.items.find((i) => i.status === 'done');
      expect(doneItem, 'the item was not marked done');
      await page.getByLabel('Hours you can study per week').fill('3');
      await page.getByRole('button', { name: 'Update plan' }).click();
      await page.waitForTimeout(1200);
      const after = (await api('GET', '/exams/gate-cs-2026/plan')).data.plan;
      const kept = after.items.find((i) => i.id === doneItem.id);
      expect(kept && kept.status === 'done', 'the completed item was lost');
      const perWeek = {};
      after.items.filter((i) => i.status === 'pending').forEach((i) => (perWeek[i.week] = (perWeek[i.week] || 0) + i.hours));
      expect(Object.values(perWeek).every((h) => h <= 3), `weekly hours exceeded: ${JSON.stringify(perWeek)}`);
      expect(/3 hours a week/.test(await page.getByTestId('plan-totals').innerText()), 'totals not updated');
    });

    await t.step('choosing more questions than exist says so', async () => {
      await tab('Practice').click();
      await page.getByLabel('Compiler Design').check();
      await page.getByLabel('Questions').fill('10');
      expect(/Only 2 questions exist/.test(await page.getByTestId('content-shortfall').innerText()), 'no shortfall message');
      await page.getByLabel('Compiler Design').uncheck();
    });

    await t.step('SSC timed practice runs section by section with a server timer', async () => {
      await gotoAndSettle(page, `${webUrl}/exams/ssc-cgl-2026-tier1`, 1500);
      await tab('Practice').click();
      await page.getByLabel('General Intelligence and Reasoning').check();
      await page.getByLabel('Quantitative Aptitude').check();
      await page.getByLabel('Questions').fill('6');
      await page.getByLabel('Timed', { exact: true }).check();
      await page.getByRole('button', { name: 'Start' }).click();
      await page.getByTestId('attempt-timer').waitFor({ timeout: 15_000 });
      const sscAttempt = (await api('GET', '/exams/ssc-cgl-2026-tier1/attempts')).data.attempts[0];
      const view = (await api('GET', `/exams/attempts/${sscAttempt.id}`)).data;
      const reasoning = view.questions.filter((q) => q.sectionId === 'reasoning').map((q) => q.questionId);
      const shown = await page.getByTestId('exam-question').evaluateAll((els) => els.map((e) => e.dataset.question));
      expect(shown.length === reasoning.length && shown.every((id) => reasoning.includes(id)), 'only the first section should be shown');
      await answerVisible();
      await page.getByRole('button', { name: /Finish section, start Quantitative Aptitude/ }).click();
      await page.waitForTimeout(800);
      const nowShown = await page.getByTestId('exam-question').evaluateAll((els) => els.map((e) => e.dataset.question));
      expect(nowShown.every((id) => !reasoning.includes(id)), 'the closed section is still shown');
      const closed = (await api('PUT', `/exams/attempts/${sscAttempt.id}/answers`, { questionId: reasoning[0], response: 1 })).status;
      expect(closed === 409, `changing a closed section answered ${closed}`);
      await page.getByRole('button', { name: 'Submit' }).click();
      await page.getByTestId('attempt-score').waitFor({ timeout: 15_000 });
      expect(/practice score, not an exam score/.test(await page.getByTestId('attempt-score').innerText()), 'the score is not labelled as practice');
    });

    await t.step('another account sees none of these attempts', async () => {
      const other = await browser.newContext();
      const otherPage = await other.newPage();
      const otherApi = apiClient(otherPage, apiUrl);
      await register(otherPage, webUrl, 'Exam Other', `exams.other.${stamp}@example.com`, PASSWORD);
      await completeOnboarding(otherPage, 'Software Engineer');
      await gotoAndSettle(otherPage, `${webUrl}/exams`, 1500);
      const probe = (await otherApi('GET', `/exams/attempts/${gateAttemptId}`)).status;
      const history = (await otherApi('GET', '/exams/gate-cs-2026/attempts')).data.attempts.length;
      const plan = (await otherApi('GET', '/exams/gate-cs-2026/plan')).data.plan;
      await other.close();
      expect(probe === 404 && history === 0 && plan === null, `other account: ${probe}, ${history}, ${JSON.stringify(plan)}`);
    });

    await t.step('the exam page fits a phone screen', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await gotoAndSettle(page, `${webUrl}/exams/gate-cs-2026`, 1500);
      await tab('Progress').click();
      await page.getByTestId('topic-table').waitFor({ timeout: 10_000 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow <= 1, `page is ${overflow}px wider than the screen`);
    });

    await t.step('no unexpected API failures or console errors', async () => {
      // One 409 is provoked on purpose (answering a closed section)
      const failed = log.failed.filter((f) => !/^409 PUT \/exams\/attempts\/[a-f0-9]+\/answers$/.test(f));
      expect(failed.length === 0, `API failures: ${failed.join(', ')}`);
      expect(log.console.length === 0, `console errors: ${log.console.slice(0, 4).join(' | ')}`);
    });
  } finally {
    await browser.close();
  }

  console.log(`\nSUMMARY ${t.results.length - t.failures}/${t.results.length} passed`);
  return t.failures;
}
