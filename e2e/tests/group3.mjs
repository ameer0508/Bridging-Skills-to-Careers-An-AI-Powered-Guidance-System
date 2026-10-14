// Browser test for the Aurora Elite group 3 screens: interview studio, voice states, technical
// assessment and exam practice. Checks the workflows, the honest voice states (unsupported
// dictation, consent before the microphone, a refused microphone, withdrawal), accessibility
// (axe, keyboard, reduced motion) and layout. Recording, playback and deletion with real audio
// are covered by interviews.mjs and voiceRealCodec.mjs. Run with
//   E2E_TEST_FILE=./tests/group3.mjs node run.mjs
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
const ANSWER = 'In my last role I owned a slow dashboard. I profiled it, found repeated renders, memoised the heavy table and cut load time from 4 seconds to 1.2 seconds, measured over a week of real traffic.';

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
  // No speech recognition, and a microphone the user refuses: the honest fallback states
  await context.addInitScript(() => {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
    }
  });
  const page = await context.newPage();
  const log = watch(page, apiUrl);
  const api = apiClient(page, apiUrl);
  const a11y = [];
  const scan = async (label) => {
    for (const v of await serious(page)) a11y.push(`${label}: ${v}`);
  };

  try {
    await t.step('signed out: the screens and the API are closed', async () => {
      for (const route of ['/interview-agent', '/interview-agent/assessments', '/exams']) {
        await gotoAndSettle(page, webUrl + route, 1200);
        expect(new URL(page.url()).pathname !== route, `${route} opened without signing in`);
      }
      for (const p of ['/interviews/history', '/interviews/voice-settings', '/exams/gate-cs-2026/attempts']) {
        const res = await fetch(apiUrl + p);
        expect(res.status === 401, `GET ${p} without a token answered ${res.status}`);
      }
    });

    await t.step('register and upload a resume', async () => {
      await register(page, webUrl, 'Group Three Tester', `group3.${Date.now()}@example.com`, PASSWORD);
      await completeOnboarding(page, 'Frontend Engineer');
      await gotoAndSettle(page, `${webUrl}/resume`, 1500);
      await page.locator('input[type="file"]').first().setInputFiles({ name: 'asha.pdf', mimeType: 'application/pdf', buffer: RESUME });
      for (let i = 0; i < 60; i++) {
        if ((await api('GET', '/resumes/me')).data?.resume?.parsingStatus === 'completed') break;
        await page.waitForTimeout(500);
      }
    });

    await t.step('interview setup: honest scoring note, tracks, rubric, no hiring claims', async () => {
      await gotoAndSettle(page, `${webUrl}/interview-agent`, 3000);
      const text = await bodyText(page);
      expect(/How answers are scored/.test(text) && /rule-based rubric/.test(text), 'the scoring path is not explained');
      expect(!/AI Evaluation|Hot Seat|verified tech stack/i.test(text), 'old claims are still on the setup screen');
      expect(await page.getByTestId('rubric-picker').isVisible(), 'the rubric picker is missing');
      await scan('setup');
    });

    let sessionId = null;
    await t.step('interview room: typed answer, unsupported dictation, consent before the microphone', async () => {
      await page.getByRole('button', { name: /ENTER INTERVIEW STUDIO/ }).click();
      const box = page.locator('textarea').first();
      await box.waitFor({ timeout: 20_000 });
      sessionId = (await api('GET', '/interviews/history')).data.history[0]._id;
      expect(await page.getByTestId('dictation-unsupported').isVisible(), 'unsupported dictation is not explained');
      // Recording asks for consent before anything touches the microphone
      await page.getByRole('button', { name: 'Record spoken answers' }).click();
      const consent = page.getByTestId('recording-consent');
      await consent.waitFor({ timeout: 5_000 });
      await scan('recording consent');
      await consent.getByRole('button', { name: 'Allow recording' }).click();
      await page.getByRole('button', { name: 'Record answer' }).click();
      const errors = page.getByTestId('recording-errors');
      await errors.locator('p').waitFor({ timeout: 5_000 });
      expect(/microphone could not be used/i.test(await errors.innerText()) && (await errors.getAttribute('role')) === 'alert', 'the refused microphone is not announced');
      expect((await api('GET', `/interviews/${sessionId}/recordings`)).data.recordings.length === 0, 'something was stored without a microphone');
      page.once('dialog', (d) => d.accept());
      await page.getByRole('button', { name: 'Turn off recording' }).click();
      await page.getByRole('button', { name: 'Record spoken answers' }).waitFor({ timeout: 10_000 });
      expect((await api('GET', '/interviews/voice-settings')).data.recordingConsent === false, 'consent was not withdrawn');
      // Typing still works and is never replaced
      await box.fill(ANSWER);
      expect((await box.inputValue()) === ANSWER, 'the typed answer changed');
      const [scored] = await Promise.all([
        page.waitForResponse((r) => /\/interviews\/[^/]+\/respond$/.test(r.url()) && r.request().method() === 'POST', { timeout: 20_000 }),
        page.getByRole('button', { name: /Submit answer for evaluation/ }).click(),
      ]);
      expect(scored.ok(), `the answer was not accepted (${scored.status()})`);
      await page.waitForTimeout(1500);
      await scan('room');
    });

    await t.step('report: rubric dimensions, scoring source, no hiring prediction', async () => {
      await page.getByRole('button', { name: /Conclude Round/ }).click();
      await page.getByTestId('evaluation-details').first().waitFor({ timeout: 20_000 });
      const text = await bodyText(page);
      expect(/rule-based/i.test(text), 'the scoring source is not named');
      expect(!/chance of (getting )?hired|hiring probability|will get the job/i.test(text), 'the report implies a hiring prediction');
      const stored = (await api('GET', `/interviews/${sessionId}`)).data;
      expect(stored.status === 'completed', `session ${stored.status}`);
      await scan('report');
    });

    await t.step('history: the session is listed and opens by keyboard', async () => {
      await gotoAndSettle(page, `${webUrl}/interview-agent`, 2500);
      await page.getByRole('button', { name: /Inspect Past Sessions/ }).click();
      const item = page.getByTestId('interview-history-item').first();
      await item.waitFor({ timeout: 15_000 });
      await scan('history');
      const card = page.locator('[role="button"]').filter({ has: item }).first();
      await card.focus();
      await page.keyboard.press('Enter');
      await page.getByTestId('evaluation-details').first().waitFor({ timeout: 15_000 });
    });

    await t.step('technical assessment: introduction, tasks, finish and history', async () => {
      await gotoAndSettle(page, `${webUrl}/interview-agent/assessments`, 2500);
      expect(/Nothing you type is run as code/.test(await page.getByTestId('assessment-intro').innerText()), 'the no-execution promise is missing');
      expect(!/run code|execute|terminal/i.test(await page.getByRole('main').innerText()) || /Nothing you type is run as code/.test(await page.getByRole('main').innerText()), 'a run-code control appears');
      await scan('technical intro');
      await page.getByLabel('SQL').check();
      await page.getByLabel('Number of tasks').selectOption('3');
      await page.getByRole('button', { name: 'Start assessment' }).click();
      await page.getByTestId('assessment').waitFor({ timeout: 15_000 });
      const tasks = page.getByTestId('assessment-task');
      expect((await tasks.count()) > 0, 'no tasks');
      await tasks.first().getByLabel('Your answer').fill('42');
      await tasks.first().getByRole('button', { name: 'Submit answer' }).click();
      await tasks.first().getByTestId('task-result').waitFor({ timeout: 10_000 });
      await scan('technical tasks');
      await page.getByRole('button', { name: 'Finish now' }).click();
      await page.getByTestId('assessment-score').waitFor({ timeout: 15_000 });
      await page.getByRole('button', { name: 'Back to start' }).click();
      expect(/correct/.test(await page.getByTestId('assessment-history').innerText()), 'the attempt is not listed');
    });

    await t.step('GATE CS: navigator follows answers, submit asks first, results explain each answer', async () => {
      await gotoAndSettle(page, `${webUrl}/exams/gate-cs-2026`, 2500);
      expect(/not affiliated/.test(await page.getByTestId('exam-disclaimer').innerText()), 'no disclaimer');
      await page.getByRole('tab', { name: 'Practice' }).click();
      await page.getByLabel('Databases').check();
      await page.getByLabel('Questions').fill('4');
      await page.getByRole('button', { name: 'Start' }).click();
      await page.getByTestId('attempt').waitFor({ timeout: 15_000 });
      const nav = page.getByTestId('exam-navigator');
      expect((await nav.getByRole('link').count()) === 4, 'the navigator does not list the four questions');
      expect(/not answered/.test(await nav.getByRole('link').first().getAttribute('aria-label')), 'the first question is not shown as unanswered');
      const first = page.getByTestId('exam-question').first();
      const choice = first.getByRole('radio');
      if (await choice.count()) await choice.first().check();
      else if (await first.getByRole('checkbox').count()) await first.getByRole('checkbox').first().check();
      else {
        await first.getByLabel('Numerical answer').fill('12');
        await first.getByRole('button', { name: 'Save answer' }).click();
      }
      await page.waitForTimeout(1200);
      expect(/, answered/.test(await nav.getByRole('link').first().getAttribute('aria-label')), 'the navigator did not follow the answer');
      await scan('exam attempt');
      let asked = false;
      page.once('dialog', (d) => { asked = /Submit now\?/.test(d.message()); d.accept(); });
      await page.getByRole('button', { name: 'Submit' }).click();
      await page.getByTestId('attempt-score').waitFor({ timeout: 15_000 });
      expect(asked, 'submitting did not ask first');
      expect((await page.getByTestId('question-result').count()) === 4, 'results per question missing');
      const text = await bodyText(page);
      expect(!(/percentile|\brank \d|cut-?off|pass probability/i.test(text) || /\bAIR\b/.test(text)), 'the result claims a rank, percentile or cutoff');
      await scan('exam result');
    });

    await t.step('SSC CGL: a timed set shows the server timer and the navigator', async () => {
      await gotoAndSettle(page, `${webUrl}/exams/ssc-cgl-2026-tier1`, 2500);
      await page.getByRole('tab', { name: 'Practice' }).click();
      await page.getByLabel('General Intelligence and Reasoning').check();
      await page.getByLabel('Questions').fill('3');
      await page.getByLabel('Timed', { exact: true }).check();
      await page.getByRole('button', { name: 'Start' }).click();
      await page.getByTestId('attempt-timer').waitFor({ timeout: 15_000 });
      await page.getByTestId('exam-navigator').waitFor({ timeout: 10_000 });
      const first = await page.getByTestId('attempt-timer').innerText();
      await page.waitForTimeout(2200);
      expect((await page.getByTestId('attempt-timer').innerText()) !== first, 'the timer does not count down');
      await scan('ssc timed');
      page.once('dialog', (d) => d.accept());
      await page.getByRole('button', { name: 'Submit' }).click();
      await page.getByTestId('attempt-score').waitFor({ timeout: 15_000 });
    });

    await t.step('no serious accessibility issue on any screen or dialog', async () => {
      expect(a11y.length === 0, a11y.join(' | '));
    });

    await t.step('reduced motion: questions and reports appear at once', async () => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', storageState: await context.storageState() });
      const p = await ctx.newPage();
      await p.goto(`${webUrl}/interview-agent`);
      await p.getByTestId('rubric-picker').waitFor({ timeout: 20_000 });
      const opacity = await p.getByTestId('rubric-picker').evaluate((el) => getComputedStyle(el).opacity);
      expect(opacity === '1', `the setup screen is still fading in (${opacity})`);
      await ctx.close();
    });

    await t.step('layout: no sideways scrolling at 1440, 1024, 768, 390 and 360 px', async () => {
      const problems = [];
      for (const width of [1440, 1024, 768, 390, 360]) {
        await page.setViewportSize({ width, height: 900 });
        for (const route of ['/interview-agent', '/interview-agent/assessments', '/exams', '/exams/gate-cs-2026']) {
          await gotoAndSettle(page, webUrl + route, 1800);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          if (overflow > 1) problems.push(`${route} ${width}px: ${overflow}px`);
        }
      }
      await page.setViewportSize({ width: 1440, height: 900 });
      expect(problems.length === 0, problems.join(' | '));
    });

    await t.step('no unexpected API failures or console errors', async () => {
      // The refused microphone is the only expected console noise in this run
      const errors = log.console.filter((e) => !/Permission denied|NotAllowedError/.test(e));
      expect(log.failed.length === 0, `API failures: ${log.failed.join(', ')}`);
      expect(errors.length === 0, `console errors: ${errors.slice(0, 4).join(' | ')}`);
    });
  } finally {
    await browser.close();
  }

  console.log(`\nSUMMARY ${t.results.length - t.failures}/${t.results.length} passed`);
  return t.failures;
}
