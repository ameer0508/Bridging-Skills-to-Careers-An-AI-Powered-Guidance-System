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
  // A stand-in for the browser's speech recognition, so the test controls what is "heard" and can
  // see whether recognition was started. No microphone or speech service is used.
  await context.addInitScript(() => {
    const state = { starts: 0, stops: 0, processLocally: null, current: null };
    class FakeRecognition {
      constructor() {
        this.continuous = false;
        this.interimResults = false;
        this.lang = '';
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
      }
      start() {
        state.starts += 1;
        state.processLocally = this.processLocally ?? null;
        state.current = this;
      }
      stop() {
        state.stops += 1;
        this.onend?.();
      }
      static available() {
        return Promise.resolve('unavailable');
      }
    }
    window.SpeechRecognition = FakeRecognition;
    window.webkitSpeechRecognition = FakeRecognition;
    window.__speech = state;
    window.__hear = (text) => state.current?.onresult?.({ resultIndex: 0, results: [[{ transcript: text }]] });
    window.__speechError = (error) => state.current?.onerror?.({ error });

    // A stand-in microphone and recorder: "recording" yields a tiny WebM-signed blob
    const media = { requests: 0 };
    window.__media = media;
    navigator.mediaDevices.getUserMedia = async () => {
      media.requests += 1;
      return { getTracks: () => [{ stop() {} }] };
    };
    class FakeRecorder {
      constructor() {
        this.mimeType = 'audio/webm';
        this.state = 'inactive';
      }
      start() {
        this.state = 'recording';
      }
      stop() {
        if (this.state !== 'recording') return;
        this.state = 'inactive';
        const bytes = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x42, 0x86, 0x81, 0x01]);
        this.ondataavailable?.({ data: new Blob([bytes], { type: 'audio/webm' }) });
        this.onstop?.();
      }
    }
    window.MediaRecorder = FakeRecorder;
  });
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

    // ---- D3 adaptive follow-ups --------------------------------------------------------------------------
    const VAGUE =
      'I would approach this carefully, think about what the team needs, talk to the people involved, and make sure that whatever we build is reliable. ' +
      'I would test it properly, review it with colleagues and keep improving it over time until everyone is happy with how it works in practice.';
    await t.step('with follow-ups on, an answer that misses a point is followed up at once', async () => {
      await gotoAndSettle(page, `${webUrl}/interview-agent`, 2500);
      await page.getByLabel(/Ask follow-up questions/).check();
      await page.getByRole('button', { name: /ENTER INTERVIEW STUDIO/ }).click();
      const box = page.locator('textarea').first();
      await box.waitFor({ timeout: 20_000 });
      await box.fill(VAGUE);
      await page.getByRole('button', { name: /Submit for AI Evaluation/ }).click();
      const badge = page.getByTestId('follow-up-badge');
      await badge.waitFor({ timeout: 20_000 });
      const grounding = await page.getByTestId('question-grounding').first().innerText();
      expect(/your answer to question 1/.test(grounding) && /follow-up to your previous answer/.test(grounding), `grounding: ${grounding}`);
      const session = await latestSession();
      expect(session.adaptiveFollowUps === true && session.questions[1].source === 'follow_up', 'the follow-up was not stored after question 1');
      return session.questions[1].question;
    });

    await t.step('the follow-up is answered and reported apart from the overall score', async () => {
      const box = page.locator('textarea').first();
      await box.fill(`${ANSWER} The key point I missed is handled explicitly, with a measured result.`);
      await page.getByRole('button', { name: /Submit for AI Evaluation/ }).click();
      await page.waitForTimeout(1500);
      await page.getByRole('button', { name: /Conclude Round/ }).click();
      const summary = page.getByTestId('follow-up-summary');
      await summary.waitFor({ timeout: 15_000 });
      expect(/1 asked, 1 answered/.test(await summary.innerText()), `summary: ${await summary.innerText()}`);
      const session = await latestSession();
      const primary = session.questions.filter((q) => !q.followUpOf);
      const expected = Math.round(primary.reduce((acc, q) => acc + (q.evaluation?.score || 0), 0) / primary.length);
      expect(session.overallScore === expected, `overall ${session.overallScore} vs planned-question average ${expected}`);
    });

    // ---- D6 historical comparison ----------------------------------------------------------------------------
    await t.step('history compares the dimensions of completed sessions, like with like', async () => {
      await gotoAndSettle(page, `${webUrl}/interview-agent`, 2000);
      await page.getByRole('button', { name: /Inspect Past Sessions/ }).click();
      const panel = page.getByTestId('interview-progress');
      await panel.getByTestId('progress-series').first().waitFor({ timeout: 15_000 });
      const progress = (await api('GET', '/interviews/progress')).data;
      const series = progress.series.find((s) => s.evaluationSource === 'heuristic');
      expect(series && series.sessions.length === 3, `heuristic sessions: ${series?.sessions.length}`);
      const row = (await panel.locator('tr[data-dimension="structure"]').innerText()).replace(/\s+/g, ' ');
      const t = series.dimensions.structure.trend;
      expect(row.includes(String(t.first)) && row.includes(String(t.latest)), `row "${row}" vs first ${t.first}, latest ${t.latest}`);
      expect(/Improved|Declined|No clear change/.test(row), `three sessions should state a direction: ${row}`);
      expect((await panel.locator('tr[data-dimension="technicalAccuracy"]').count()) === 0, 'rule-based sessions show no accuracy row');
      return row;
    });

    // ---- D2 speech-to-text --------------------------------------------------------------------------------
    await t.step('dictation does nothing until the user consents, and says where audio goes', async () => {
      await gotoAndSettle(page, `${webUrl}/interview-agent`, 2000);
      await page.getByRole('button', { name: /ENTER INTERVIEW STUDIO/ }).click();
      await page.locator('textarea').first().waitFor({ timeout: 20_000 });
      const enable = page.getByRole('button', { name: 'Enable voice dictation' });
      await enable.waitFor({ timeout: 10_000 });
      expect((await page.evaluate(() => window.__speech.starts)) === 0, 'recognition started without consent');
      await enable.click();
      const dialog = page.getByTestId('dictation-consent');
      const text = await dialog.innerText();
      expect(/does not receive or store your voice/.test(text) && /browser vendor/.test(text), `consent text: ${text}`);
      expect(await dialog.getByRole('button', { name: 'Only on this device' }).isDisabled(), 'on-device offered though the browser cannot do it');
      await dialog.getByRole('button', { name: /Allow my browser/ }).click();
      await page.getByTestId('dictation-status').waitFor({ timeout: 10_000 });
      const settings = (await api('GET', '/interviews/voice-settings')).data;
      expect(settings.dictationConsent === 'browser_service' && settings.history.length === 1, `stored consent ${JSON.stringify(settings)}`);
    });

    await t.step('dictated text lands in the answer, stays editable, and the answer is stored as mixed input', async () => {
      await page.getByRole('button', { name: 'Dictate' }).click();
      expect((await page.evaluate(() => window.__speech.starts)) === 1, 'recognition did not start');
      await page.evaluate(() => window.__hear('I compared the two groups with an A B test'));
      const box = page.getByLabel('Your answer');
      await page.waitForFunction(() => document.querySelector('textarea')?.value.includes('A B test'));
      await page.getByRole('button', { name: /Listening/ }).click();
      await box.fill((await box.inputValue()).replace('A B test', 'A/B test') + ' and measured conversion over two weeks because that is the decision metric.');
      await page.getByRole('button', { name: /Submit for AI Evaluation/ }).click();
      await page.waitForTimeout(1500);
      const session = await latestSession();
      expect(session.questions[0].answerInputMethod === 'mixed', `stored input method ${session.questions[0].answerInputMethod}`);
      expect(/A\/B test/.test(session.questions[0].candidateResponse), 'the edited text was not the one stored');
    });

    await t.step('a dictation error is explained and typing still works; dictation can be turned off', async () => {
      await page.getByRole('button', { name: 'Dictate' }).click();
      await page.evaluate(() => window.__speechError('not-allowed'));
      await page.getByRole('alert').filter({ hasText: 'Microphone access was refused' }).waitFor({ timeout: 5000 });
      await page.getByRole('button', { name: 'Turn off dictation' }).click();
      await page.getByRole('button', { name: 'Enable voice dictation' }).waitFor({ timeout: 10_000 });
      expect((await api('GET', '/interviews/voice-settings')).data.dictationConsent === 'none', 'consent was not withdrawn');
      await page.getByRole('button', { name: /Conclude Round/ }).click();
      await page.waitForTimeout(2500);
    });

    await t.step('a browser without speech recognition gets the typed fallback', async () => {
      const plain = await browser.newContext({ viewport: { width: 1366, height: 900 } });
      await plain.addInitScript(() => {
        delete window.SpeechRecognition;
        delete window.webkitSpeechRecognition;
      });
      const other = await plain.newPage();
      const otherApi = apiClient(other, apiUrl);
      await register(other, webUrl, 'No Speech Tester', `nospeech.${stamp}@example.com`, PASSWORD);
      await completeOnboarding(other, 'Data Analyst');
      await gotoAndSettle(other, `${webUrl}/interview-agent`, 2000);
      await other.getByRole('button', { name: /ENTER INTERVIEW STUDIO/ }).click();
      await other.getByTestId('dictation-unsupported').waitFor({ timeout: 20_000 });
      expect((await other.getByRole('button', { name: /dictat/i }).count()) === 0, 'a dictation button is shown without support');
      await other.getByLabel('Your answer').fill(ANSWER);
      await other.getByRole('button', { name: /Submit for AI Evaluation/ }).click();
      await other.waitForTimeout(1500);
      const stored = (await otherApi('GET', '/interviews/history')).data.history[0];
      await plain.close();
      expect(stored.questions[0].answerInputMethod === 'typed' && stored.questions[0].evaluation, 'the typed answer was not stored and scored');
    });

    // ---- D1 recorded answers --------------------------------------------------------------------------------
    let recordingRound;
    await t.step('recording is off until the user consents and picks a retention', async () => {
      await gotoAndSettle(page, `${webUrl}/interview-agent`, 2000);
      await page.getByRole('button', { name: /ENTER INTERVIEW STUDIO/ }).click();
      await page.locator('textarea').first().waitFor({ timeout: 20_000 });
      recordingRound = (await latestSession())._id;
      await page.getByRole('button', { name: 'Record spoken answers' }).click();
      expect((await page.evaluate(() => window.__media.requests)) === 0, 'the microphone was opened before consent');
      const dialog = page.getByTestId('recording-consent');
      const text = await dialog.innerText();
      expect(/not sent to\s+any AI/.test(text) && /do not change your score/.test(text) && /deletes all of them/.test(text), `consent text: ${text}`);
      await dialog.getByLabel('Keep recordings').selectOption('7');
      await dialog.getByRole('button', { name: 'Allow recording' }).click();
      await page.getByTestId('recording-status').waitFor({ timeout: 10_000 });
      const settings = (await api('GET', '/interviews/voice-settings')).data;
      expect(settings.recordingConsent === true && settings.retentionDays === 7, `settings ${JSON.stringify(settings)}`);
    });

    await t.step('an answer is recorded, played back to its owner and deleted', async () => {
      await page.getByRole('button', { name: 'Record answer' }).click();
      await page.getByRole('button', { name: /Stop recording/ }).click();
      await page.getByRole('button', { name: 'Listen' }).waitFor({ timeout: 10_000 });
      expect(/Recording saved/.test(await page.getByTestId('recording-status').innerText()), 'the saved state is not shown');
      expect((await api('GET', `/interviews/${recordingRound}/recordings`)).data.recordings.length === 1, 'the recording was not stored');
      await page.getByRole('button', { name: 'Listen' }).click();
      const player = page.getByTestId('recording-player');
      await player.waitFor({ timeout: 10_000 });
      expect(/^blob:/.test(await player.getAttribute('src')), 'playback does not use the fetched audio');
      await page.getByRole('button', { name: 'Delete recording' }).click();
      await page.getByRole('button', { name: 'Record answer' }).waitFor({ timeout: 10_000 });
      expect((await api('GET', `/interviews/${recordingRound}/recordings`)).data.recordings.length === 0, 'the recording was not deleted');
    });

    await t.step('turning recording off deletes every recording', async () => {
      await page.getByRole('button', { name: 'Record answer' }).click();
      await page.getByRole('button', { name: /Stop recording/ }).click();
      await page.getByRole('button', { name: 'Listen' }).waitFor({ timeout: 10_000 });
      page.once('dialog', (d) => d.accept());
      await page.getByRole('button', { name: 'Turn off recording' }).click();
      await page.getByRole('button', { name: 'Record spoken answers' }).waitFor({ timeout: 10_000 });
      const settings = (await api('GET', '/interviews/voice-settings')).data;
      expect(settings.recordingConsent === false, 'consent was not withdrawn');
      expect((await api('GET', `/interviews/${recordingRound}/recordings`)).data.recordings.length === 0, 'recordings survived withdrawal');
      await page.getByRole('button', { name: /Conclude Round/ }).click();
      await page.waitForTimeout(2500);
    });

    // ---- X9 scoring quality ----------------------------------------------------------------------------------
    await t.step('each scored answer shows its method, uncertainty, factors and limits', async () => {
      await gotoAndSettle(page, `${webUrl}/interview-agent`, 2000);
      await page.getByRole('button', { name: /ENTER INTERVIEW STUDIO/ }).click();
      const box = page.locator('textarea').first();
      await box.waitFor({ timeout: 20_000 });
      await box.fill(ANSWER);
      await page.getByRole('button', { name: /Submit for AI Evaluation/ }).click();
      // The room moves on to question 2: answer it in Hindi
      await page.waitForFunction(() => document.body.innerText.includes('QUESTION 2 OF'), null, { timeout: 20_000 });
      await page.locator('textarea').first().fill('मैंने इस समस्या पर टीम के साथ काम किया और एक भरोसेमंद समाधान बनाया जो भारी ट्रैफ़िक में भी चलता रहा।');
      await page.getByRole('button', { name: /Submit for AI Evaluation/ }).click();
      await page.waitForTimeout(1500);
      await page.getByRole('button', { name: /Conclude Round/ }).click();
      const details = page.getByTestId('evaluation-details').first();
      await details.waitFor({ timeout: 20_000 });
      expect(['medium', 'high'].includes(await details.getAttribute('data-uncertainty')), 'rule-based scoring shows at least medium uncertainty');
      await details.getByText(/How this answer was scored/).click();
      await details.getByText('Limits of this score').click();
      const text = await details.innerText();
      expect(/rule-based-v3/.test(text) && /Completeness: \d+ words/.test(text), `factors: ${text.slice(0, 200)}`);
      expect(/does not predict how an employer would assess you/.test(text), 'the hiring disclaimer is missing');
    });

    await t.step('an answer in Hindi is not scored, rather than marked down', async () => {
      await page.getByRole('button', { name: /^Q2/ }).click();
      await page.getByTestId('not-scored').waitFor({ timeout: 10_000 });
      expect(/not scored/i.test(await page.getByRole('button', { name: /^Q2/ }).innerText()), 'the question list shows a score');
      const session = await latestSession();
      expect(session.notScoredCount === 1 && session.questions[1].evaluation.notScored === true, `stored: ${session.notScoredCount}`);
      expect(session.preparationRecommendations.some((a) => /not in English/.test(a)), 'the debrief does not explain it');
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
