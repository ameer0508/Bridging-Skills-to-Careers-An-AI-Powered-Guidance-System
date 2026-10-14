// Browser test for the public landing page (Aurora Elite): no invented endorsements, user counts,
// plans or false technical claims; sample screens labelled; calls to action, keyboard use, reduced
// motion and the phone layout work. Run with
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
  /\bPro plan\b|Upgrade to Pro|per month subscription/i, // there is no paid plan
  /verified employer/i, // organizations are self-declared
  /chance of (getting )?hired|hiring probability|guaranteed (job|placement)/i,
  /placement rate|users? placed|\d+% of (our )?users/i,
];

export async function run({ webUrl, apiUrl }) {
  const t = new Reporter();
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const log = watch(page, apiUrl);

  try {
    await t.step('the landing page loads for a visitor with its headline and both calls to action', async () => {
      await gotoAndSettle(page, webUrl, 3000);
      const h1 = await page.getByRole('heading', { level: 1 }).innerText();
      expect(/Turn Your Skills Into\s+Meaningful Careers\./.test(h1), `headline: ${h1}`);
      expect((await page.getByRole('link', { name: /Start Your Journey/ }).count()) >= 2, 'no Start Your Journey action');
      expect((await page.getByRole('link', { name: 'Explore Careers' }).count()) === 1, 'no Explore Careers action');
      expect(/The SkillBridge journey: Discover, then Learn, then Build, then Practice, then Opportunities/.test(await page.locator('svg[role="img"] title').first().textContent()), 'the journey scene has no accessible name');
    });

    await t.step('no invented endorsements, plans, user counts or false technical claims', async () => {
      // Scroll through so lazily revealed sections are in the DOM
      for (let y = 0; y < 14; y++) {
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
      const notes = await page.getByTestId('landing-sample-note').count();
      expect(notes >= 6, `only ${notes} sample labels`);
      expect(/Simulation with sample data/.test(await bodyText(page)), 'the interactive demo is not labelled as a simulation');
    });

    await t.step('the what-if demo responds and announces its result', async () => {
      const lab = page.locator('#career-lab');
      const tableau = lab.getByRole('button', { name: 'Tableau' });
      expect((await tableau.getAttribute('aria-pressed')) === 'false', 'Tableau starts selected');
      await tableau.click();
      await page.waitForTimeout(900);
      expect((await tableau.getAttribute('aria-pressed')) === 'true', 'the toggle state is not exposed');
      const results = await lab.locator('[aria-live="polite"]').innerText();
      expect(/Data Analyst\s+71%/.test(results) && /\+7/.test(results), `results: ${results.replace(/\s+/g, ' ')}`);
      await tableau.click();
    });

    await t.step('the calls to action go where they say', async () => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.getByRole('link', { name: 'Explore Careers' }).click();
      await page.waitForTimeout(800);
      expect(new URL(page.url()).hash === '#discover', `Explore Careers went to ${page.url()}`);
      const top = await page.locator('#discover').evaluate((el) => el.getBoundingClientRect().top);
      expect(top < 200, `the discovery section is not in view (${top}px)`);
      await page.locator('header').getByRole('link', { name: 'Start Your Journey' }).click();
      await page.waitForURL('**/register', { timeout: 15_000 });
      await gotoAndSettle(page, webUrl, 1500);
      await page.locator('header').getByRole('link', { name: 'Sign in' }).click();
      await page.waitForURL('**/login', { timeout: 15_000 });
    });

    await t.step('keyboard: the skip link comes first, focus is visible, and the main action is reachable', async () => {
      await gotoAndSettle(page, webUrl, 1500);
      await page.keyboard.press('Tab');
      const first = await page.evaluate(() => ({ text: document.activeElement?.textContent?.trim(), visible: document.activeElement?.matches(':focus-visible') }));
      expect(first.text === 'Skip to content' && first.visible, `first focus: ${JSON.stringify(first)}`);
      let reached = false;
      for (let i = 0; i < 15 && !reached; i++) {
        await page.keyboard.press('Tab');
        reached = await page.evaluate(() => /Start Your Journey/.test(document.activeElement?.textContent || ''));
      }
      expect(reached, 'Start Your Journey cannot be reached with Tab');
      const ring = await page.evaluate(() => getComputedStyle(document.activeElement).boxShadow);
      expect(ring && ring !== 'none', 'no visible focus ring on the main action');
    });

    await t.step('with reduced motion, everything is shown at once and nothing waits on an animation', async () => {
      const still = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
      const p = await still.newPage();
      await p.goto(webUrl);
      await p.getByRole('heading', { level: 1 }).waitFor({ timeout: 10_000 });
      await p.waitForTimeout(150);
      const state = await p.evaluate(() => {
        const h1 = document.querySelector('h1');
        const route = [...document.querySelectorAll('svg[role="img"] path')].find((e) => e.getAttribute('stroke-dasharray') === '2 10');
        return { opacity: getComputedStyle(h1.closest('[style]') || h1).opacity, routeStyle: route?.getAttribute('style') || '' };
      });
      await still.close();
      expect(state.opacity === '1', `the headline is still fading in (${state.opacity})`);
      expect(!/stroke-dashoffset/.test(state.routeStyle), 'the route is still being drawn');
    });

    await t.step('the page fits phone and tablet screens', async () => {
      for (const width of [390, 360, 768]) {
        await page.setViewportSize({ width, height: 844 });
        await page.waitForTimeout(400);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow <= 1, `at ${width}px the page is ${overflow}px wider than the screen`);
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole('button', { name: 'Open menu' }).click();
      await page.locator('#landing-mobile-menu').getByRole('link', { name: 'Career Lab' }).click();
      await page.waitForTimeout(600);
      expect(new URL(page.url()).hash === '#career-lab' && (await page.locator('#landing-mobile-menu').count()) === 0, 'the phone menu does not navigate and close');
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
