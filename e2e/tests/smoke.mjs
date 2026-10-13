// Browser smoke test: one synthetic user walks through the product end to end, and a second
// user checks that none of it is reachable from another account.
import {
  Reporter,
  apiClient,
  bodyText,
  completeOnboarding,
  expect,
  gotoAndSettle,
  launchBrowser,
  register,
  syntheticResume,
  watch,
} from '../lib/harness.mjs';

const PASSWORD = 'Password123!';
const TARGET_ROLE = 'Full Stack Developer';

// Synthetic people and content only
const RESUME_FIRST = syntheticResume([
  'Priya Sharma',
  'Email: priya.sharma@example.com',
  'Phone: +1 555-0100',
  '',
  'Experience:',
  'Frontend Developer at Example Co (2022-2024)',
  'Built dashboards with React, JavaScript, HTML and CSS.',
  '',
  'Projects:',
  'Campus Marketplace',
  'REST service written in Node.js, tracked with Git.',
  '',
  'Skills:',
  'React, JavaScript, HTML, CSS, Node.js, Git',
]);
const RESUME_SECOND = syntheticResume([
  'Priya Sharma',
  'Email: priya.sharma@example.com',
  '',
  'Experience:',
  'Full Stack Developer at Example Co (2024-2025)',
  'Built services with React, Node.js, Python and Docker.',
  '',
  'Skills:',
  'React, JavaScript, Node.js, Python, Docker, Git',
]);

const pdf = (name, buffer) => ({ name, mimeType: 'application/pdf', buffer });

export async function run({ webUrl, apiUrl, aiControl }) {
  const t = new Reporter();
  const stamp = Date.now();
  const emailA = `smoke.a.${stamp}@example.com`;
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);

  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const log = watch(page, apiUrl);
  const api = apiClient(page, apiUrl);

  const snapshot = async () => (await api('GET', '/users/me/career-snapshot')).data;
  /** Waits until the active resume (optionally a specific file) has finished processing. */
  const waitForResume = async (fileName) => {
    for (let i = 0; i < 80; i++) {
      const resume = (await api('GET', '/resumes/me')).data?.resume;
      const finished = resume && ['completed', 'failed'].includes(resume.parsingStatus);
      if (finished && (!fileName || resume.originalFileName === fileName)) return resume;
      await page.waitForTimeout(250);
    }
    throw new Error(`resume ${fileName || ''} did not finish processing`);
  };
  const extractCalls = async () => (await aiControl()).requests.filter((r) => r === 'POST /api/v1/extract').length;

  try {
    // ---- Access control and invalid input before signing in ----------------------------
    await t.step('protected page redirects to sign-in when logged out', async () => {
      await gotoAndSettle(page, `${webUrl}/home`, 1500);
      const path = new URL(page.url()).pathname;
      expect(path !== '/home', 'the home page opened without signing in');
      return path;
    });
    await t.step('sign-in with wrong credentials shows an error', async () => {
      await page.goto(`${webUrl}/login`);
      await page.fill('input[type="email"]', `nobody.${stamp}@example.com`);
      await page.fill('input[type="password"]', 'WrongPassword1!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      expect(new URL(page.url()).pathname === '/login', `left the sign-in page: ${page.url()}`);
      expect(/invalid|incorrect|failed|wrong/i.test(await bodyText(page)), 'no error message is shown');
    });
    await t.step('registration rejects a weak password', async () => {
      await page.goto(`${webUrl}/register`);
      await page.fill('input[placeholder="John Doe"]', 'Weak Password');
      await page.fill('input[type="email"]', `weak.${stamp}@example.com`);
      for (const field of await page.locator('input[type="password"]').all()) await field.fill('123');
      for (const box of await page.locator('input[type="checkbox"]').all()) await box.check().catch(() => {});
      await page.click('button[type="submit"]').catch(() => {});
      await page.waitForTimeout(1500);
      expect(new URL(page.url()).pathname === '/register', 'a weak password was accepted');
    });
    await t.step('unknown address shows the not-found page', async () => {
      await gotoAndSettle(page, `${webUrl}/definitely-not-a-page`, 1200);
      expect(await page.getByTestId('not-found-page').isVisible(), 'no not-found page');
      expect((await bodyText(page)).includes('/definitely-not-a-page'), 'the missing address is not named');
    });
    log.failed.length = 0; // the rejections above are the expected outcome
    log.console.length = 0;

    // ---- Registration and onboarding -------------------------------------------------------
    await t.step('register', async () => {
      await register(page, webUrl, 'Smoke Tester', emailA, PASSWORD);
    });
    await t.step('onboarding stores the target role', async () => {
      await completeOnboarding(page, TARGET_ROLE);
      const me = await api('GET', '/users/me');
      expect(me.status === 200 && me.data.targetRole === TARGET_ROLE, `profile target role is "${me.data?.targetRole}"`);
    });

    // ---- Empty states and unavailable providers ---------------------------------------------
    await t.step('before a resume: no scores are shown as if they existed', async () => {
      const snap = await snapshot();
      expect(snap.resumeInfo.hasResume === false, 'snapshot claims a resume');
      expect(!snap.isReadinessEvaluated || snap.readinessScore === 0 || snap.readinessScore === null, `readiness is ${snap.readinessScore} without a resume`);
      await gotoAndSettle(page, `${webUrl}/resume`);
      expect(!(await page.getByTestId('resume-candidate-name').isVisible().catch(() => false)), 'a candidate name is shown with no resume');
    });
    await t.step('job search without a provider key shows labelled demo listings', async () => {
      await gotoAndSettle(page, `${webUrl}/job-agent`, 3500);
      const notice = page.getByTestId('job-source-notice');
      expect((await notice.getAttribute('data-source')) === 'sample', 'listings are not labelled as demo');
      expect(/not real vacancies/i.test(await notice.innerText()), 'the demo notice does not say they are not real');
      // A sample listing is never given an age: its date belongs to the demonstration
      const ages = page.getByTestId('job-freshness');
      const count = await ages.count();
      expect(count > 0, 'no listing shows a freshness label');
      for (let i = 0; i < count; i++) {
        expect((await ages.nth(i).getAttribute('data-freshness')) === 'sample' && /Sample listing, no real date/.test(await ages.nth(i).innerText()), `listing ${i + 1} is shown with an age although it is a sample`);
      }
      const stored = (await api('GET', '/opportunities')).data;
      expect(stored.opportunities.every((o) => o.freshness.status === 'sample' && o.freshness.ageDays === null) && stored.meta.providerQuota === null, 'the API gives a sample listing an age or a provider allowance');
      return `${count} sample listings, none given an age`;
    });
    await t.step('a file that is not a resume is rejected with a message', async () => {
      await gotoAndSettle(page, `${webUrl}/resume`, 1500);
      await page.locator('input[type="file"]').first().setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('plain text') });
      await page.waitForTimeout(1200);
      expect(/not supported/i.test(await bodyText(page)), 'no message about the unsupported file');
      expect((await api('GET', '/resumes/me')).data.resume === null, 'the file was stored');
    });

    // ---- Resume: upload and extraction ----------------------------------------------------------
    await t.step('upload a resume and see the extraction', async () => {
      await page.locator('input[type="file"]').first().setInputFiles(pdf('priya-frontend.pdf', RESUME_FIRST));
      const resume = await waitForResume('priya-frontend.pdf');
      expect(resume.parsingStatus === 'completed', `processing ${resume.parsingStatus}: ${resume.parsingError}`);
      await gotoAndSettle(page, `${webUrl}/resume`, 3000);
      const name = await page.getByTestId('resume-candidate-name').innerText();
      expect(name === 'Priya Sharma', `candidate name shown as "${name}"`);
      const text = await bodyText(page);
      expect(text.includes('priya-frontend.pdf') && /React/.test(text), 'file name or extracted skills are not shown');
      return `candidate ${name}`;
    });

    await t.step('download returns the stored resume file', async () => {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 15_000 }),
        page.getByRole('button', { name: 'Download', exact: true }).click(),
      ]);
      expect(download.suggestedFilename() === 'priya-frontend.pdf', `downloaded as "${download.suggestedFilename()}"`);
      const chunks = [];
      for await (const chunk of await download.createReadStream()) chunks.push(chunk);
      expect(Buffer.concat(chunks).equals(RESUME_FIRST), 'the downloaded file is not the uploaded one');
      return `${download.suggestedFilename()}, ${RESUME_FIRST.length} bytes, identical to the upload`;
    });

    let skillCount = 0;
    await t.step('skills page lists the extracted skills with evidence', async () => {
      skillCount = (await api('GET', '/skills/me')).data.totalSkills;
      expect(skillCount === 6, `expected 6 skills, the API has ${skillCount}`);
      await gotoAndSettle(page, `${webUrl}/skills`, 3000);
      const text = await bodyText(page);
      expect(/React/.test(text) && /Node\.js/.test(text) && /evidence/i.test(text), 'skills or evidence wording missing');
      const covered = text.match(/REQUIREMENTS COVERED\s*(\d+)%/i);
      expect(covered && Number(covered[1]) > 0, 'requirement coverage is missing or zero');
      return `${skillCount} skills, ${covered[1]}% of requirements covered`;
    });

    let readiness = null;
    await t.step('career matches show the score and how it was calculated', async () => {
      const matches = (await api('GET', '/careers/matches')).data.matches;
      expect(matches.length > 0, 'no career matches');
      await gotoAndSettle(page, `${webUrl}/careers`, 3500);
      const text = await bodyText(page);
      expect(text.includes(matches[0].careerId.title), 'top match is not shown');
      expect(/How this score was calculated/i.test(text), 'no score breakdown');
      expect(text.includes(String(matches[0].matchScore)), `score ${matches[0].matchScore} is not on the page`);
      return `${matches[0].careerId.title} ${matches[0].matchScore}%`;
    });
    await t.step('careers page shows no invented market or salary figures', async () => {
      await gotoAndSettle(page, `${webUrl}/careers`, 3500);
      const demand = page.getByTestId('career-demand');
      await demand.waitFor({ timeout: 15_000 });
      await page.locator('[data-testid="career-demand"][data-state="no_source"]').waitFor({ timeout: 15_000 });
      expect(/Market data unavailable/.test(await demand.innerText()) && /No licensed job-market source is connected/.test(await demand.innerText()), 'the demand section does not say that market data is unavailable');
      const salary = page.getByTestId('career-salary');
      await page.locator('[data-testid="career-salary"][data-status="data_unavailable"]').waitFor({ timeout: 15_000 });
      expect(/Salary data unavailable/.test(await salary.innerText()), 'the salary section does not say that salary data is unavailable');
      expect(await page.getByTestId('job-listings-pointer').isVisible(), 'the pointer to the job search is missing');
      const text = await bodyText(page);
      expect(!/\$\s?\d{2,3}[,kK]|\d+\s?LPA|% YoY|Demand Score:|Real-time salary|Real-time labor market|average base salary|hiring growth/i.test(text), 'the careers page still shows a salary, growth or demand figure that has no source');
      return 'demand: no licensed source; salaries: unavailable; no invented figures';
    });
    await t.step('readiness is the same figure on every page that shows it', async () => {
      readiness = (await snapshot()).readinessScore;
      expect(typeof readiness === 'number' && readiness > 0, `snapshot readiness is ${readiness}`);
      const missing = [];
      for (const route of ['/home', '/readiness', '/job-agent', '/interview-agent']) {
        await gotoAndSettle(page, webUrl + route, 3000);
        const text = await bodyText(page);
        if (!text.includes(`${readiness}%`) && !text.includes(`${readiness} / 100`)) missing.push(route);
      }
      expect(missing.length === 0, `readiness ${readiness} is not shown on ${missing.join(', ')}`);
      return `${readiness}% on four pages`;
    });

    // ---- Career Lab (expansion) --------------------------------------------------------------------
    const openLabTab = async (name) => {
      await page.getByRole('tab', { name, exact: true }).click();
      await page.waitForTimeout(800);
    };
    await t.step('Career Lab: compare careers with the same scores as the match list', async () => {
      const matches = (await api('GET', '/careers/matches')).data.matches;
      const stored = matches.find((m) => m.careerId.title === 'Frontend Engineer');
      await gotoAndSettle(page, `${webUrl}/career-lab`, 2500);
      await page.getByLabel('Frontend Engineer', { exact: true }).check();
      await page.getByLabel('DevOps Engineer', { exact: true }).check();
      await page.getByRole('button', { name: 'Compare', exact: true }).click();
      await page.getByTestId('compare-result').waitFor({ timeout: 15_000 });
      const shown = await page.getByTestId('compare-score-Frontend Engineer').innerText();
      expect(shown === `${stored.matchScore}%`, `comparison shows ${shown}, the match list has ${stored.matchScore}%`);
      expect(/No time estimate is given/.test(await page.getByTestId('compare-effort-note').innerText()), 'the effort note does not say that no time estimate is given');
      expect(/Docker/.test(await page.getByTestId('compare-result').innerText()), 'the DevOps gap (Docker) is not listed');
      const market = page.getByTestId('compare-market-row');
      const cells = page.getByTestId('compare-market-cell');
      expect((await cells.count()) === 2 && (await cells.first().getAttribute('data-state')) === 'no_source' && (await cells.first().getAttribute('data-usable')) === 'false', 'without a licensed source each career should be shown as having no market source');
      expect(/No licensed job-market source is connected/.test(await cells.first().innerText()) && !/\d+ postings/.test(await market.innerText()), 'a posting count is shown although no sourced data exists');
      expect(/separate from your match and readiness/.test(await page.getByTestId('compare-market-note').innerText()), 'the note does not keep opportunities apart from readiness');
      expect((await market.getAttribute('data-available')) === 'false' && /Market data unavailable/.test(await market.innerText()), 'the opportunities row does not say that market data is unavailable');
      // OnJob.io live listings are off by default: said so, and no request is made (A1)
      const live = page.getByTestId('compare-live-cell');
      expect((await live.count()) === 2 && (await live.first().getAttribute('data-state')) === 'off' && /not enabled the OnJob.io feed/.test(await live.first().innerText()), 'live listings are not reported as off');
      expect(/not the Indian job market/.test(await page.getByTestId('compare-live-note').innerText()), 'the live listings note does not state its scope');
      return `Frontend Engineer ${shown}`;
    });
    await t.step('Career Lab: counterfactuals and a what-if scenario that changes nothing real', async () => {
      const stateNow = async () => ({
        skills: (await api('GET', '/skills/me')).data.totalSkills,
        matches: JSON.stringify((await api('GET', '/careers/matches')).data.matches.map((m) => [m.careerId.title, m.matchScore])),
      });
      const before = await stateNow();
      await openLabTab('What-if');
      await page.selectOption('#whatif-career', { label: 'DevOps Engineer' });
      await page.getByTestId('counterfactuals').waitFor({ timeout: 15_000 });
      expect((await page.getByTestId('counterfactual-row').count()) > 0, 'no ranked changes are listed');
      expect(await page.getByTestId('counterfactual-path').isVisible(), 'no route to a higher score is shown');

      await page.fill('#scenario-skill', 'Underwater Basket Weaving');
      await page.getByRole('button', { name: 'Add to scenario' }).click();
      await page.getByRole('button', { name: 'Run scenario' }).click();
      await page.waitForTimeout(1500);
      expect(/not a skill SkillBridge recognises/.test(await bodyText(page)), 'an unknown skill was not rejected with a message');
      // That rejection is the expected outcome, not an unexpected API failure
      log.failed.splice(0, log.failed.length, ...log.failed.filter((entry) => entry !== '400 POST /careers/what-if'));
      log.console.splice(0, log.console.length, ...log.console.filter((entry) => !/UNKNOWN_SKILL|status of 400/.test(entry)));
      await page.getByRole('button', { name: 'Clear', exact: true }).click();

      await page.fill('#scenario-skill', 'Docker');
      await page.getByRole('button', { name: 'Add to scenario' }).click();
      await page.getByRole('button', { name: 'Run scenario' }).click();
      await page.getByTestId('whatif-result').waitFor({ timeout: 15_000 });
      expect(/Nothing was saved/.test(await page.getByTestId('whatif-hypothetical-label').innerText()), 'the result is not labelled hypothetical');
      const row = await page.getByTestId('whatif-career-row').filter({ hasText: 'DevOps Engineer' }).innerText();
      const [now, scenario] = [...row.matchAll(/(\d+)%/g)].map((m) => Number(m[1]));
      expect(scenario > now, `the scenario did not raise the DevOps score (${now}% to ${scenario}%)`);

      const after = await stateNow();
      expect(after.skills === before.skills && after.matches === before.matches, 'the what-if changed stored skills or scores');
      return `DevOps Engineer ${now}% to ${scenario}% hypothetically; stored data unchanged`;
    });
    await t.step('Career Lab: skill freshness is dated honestly and a confirmation adds no points', async () => {
      await openLabTab('Skill freshness');
      const react = page.locator('[data-testid="freshness-skill"][data-skill="React"]');
      await react.waitFor({ timeout: 15_000 });
      expect((await react.getAttribute('data-status')) === 'aging', `React is shown as ${await react.getAttribute('data-status')}`);
      const node = page.locator('[data-testid="freshness-skill"][data-skill="Node.js"]');
      expect((await node.getAttribute('data-status')) === 'undated', 'a skill with no dated evidence is not shown as undated');
      const scoreOfReact = async () => (await api('GET', '/skills/freshness')).data.skills.find((s) => s.name === 'React').evidenceScore;
      const scoreBefore = await scoreOfReact();
      await react.getByRole('button', { name: 'I have used this recently' }).click();
      await react.getByRole('button', { name: 'Confirm' }).click();
      await page.locator('[data-testid="freshness-skill"][data-skill="React"][data-status="current"]').waitFor({ timeout: 15_000 });
      expect(/Your own record \(not verified\)/.test(await react.innerText()), 'the confirmation is not labelled unverified');
      const scoreAfter = await scoreOfReact();
      expect(scoreAfter === scoreBefore, `the confirmation changed the evidence score (${scoreBefore} to ${scoreAfter})`);
      return 'React ageing to current after confirmation, evidence score unchanged; Node.js undated';
    });
    await t.step('Career Lab: a transition plan is built, saved and survives a reload', async () => {
      await openLabTab('Transition plan');
      await page.selectOption('#transition-target', { label: 'Machine Learning Engineer' });
      await page.getByRole('button', { name: 'Build plan' }).click();
      await page.getByTestId('transition-plan').waitFor({ timeout: 15_000 });
      const stages = await page.getByTestId('transition-stage').count();
      expect(stages >= 1, 'the plan has no stages');
      await page.reload();
      await page.waitForTimeout(2500);
      await openLabTab('Transition plan');
      await page.getByTestId('transition-plan').waitFor({ timeout: 15_000 });
      expect(/Machine Learning Engineer/.test(await page.getByTestId('transition-plan').innerText()), 'the saved plan is not shown after a reload');
      return `${stages} stage(s) to Machine Learning Engineer`;
    });
    await t.step('Career Lab: activity shows what each event recalculated', async () => {
      await openLabTab('Activity');
      await page.getByTestId('recalculation-run').first().waitFor({ timeout: 15_000 });
      const processed = page.locator('[data-testid="recalculation-run"][data-trigger="resume_processed"]');
      expect((await processed.count()) === 1, `expected one "resume processed" entry, found ${await processed.count()}`);
      expect(/Recalculated career matches, readiness and gaps, recommendations/.test(await processed.first().innerText()), 'the entry does not say what was recalculated');
      const skipped = await page.locator('[data-testid="recalculation-run"][data-status="skipped_duplicate"]').count();
      expect(skipped >= 1, 'the confirmation that changed no score is not recorded as needing no recalculation');
      return `one resume run; ${skipped} event(s) correctly recalculated nothing`;
    });
    await t.step('Career Lab: a skill check fails without changing scores, then a pass adds assessed evidence once', async () => {
      const javascript = async () => (await api('GET', '/skills/freshness')).data.skills.find((s) => s.name === 'JavaScript');
      const before = await javascript();
      await openLabTab('Verify skills');
      const tile = page.locator('[data-testid="assessable-skill"][data-skill="JavaScript"]');
      await tile.waitFor({ timeout: 15_000 });
      expect(/Stated, not verified/.test(await tile.innerText()), 'a skill from the resume is not labelled as stated only');
      expect(await page.getByTestId('assessment-history-empty').isVisible(), 'the empty history is not shown');
      expect(/not a certification/.test(await page.getByTestId('assessment-note').innerText()), 'the limits of a skill check are not stated');

      // Correct answers are learned only from the reviews the server returns after each submission
      const known = new Map();
      const attemptOnce = async () => {
        await tile.getByRole('button').click();
        await page.getByTestId('assessment-attempt').waitFor({ timeout: 15_000 });
        const questions = page.getByTestId('assessment-question');
        const count = await questions.count();
        for (let i = 0; i < count; i++) {
          const question = questions.nth(i);
          const prompt = (await question.locator('legend').innerText()).replace(/^\d+\.\s*/, '');
          if (known.has(prompt)) await question.getByLabel(known.get(prompt), { exact: true }).check();
        }
        const [response] = await Promise.all([
          page.waitForResponse((r) => /\/skills\/assessments\/[^/]+\/submit$/.test(r.url())),
          page.getByRole('button', { name: 'Submit answers' }).click(),
        ]);
        const scored = (await response.json()).data;
        for (const item of scored.review) known.set(item.prompt, item.options[item.correctOption]);
        await page.getByTestId('assessment-result').waitFor({ timeout: 15_000 });
        return scored;
      };

      const blank = await attemptOnce();
      expect(blank.correct === 0 && !blank.passed, `an unanswered attempt scored ${blank.correct}`);
      expect(/Not passed/.test(await page.getByTestId('assessment-result').innerText()), 'the failed result is not shown');
      expect((await page.getByTestId('assessment-review').count()) === 5, 'the review does not list every question');
      expect((await javascript()).evidenceScore === before.evidenceScore, 'a failed attempt changed the evidence score');

      const partial = await attemptOnce();
      expect(!partial.passed, `answering only the ${partial.correct} questions seen before should not pass`);

      const full = await attemptOnce();
      expect(full.passed && full.correct === 5, `the third attempt scored ${full.correct} of 5`);
      await page.locator('[data-testid="assessable-skill"][data-skill="JavaScript"][data-verified="true"]').waitFor({ timeout: 15_000 });
      expect(/Verified by skill check/.test(await tile.innerText()), 'the skill is not shown as verified');
      expect(/No attempts left today/.test(await tile.innerText()), 'the daily attempt limit is not shown');
      expect(await tile.getByRole('button').isDisabled(), 'a fourth attempt can still be started');
      expect((await page.getByTestId('assessment-history').locator('li').count()) === 3, 'the three attempts are not in the history');

      const after = await javascript();
      expect(after.evidenceScore === Math.min(100, before.evidenceScore + 15), `evidence score went from ${before.evidenceScore} to ${after.evidenceScore}`);
      expect(after.verification === 'assessed', `verification is ${after.verification}`);
      await openLabTab('Skill freshness');
      const shown = await page.locator('[data-testid="freshness-skill"][data-skill="JavaScript"]').innerText();
      expect(/Verified by a SkillBridge skill check/.test(shown) && /Not a professional certification/.test(shown), 'the freshness list does not say how the skill was verified');
      return `0, ${partial.correct} and 5 of 5; evidence ${before.evidenceScore} to ${after.evidenceScore}; fourth attempt blocked`;
    });

    await t.step('readiness says what it rests on, and a passed skill check shows up as assessed evidence', async () => {
      const stored = (await api('GET', '/readiness')).data.readiness[0];
      const basis = stored.evidenceBasis;
      expect(basis && basis.assessed > 0 && basis.assessed + basis.selfReported + basis.stated + basis.inferred === 100, `stored basis ${JSON.stringify(basis)}`);
      await gotoAndSettle(page, `${webUrl}/readiness`, 3500);
      const panel = page.getByTestId('evidence-basis');
      await panel.waitFor({ timeout: 15_000 });
      for (const kind of ['assessed', 'selfReported', 'stated', 'inferred']) {
        const shown = await page.locator(`[data-testid="evidence-share"][data-kind="${kind}"]`).getAttribute('data-share');
        expect(shown === String(basis[kind]), `${kind} shown as ${shown}%, stored ${basis[kind]}%`);
      }
      expect(/has not been calibrated against interview or hiring outcomes/.test(await page.getByTestId('evidence-basis-note').innerText()), 'the page does not say readiness is uncalibrated');
      return `${stored.careerId.title}: ${basis.stated}% stated, ${basis.assessed}% assessed, ${basis.selfReported}% self-reported, ${basis.inferred}% inferred`;
    });

    // ---- Roadmap ------------------------------------------------------------------------------------
    let completedBeforeReplace = 0;
    await t.step('roadmap is generated and completing an item moves progress', async () => {
      await gotoAndSettle(page, `${webUrl}/roadmap`, 3500);
      const before = (await snapshot()).roadmap;
      expect(before.isInitialized && before.progress === 0, `roadmap state ${JSON.stringify({ i: before.isInitialized, p: before.progress })}`);
      await page.getByRole('button', { name: 'Mark Complete' }).first().click();
      await page.waitForTimeout(2500);
      const after = (await snapshot()).roadmap;
      expect(after.progress > 0 && after.completedMilestones === 1, `progress ${before.progress}% → ${after.progress}%`);
      expect(/1 of \d+ Tasks Done/i.test(await bodyText(page)), 'the page does not show one task done');
      completedBeforeReplace = after.completedMilestones;
      return `0% → ${after.progress}%`;
    });
    await t.step('study plan: weeks appear only after weekly hours are set, and match the dashboard', async () => {
      const careerId = (await api('GET', '/careers/matches')).data.matches[0].careerId._id;
      const stored = async () => (await api('GET', `/roadmap/${careerId}/schedule`)).data.schedule;
      const plan = page.getByTestId('study-plan');
      await plan.waitFor({ timeout: 15_000 });
      const summary = page.getByTestId('study-plan-summary');
      expect(/Set your weekly hours to see weeks/.test(await summary.innerText()), 'weeks are shown before any weekly hours were entered');
      expect((await stored()).weeksRemaining === null, 'the stored plan has weeks without weekly hours');
      expect((await page.locator('[data-testid="study-plan-item"][data-status="completed"]').count()) === 1, 'the completed item is not marked in the plan');
      expect(/has not measured/.test(await page.getByTestId('study-plan-assumptions').textContent()), 'the assumptions behind the schedule are not stated');

      await page.fill('#hours-per-week', '0');
      await page.getByRole('button', { name: 'Save hours' }).click();
      expect(/whole number of hours from 1 to 60/.test(await plan.innerText()), 'an invalid number of hours was not rejected with a message');
      expect((await stored()).hoursPerWeek === null, 'an invalid value was stored');

      await page.fill('#hours-per-week', '6');
      await page.getByRole('button', { name: 'Save hours' }).click();
      await page.locator('[data-testid="study-plan-summary"]:not([data-weeks-low=""])').waitFor({ timeout: 15_000 });
      const schedule = await stored();
      expect(schedule.hoursPerWeek === 6 && schedule.weeksRemaining.low === Math.ceil(schedule.remainingHours.low / 6), `stored plan ${JSON.stringify(schedule.weeksRemaining)}`);
      const weeks = `${schedule.weeksRemaining.low} to ${schedule.weeksRemaining.high} weeks at 6 hours a week`;
      expect((await summary.innerText()).includes(weeks), `the page does not show "${weeks}"`);

      await gotoAndSettle(page, `${webUrl}/home`, 3500);
      const home = await page.getByTestId('home-study-plan').innerText();
      expect(home.includes(weeks) && home.includes(schedule.nextItem.title), `the dashboard shows "${home}"`);
      await gotoAndSettle(page, `${webUrl}/roadmap`, 3500);
      expect((await page.inputValue('#hours-per-week')) === '6', 'the weekly hours were not kept after a reload');
      return `${schedule.remainingItems} items, ${weeks}; same on the dashboard`;
    });

    await t.step('practice projects: suggested for real gaps, taken on and completed without changing any score', async () => {
      const careerId = (await api('GET', '/careers/matches')).data.matches[0].careerId._id;
      const scores = async () => JSON.stringify([(await api('GET', '/careers/matches')).data.matches.map((m) => [m.careerId.title, m.matchScore]), (await api('GET', '/skills/me')).data.totalSkills]);
      const before = await scores();
      const expected = (await api('GET', `/projects/suggestions?careerId=${careerId}`)).data.suggestions;
      const panel = page.getByTestId('practice-projects');
      await panel.waitFor({ timeout: 15_000 });
      const cards = page.getByTestId('project-suggestion');
      expect((await cards.count()) === expected.length && expected.length > 0, `page shows ${await cards.count()} suggestions, the API has ${expected.length}`);
      const first = cards.first();
      const top = expected[0];
      expect((await first.getAttribute('data-brief')) === top.briefId, 'the most useful project is not listed first');
      const why = await first.getByTestId('project-why').innerText();
      expect(top.practises.every((p) => why.includes(p.skill)), `the reason does not name the gap skills: ${why}`);
      const effect = await first.getByTestId('project-effect').innerText();
      expect(effect.includes(`${top.hypotheticalScore.after}% instead of ${top.hypotheticalScore.before}% (hypothetical)`), `effect shown as "${effect}"`);
      expect(/at 6 hours a week/.test(effect), 'the effort is not expressed in weeks at the saved weekly hours');

      await first.getByRole('button', { name: 'Tasks and deliverables' }).click();
      expect((await first.innerText()).includes(top.tasks[0]), 'the tasks are not shown');
      await first.getByRole('button', { name: `Take on ${top.title}` }).click();
      const mine = page.getByTestId('my-project');
      await mine.waitFor({ timeout: 15_000 });
      expect((await mine.getAttribute('data-status')) === 'planned', 'a project just taken on is not shown as planned');
      // The box is ticked once the server has stored it
      await mine.getByRole('checkbox').first().click();
      await page.locator('[data-testid="my-project"][data-status="in_progress"]').waitFor({ timeout: 15_000 });
      await mine.getByRole('button', { name: 'Mark complete' }).click();
      await page.locator('[data-testid="my-project"][data-status="completed"]').waitFor({ timeout: 15_000 });
      expect(/Marked complete by you/.test(await mine.innerText()) && /not skill evidence/.test(await mine.innerText()), 'a completed project is not labelled as the user\'s own record');
      expect((await scores()) === before, 'taking on and completing a project changed a score');
      await page.reload();
      await page.locator('[data-testid="my-project"][data-status="completed"]').waitFor({ timeout: 20_000 });
      return `${expected.length} suggestions; "${top.title}" taken on and completed; scores unchanged`;
    });

    await t.step('portfolio: a finished project with a link counts, stays self-reported, and is public only when shared', async () => {
      const evidence = async () => JSON.stringify((await api('GET', '/skills/freshness')).data.skills.map((x) => [x.name, x.evidenceScore]).sort());
      const before = await evidence();
      await gotoAndSettle(page, `${webUrl}/portfolio`, 2500);
      expect(/Nothing recorded yet/.test(await bodyText(page)), 'the empty portfolio is not explained');
      await page.getByRole('button', { name: 'Add work' }).click();
      const form = page.getByTestId('portfolio-form');
      // The practice project completed earlier fills in the title and skills
      await form.locator('#pf-project').selectOption({ index: 1 });
      const title = await form.locator('#pf-title').inputValue();
      expect(title.length > 3 && (await form.locator('#pf-skills').inputValue()).length > 0, 'the completed practice project did not prefill the entry');

      await form.locator('#pf-url').fill('http://example.com/work');
      await form.getByRole('button', { name: 'Save entry' }).click();
      expect(/must start with https/.test(await form.innerText()), 'a link that is not https was accepted');
      await form.locator('#pf-url').fill('https://example.com/priya/bookings-api');
      await form.getByRole('button', { name: 'Save entry' }).click();
      const entry = page.getByTestId('portfolio-entry');
      await entry.waitFor({ timeout: 15_000 });
      expect((await entry.getAttribute('data-counts')) === 'true' && (await entry.getAttribute('data-visibility')) === 'private', 'a new entry with a link should count and be private');
      expect(/Your own record, not checked/.test(await entry.innerText()), 'the entry is not labelled as unchecked');
      const stored = (await api('GET', '/portfolio')).data.entries[0];
      expect(stored.verification === 'self_reported' && stored.skills.some((x) => x.points > 0), `stored entry ${JSON.stringify(stored.skills)}`);
      expect((await evidence()) !== before, 'the entry with a link did not change any evidence score');

      // Sharing: nothing is public until the link is on and the entry is marked as shared
      const share = page.getByTestId('portfolio-share');
      await share.getByRole('button', { name: 'Switch sharing on' }).click();
      const link = page.getByTestId('portfolio-share-link');
      await link.waitFor({ timeout: 15_000 });
      const url = await link.innerText();
      const visitor = await browser.newContext();
      const publicPage = await visitor.newPage();
      await gotoAndSettle(publicPage, url, 2500);
      expect(/Nothing has been shared yet/.test(await bodyText(publicPage)), 'a private entry is visible through the public link');

      await entry.getByRole('button', { name: `Edit ${title}` }).click();
      await form.getByRole('checkbox').check();
      await form.getByRole('button', { name: 'Save entry' }).click();
      await page.locator('[data-testid="portfolio-entry"][data-visibility="shared"]').waitFor({ timeout: 15_000 });
      await gotoAndSettle(publicPage, url, 2500);
      const shown = await bodyText(publicPage);
      expect(shown.includes(title) && /not a professional certification/.test(shown), 'the shared entry or the note on what it means is missing from the public page');
      expect(!shown.includes(emailA) && !/Smoke Tester/.test(shown), 'the public page shows who the owner is although they did not allow it');

      await share.getByRole('button', { name: 'Switch sharing off' }).click();
      await page.locator('[data-testid="portfolio-share"][data-enabled="false"]').waitFor({ timeout: 15_000 });
      await gotoAndSettle(publicPage, url, 2500);
      expect(await publicPage.getByTestId('public-portfolio-unavailable').isVisible(), 'the link still works after sharing was switched off');
      // That 404 belongs to the signed-out visitor, not to the journey being watched
      await visitor.close();

      // Removing the entry removes exactly the evidence it added
      await entry.getByRole('button', { name: `Remove ${title}` }).click();
      await page.getByText('Nothing recorded yet').waitFor({ timeout: 15_000 });
      expect((await evidence()) === before, 'removing the entry did not restore the evidence scores');
      return `"${title}" counted with a link, shown publicly only while shared, evidence restored after removal`;
    });

    await t.step('learning activity: a real streak, and notifications only after opting in', async () => {
      const stored = async () => (await api('GET', '/activity')).data;
      const start = await stored();
      expect(start.streak.current === 1 && start.streak.activeToday, `streak ${JSON.stringify(start.streak)} after a day with recorded activity`);
      expect(start.notifications.length === 0 && !start.preferences.reminders && !start.preferences.milestoneNotifications, 'notifications exist although nothing was switched on');

      await gotoAndSettle(page, `${webUrl}/activity`, 2500);
      expect((await page.getByTestId('streak').getAttribute('data-current')) === '1', 'the page does not show the one-day streak');
      expect((await page.getByTestId('recent-activity').locator('li').count()) === start.recent.length, 'recent activity differs from what is stored');
      expect(/Notifications are switched off/.test(await page.getByTestId('notifications').innerText()), 'the page does not say that notifications are off');
      expect(/UTC calendar days/.test(await page.getByTestId('activity-note').innerText()), 'how a day is counted is not explained');
      expect((await page.getByTestId('notification-bell').getAttribute('data-unread')) === '0', 'the bell shows unread notifications that do not exist');

      // The switch shows the stored value, so it moves once the server has saved it
      await page.getByLabel(/^Milestones:/).click();
      await page.waitForTimeout(1200);
      expect((await stored()).preferences.milestoneNotifications === true, 'the milestone setting was not stored');

      // A milestone reached now is announced once; the bell follows
      const careerId = (await api('GET', '/careers/matches')).data.matches[0].careerId._id;
      const mine = (await api('GET', '/projects')).data.projects[0];
      await api('PATCH', `/projects/${mine.id}`, { status: 'in_progress' });
      await api('PATCH', `/projects/${mine.id}`, { status: 'completed' });
      await page.reload();
      const notice = page.getByTestId('notification');
      await notice.first().waitFor({ timeout: 15_000 });
      expect((await notice.count()) === 1 && (await notice.first().getAttribute('data-read')) === 'false', 'expected exactly one unread notification');
      expect(/Practice project marked complete/.test(await notice.first().innerText()), 'the milestone is not described');
      await page.locator('[data-testid="notification-bell"][data-unread="1"]').waitFor({ timeout: 15_000 });

      await notice.first().getByRole('button', { name: /^Mark read:/ }).click();
      await page.locator('[data-testid="notification-bell"][data-unread="0"]').waitFor({ timeout: 15_000 });
      await notice.first().getByRole('button', { name: /^Dismiss:/ }).click();
      await page.getByText('Nothing to tell you right now.').waitFor({ timeout: 15_000 });
      // Switched off again so the rest of the journey is unaffected
      await page.getByLabel(/^Milestones:/).click();
      await page.waitForTimeout(1000);
      void careerId;
      return `${start.recent.length} recorded activities, 1-day streak; one milestone after opting in, read and dismissed`;
    });

    await t.step('free resources: listed for real gaps, labelled third-party, and a mark changes no score', async () => {
      const careerId = (await api('GET', '/careers/matches')).data.matches[0].careerId._id;
      const stored = (await api('GET', `/learning-resources?careerId=${careerId}`)).data;
      const scores = async () => JSON.stringify((await api('GET', '/careers/matches')).data.matches.map((m) => [m.careerId.title, m.matchScore]));
      const before = await scores();
      await gotoAndSettle(page, `${webUrl}/roadmap`, 3500);
      const panel = page.getByTestId('free-resources');
      await panel.waitFor({ timeout: 15_000 });
      const groups = page.getByTestId('resource-group');
      expect((await groups.count()) === stored.groups.length && stored.groups.length > 0, `page shows ${await groups.count()} skills with resources, the API has ${stored.groups.length}`);
      const first = panel.getByTestId('resource').first();
      const link = first.getByRole('link');
      expect((await link.getAttribute('href')) === stored.groups[0].resources[0].url, 'the link is not the catalogue link');
      expect((await link.getAttribute('target')) === '_blank' && /noopener/.test(await link.getAttribute('rel')), 'an outside link does not open safely in a new tab');
      expect(/Third-party site/.test(await first.innerText()) && /not re-checked/.test(await first.innerText()), 'the resource is not labelled as third-party and unchecked');
      const note = await page.getByTestId('free-resources-note').innerText();
      expect(/cannot promise they stay free/.test(note) && /not a course completion/.test(note), 'the limits of the catalogue are not stated');

      await first.getByRole('button', { name: /^Mark as worked through:/ }).click();
      await panel.locator('[data-testid="resource"][data-status="done"]').first().waitFor({ timeout: 15_000 });
      expect((await api('GET', '/learning-resources/mine')).data.resources.length === 1, 'the mark was not stored');
      expect((await scores()) === before, 'marking a resource changed a score');
      await first.getByRole('button', { name: /^Unmark as worked through:/ }).click();
      await panel.locator('[data-testid="resource"][data-status="none"]').first().waitFor({ timeout: 15_000 });
      return `${stored.coverage.withResources} of ${stored.coverage.gapSkills} gaps have resources; marks stored without changing scores`;
    });

    await t.step('dashboard: ranked next steps with their reasons, matching the stored ranking, and the real streak', async () => {
      const stored = (await api('GET', '/recommendations/next-actions')).data;
      const streak = (await api('GET', '/activity')).data.streak.current;
      await gotoAndSettle(page, `${webUrl}/home`, 3500);
      const panel = page.getByTestId('next-steps');
      await panel.waitFor({ timeout: 15_000 });
      const steps = page.getByTestId('next-step');
      expect((await steps.count()) === stored.actions.length && stored.actions.length > 0, `page shows ${await steps.count()} steps, the API has ${stored.actions.length}`);
      const first = steps.first();
      const top = stored.actions[0];
      expect((await first.getAttribute('data-action')) === top.id, 'the top-ranked action is not shown first');
      expect((await first.innerText()).includes(`from ${top.factors.scoreBefore}% to ${top.factors.scoreAfter}% (hypothetical)`), 'the hypothetical score change is not shown');
      await first.getByRole('button', { name: /^Show why:/ }).click();
      const why = await first.getByTestId('next-step-why').innerText();
      expect(why.includes(`Ranking score ${top.score}`) && /No market data is available/.test(why) && /required-first alone/.test(why), `the reasoning is incomplete: ${why}`);
      expect(/Market demand is not used/.test(await page.getByTestId('next-steps-note').innerText()), 'the note does not say market demand is unused');
      expect((await page.getByTestId('home-streak').getAttribute('data-current')) === String(streak), 'the dashboard streak differs from the stored one');
      return `${stored.actions.length} steps for ${stored.career.title}; first: ${top.title}`;
    });

    // ---- Resume: replace, reprocess, recover ----------------------------------------------------------
    await t.step('replacing the resume rebuilds skills and reports what changed', async () => {
      await gotoAndSettle(page, `${webUrl}/resume`, 2000);
      await page.locator('input[type="file"]').first().setInputFiles(pdf('priya-fullstack.pdf', RESUME_SECOND));
      const resume = await waitForResume('priya-fullstack.pdf');
      expect(resume.parsingStatus === 'completed' && resume.originalFileName === 'priya-fullstack.pdf', `status ${resume.parsingStatus}, file ${resume.originalFileName}`);
      await gotoAndSettle(page, `${webUrl}/resume`, 3000);
      const changes = await page.getByTestId('resume-skill-changes').innerText();
      expect(/Docker/.test(changes) && /Python/.test(changes), 'added skills are not listed');
      expect(/CSS/.test(changes) && /HTML/.test(changes), 'removed skills are not listed');
      const snap = await snapshot();
      expect(snap.roadmap.completedMilestones >= completedBeforeReplace, 'completed roadmap work was lost when the resume was replaced');
      return 'added Docker, Python; no longer found CSS, HTML; roadmap progress kept';
    });
    await t.step('reprocess runs extraction again on the stored file', async () => {
      const before = await extractCalls();
      await page.getByRole('button', { name: 'Reprocess', exact: true }).click();
      for (let i = 0; i < 40 && (await extractCalls()) === before; i++) await page.waitForTimeout(250);
      expect((await extractCalls()) === before + 1, 'the stored file was not sent for extraction again');
      const resume = await waitForResume();
      expect(resume.parsingStatus === 'completed', `status ${resume.parsingStatus}`);
    });
    await t.step('a failed extraction is shown and can be recovered', async () => {
      await aiControl({ extract: { mode: 'fail' } });
      const callsBefore = await extractCalls();
      await page.getByRole('button', { name: 'Reprocess', exact: true }).click();
      for (let i = 0; i < 40 && (await extractCalls()) === callsBefore; i++) await page.waitForTimeout(250);
      await page.waitForTimeout(600);
      expect((await waitForResume()).parsingStatus === 'failed', 'the failure was not recorded');
      await gotoAndSettle(page, `${webUrl}/resume`, 2500);
      expect(/could not be processed/i.test(await bodyText(page)), 'the failure is not shown');
      expect((await api('GET', '/skills/me')).data.totalSkills === 6, 'a failed run changed the skill profile');
      await aiControl({ extract: { mode: 'ok' } });
      const callsAfterFailure = await extractCalls();
      await page.getByRole('button', { name: 'Reprocess resume' }).click();
      for (let i = 0; i < 40 && (await extractCalls()) === callsAfterFailure; i++) await page.waitForTimeout(250);
      await page.waitForTimeout(600);
      expect((await waitForResume()).parsingStatus === 'completed', 'reprocessing did not recover');
      await gotoAndSettle(page, `${webUrl}/resume`, 2500);
      expect(!/could not be processed/i.test(await bodyText(page)), 'the error is still shown after recovery');
      return 'failed → shown → reprocessed → completed';
    });

    // ---- Jobs and application tracking -----------------------------------------------------------------
    let savedJob = null;
    await t.step('job search: keyword, filters and honest handling of salary', async () => {
      await gotoAndSettle(page, `${webUrl}/job-agent`, 3500);
      await page.fill('input[placeholder^="Search by role"]', 'Developer Engineer Analyst');
      await page.getByRole('button', { name: 'Search Opportunities' }).click();
      await page.waitForTimeout(3000);
      const all = await page.getByTestId('job-source-notice').innerText();
      const total = Number((all.match(/of (\d+) matching/) || [])[1]);
      expect(total >= 6, `expected several demo listings, notice says: ${all.slice(-90)}`);
      expect(/duplicate posting hidden/i.test(all), 'the re-posted listing was not reported as hidden');

      await page.selectOption('#job-date-posted', 'week');
      await page.waitForTimeout(2500);
      const week = Number(((await page.getByTestId('job-source-notice').innerText()).match(/of (\d+) matching/) || [])[1]);
      expect(week < total, `date filter did not narrow the list (${total} → ${week})`);
      await page.selectOption('#job-date-posted', 'all');

      await page.fill('#job-salary-min', '1200000');
      await page.getByRole('button', { name: 'Apply', exact: true }).click();
      await page.waitForTimeout(2500);
      const salary = await page.getByTestId('job-source-notice').innerText();
      expect(/hidden by the salary filter because no yearly salary is stated/i.test(salary), 'postings without a salary were not accounted for');
      await page.getByRole('button', { name: 'Reset all filters' }).click();
      await page.waitForTimeout(2500);
      return `${total} listings; ${week} in the last 7 days; salary filter explains what it hid`;
    });
    await t.step('a posting with no stated requirements is shown as not scored', async () => {
      await page.fill('input[placeholder^="Search by role"]', 'Support');
      await page.getByRole('button', { name: 'Search Opportunities' }).click();
      await page.waitForTimeout(3000);
      const text = await bodyText(page);
      expect(/Technical Support Associate/.test(text) && /Not scored/i.test(text), 'the unscoreable posting is not marked "Not scored"');
    });
    await t.step('save a job, then track status, notes and a reminder', async () => {
      await page.fill('input[placeholder^="Search by role"]', 'Stack');
      await page.getByRole('button', { name: 'Search Opportunities' }).click();
      await page.waitForTimeout(3000);
      await page.getByRole('button', { name: 'Save Role' }).click();
      await page.waitForTimeout(2000);
      const tracker = page.getByTestId('application-tracker');
      expect(await tracker.isVisible(), 'the tracking panel did not appear after saving');
      expect(/Demo listing/.test(await tracker.innerText()), 'the saved demo listing lost its label');

      await page.locator('select[aria-label="Application status"]').selectOption('applied');
      await page.waitForTimeout(2000);
      await page.fill('#tracker-notes', 'Applied through the careers page.');
      await page.getByRole('button', { name: 'Save notes' }).click();
      await page.waitForTimeout(1800);
      const inAWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      await page.fill('#tracker-reminder-date', inAWeek);
      await page.fill('#tracker-reminder-note', 'Follow up');
      await page.getByRole('button', { name: 'Set reminder' }).click();
      await page.waitForTimeout(2000);

      const saved = (await api('GET', '/opportunities/saved')).data.savedOpportunities;
      expect(saved.length === 1, `expected one tracked job, found ${saved.length}`);
      savedJob = saved[0];
      expect(savedJob.status === 'applied' && savedJob.notes === 'Applied through the careers page.', `stored status ${savedJob.status}, notes "${savedJob.notes}"`);
      expect(savedJob.reminderAt && savedJob.reminderNote === 'Follow up', 'the reminder was not stored');
      expect(savedJob.statusHistory.map((e) => e.status).join('>') === 'saved>applied', `history ${savedJob.statusHistory.map((e) => e.status)}`);
      expect(/Set for/.test(await page.getByTestId('reminder-status').innerText()), 'the reminder is not shown');
      const history = await page.getByTestId('status-history').innerText();
      expect(/Saved/.test(history) && /Applied/.test(history), 'status history is not shown');
      return 'status applied, notes, reminder and history stored and shown';
    });

    // ---- Interviews ------------------------------------------------------------------------------------------
    const answerInterview = async () => {
      const answer = 'In my internship the checkout page was slow. I owned the React front end. I profiled renders, memoised the table and split the bundle. As a result load time fell from 6s to 2s and errors dropped by 40%.';
      let answered = 0;
      for (let i = 0; i < 6; i++) {
        const box = page.locator('textarea').first();
        if (!(await box.isVisible().catch(() => false))) break;
        const submit = page.getByRole('button', { name: /Submit for AI Evaluation/ });
        await box.fill(`${answer} (answer ${i + 1})`);
        if (!(await submit.isEnabled({ timeout: 4000 }).catch(() => false))) break;
        await submit.click();
        answered++;
        await page.waitForFunction((n) => !document.body.innerText.includes(`QUESTION ${n} OF`), i + 1, { timeout: 25_000 }).catch(() => {});
        await page.waitForTimeout(800);
      }
      await page.getByRole('button', { name: /Finalize Round/ }).click();
      await page.waitForTimeout(3500);
      return answered;
    };
    let firstSessionId = null;
    await t.step('mock interview: personalised questions, honest scoring labels, stored report', async () => {
      await gotoAndSettle(page, `${webUrl}/interview-agent`, 2500);
      await page.getByRole('button', { name: /ENTER INTERVIEW STUDIO/ }).click();
      await page.waitForTimeout(4000);
      const grounding = await page.getByTestId('question-grounding').first().innerText();
      expect(/from the question bank/.test(grounding), `question source is not labelled: "${grounding}"`);
      const answered = await answerInterview();
      expect(answered === 5, `answered ${answered} of 5`);

      expect((await page.getByTestId('questions-source').first().getAttribute('data-source')) === 'question_bank', 'question source badge missing');
      expect((await page.getByTestId('scoring-source').first().getAttribute('data-source')) === 'heuristic', 'scoring source badge missing');
      expect(/cannot verify that an answer is technically correct/i.test(await page.getByTestId('heuristic-notice').innerText()), 'the rule-based limits are not stated');
      expect(/Technical accuracy\s*Not assessed/i.test(await page.getByTestId('evaluation-dimensions').first().innerText()), 'technical accuracy should read "Not assessed"');

      const sessions = (await api('GET', '/interviews/history')).data.history;
      const done = sessions.filter((s) => s.status === 'completed');
      expect(done.length === 1, `${done.length} completed sessions`);
      firstSessionId = done[0]._id;
      expect(done[0].questions.every((q) => q.candidateResponse && q.evaluation), 'answers or evaluations were not stored');
      expect(done[0].overallScore <= 80, `rule-based score ${done[0].overallScore} exceeds its cap`);
      expect((await bodyText(page)).includes(`${done[0].overallScore}%`), 'the stored score is not the one shown');
      return `5 answers, score ${done[0].overallScore}, labelled rule-based`;
    });
    await t.step('interview history lists the session and reopens its report', async () => {
      await gotoAndSettle(page, `${webUrl}/interview-agent`, 2500);
      await page.getByRole('button', { name: /Inspect Past Sessions/ }).click();
      await page.waitForTimeout(1500);
      const items = page.getByTestId('interview-history-item');
      expect((await items.count()) >= 1, 'no sessions in the history');
      expect(/5 of 5 answered/.test(await items.first().innerText()), 'answered count is not shown');
      await items.first().click();
      await page.waitForTimeout(2000);
      expect(await page.getByTestId('evaluation-dimensions').first().isVisible(), 'the stored report did not open');
      expect(/\(answer 1\)/.test(await bodyText(page)), 'the stored answer is not shown');
    });
    await t.step('second interview does not repeat the first; job-specific practice keeps the posting', async () => {
      const first = (await api('GET', `/interviews/${firstSessionId}`)).data.questions.map((q) => q.questionId);
      await gotoAndSettle(page, `${webUrl}/job-agent`, 3500);
      await page.getByRole('button', { name: 'Tracked Pipeline' }).click();
      await page.waitForTimeout(1500);
      await page.getByRole('button', { name: 'Practice Interview' }).first().click();
      await page.waitForURL('**/interview-agent', { timeout: 15_000 });
      await page.waitForTimeout(2500);
      await page.getByRole('button', { name: /ENTER INTERVIEW STUDIO/ }).click();
      await page.waitForTimeout(4000);
      const sessions = (await api('GET', '/interviews/history')).data.history;
      const latest = sessions[0];
      expect(latest._id !== firstSessionId, 'no new session was started');
      expect(/Sample Company A/.test(latest.opportunityContext?.company || ''), `job context not stored: ${JSON.stringify(latest.opportunityContext)}`);
      expect(latest.questions.some((q) => /job posting/i.test(q.groundedIn || '')), 'no question is tied to the posting');
      const repeated = latest.questions.filter((q) => first.includes(q.questionId)).length;
      expect(repeated === 0, `${repeated} questions were repeated from the previous session`);
      return `prepared for ${latest.opportunityContext.title} at ${latest.opportunityContext.company}`;
    });

    // ---- Chat ----------------------------------------------------------------------------------------------------
    await t.step('chat: unavailable AI gives a labelled fallback that can be retried', async () => {
      await aiControl({ chat: { mode: 'unavailable' } });
      await gotoAndSettle(page, `${webUrl}/ai`, 4000);
      const input = page.locator('textarea[placeholder^="Ask your AI Career Architect"]');
      await input.fill('What should I learn next?');
      await input.press('Enter');
      const fallback = page.locator('[data-testid="chat-message"][data-source="fallback"]');
      await fallback.first().waitFor({ timeout: 30_000 });
      const text = await fallback.first().innerText();
      expect(/Not an AI reply/i.test(text) && /not an AI-generated answer/i.test(text), 'the fallback is not labelled');
      expect(/Skills on your profile: 6/.test(text), 'the fallback does not use the stored data');
      expect(!/Mock AI/i.test(text), 'canned mock text reached the user');

      await aiControl({ chat: { mode: 'ok', reply: 'Practise Kubernetes next; your React evidence is strong.' } });
      await fallback.first().getByRole('button', { name: 'Retry' }).click();
      const reply = page.locator('[data-testid="chat-message"][data-source="ai"]');
      await reply.first().waitFor({ timeout: 30_000 });
      expect(/Practise Kubernetes next/.test(await reply.first().innerText()), 'the AI reply is not shown');
      expect(/fake_ai_service/.test(await page.getByTestId('chat-reply-source').first().innerText()), 'the reply does not name its provider');
      expect((await fallback.count()) === 0, 'the fallback is still shown after a successful retry');

      const conversations = (await api('GET', '/ai')).data;
      const stored = (await api('GET', `/ai/${conversations[0]._id}`)).data.messages;
      expect(stored.length === 2 && stored[0].role === 'user' && stored[1].source === 'ai', `stored messages: ${stored.map((m) => `${m.role}/${m.source || '-'}`)}`);
      return 'fallback labelled → retry → AI reply with provider; one question stored';
    });

    // ---- Command Center and persistence ---------------------------------------------------------------------------
    await t.step('Command Center shows the same values as the stored data', async () => {
      await gotoAndSettle(page, `${webUrl}/home`, 4000);
      const snap = await snapshot();
      const text = await bodyText(page);
      expect(text.includes(`${snap.readinessScore}%`), `readiness ${snap.readinessScore}% is not on Home`);
      expect(new RegExp(`${snap.totalSkills} Verified Skills`, 'i').test(text), `skill count ${snap.totalSkills} is not on Home`);
      expect(/1 Opportunities/i.test(text), 'the tracked job is not counted on Home');
      expect(text.includes(`${snap.roadmap.progress}%`), `roadmap progress ${snap.roadmap.progress}% is not on Home`);
      expect(snap.opportunities.applied === 1 && snap.opportunities.total === 1, `snapshot pipeline ${JSON.stringify(snap.opportunities)}`);
      return `readiness ${snap.readinessScore}%, ${snap.totalSkills} skills, 1 tracked job, roadmap ${snap.roadmap.progress}%`;
    });
    await t.step('a full reload keeps the session and the saved work', async () => {
      await gotoAndSettle(page, `${webUrl}/job-agent`, 3000);
      await page.reload();
      await page.waitForTimeout(3500);
      expect(new URL(page.url()).pathname === '/job-agent', `session lost: ${page.url()}`);
      await page.getByRole('button', { name: 'Tracked Pipeline' }).click();
      await page.waitForTimeout(1500);
      expect((await page.locator('#tracker-notes').inputValue()) === 'Applied through the careers page.', 'notes did not survive a reload');
    });

    // ---- Layout and accessibility basics ------------------------------------------------------------------------------
    await t.step('main pages render, fit a phone screen, and name their controls', async () => {
      const problems = [];
      const routes = ['/home', '/ai', '/resume', '/skills', '/careers', '/career-lab', '/portfolio', '/activity', '/readiness', '/roadmap', '/recommendations', '/job-agent', '/interview-agent', '/analytics', '/profile', '/settings'];
      for (const route of routes) {
        await gotoAndSettle(page, webUrl + route, 2200);
        const text = await bodyText(page);
        if (/something went wrong|Cannot read prop/i.test(text) || text.length < 200) problems.push(`${route}: did not render`);
        const audit = await page.evaluate(() => {
          const visible = (el) => el.offsetParent !== null;
          const name = (el) => (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
          const labelled = (el) =>
            el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('title') ||
            (el.id && document.querySelector(`label[for="${el.id}"]`)) || el.closest('label');
          return {
            unnamed: [...document.querySelectorAll('button, a[href]')].filter(visible).filter((el) => !name(el)).length,
            unlabelled: [...document.querySelectorAll('input:not([type=hidden]):not([type=file]), select, textarea')].filter(visible).filter((el) => !labelled(el)).length,
            noAlt: [...document.querySelectorAll('img')].filter((el) => !el.hasAttribute('alt')).length,
          };
        });
        if (audit.unnamed || audit.unlabelled || audit.noAlt) problems.push(`${route}: ${JSON.stringify(audit)}`);
      }
      await page.setViewportSize({ width: 390, height: 844 });
      for (const route of ['/home', '/resume', '/careers', '/career-lab', '/portfolio', '/activity', '/job-agent', '/roadmap', '/interview-agent', '/readiness']) {
        await gotoAndSettle(page, webUrl + route, 2200);
        const width = await page.evaluate(() => document.documentElement.scrollWidth);
        if (width > 395) problems.push(`${route}: ${width}px wide at 390px`);
      }
      await page.setViewportSize({ width: 1366, height: 900 });
      expect(problems.length === 0, problems.join(' | '));
      return `${routes.length} pages render with named controls; 7 fit 390px`;
    });
    await t.step('keyboard focus moves through the controls', async () => {
      await gotoAndSettle(page, `${webUrl}/job-agent`, 2500);
      const tags = [];
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press('Tab');
        tags.push(await page.evaluate(() => document.activeElement?.tagName));
      }
      expect(tags.filter((tag) => ['BUTTON', 'A', 'INPUT', 'SELECT'].includes(tag)).length >= 4, `focus order: ${tags.join(' > ')}`);
    });

    const unexpected = { failed: [...new Set(log.failed)], console: [...new Set(log.console)] };

    // ---- When the server fails ----------------------------------------------------------------------------------------
    await t.step('a failed data load is announced on every page and can be retried', async () => {
      const failReads = (route) =>
        route.request().method() === 'GET'
          ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Simulated failure' } }) })
          : route.continue();
      await page.route(`${apiUrl}/**`, failReads);
      const silent = [];
      const routes = ['/home', '/ai', '/resume', '/skills', '/careers', '/career-lab', '/portfolio', '/activity', '/readiness', '/roadmap', '/recommendations', '/job-agent', '/interview-agent', '/analytics', '/profile'];
      for (const route of routes) {
        await page.goto(webUrl + route);
        const shown = await page.getByTestId('load-error-banner').waitFor({ timeout: 15_000 }).then(() => true, () => false);
        if (!shown) silent.push(route);
      }
      expect(silent.length === 0, `no failure notice on ${silent.join(', ')}`);

      await page.unroute(`${apiUrl}/**`, failReads);
      await page.getByTestId('load-error-banner').getByRole('button', { name: 'Try again' }).click();
      await page.getByTestId('load-error-banner').waitFor({ state: 'detached', timeout: 20_000 });
      return `${routes.length} pages show the notice; "Try again" reloads and clears it`;
    });

    // ---- Cross-user isolation ------------------------------------------------------------------------------------------
    await t.step('another account cannot see or change any of this', async () => {
      const conversationId = (await api('GET', '/ai')).data[0]._id;
      const otherContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
      const other = await otherContext.newPage();
      const otherApi = apiClient(other, apiUrl);
      await register(other, webUrl, 'Other Person', `smoke.b.${stamp}@example.com`, PASSWORD);
      await other.waitForTimeout(2500);
      expect((await otherApi('GET', '/users/me')).status === 200, 'the second user is not signed in, so the check would prove nothing');

      const own = {
        skills: (await otherApi('GET', '/skills/me')).data.totalSkills,
        saved: (await otherApi('GET', '/opportunities/saved')).data.total,
        resume: (await otherApi('GET', '/resumes/me')).data.resume,
        interviews: (await otherApi('GET', '/interviews/history')).data.history.length,
        conversations: (await otherApi('GET', '/ai')).data.length,
      };
      expect(own.skills === 0 && own.saved === 0 && own.resume === null && own.interviews === 0 && own.conversations === 0, `the new account is not empty: ${JSON.stringify(own)}`);

      const id = encodeURIComponent(savedJob.externalId);
      const attempts = {
        'read interview': (await otherApi('GET', `/interviews/${firstSessionId}`)).status,
        'answer interview': (await otherApi('POST', `/interviews/${firstSessionId}/respond`, { questionIndex: 0, candidateResponse: 'intrusion' })).status,
        'change job status': (await otherApi('PATCH', `/opportunities/saved/${id}/status`, { status: 'offer' })).status,
        'edit job notes': (await otherApi('PATCH', `/opportunities/saved/${id}`, { notes: 'intrusion' })).status,
        'delete job': (await otherApi('DELETE', `/opportunities/saved/${id}`)).status,
        'download resume': (await otherApi('GET', '/resumes/download')).status,
        'reprocess resume': (await otherApi('POST', '/resumes/reprocess')).status,
        'read conversation': (await otherApi('GET', `/ai/${conversationId}`)).status,
        'post to conversation': (await otherApi('POST', `/ai/${conversationId}/messages`, { content: 'intrusion' })).status,
      };
      await otherContext.close();
      const leaked = Object.entries(attempts).filter(([, status]) => status !== 404);
      expect(leaked.length === 0, `not refused with 404: ${JSON.stringify(Object.fromEntries(leaked))}`);

      const mine = (await api('GET', '/opportunities/saved')).data.savedOpportunities[0];
      expect(mine.status === 'applied' && mine.notes === 'Applied through the careers page.', 'the first user\'s tracked job was changed');
      expect((await api('GET', `/ai/${conversationId}`)).data.messages.length === 2, 'the first user\'s conversation was changed');
      return `${Object.keys(attempts).length} cross-account requests all answered 404; data unchanged`;
    });

    // ---- Resume deletion ---------------------------------------------------------------------------------------------------
    await t.step('deleting the resume asks first, clears what came from it and keeps history', async () => {
      await gotoAndSettle(page, `${webUrl}/resume`, 2500);
      await page.getByRole('button', { name: 'Delete resume' }).first().click();
      const dialog = page.getByRole('dialog');
      expect(/roadmap progress, saved jobs and interview history are kept/i.test(await dialog.innerText()), 'the confirmation does not say what is kept');
      expect(/skills you verified with a skill check/i.test(await dialog.innerText()), 'the confirmation does not say verified skills are kept');
      await dialog.getByRole('button', { name: 'Keep resume' }).click();
      expect((await api('GET', '/resumes/me')).data.resume !== null, 'cancelling deleted the resume');

      await page.getByRole('button', { name: 'Delete resume' }).first().click();
      await page.getByRole('dialog').getByRole('button', { name: 'Delete resume' }).click();
      await page.waitForTimeout(3000);
      expect((await api('GET', '/resumes/me')).data.resume === null, 'the resume still exists');
      // The skill check passed earlier is the user's own evidence: it stays, worth its own points only
      const left = (await api('GET', '/skills/freshness')).data.skills;
      expect(left.length === 1 && left[0].name === 'JavaScript' && left[0].evidenceScore === 15 && left[0].verification === 'assessed',
        `after deletion the profile holds ${JSON.stringify(left.map((s) => [s.name, s.evidenceScore, s.verification]))}`);
      const snap = await snapshot();
      expect(snap.resumeInfo.hasResume === false, 'Home still reports a resume');
      expect(snap.roadmap.completedMilestones >= 1, 'completed roadmap work was erased');
      expect(snap.opportunities.total === 1, 'tracked jobs were erased');
      expect((await api('GET', '/interviews/history')).data.history.length === 2, 'interview history was erased');
      return 'resume skills cleared; the verified skill, roadmap progress, tracked job and interviews kept';
    });

    // ---- Sign out and back in -----------------------------------------------------------------------------------------------
    await t.step('sign out ends the session', async () => {
      await gotoAndSettle(page, `${webUrl}/profile`, 2500);
      await page.getByRole('button', { name: /Sign Out Session/ }).click();
      await page.getByRole('button', { name: 'Terminate Session' }).click();
      await page.waitForTimeout(2500);
      await gotoAndSettle(page, `${webUrl}/home`, 2000);
      expect(new URL(page.url()).pathname !== '/home', 'the home page still opens after signing out');
      const stored = await page.evaluate(() => JSON.stringify(localStorage) + JSON.stringify(sessionStorage));
      expect(!/eyJ[A-Za-z0-9_-]{10,}\./.test(stored), 'a token is still in browser storage');
    });
    await t.step('signing in again restores the same data', async () => {
      await page.goto(`${webUrl}/login`);
      await page.fill('input[type="email"]', emailA);
      await page.fill('input[type="password"]', PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/home', { timeout: 20_000 });
      await page.waitForTimeout(2000);
      const saved = (await api('GET', '/opportunities/saved')).data;
      expect(saved.total === 1 && saved.savedOpportunities[0].status === 'applied', 'the tracked job is not there after signing in again');
    });

    await t.step('searching too often is refused with a clear message; saved jobs stay reachable', async () => {
      // Use up this minute's searches for the signed-in user
      let last = null;
      for (let i = 0; i < 31; i++) last = await api('GET', '/opportunities?search=Developer');
      expect(last.status === 429 && last.json?.error?.code === 'JOB_SEARCH_RATE_LIMITED', `search 31 answered ${last.status}`);
      // The limit counts fixed one-minute windows. If this one ends before the page has loaded,
      // the page's own search would rightly be allowed: wait for the next window and use it up.
      const resetSeconds = Number(last.headers.get('ratelimit-reset'));
      if (Number.isFinite(resetSeconds) && resetSeconds <= 10) {
        await page.waitForTimeout((resetSeconds + 1) * 1000);
        for (let i = 0; i < 31; i++) last = await api('GET', '/opportunities?search=Developer');
        expect(last.status === 429, `search 31 of the next window answered ${last.status}`);
      }
      expect((await api('GET', '/opportunities/saved')).status === 200, 'saved jobs are blocked by the search limit');
      await gotoAndSettle(page, `${webUrl}/job-agent`, 4000);
      expect(/You can search for jobs 30 times a minute/.test(await bodyText(page)), 'the page does not explain that searching is limited');
      return 'search 31 in a minute refused with an explanation';
    });

    await t.step('no unexpected API failures or console errors during the journey', async () => {
      expect(unexpected.failed.length === 0, `API failures: ${unexpected.failed.join(', ')}`);
      expect(unexpected.console.length === 0, `console errors: ${unexpected.console.slice(0, 4).join(' | ')}`);
    });
  } finally {
    await browser.close();
  }

  console.log(`\nSUMMARY ${t.results.length - t.failures}/${t.results.length} passed`);
  return t.failures;
}
