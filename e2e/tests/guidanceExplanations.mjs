// Browser test for the Phase 2 explanations: readiness, skill gaps and the next-best action.
//   E2E_TEST_FILE=./tests/guidanceExplanations.mjs node run.mjs
// Run it twice: as is (AI wording off, the default) and with ENABLE_LOCAL_AI_EXPLANATIONS=true
// (passed to the test backend). The stub AI service stands in for the AI service; no model runs.
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
const TEXT = 'Your readiness reflects the dimension scores and weights computed by SkillBridge. Adding the required skills not found would raise it most.';
// One of the plausible-but-wrong claims the validator cannot judge (docs/AI_EXPLANATIONS.md)
const WRONG_CLAIM = 'Most of your credited evidence comes from skill checks.';
const AI_ON = ['1', 'true', 'on', 'yes'].includes((process.env.ENABLE_LOCAL_AI_EXPLANATIONS || '').trim().toLowerCase());

export async function run({ webUrl, apiUrl, aiControl }) {
  const t = new Reporter();
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}; local AI wording ${AI_ON ? 'ON' : 'OFF (default)'}`);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const log = watch(page, apiUrl);
  const api = apiClient(page, apiUrl);
  const posts = [];
  page.on('request', (r) => {
    if (r.method() === 'POST' && /\/careers\/[^/]+\/explanations?\b/.test(r.url())) posts.push(r.url());
  });
  const calls = async (subject) => (await aiControl()).explain.paths.filter((p) => !subject || p === `/api/v1/explain/${subject}`).length;
  let readiness = [];

  try {
    await t.step('register and upload a resume', async () => {
      await register(page, webUrl, 'Guidance Tester', `guidance.${Date.now()}@example.com`, PASSWORD);
      await completeOnboarding(page, 'Backend Developer');
      await gotoAndSettle(page, `${webUrl}/resume`, 1500);
      await page.locator('input[type="file"]').first().setInputFiles({ name: 'riya.pdf', mimeType: 'application/pdf', buffer: RESUME });
      for (let i = 0; i < 60; i++) {
        if ((await api('GET', '/resumes/me')).data?.resume?.parsingStatus === 'completed') break;
        await page.waitForTimeout(500);
      }
      for (let i = 0; i < 40; i++) {
        readiness = (await api('GET', '/readiness')).data?.readiness ?? [];
        if (readiness.length >= 2) break;
        await page.waitForTimeout(500);
      }
      expect(readiness.length >= 2, `need two readiness results, got ${readiness.length}`);
      return readiness.slice(0, 2).map((r) => `${r.careerId.title} ${r.overallScore}`).join(', ');
    });

    await t.step('readiness: a verified summary from SkillBridge\'s rules, with the real score and tier', async () => {
      await gotoAndSettle(page, `${webUrl}/readiness`, 2500);
      const panel = page.getByTestId('readiness-explanation');
      await panel.waitFor({ timeout: 15_000 });
      const summary = panel.getByTestId('explanation-summary');
      await summary.waitFor({ timeout: 10_000 });
      expect(/Verified summary · written by SkillBridge's rules/.test(await summary.getByTestId('explanation-summary-attribution').innerText()), 'attributed to the rules');
      const text = await summary.getByTestId('explanation-summary-text').innerText();
      const first = readiness[0];
      expect(text.includes(`is ${first.overallScore}/100`), `summary: ${text.slice(0, 200)}`);
      expect(text.includes('Technical Skills') && text.includes('(weight 50%)'), 'the dimensions with their weights');
      expect(!/local AI/i.test(await summary.innerText()), 'the summary never claims to be AI');
      await summary.getByRole('button', { name: 'Facts behind this summary' }).click();
      expect((await summary.getByTestId('explanation-facts').innerText()).includes(`Readiness: ${first.overallScore}/100`), 'facts behind it');
    });

    await t.step('skill gaps: the summary lists the gaps in the order the page shows them', async () => {
      const panel = page.getByTestId('skill-gap-explanation');
      await panel.waitFor({ timeout: 15_000 });
      const items = await panel.getByTestId('explanation-summary-items').locator('li').allInnerTexts();
      const onPage = await page.locator('section[aria-labelledby="gaps-heading"] li span.text-sm.font-semibold').allInnerTexts();
      expect(items.length > 0 && onPage.length > 0, 'gaps are listed');
      expect(onPage.every((name, i) => items[i]?.startsWith(name.trim())), `summary order ${items.join(' | ')} vs page ${onPage.join(' | ')}`);
      return items[0];
    });

    await t.step('next step: the dashboard summary explains the first ranked action from the ranking\'s evidence', async () => {
      const ranked = (await api('GET', '/recommendations/next-actions')).data;
      expect(ranked.actions.length > 0, 'the profile has ranked next actions');
      await gotoAndSettle(page, `${webUrl}/home`, 3500);
      const panel = page.getByTestId('next-action-explanation');
      await panel.waitFor({ timeout: 15_000 });
      const text = await panel.getByTestId('explanation-summary-text').innerText();
      const top = ranked.actions[0];
      expect(text.includes(`first of ${ranked.totalCandidates} possible action`), `summary: ${text.slice(0, 200)}`);
      expect(text.includes(`from ${top.factors.scoreBefore} to ${top.factors.scoreAfter}`) && text.includes('not a guarantee'), 'the hypothetical change, exactly');
      const after = (await api('GET', '/recommendations/next-actions')).data;
      expect(JSON.stringify(after) === JSON.stringify(ranked), 'the ranking is unchanged');
      return top.title;
    });

    if (!AI_ON) {
      await t.step('AI wording is off: no AI section, no button, no request to the model', async () => {
        for (const path of ['/readiness', '/home']) {
          await gotoAndSettle(page, `${webUrl}${path}`, 2500);
          expect((await page.getByTestId('explanation-ai').count()) === 0, `${path}: no AI section`);
          expect((await page.getByRole('button', { name: 'Explain with local AI' }).count()) === 0, `${path}: no AI button`);
        }
        expect((await calls()) === 0 && posts.length === 0, `model ${await calls()}, POST ${posts.length}`);
      });

      await t.step('AI wording is off: direct requests are refused by the server', async () => {
        const careerId = readiness[0].careerId._id;
        for (const subject of ['readiness', 'skill-gap', 'next-action']) {
          const res = await api('POST', `/careers/${careerId}/explanations/${subject}`);
          expect(res.status === 403 && res.json?.error?.code === 'AI_EXPLANATIONS_DISABLED', `${subject}: ${res.status} ${res.json?.error?.code}`);
        }
        expect((await calls()) === 0, 'still no request to the model');
      });
    } else {
      await t.step('AI wording is on: it is a separate, labelled, experimental section; nothing is generated until asked', async () => {
        await gotoAndSettle(page, `${webUrl}/readiness`, 2500);
        const ai = page.getByTestId('readiness-explanation').getByTestId('explanation-ai');
        await ai.waitFor({ timeout: 10_000 });
        expect(/Experimental local AI wording/.test(await ai.innerText()), 'labelled experimental');
        expect((await calls()) === 0 && posts.length === 0, 'nothing generated by opening pages');
      });

      await t.step('AI wording is on: a wrong claim stays in the labelled AI section and never replaces the verified summary', async () => {
        await aiControl({ explain: { mode: 'slow', delayMs: 1500, text: WRONG_CLAIM } });
        const panel = page.getByTestId('readiness-explanation');
        const summaryBefore = await panel.getByTestId('explanation-summary-text').innerText();
        await panel.getByRole('button', { name: 'Explain with local AI' }).focus();
        await page.keyboard.press('Enter');
        await panel.getByTestId('explanation-pending').waitFor({ timeout: 5_000 });
        await panel.getByTestId('explanation-result').waitFor({ timeout: 15_000 });
        const ai = panel.getByTestId('explanation-ai');
        expect((await ai.getByTestId('explanation-text').innerText()).trim() === WRONG_CLAIM, 'shown as AI wording');
        expect((await ai.getByTestId('explanation-attribution').innerText()).includes('Written by local AI · fake-explainer'), 'attributed to the local AI');
        expect(/can contain mistakes/.test(await ai.getByTestId('explanation-warning').innerText()), 'with the warning');
        const summaryAfter = await panel.getByTestId('explanation-summary-text').innerText();
        expect(summaryAfter === summaryBefore && !summaryAfter.includes(WRONG_CLAIM), 'the verified summary is unchanged');
        expect(await page.evaluate(() => document.activeElement?.textContent?.trim() === 'Local AI explanation'), 'focus moved to the AI wording');
        expect((await calls('readiness')) === 1, 'one model call');
      });

      await t.step('AI wording is on: a rejected answer has its own message', async () => {
        await aiControl({ explain: { mode: 'rejected' } });
        await gotoAndSettle(page, `${webUrl}/readiness`, 2500);
        const panel = page.getByTestId('skill-gap-explanation');
        await panel.getByRole('button', { name: 'Explain with local AI' }).click();
        const error = panel.getByTestId('explanation-error');
        await error.waitFor({ timeout: 10_000 });
        expect((await error.innerText()).includes('The AI wording was not shown.'), await error.innerText());
        expect((await panel.getByTestId('explanation-result').count()) === 0, 'no AI wording shown');
        expect((await panel.getByTestId('explanation-summary').count()) === 1, 'the verified summary is still there');
        await aiControl({ explain: { mode: 'ok', text: TEXT } });
      });
    }

    await t.step('phone width: the panels fit', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      for (const path of ['/readiness', '/home']) {
        await gotoAndSettle(page, `${webUrl}${path}`, 2500);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow <= 0, `${path} scrolls sideways by ${overflow}px`);
      }
      const summary = page.getByTestId('next-action-explanation').getByTestId('explanation-summary');
      await summary.scrollIntoViewIfNeeded();
      const box = await summary.boundingBox();
      expect(box && box.x >= 0 && box.x + box.width <= 390, `summary outside the screen: ${JSON.stringify(box)}`);
      await page.setViewportSize({ width: 1366, height: 900 });
    });

    await t.step('no unexpected errors', async () => {
      const unexpected = log.failed.filter((f) => !/\/explanations?(\/[a-z-]+)?$/.test(f));
      expect(unexpected.length === 0, `failed requests: ${unexpected.join('; ')}`);
      const consoleErrors = log.console.filter((c) => !/status of (403|422|503|504)/.test(c)
        && !/\[API Error\].*code: (AI_BUSY|AI_UNAVAILABLE|AI_TIMEOUT|EXPLANATION_REJECTED|AI_EXPLANATIONS_DISABLED)/.test(c));
      expect(consoleErrors.length === 0, `console errors: ${consoleErrors.join('; ')}`);
    });
  } finally {
    await browser.close();
  }
  console.log(`\nSUMMARY ${t.results.length - t.failures}/${t.results.length} passed`);
  return t.failures;
}
