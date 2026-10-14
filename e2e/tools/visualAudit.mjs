// Visual audit of the running product: every registered route at five widths, signed out, signed
// in with seeded data, as an administrator, and in loading and error states. Saves full-page
// screenshots and a JSON report of layout problems for a person to review. It asserts nothing
// itself (the browser suites do that). Run with
//   E2E_TEST_FILE=./tools/visualAudit.mjs E2E_AUDIT_DIR=<folder> E2E_API_RATE_LIMIT_MAX=20000 node run.mjs
// All accounts and documents are SYNTHETIC TEST DATA.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { apiClient, completeOnboarding, gotoAndSettle, launchBrowser, syntheticResume, watch } from '../lib/harness.mjs';
import { setRole } from '../lib/admin.mjs';

const WIDTHS = [1440, 1024, 768, 390, 360];
const PASSWORD = 'Password123!';
const RESUME = syntheticResume([
  'Asha Rao', 'Email: asha.rao@example.com', '', 'Experience:', 'Frontend Developer at Example Co (2022-2024)',
  'Built dashboards with React, JavaScript, HTML and CSS.', '', 'Skills:', 'React, JavaScript, HTML, CSS, Node.js, Git, SQL',
]);
const PUBLIC = ['/', '/login', '/register', '/no-such-page'];
const SIGNED_IN = [
  '/home', '/resume', '/careers', '/readiness', '/career-lab', '/roadmap', '/portfolio', '/interview-agent',
  '/interview-agent/assessments', '/interviews', '/exams', '/job-agent', '/opportunities', '/opportunity-agent',
  '/applications', '/application-outcomes', '/market', '/market/salaries', '/ai', '/agent', '/resume-language',
  '/employer-postings', '/settings', '/profile', '/activity', '/analytics', '/brand', '/career-domains', '/career-os',
  '/coding', '/diagnostics', '/digital-twin', '/events', '/features', '/github', '/graph', '/learning-agent',
  '/linkedin', '/memory', '/networking-agent', '/opensource', '/ops', '/orchestrator', '/recommendations',
  '/resume-agent', '/skills', '/portfolio-demo', '/ai-observability',
];

// Layout measurements taken inside the page
const measure = (page) =>
  page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const visible = (el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
    };
    const scrollsSideways = (el) => {
      for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
        const o = getComputedStyle(n).overflowX;
        if (o === 'auto' || o === 'scroll') return true;
      }
      return false;
    };
    const label = (el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${(el.getAttribute('aria-label') || el.innerText || el.getAttribute('placeholder') || '').trim().slice(0, 40)}"`;
    const main = document.getElementById('main-content');
    const mainRect = main ? main.getBoundingClientRect() : { left: 0, right: vw };
    const offscreen = [];
    const small = [];
    for (const el of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=link]')) {
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect();
      const box = main && main.contains(el) ? mainRect : { left: 0, right: vw };
      if ((r.right > box.right + 1 || r.left < box.left - 1) && !scrollsSideways(el) && !el.closest('[aria-hidden="true"]')) offscreen.push(label(el));
      // WCAG 2.2 target size (minimum): 24 by 24 CSS px, inline text links excepted
      const inlineLink = el.tagName === 'A' && getComputedStyle(el).display === 'inline';
      if (!inlineLink && (r.width < 24 || r.height < 24) && el.type !== 'checkbox' && el.type !== 'radio') small.push(`${label(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    const dialogs = [...document.querySelectorAll('[role=dialog], [role=alertdialog]')]
      .filter(visible)
      .map((d) => d.getBoundingClientRect())
      .filter((r) => r.width > vw + 1 || r.height > vh + 1)
      .map((r) => `${Math.round(r.width)}x${Math.round(r.height)}`);
    const text = document.body.innerText.replace(/\s+/g, ' ');
    return {
      overflow: document.documentElement.scrollWidth - vw,
      // #main-content hides sideways overflow, so anything wider is silently cut off
      clippedX: main ? main.scrollWidth - main.clientWidth : 0,
      height: document.documentElement.scrollHeight,
      offscreen: offscreen.slice(0, 6),
      offscreenCount: offscreen.length,
      small: small.slice(0, 6),
      smallCount: small.length,
      dialogs,
      errorScreen: /Something went wrong|Unexpected Application Error/i.test(text),
      h1: [...document.querySelectorAll('h1')].filter(visible).map((h) => h.innerText.trim().slice(0, 60)),
    };
  });

export async function run({ webUrl, apiUrl, tmpDir }) {
  const outDir = process.env.E2E_AUDIT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'skillbridge-audit-'));
  fs.mkdirSync(outDir, { recursive: true });
  const report = [];
  const { browser, channel } = await launchBrowser();
  console.log(`[audit] browser ${channel}, output ${outDir}`);
  // The app scrolls inside #main-content, not the document, so a full-page screenshot would stop
  // at the first screen. The viewport is grown to the content height instead and captured in
  // segments of 1400 px that are readable one by one.
  const shot = async (page, name, width) => {
    const base = `${name.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'root'}-${width}`;
    const total = await page.evaluate(() => {
      const main = document.getElementById('main-content');
      const extra = main ? main.scrollHeight - main.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
      return Math.min(window.innerHeight + Math.max(0, extra), 8400);
    });
    const restore = page.viewportSize();
    if (total > restore.height) {
      await page.setViewportSize({ width, height: total });
      await page.waitForTimeout(500);
    }
    const files = [];
    for (let y = 0, i = 0; y < total; y += 1400, i++) {
      const file = `${base}-${i}.png`;
      await page.screenshot({ path: path.join(outDir, file), clip: { x: 0, y, width, height: Math.min(1400, total - y) }, animations: 'disabled' });
      files.push(file);
    }
    await page.setViewportSize(restore);
    return files;
  };
  const firstScreen = async (page, name, width) => {
    const file = `${name.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'root'}-${width}-0.png`;
    await page.screenshot({ path: path.join(outDir, file), animations: 'disabled' });
    return [file];
  };
  const audit = async (page, log, state, route, { settle = 2200 } = {}) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      const before = log.console.length;
      await gotoAndSettle(page, webUrl + route, settle);
      let m;
      try {
        m = await measure(page);
      } catch {
        // The page navigated by itself while being measured; record where it went
        await page.waitForLoadState('load').catch(() => {});
        await page.waitForTimeout(1500);
        m = { ...(await measure(page)), navigatedTo: new URL(page.url()).pathname };
      }
      // Whole pages at desktop and phone width; the first screen at the other widths (layout is
      // measured at every width either way)
      const file = [1440, 390].includes(width) ? await shot(page, `${state}${route}`, width) : await firstScreen(page, `${state}${route}`, width);
      report.push({ state, route, width, file, ...m, consoleErrors: log.console.slice(before) });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
  };

  try {
    // Signed out
    const visitor = await (await browser.newContext()).newPage();
    const visitorLog = watch(visitor, apiUrl);
    for (const route of PUBLIC) await audit(visitor, visitorLog, 'public', route);

    // Signed in, registered at phone width so onboarding is seen there too
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const log = watch(page, apiUrl);
    const api = apiClient(page, apiUrl);
    const email = `audit.${Date.now()}@example.com`;
    await page.goto(`${webUrl}/register`);
    await page.fill('input[placeholder="John Doe"]', 'Audit Student');
    await page.fill('input[type="email"]', email);
    for (const field of await page.locator('input[type="password"]').all()) await field.fill(PASSWORD);
    for (const box of await page.locator('input[type="checkbox"]').all()) await box.check().catch(() => {});
    await shot(page, 'register-filled', 390);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home', { timeout: 30_000 });
    await page.waitForTimeout(1500);
    await shot(page, 'onboarding', 390);
    await page.setViewportSize({ width: 1440, height: 900 });
    await shot(page, 'onboarding', 1440);
    await completeOnboarding(page, 'Frontend Engineer');

    // Empty states before any data
    for (const route of ['/home', '/resume', '/careers', '/applications', '/application-outcomes', '/portfolio', '/interviews']) {
      await audit(page, log, 'empty', route);
    }

    // Seed: resume, a saved job, an application elsewhere, portfolio sharing
    await gotoAndSettle(page, `${webUrl}/resume`, 1500);
    await page.locator('input[type="file"]').first().setInputFiles({ name: 'asha.pdf', mimeType: 'application/pdf', buffer: RESUME });
    for (let i = 0; i < 60; i++) {
      if ((await api('GET', '/resumes/me')).data?.resume?.parsingStatus === 'completed') break;
      await page.waitForTimeout(500);
    }
    await gotoAndSettle(page, `${webUrl}/job-agent`, 2500);
    await page.fill('input[placeholder^="Search by role"]', 'Developer Engineer Analyst').catch(() => {});
    await page.getByRole('button', { name: 'Search Opportunities' }).click().catch(() => {});
    await page.waitForTimeout(3000);
    await page.getByRole('button', { name: 'Save Role' }).first().click().catch(() => {});
    await page.waitForTimeout(1500);
    await gotoAndSettle(page, `${webUrl}/applications`, 2500);
    await page.getByText('Add an application you made elsewhere').click().catch(() => {});
    const form = page.getByRole('form', { name: 'Add an application' });
    await form.getByLabel('Job title').fill('Product Analyst').catch(() => {});
    await form.getByLabel('Employer').fill('Elsewhere Ltd').catch(() => {});
    await form.getByLabel(/Date you applied/).fill(new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10)).catch(() => {});
    await form.getByRole('button', { name: 'Add application' }).click().catch(() => {});
    await page.waitForTimeout(1500);
    let shareUrl = null;
    await gotoAndSettle(page, `${webUrl}/portfolio`, 2500);
    const share = page.getByTestId('portfolio-share');
    if (await share.count()) {
      await share.getByRole('button', { name: 'Switch sharing on' }).click().catch(() => {});
      await page.waitForTimeout(1500);
      shareUrl = await page.getByTestId('portfolio-share-link').innerText().catch(() => null);
    }

    // Every signed-in route with data
    for (const route of SIGNED_IN) await audit(page, log, 'user', route);

    // Public portfolio page
    if (shareUrl) {
      const shared = new URL(shareUrl.trim());
      await audit(visitor, visitorLog, 'public', shared.pathname);
    }

    // Loading states: slow API, screenshot after one second
    for (const route of ['/home', '/careers', '/applications', '/market']) {
      await page.route('**/api/v1/**', async (r) => {
        await new Promise((res) => setTimeout(res, 6000));
        await r.continue().catch(() => {});
      });
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(webUrl + route);
        await page.waitForTimeout(1000);
        report.push({ state: 'loading', route, width, file: await shot(page, `loading${route}`, width), ...(await measure(page).catch(() => ({}))) });
      }
      await page.unroute('**/api/v1/**');
    }

    // Error states: every API call for the page fails
    for (const route of ['/home', '/careers', '/applications', '/market', '/resume']) {
      await page.route('**/api/v1/**', (r) => (r.request().url().includes('/auth/') ? r.continue() : r.fulfill({ status: 500, contentType: 'application/json', body: '{"success":false,"message":"Server error"}' })));
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await gotoAndSettle(page, webUrl + route, 3000);
        report.push({ state: 'error', route, width, file: await shot(page, `error${route}`, width), ...(await measure(page).catch(() => ({}))) });
      }
      await page.unroute('**/api/v1/**');
    }
    await page.setViewportSize({ width: 1440, height: 900 });

    // Administrator
    setRole(tmpDir, email, 'admin');
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const admin = await adminContext.newPage();
    const adminLog = watch(admin, apiUrl);
    await admin.goto(`${webUrl}/login`);
    await admin.fill('input[type="email"]', email);
    await admin.fill('input[type="password"]', PASSWORD);
    await admin.click('button[type="submit"]');
    await admin.waitForURL('**/home', { timeout: 20_000 });
    await audit(admin, adminLog, 'admin', '/ai-observability', { settle: 3000 });
    await audit(admin, adminLog, 'admin', '/employer-postings');
    await adminContext.close();
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  }

  const problems = report.filter((r) => r.navigatedTo || r.overflow > 1 || r.clippedX > 1 || r.offscreenCount || r.dialogs?.length || r.errorScreen || r.consoleErrors?.length);
  console.log(`[audit] ${report.length} captures, ${problems.length} with layout problems; report.json in ${outDir}`);
  for (const p of problems) console.log(`  ${p.state} ${p.route} ${p.width}px ${p.navigatedTo ? 'navigated to ' + p.navigatedTo + ' ' : ''}overflow=${p.overflow} clippedX=${p.clippedX} offscreen=${p.offscreenCount} ${(p.offscreen || []).join('; ')} dialogs=${p.dialogs} error=${p.errorScreen} console=${(p.consoleErrors || []).length}`);
  return 0;
}
