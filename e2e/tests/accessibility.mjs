// Accessibility scan (V3): axe-core (WCAG 2.0/2.1 A and AA rules) on every screen, signed out and
// signed in with real data, plus keyboard and reduced-motion checks. Run with
//   E2E_TEST_FILE=./tests/accessibility.mjs node run.mjs
// Set A11Y_REPORT=1 to print every violation instead of failing on the first page.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Reporter, apiClient, completeOnboarding, expect, gotoAndSettle, launchBrowser, register, syntheticResume, watch } from '../lib/harness.mjs';

const AXE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', 'axe-core', 'axe.min.js');
const PASSWORD = 'Password123!';
const RESUME = syntheticResume([
  'Asha Rao', 'Email: asha.rao@example.com', '', 'Experience:', 'Frontend Developer at Example Co (2022-2024)',
  'Built dashboards with React, TypeScript and SQL.', '', 'Projects:', 'Shop API', 'REST service in Node.js, tracked with Git.', '', 'Skills:', 'React, TypeScript, JavaScript, Node.js, SQL, Git',
]);

export const PUBLIC_PAGES = ['/', '/login', '/register'];
export const APP_PAGES = [
  '/home', '/careers', '/career-lab', '/activity', '/portfolio', '/roadmap', '/recommendations', '/analytics', '/ai', '/profile',
  '/settings', '/readiness', '/skills', '/resume', '/job-agent', '/interview-agent', '/interview-agent/assessments', '/interviews',
  '/market', '/market/salaries', '/resume-language', '/career-domains', '/exams', '/exams/gate-cs-2026', '/applications',
  '/application-outcomes', '/opportunities', '/portfolio-demo', '/learning-agent', '/resume-agent', '/agent', '/orchestrator',
  '/diagnostics', '/graph', '/events', '/features', '/ops', '/github', '/linkedin', '/coding', '/opensource', '/brand',
  '/digital-twin', '/networking-agent', '/opportunity-agent', '/memory', '/career-os',
];
const IMPACT = new Set(['serious', 'critical']);

async function scan(page) {
  await page.addScriptTag({ path: AXE });
  return page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, resultTypes: ['violations'] });
    return result.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, count: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
  });
}

export async function run({ webUrl, apiUrl }) {
  const t = new Reporter();
  const { browser, channel } = await launchBrowser();
  console.log(`[e2e] browser channel: ${channel}`);
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const log = watch(page, apiUrl);
  const api = apiClient(page, apiUrl);
  const report = process.env.A11Y_REPORT === '1';
  const findings = [];
  const email = `a11y.${Date.now()}@example.com`;
  const crashes = [];
  // Error objects behind console errors, so a crash names its cause
  page.on('console', async (m) => {
    if (m.type() !== 'error') return;
    for (const a of m.args()) {
      const text = await a.evaluate((e) => (e instanceof Error ? `${e.name}: ${e.message} @ ${(e.stack || '').split('\n')[1] || ''}` : '')).catch(() => '');
      if (text) crashes.push(text);
    }
  });

  const check = async (route) => {
    const errorsBefore = log.console.length;
    await gotoAndSettle(page, webUrl + route, 1800);
    // A screen that crashed into the error boundary is a failure state in itself
    if (await page.getByTestId('error-boundary').count()) {
      const why = [...crashes.splice(0), ...log.console.slice(errorsBefore)].join(' | ').slice(0, 500);
      if (report) console.log(`  ${route}  CRASH  ${why}`);
      else expect(false, `${route} crashed into the error screen: ${why}`);
    }
    const serious = (await scan(page)).filter((v) => IMPACT.has(v.impact));
    if (serious.length) findings.push({ route, serious });
    if (report) {
      for (const v of serious) console.log(`  ${route}  ${v.impact}  ${v.id} (${v.count})  ${v.help}  e.g. ${v.targets.join(' | ')}`);
      return;
    }
    expect(serious.length === 0, `${route}: ${serious.map((v) => `${v.id} x${v.count} [${v.targets[0]}]`).join(', ')}`);
  };

  try {
    for (const route of PUBLIC_PAGES) await t.step(`axe: ${route} (signed out)`, () => check(route));

    await t.step('register, onboard and upload a resume so pages show real data', async () => {
      await register(page, webUrl, 'Accessibility Tester', email, PASSWORD);
      await completeOnboarding(page, 'Frontend Engineer');
      await gotoAndSettle(page, `${webUrl}/resume`, 1500);
      await page.locator('input[type="file"]').first().setInputFiles({ name: 'asha.pdf', mimeType: 'application/pdf', buffer: RESUME });
      for (let i = 0; i < 60; i++) {
        if ((await api('GET', '/resumes/me')).data?.resume?.parsingStatus === 'completed') break;
        await page.waitForTimeout(500);
      }
    });

    for (const route of APP_PAGES) await t.step(`axe: ${route}`, () => check(route));

    await t.step('sign-in works with the keyboard alone, with a visible focus indicator', async () => {
      const fresh = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
      await fresh.goto(`${webUrl}/login`);
      await fresh.locator('input[type="email"]').waitFor({ timeout: 15_000 });
      // Tab from the top of the page until the e-mail field is reached
      let reached = false;
      for (let i = 0; i < 25 && !reached; i++) {
        await fresh.keyboard.press('Tab');
        reached = await fresh.evaluate(() => document.activeElement?.getAttribute('type') === 'email');
        if (i === 0) {
          const visible = await fresh.evaluate(() => {
            const st = getComputedStyle(document.activeElement);
            return (st.outlineStyle !== 'none' && parseFloat(st.outlineWidth) > 0) || (st.boxShadow && st.boxShadow !== 'none');
          });
          expect(visible, 'the first focused control shows no focus indicator');
        }
      }
      expect(reached, 'the e-mail field cannot be reached with Tab');
      await fresh.keyboard.type(email);
      await fresh.keyboard.press('Tab');
      expect(await fresh.evaluate(() => document.activeElement?.getAttribute('type') === 'password'), 'Tab does not move from e-mail to password');
      await fresh.keyboard.type(PASSWORD);
      await fresh.keyboard.press('Enter');
      await fresh.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20_000 });
      await fresh.context().close();
    });

    if (report) {
      const byRule = {};
      for (const f of findings) for (const v of f.serious) byRule[v.id] = (byRule[v.id] || 0) + 1;
      console.log('\nA11Y SUMMARY: pages with serious/critical violations', findings.length, JSON.stringify(byRule));
    }
  } finally {
    await browser.close();
  }
  console.log(`\nSUMMARY ${t.results.length - t.failures}/${t.results.length} passed`);
  return t.failures;
}
