// Opt-in check of A1 against a running stack with REAL OnJob.io data. It is not part of the
// regular suites, because it depends on the live feed. Start the stack with
//   SKILLBRIDGE_ENABLE_ONJOB=true SKILLBRIDGE_ONJOB_FEED_TERMS_ACCEPTED=true docker compose up -d
// then run from e2e/:  node live/onjobCompareLive.mjs   (WEB_URL defaults to http://localhost:3000)
import { Reporter, apiClient, completeOnboarding, expect, gotoAndSettle, launchBrowser, register } from '../lib/harness.mjs';

const WEB = (process.env.WEB_URL || 'http://localhost:3000').replace(/\/$/, '');
const API = `${WEB}/api/v1`;
const CAREERS = (process.env.LIVE_CAREERS || 'Full Stack Developer,DevOps Engineer,Data Analyst').split(',');

const t = new Reporter();
const { browser, channel } = await launchBrowser();
const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
const api = apiClient(page, API);
let result;
try {
  await t.step('register and open the Career Lab', async () => {
    await register(page, WEB, 'Live Listings Check', `live.onjob.${Date.now()}@example.com`, 'Password123!');
    await completeOnboarding(page, 'Data Analyst');
    await gotoAndSettle(page, `${WEB}/career-lab`, 2500);
    return `${channel}, ${WEB}`;
  });

  await t.step('the comparison shows live OnJob.io listings with links, or says there are none', async () => {
    for (const title of CAREERS) await page.getByLabel(title, { exact: true }).check();
    await page.getByRole('button', { name: 'Compare', exact: true }).click();
    await page.getByTestId('compare-result').waitFor({ timeout: 60_000 });
    const cells = page.getByTestId('compare-live-cell');
    const states = await cells.evaluateAll((els) => els.map((e) => e.getAttribute('data-state')));
    expect(!states.includes('off'), `live listings are off (${states.join(', ')}): start the stack with the two OnJob flags`);
    expect(!states.includes('unavailable'), `the feed could not be read (${states.join(', ')})`);
    const links = await page.getByTestId('live-listing-link').evaluateAll((els) => els.map((e) => ({ href: e.getAttribute('href'), target: e.getAttribute('target'), rel: e.getAttribute('rel') })));
    expect(links.length > 0, 'no listing is shown for any of the compared careers');
    expect(links.every((l) => /^https:\/\/onjob\.io\/job\//.test(l.href) && l.target === '_blank' && /noopener/.test(l.rel)), `links ${JSON.stringify(links.slice(0, 3))}`);
    expect(/not the Indian job market/.test(await page.getByTestId('compare-live-note').innerText()), 'the scope is not stated');
    expect(!/\d+ (postings|openings|jobs)\b/i.test(await page.getByTestId('compare-live-row').innerText()), 'a count is shown');
    result = (await api('POST', '/careers/compare', { careerIds: (await api('GET', '/careers/catalog')).data.careers.filter((c) => CAREERS.includes(c.title)).map((c) => c.id) })).data;
    return CAREERS.map((title, i) => `${title}: ${states[i]}`).join('; ') + `; ${links.length} links`;
  });

  await t.step('every shown listing is an India listing, dated, with its rule and read time', async () => {
    for (const c of result.careers) {
      const live = c.liveListings;
      expect(['listings', 'none'].includes(live.state), `${c.careerTitle}: ${live.state}`);
      expect(live.retrievedAt && Date.now() - Date.parse(live.retrievedAt) < 24 * 3_600_000, `${c.careerTitle}: read ${live.retrievedAt}`);
      expect(live.listings.length <= 5 && live.matchingRule, `${c.careerTitle}: ${live.listings.length} shown, rule ${live.matchingRule}`);
      for (const l of live.listings) expect(/^https:\/\/onjob\.io\//.test(l.url) && l.title && l.employer && l.location, JSON.stringify(l));
    }
    return result.careers.map((c) => `${c.careerTitle}: ${c.liveListings.listings.map((l) => `${l.title} (${l.location}, ${l.postedAt?.slice(0, 10) ?? 'undated'})`).join(' | ') || 'none'}`).join(' ;; ');
  });
} finally {
  await browser.close();
}
const failures = t.results.filter((r) => !r.ok).length;
console.log(`\nSUMMARY ${t.results.length - failures}/${t.results.length} passed`);
process.exitCode = failures ? 1 : 0;
