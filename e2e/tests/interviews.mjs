// Browser test for the advanced interview features (D-series). Run with
//   E2E_TEST_FILE=./tests/interviews.mjs node run.mjs
import { Reporter, apiClient, completeOnboarding, expect, gotoAndSettle, launchBrowser, register, watch } from '../lib/harness.mjs';

const PASSWORD = 'Password123!';
const ANSWER =
  'When I was leading a reporting change at my previous company, sales and finance disagreed on the definitions. My task was to agree one plan. ' +
  'I organised a workshop, wrote down each concern and proposed a compromise, then coordinated a review with both leads. ' +
  'As a result both teams signed off and the report shipped on time.';

export async function run({ webUrl, apiUrl }) {
  const t = new Reporter();
  const stamp = Date.now();
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const log = watch(page, apiUrl);
  const api = apiClient(page, apiUrl);

  /** Starts a session from the lobby, answers the first question and finalises the round. */
  const playOneQuestion = async () => {
    await page.getByRole('button', { name: /ENTER INTERVIEW STUDIO/ }).click();
    const box = page.locator('textarea').first();
    await box.waitFor({ timeout: 20_000 });
    await box.fill(ANSWER);
    await page.getByRole('button', { name: /Submit for AI Evaluation/ }).click();
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /Conclude Round/ }).click();
    await page.waitForTimeout(3000);
  };
  const latestSession = async () => (await api('GET', '/interviews/history')).data.history[0];

  try {
    await t.step('register', async () => {
      await register(page, webUrl, 'Interview Tester', `interviews.${stamp}@example.com`, PASSWORD);
      await completeOnboarding(page, 'Data Analyst');
    });

    // ---- D5 role-specific rubrics -------------------------------------------------------------------------
    await t.step('the lobby shows the scoring rubric and its weights', async () => {
      await gotoAndSettle(page, `${webUrl}/interview-agent`, 2500);
      const picker = page.getByTestId('rubric-picker');
      await picker.waitFor({ timeout: 15_000 });
      const select = picker.getByLabel('Scoring rubric');
      expect(/Match my role/.test(await select.locator('option').first().innerText()), 'no automatic option');
      await select.selectOption('product_business');
      expect(/Structure and relevance weigh more/.test(await picker.innerText()), 'the emphasis does not follow the choice');
      await picker.getByText('How each dimension is weighted').click();
      const weights = (await picker.getByTestId('rubric-weights').innerText()).replace(/\s+/g, ' ');
      expect(/Structure 30% 25%/.test(weights), `weights: ${weights}`);
    });

    await t.step('a chosen rubric is stored with the session and named in the debrief', async () => {
      await playOneQuestion();
      const note = page.getByTestId('rubric-note');
      await note.waitFor({ timeout: 15_000 });
      expect((await note.getAttribute('data-rubric')) === 'product_business', `debrief rubric ${await note.getAttribute('data-rubric')}`);
      expect(/Product and business/.test(await note.innerText()), 'the rubric is not named');
      const session = await latestSession();
      expect(session.rubricId === 'product_business', `stored rubric ${session.rubricId}`);
      expect(session.questions[0].evaluation?.rubricId === 'product_business', 'the evaluation does not record its rubric');
    });

    await t.step('"match my role" uses the rubric the server resolves for the role', async () => {
      await gotoAndSettle(page, `${webUrl}/interview-agent`, 2500);
      await page.getByTestId('rubric-picker').getByLabel('Scoring rubric').selectOption('');
      await playOneQuestion();
      const session = await latestSession();
      const resolved = (await api('GET', `/interviews/rubrics?role=${encodeURIComponent(session.targetCareerTitle)}`)).data.resolved;
      expect(session.rubricId === resolved, `role "${session.targetCareerTitle}": stored ${session.rubricId}, resolved ${resolved}`);
      return `${session.targetCareerTitle} → ${resolved}`;
    });

    // ---- D4 technical assessments --------------------------------------------------------------------------
    const SQL_KEYS = { 'sql-group-count': '2', 'sql-offset': 'Dina', 'sql-avg': '70', 'sql-left-join-zero': '3', 'sql-count-distinct': '3' };
    await t.step('the lobby links to a technical assessment that runs nothing', async () => {
      await gotoAndSettle(page, `${webUrl}/interview-agent`, 2000);
      await page.getByRole('link', { name: /Technical assessment/ }).click();
      await page.waitForURL('**/interview-agent/assessments', { timeout: 15_000 });
      await page.getByRole('heading', { name: 'Technical assessment', level: 1 }).waitFor({ timeout: 15_000 });
      expect(/Nothing you type is run as code/.test(await page.getByTestId('assessment-intro').innerText()), 'the no-execution promise is not stated');
    });

    await t.step('SQL tasks show their tables and no answer before answering', async () => {
      await page.getByLabel('SQL').check();
      await page.getByLabel('Number of tasks').selectOption('3');
      await page.getByRole('button', { name: 'Start assessment' }).click();
      await page.getByTestId('assessment').waitFor({ timeout: 15_000 });
      const tasks = page.getByTestId('assessment-task');
      expect((await tasks.count()) === 3, `${await tasks.count()} tasks`);
      expect(/employees/.test(await tasks.first().innerText()), 'the tables are not shown');
      expect(!/Correct answer/.test(await page.getByTestId('assessment').innerText()), 'an answer is visible before answering');
    });

    await t.step('a right answer and code typed as an answer are scored, with explanations', async () => {
      const tasks = page.getByTestId('assessment-task');
      const firstId = await tasks.nth(0).getAttribute('data-task');
      await tasks.nth(0).getByLabel('Your answer').fill(SQL_KEYS[firstId]);
      await tasks.nth(0).getByRole('button', { name: 'Submit answer' }).click();
      await tasks.nth(0).getByTestId('task-result').waitFor({ timeout: 10_000 });
      expect((await tasks.nth(0).getByTestId('task-result').getAttribute('data-correct')) === 'true', 'the right answer was not accepted');
      await tasks.nth(1).getByLabel('Your answer').fill("require('child_process').execSync('whoami')");
      await tasks.nth(1).getByRole('button', { name: 'Submit answer' }).click();
      const result = tasks.nth(1).getByTestId('task-result');
      await result.waitFor({ timeout: 10_000 });
      expect((await result.getAttribute('data-correct')) === 'false' && /Correct answer:/.test(await result.innerText()), 'the code answer was not treated as a wrong text answer');
    });

    await t.step('finishing scores unanswered tasks as incorrect and lists the attempt', async () => {
      await page.getByRole('button', { name: 'Finish now' }).click();
      const score = page.getByTestId('assessment-score');
      await score.waitFor({ timeout: 10_000 });
      expect(/1 of 3 correct \(33%\)/.test(await score.innerText()) && /1 unanswered/.test(await score.innerText()), `score: ${await score.innerText()}`);
      await page.getByRole('button', { name: 'Back to start' }).click();
      expect(/1 of 3 correct/.test(await page.getByTestId('assessment-history').innerText()), 'the attempt is not listed');
    });

    await t.step('a find-the-defect task is answered by choosing a line', async () => {
      await page.getByLabel('Find the defect').check();
      await page.getByRole('button', { name: 'Start assessment' }).click();
      const lineTask = page.locator('[data-testid="assessment-task"][data-task="review-js-assignment"]');
      await lineTask.waitFor({ timeout: 15_000 });
      await lineTask.getByLabel('Line with the defect').selectOption('2');
      await lineTask.getByRole('button', { name: 'Submit answer' }).click();
      await lineTask.getByTestId('task-result').waitFor({ timeout: 10_000 });
      expect((await lineTask.getByTestId('task-result').getAttribute('data-correct')) === 'true', 'line 2 was not accepted');
    });

    await t.step('the assessment page fits a phone screen', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow <= 1, `page is ${overflow}px wider than the screen`);
      await page.setViewportSize({ width: 1366, height: 900 });
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
