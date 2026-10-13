// Browser test for the public landing page: no invented endorsements, user counts or false
// technical claims, and sample screens labelled as such. Run with
//   E2E_TEST_FILE=./tests/landing.mjs node run.mjs
import { Reporter, bodyText, expect, gotoAndSettle, launchBrowser, watch } from '../lib/harness.mjs';

// Claims that were on the page and are not true of SkillBridge, or cannot be measured
const FORBIDDEN = [
  /Alex Rivera|Sophia Chen|Marcus Vance/, // invented people presented as users
  /Trusted by/i,
  /thousands of (ambitious )?professionals/i,
  /spaCy/i, // not installed
  /Sentence Transformer|vector embeddings|cosine/i, // matching is weighted requirement scoring
  /Gemini 1\.5/i,
  /500\+ (tech )?role/i,
  /10x Extraction/i,
  /Zero Application Waste/i,
  /\$1\d\dk/i, // salary outcomes
  /Promoted in \d/i,
];

export async function run({ webUrl, apiUrl }) {
  const t = new Reporter();
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const log = watch(page, apiUrl);

  try {
    await t.step('the landing page loads for a visitor', async () => {
      await gotoAndSettle(page, webUrl, 3000);
      expect(/Bridge Your Skills/.test(await bodyText(page)), 'the landing page did not render');
    });

    await t.step('no invented endorsements, user counts or false technical claims', async () => {
      // Scroll through so lazily revealed sections are in the DOM
      for (let y = 0; y < 12; y++) {
        await page.mouse.wheel(0, 1200);
        await page.waitForTimeout(150);
      }
      const text = await bodyText(page);
      const found = FORBIDDEN.filter((re) => re.test(text)).map(String);
      expect(found.length === 0, `still on the page: ${found.join(', ')}`);
      const stockPhotos = await page.locator('img[src*="unsplash"], img[src*="randomuser"], img[src*="pravatar"]').count();
      expect(stockPhotos === 0, `${stockPhotos} stock portrait(s) shown`);
    });

    await t.step('example scenarios are labelled as not being customer stories', async () => {
      const note = await page.getByTestId('scenarios-note').innerText();
      expect(/not customer stories/.test(note) && /no user outcomes or reviews/.test(note), `note: ${note}`);
      expect((await page.getByTestId('example-scenarios').locator('img').count()) === 0, 'scenarios show faces');
    });

    await t.step('sample screens say they are samples', async () => {
      expect((await page.getByTestId('landing-sample-note').count()) >= 2, 'sample notes missing');
      expect(/Simulation with sample data/.test(await bodyText(page)), 'the interactive demo is not labelled as a simulation');
    });

    await t.step('the page fits a phone screen', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow <= 1, `page is ${overflow}px wider than the screen`);
    });

    await t.step('no console errors', async () => {
      expect(log.console.length === 0, `console errors: ${log.console.slice(0, 4).join(' | ')}`);
    });
  } finally {
    await browser.close();
  }

  console.log(`\nSUMMARY ${t.results.length - t.failures}/${t.results.length} passed`);
  return t.failures;
}
