// Smoke test for the Docker Compose stack. It talks to the running containers over HTTP only,
// with synthetic users and a generated resume, and needs no dependencies beyond Node.js.
//
//   node e2e/docker-smoke.mjs            full run: readiness, connectivity, auth, resume-to-career
//   node e2e/docker-smoke.mjs --verify   after a restart: the same account and its data still exist
//
// WEB_URL   where nginx serves the app   (default http://localhost:3000)
// API_URL   where the backend is published (default http://localhost:5000)
// SMOKE_STATE  file used to pass the synthetic account from the first run to --verify
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { makeTextPdf } from './lib/pdf.mjs';

const WEB = (process.env.WEB_URL || 'http://localhost:3000').replace(/\/$/, '');
const BACKEND = (process.env.API_URL || 'http://localhost:5000').replace(/\/$/, '');
const API = `${WEB}/api/v1`; // through nginx, the way a browser reaches the API
const STATE_FILE = process.env.SMOKE_STATE || path.join(os.tmpdir(), 'skillbridge-docker-smoke.json');
const verifyOnly = process.argv.includes('--verify');

const results = [];
async function check(name, fn) {
  try {
    const detail = await fn();
    results.push(true);
    console.log(`PASS  ${name}${detail ? `  — ${detail}` : ''}`);
  } catch (error) {
    results.push(false);
    console.log(`FAIL  ${name}  — ${String(error.message).replace(/\s+/g, ' ').slice(0, 400)}`);
  }
}
const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};

async function call(method, url, { token, json, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(url, { method, headers, body: form ?? (json !== undefined ? JSON.stringify(json) : undefined) });
  const text = await res.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    // not JSON
  }
  return { status: res.status, body, text, headers: res.headers };
}

async function waitUntil(label, probe, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  let last = 'no response';
  while (Date.now() < deadline) {
    try {
      const outcome = await probe();
      if (outcome === true) return;
      last = String(outcome);
    } catch (error) {
      last = error.message;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`${label} was not ready in ${timeoutMs / 1000}s (${last})`);
}

const RESUME_LINES = [
  'Priya Sharma',
  'Email: priya.sharma@example.com',
  'Phone: +1 555-0100',
  '',
  'Experience',
  'Frontend Developer at Example Co (2022 - 2024)',
  '- Built dashboards with React, TypeScript and JavaScript.',
  '- Wrote REST APIs in Node.js and stored data in MongoDB.',
  '',
  'Projects',
  'Campus Marketplace',
  '- Full stack web app using React, Node.js, Express.js and MongoDB.',
  '',
  'Education',
  'B.Tech Computer Science, Example University, 2022',
  '',
  'Skills',
  'React, TypeScript, JavaScript, Node.js, Express.js, MongoDB, HTML, CSS, Git',
];

async function fullRun() {
  const stamp = Date.now();
  const account = { fullName: 'Compose Tester', email: `compose.${stamp}@example.com`, password: 'Password123!' };
  let token = null;

  await check('backend reports healthy with its database connected', async () => {
    await waitUntil('backend /health', async () => {
      const res = await call('GET', `${BACKEND}/health`);
      return res.status === 200 && res.body?.services?.database === 'UP' ? true : `HTTP ${res.status}`;
    });
  });
  await check('frontend is served by nginx', async () => {
    await waitUntil('frontend', async () => ((await call('GET', `${WEB}/`)).status === 200 ? true : 'not 200'), 60_000);
    const page = await call('GET', `${WEB}/`);
    expect(/<div id="root">/.test(page.text), 'the page is not the built application');
    const deepLink = await call('GET', `${WEB}/careers`);
    expect(deepLink.status === 200 && /<div id="root">/.test(deepLink.text), 'client-side routes are not served');
  });
  await check('frontend reaches the backend through nginx', async () => {
    const res = await call('GET', `${API}/users/me`);
    expect(res.status === 401 && res.body?.error?.code === 'UNAUTHORIZED', `expected the API's own 401, got ${res.status} ${res.text.slice(0, 80)}`);
    return 'GET /api/v1/users/me answered by the backend with 401';
  });
  await check('diagnostics are not public in the deployed stack', async () => {
    expect((await call('GET', `${API}/realtime`)).status === 401, 'the diagnostics endpoint answered without a token');
    const root = await call('GET', `${BACKEND}/`);
    expect(!/memory|node_version|_count/.test(root.text), 'the backend root exposes system details');
  });

  await check('register and sign in with a synthetic user', async () => {
    const weak = await call('POST', `${API}/auth/register`, { json: { ...account, password: '123' } });
    expect(weak.status === 400, `a weak password was accepted (${weak.status})`);
    const registered = await call('POST', `${API}/auth/register`, { json: account });
    expect(registered.status === 201, `register ${registered.status} ${registered.text.slice(0, 120)}`);
    const wrong = await call('POST', `${API}/auth/login`, { json: { email: account.email, password: 'WrongPassword1!' } });
    expect(wrong.status === 401, `wrong password answered ${wrong.status}`);
    const login = await call('POST', `${API}/auth/login`, { json: { email: account.email, password: account.password } });
    expect(login.status === 200 && login.body.data.accessToken, `login ${login.status}`);
    token = login.body.data.accessToken;
    const refreshed = await call('POST', `${API}/auth/refresh`, { json: { refreshToken: login.body.data.refreshToken } });
    expect(refreshed.status === 200, `refresh ${refreshed.status}`);
    token = refreshed.body.data.accessToken;
    const me = await call('GET', `${API}/users/me`, { token });
    expect(me.status === 200 && me.body.data.email === account.email, 'the profile is not the registered user');
    const onboarded = await call('PUT', `${API}/users/me`, { token, json: { targetRole: 'Full Stack Developer' } });
    expect(onboarded.status === 200, `profile update ${onboarded.status}`);
  });
  if (!token) return;

  await check('backend reaches the AI service: an uploaded PDF is parsed', async () => {
    const form = new FormData();
    form.append('resume', new Blob([makeTextPdf(RESUME_LINES)], { type: 'application/pdf' }), 'priya-sharma.pdf');
    const upload = await call('POST', `${API}/resumes/upload`, { token, form });
    expect(upload.status === 201, `upload ${upload.status} ${upload.text.slice(0, 160)}`);
    let resume = null;
    await waitUntil('resume processing', async () => {
      resume = (await call('GET', `${API}/resumes/me`, { token })).body?.data?.resume;
      return resume && ['completed', 'failed'].includes(resume.parsingStatus) ? true : resume?.parsingStatus;
    }, 120_000);
    expect(resume.parsingStatus === 'completed', `processing failed: ${resume.parsingError}`);
    expect(resume.personalInfo?.fullName?.value === 'Priya Sharma', `name parsed as ${JSON.stringify(resume.personalInfo?.fullName?.value)}`);
    return `parsed by the AI service container: ${resume.personalInfo.fullName.value}`;
  });

  await check('resume to career: skills, matches, readiness, recommendations, roadmap, snapshot', async () => {
    const skills = (await call('GET', `${API}/skills/me`, { token })).body.data;
    expect(skills.totalSkills >= 8, `only ${skills.totalSkills} skills`);
    const matches = (await call('GET', `${API}/careers/matches`, { token })).body.data.matches;
    expect(matches.length > 0 && matches[0].breakdown?.length > 0, 'no career matches with a breakdown');
    const readiness = (await call('GET', `${API}/readiness`, { token })).body.data;
    expect(JSON.stringify(readiness).includes('overallScore'), 'no readiness scores');
    const recs = (await call('GET', `${API}/recommendations`, { token })).body.data.recommendations;
    expect(recs.length > 0, 'no recommendations');
    const roadmap = (await call('GET', `${API}/roadmap/${matches[0].careerId._id}`, { token })).body.data.roadmap;
    expect(roadmap?.phases?.length > 0, 'no roadmap');
    const snapshot = (await call('GET', `${API}/users/me/career-snapshot`, { token })).body.data;
    expect(snapshot.resumeInfo.hasResume && snapshot.readinessScore > 0, 'the snapshot does not reflect the resume');
    return `${skills.totalSkills} skills, top match ${matches[0].careerId.title} ${matches[0].matchScore}%, readiness ${snapshot.readinessScore}%, ${recs.length} recommendations`;
  });

  await check('stored file can be downloaded (uploads volume is writable)', async () => {
    const res = await fetch(`${API}/resumes/download`, { headers: { Authorization: `Bearer ${token}` } });
    const bytes = Buffer.from(await res.arrayBuffer());
    expect(res.status === 200 && bytes.equals(makeTextPdf(RESUME_LINES)), `download ${res.status}, ${bytes.length} bytes`);
  });

  await check('without provider keys AI features use labelled fallbacks, not invented output', async () => {
    const conversation = (await call('POST', `${API}/ai`, { token, json: {} })).body.data;
    const reply = (await call('POST', `${API}/ai/${conversation._id}/messages`, { token, json: { content: 'What should I learn next?' } })).body.data;
    expect(reply.isFallback === true && reply.source === 'fallback', `chat reply source is ${reply.source}`);
    expect(/not an AI-generated answer/.test(reply.content) && !/Mock AI/.test(reply.content), 'the fallback is not labelled');
    const session = (await call('POST', `${API}/interviews`, { token, json: { mode: 'mixed', questionCount: 3 } })).body.data;
    expect(session.questionSource === 'question_bank' && session.questions.length === 3, `interview source ${session.questionSource}`);
    const jobs = (await call('GET', `${API}/opportunities?search=Developer`, { token })).body.data;
    expect(jobs.meta.source === 'sample' && jobs.opportunities.every((o) => o.isSample), 'job listings are not labelled as demo');
    return 'chat fallback, question-bank interview, demo job listings';
  });

  await check('a second user sees none of the first user\'s data', async () => {
    const other = { fullName: 'Other Person', email: `compose.other.${stamp}@example.com`, password: 'Password123!' };
    const registered = await call('POST', `${API}/auth/register`, { json: other });
    expect(registered.status === 201, `register ${registered.status}`);
    const otherToken = registered.body.data.accessToken;
    expect((await call('GET', `${API}/resumes/me`, { token: otherToken })).body.data.resume === null, 'the other user sees a resume');
    expect((await call('GET', `${API}/skills/me`, { token: otherToken })).body.data.totalSkills === 0, 'the other user sees skills');
    expect((await call('GET', `${API}/resumes/download`, { token: otherToken })).status === 404, 'the other user can download the file');
  });

  fs.writeFileSync(STATE_FILE, JSON.stringify(account));
}

async function verifyRun() {
  const account = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  await check('after a restart the account, resume and derived data are still there', async () => {
    await waitUntil('backend /health', async () => ((await call('GET', `${BACKEND}/health`)).status === 200 ? true : 'not healthy'));
    const login = await call('POST', `${API}/auth/login`, { json: { email: account.email, password: account.password } });
    expect(login.status === 200, `login after restart ${login.status}`);
    const token = login.body.data.accessToken;
    const resume = (await call('GET', `${API}/resumes/me`, { token })).body.data.resume;
    expect(resume?.originalFileName === 'priya-sharma.pdf' && resume.parsingStatus === 'completed', 'the resume record is gone');
    expect((await call('GET', `${API}/skills/me`, { token })).body.data.totalSkills >= 8, 'skills are gone');
    const download = await fetch(`${API}/resumes/download`, { headers: { Authorization: `Bearer ${token}` } });
    expect(download.status === 200, `the stored file is gone (${download.status})`);
    return 'database volume and uploads volume both survived';
  });
}

await (verifyOnly ? verifyRun() : fullRun());
const failed = results.filter((ok) => !ok).length;
console.log(`\nSUMMARY ${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
