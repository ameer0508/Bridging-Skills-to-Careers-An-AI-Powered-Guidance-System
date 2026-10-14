// Every screen in the sidebar is reached by clicking its link, renders without falling into the
// error boundary, and administrator-only entries stay hidden from other users. Run with
//   E2E_TEST_FILE=./tests/navigation.mjs node run.mjs
import { Reporter, completeOnboarding, expect, launchBrowser, register, watch } from '../lib/harness.mjs';

const PASSWORD = 'Password123!';
const ENTRIES = [
  ['/home', 'Home Command Center'],
  ['/ai', 'AI Command Center'],
  ['/recommendations', 'Recommendations'],
  ['/careers', 'Career Intelligence'],
  ['/career-lab', 'Career Lab'],
  ['/portfolio', 'Portfolio'],
  ['/readiness', 'Career Readiness'],
  ['/roadmap', 'Learning Roadmap'],
  ['/activity', 'Learning Activity'],
  ['/skills', 'Skill Intelligence'],
  ['/analytics', 'Progress Analytics'],
  ['/market', 'Market Evidence'],
  ['/market/salaries', 'Salary Insights'],
  ['/resume-language', 'Resume Language Check'],
  ['/career-domains', 'More Career Domains'],
  ['/exams', 'Exam Practice'],
  ['/applications', 'Applications'],
  ['/application-outcomes', 'Application Outcomes'],
  ['/employer-postings', 'Employer Postings'],
  ['/job-agent', 'Job Search Agent'],
  ['/interview-agent', 'Interview Prep Agent'],
  ['/orchestrator', 'Agent Orchestrator'],
  ['/resume', 'Resume Intelligence'],
  ['/profile', 'Profile & Settings'],
];

export async function run({ webUrl, apiUrl }) {
  const t = new Reporter();
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const log = watch(page, apiUrl);
  try {
    await t.step('register a synthetic student', async () => {
      await register(page, webUrl, 'Navigation Tester', `navigation.${Date.now()}@example.com`, PASSWORD);
      await completeOnboarding(page, 'Data Analyst');
    });

    for (const [path, label] of ENTRIES) {
      await t.step(`sidebar → ${label}`, async () => {
        const nav = page.getByRole('navigation').first();
        let link = page.locator(`a[href="${path}"]`).filter({ hasText: label }).first();
        if (!(await link.isVisible())) {
          // Collapsed sections open on click
          for (const header of await nav.getByRole('button').all()) {
            if (await link.isVisible()) break;
            const text = (await header.innerText().catch(() => '')).trim();
            if (/^[A-Z &]{4,}$/.test(text)) await header.click().catch(() => {});
          }
        }
        expect(await link.isVisible(), `no visible sidebar link "${label}"`);
        await link.click();
        await page.waitForURL((u) => new URL(u).pathname === path, { timeout: 15_000 });
        await page.waitForTimeout(1200);
        expect((await page.getByTestId('error-boundary').count()) === 0, `${path} fell into the error boundary`);
        expect(!/Something went wrong/.test(await page.locator('body').innerText()), `${path} shows "Something went wrong"`);
      });
    }

    await t.step('administrator-only entries are hidden from a student', async () => {
      expect((await page.locator('a[href="/ai-observability"]').count()) === 0, 'AI Observability is shown to a student');
      await page.goto(`${webUrl}/employer-postings`);
      await page.getByRole('tab', { name: 'Openings' }).waitFor({ timeout: 10_000 });
      expect((await page.getByRole('tab', { name: 'Review reports' }).count()) === 0, 'the review tab is shown to a student');
    });

    await t.step('no page errors while navigating', async () => {
      const pageErrors = log.console.filter((c) => c.startsWith('PAGEERROR'));
      expect(pageErrors.length === 0, `page errors: ${pageErrors.slice(0, 4).join(' | ')}`);
    });
  } finally {
    await browser.close();
  }
  console.log(`\nSUMMARY ${t.results.length - t.failures}/${t.results.length} passed`);
  return t.failures;
}
