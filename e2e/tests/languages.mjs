// Browser test for multilingual resume checks (E5, X1). Uses the stub AI service like every
// browser test; the real extraction module is tested in ai/tests/test_multilingual.py. Run with
//   E2E_TEST_FILE=./tests/languages.mjs node run.mjs
import { Reporter, apiClient, completeOnboarding, expect, gotoAndSettle, launchBrowser, register, watch } from '../lib/harness.mjs';

const PASSWORD = 'Password123!';

export async function run({ webUrl, apiUrl }) {
  const t = new Reporter();
  const stamp = Date.now();
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const log = watch(page, apiUrl);
  const api = apiClient(page, apiUrl);
  const intro = () => page.getByTestId('guidance-intro').innerText();
  const pasteAndAnalyse = async (text, button) => {
    await page.locator('textarea').fill(text);
    await page.getByRole('button', { name: button }).click();
    await page.getByTestId('analysis').waitFor({ timeout: 15_000 });
    await page.waitForTimeout(400);
  };

  try {
    await t.step('the page requires sign-in', async () => {
      await gotoAndSettle(page, `${webUrl}/resume-language`, 1500);
      expect(new URL(page.url()).pathname !== '/resume-language', 'opened without signing in');
    });

    await t.step('register', async () => {
      await register(page, webUrl, 'Language Tester', `lang.${stamp}@example.com`, PASSWORD);
      await completeOnboarding(page, 'Data Analyst');
    });

    await t.step('the guidance starts in English and names the supported languages', async () => {
      await page.getByRole('link', { name: /Resume Language Check/ }).first().click();
      await page.waitForURL('**/resume-language', { timeout: 15_000 });
      expect(/English, Hindi \(Devanagari script\) and Spanish/.test(await intro()), 'supported languages not stated');
      expect((await page.getByTestId('resume-language-page').getAttribute('lang')) === 'en', 'lang attribute missing');
    });

    await t.step('choosing Hindi translates the guidance and persists after a reload', async () => {
      await page.getByLabel('Language of this page').selectOption('hi');
      await page.waitForFunction(() => document.querySelector('[data-testid="resume-language-page"]')?.getAttribute('lang') === 'hi', null, { timeout: 10_000 });
      expect(/हिंदी \(देवनागरी लिपि\)/.test(await intro()), 'the guidance is not in Hindi');
      await page.reload();
      await page.getByTestId('guidance-intro').waitFor({ timeout: 15_000 });
      expect(/देवनागरी/.test(await intro()), 'the language choice did not persist');
      expect((await api('GET', '/languages/settings')).data.uiLanguage === 'hi', 'not stored on the account');
    });

    await t.step('a Hindi resume is read with every value traced to its line', async () => {
      await pasteAndAnalyse('कौशल\nPython, SQL\nrahul@example.com\nमैं एक डेटा विश्लेषक हूँ और मुझे अनुभव है।', 'पाठ जाँचें');
      const analysis = page.getByTestId('analysis');
      expect((await analysis.getAttribute('data-status')) === 'extracted', 'not extracted');
      expect(/Hindi/.test(await page.getByTestId('detected-language').innerText()), 'language not shown');
      const skills = await page.getByTestId('skill-list').innerText();
      expect(/Python/.test(skills) && /SQL/.test(skills), `skills: ${skills}`);
      expect(/पंक्ति 3:\s*\S?rahul@example\.com/.test(await analysis.innerText()), 'the email is not traced to line 3');
      expect(/कौशल/.test(await page.getByTestId('section-table').innerText()), 'the original heading is not shown');
    });

    await t.step('an unsupported language is refused with a message, not guessed', async () => {
      await pasteAndAnalyse('Compétences\nPython, SQL et beaucoup de travail en équipe.', 'पाठ जाँचें');
      expect((await page.getByTestId('analysis').getAttribute('data-status')) === 'unsupported', 'not refused');
      expect(/French/.test(await page.getByTestId('analysis-warnings').innerText()), 'no explanation');
      expect((await page.getByTestId('skill-list').count()) === 0, 'skills were extracted from an unsupported language');
    });

    await t.step('a scanned file is reported as unreadable without OCR', async () => {
      await page.locator('input[type=file]').setInputFiles({ name: 'scan.txt', mimeType: 'text/plain', buffer: Buffer.from('SCANNED page') });
      await page.getByRole('button', { name: 'जाँचें', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('[data-testid="analysis"]')?.getAttribute('data-status') === 'scanned_unreadable', null, { timeout: 15_000 });
      expect(/OCR/.test(await page.getByTestId('analysis-warnings').innerText()), 'no OCR explanation');
    });

    await t.step('a check can be deleted with its stored text, and another account sees none', async () => {
      const before = (await api('GET', '/languages/resume-analyses')).data.analyses;
      expect(before.length === 3, `${before.length} checks stored`);
      await page.getByRole('button', { name: /हटाएँ: scan\.txt/ }).click();
      await page.waitForTimeout(800);
      const after = (await api('GET', '/languages/resume-analyses')).data.analyses;
      expect(after.length === 2 && (await api('GET', `/languages/resume-analyses/${before[0].id}`)).status === 404, 'the check was not deleted');
      const other = await browser.newContext();
      const otherPage = await other.newPage();
      const otherApi = apiClient(otherPage, apiUrl);
      await register(otherPage, webUrl, 'Lang Other', `lang.other.${stamp}@example.com`, PASSWORD);
      await completeOnboarding(otherPage, 'Data Analyst');
      await gotoAndSettle(otherPage, `${webUrl}/resume-language`, 1500);
      const probe = (await otherApi('GET', `/languages/resume-analyses/${after[0].id}`)).status;
      const settings = (await otherApi('GET', '/languages/settings')).data.uiLanguage;
      await other.close();
      expect(probe === 404 && settings === 'en', `other account: ${probe}, ${settings}`);
    });

    await t.step('the page fits a phone screen', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow <= 1, `page is ${overflow}px wider than the screen`);
    });

    await t.step('no unexpected API failures or console errors', async () => {
      // One 404 is provoked on purpose (reading the deleted check)
      const failed = log.failed.filter((f) => !/^404 GET \/languages\/resume-analyses\/[a-f0-9]+$/.test(f));
      expect(failed.length === 0, `API failures: ${failed.join(', ')}`);
      const consoleErrors = log.console.filter((c) => !/status of 404/.test(c));
      expect(consoleErrors.length === 0, `console errors: ${consoleErrors.slice(0, 4).join(' | ')}`);
    });
  } finally {
    await browser.close();
  }

  console.log(`\nSUMMARY ${t.results.length - t.failures}/${t.results.length} passed`);
  return t.failures;
}
