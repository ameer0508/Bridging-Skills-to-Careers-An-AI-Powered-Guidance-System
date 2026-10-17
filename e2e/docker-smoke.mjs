// Smoke test for the Docker Compose stack. It talks to the running containers over HTTP only,
// with synthetic users and a generated resume, and needs no dependencies beyond Node.js.
//
//   node e2e/docker-smoke.mjs            full run: readiness, connectivity, auth, resume-to-career
//   node e2e/docker-smoke.mjs --verify   after a restart: the same account and its data still exist
//   node e2e/docker-smoke.mjs --after-expiry   after recordings were expired and the retention job ran
//
// WEB_URL   where nginx serves the app   (default http://localhost:3000)
// API_URL   where the backend is published (default http://localhost:5000)
// SMOKE_STATE  file used to pass the synthetic account from the first run to --verify
// SMOKE_AI_MODE  none | local | auto (default): which chat outcome is required (see the chat check)
// SMOKE_LOCAL_MODEL  with a local model, the model name the reply must carry
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { makeTextPdf } from './lib/pdf.mjs';
import { checkCareerExplanation } from './lib/explanationSmoke.mjs';

const WEB = (process.env.WEB_URL || 'http://localhost:3000').replace(/\/$/, '');
const BACKEND = (process.env.API_URL || 'http://localhost:5000').replace(/\/$/, '');
const API = `${WEB}/api/v1`; // through nginx, the way a browser reaches the API
const STATE_FILE = process.env.SMOKE_STATE || path.join(os.tmpdir(), 'skillbridge-docker-smoke.json');
const verifyOnly = process.argv.includes('--verify');
const afterExpiry = process.argv.includes('--after-expiry');

// A few bytes with a WebM signature: enough for the server's format check, and no real audio
const fakeWebm = (marker) => Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.from(`synthetic-recording-${marker}`)]);
const audioUrl = (r) => `${API}/interviews/${r.sessionId}/recordings/${encodeURIComponent(r.questionId)}/audio`;
async function fetchAudio(token, r) {
  const res = await fetch(audioUrl(r), { headers: { Authorization: `Bearer ${token}` } });
  return { status: res.status, bytes: Buffer.from(await res.arrayBuffer()) };
}

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

  // SMOKE_AI_MODE says which chat outcome is required: "none" (no permitted provider: the
  // labelled fallback, as in CI), "local" (the local Ollama model must answer, labelled with it),
  // or "auto" (either, each correctly labelled). In every mode an external provider answering
  // fails: chat carries personal data and may only reach a local model.
  const aiMode = (process.env.SMOKE_AI_MODE || 'auto').toLowerCase();
  const localModel = process.env.SMOKE_LOCAL_MODEL || '';
  await check(`chat is answered honestly (${aiMode})`, async () => {
    const conversation = (await call('POST', `${API}/ai`, { token, json: {} })).body.data;
    const res = await call('POST', `${API}/ai/${conversation._id}/messages`, { token, json: { content: 'What should I learn next?' } });
    expect(res.status === 200, `chat answered ${res.status}`);
    const reply = res.body.data;
    expect(!['gemini', 'openai', 'huggingface'].includes(reply.aiProvider), `chat was answered by the external provider ${reply.aiProvider}`);
    if (reply.source === 'ai') {
      expect(aiMode !== 'none', 'an AI reply arrived although no provider is permitted');
      expect(reply.isFallback === false && reply.aiProvider === 'local', `AI reply attributed to ${reply.aiProvider}`);
      expect(reply.aiModel && (!localModel || reply.aiModel === localModel), `AI reply model ${reply.aiModel}, expected ${localModel || 'a model name'}`);
      expect(reply.content.trim().length > 0 && !/Mock AI|not an AI-generated answer/i.test(reply.content), 'the AI reply is empty, canned or labelled as a fallback');
      return `answered by ${reply.aiProvider} / ${reply.aiModel}`;
    }
    expect(aiMode !== 'local', `the local model did not answer (source ${reply.source}, reason ${reply.fallbackReason})`);
    expect(reply.source === 'fallback' && reply.isFallback === true && !reply.aiProvider, `chat reply source is ${reply.source}`);
    expect(/not an AI-generated answer/.test(reply.content) && !/Mock AI/.test(reply.content), 'the fallback is not labelled');
    return `labelled fallback (${reply.fallbackReason})`;
  });

  await check('interview questions come from the labelled question bank', async () => {
    const session = (await call('POST', `${API}/interviews`, { token, json: { mode: 'mixed', questionCount: 3 } })).body.data;
    expect(session.questionSource === 'question_bank' && session.questions.length === 3, `interview source ${session.questionSource}`);
    return '3 question-bank questions';
  });

  await check('job listings without a provider are labelled demo data', async () => {
    const jobs = (await call('GET', `${API}/opportunities?search=Developer`, { token })).body.data;
    expect(jobs.meta.source === 'sample' && jobs.opportunities.every((o) => o.isSample), 'job listings are not labelled as demo');
    return `${jobs.opportunities.length} sample listings`;
  });

  let otherToken = null;
  await check('a second user sees none of the first user\'s data', async () => {
    const other = { fullName: 'Other Person', email: `compose.other.${stamp}@example.com`, password: 'Password123!' };
    const registered = await call('POST', `${API}/auth/register`, { json: other });
    expect(registered.status === 201, `register ${registered.status}`);
    otherToken = registered.body.data.accessToken;
    expect((await call('GET', `${API}/resumes/me`, { token: otherToken })).body.data.resume === null, 'the other user sees a resume');
    expect((await call('GET', `${API}/skills/me`, { token: otherToken })).body.data.totalSkills === 0, 'the other user sees skills');
    expect((await call('GET', `${API}/resumes/download`, { token: otherToken })).status === 404, 'the other user can download the file');
  });

  // The optional local-AI explanation of a match (docs/AI_EXPLANATIONS.md): owner only, reading never
  // generates, and with no model (CI) generating gives the labelled AI_UNAVAILABLE and stores nothing
  await check(`career explanation is answered honestly (${aiMode})`, () =>
    checkCareerExplanation({ api: API, call, token, otherToken, aiMode, localModel }));

  await check('interview recordings: refused without consent, then stored privately and played back to their owner', async () => {
    const session = (await call('POST', `${API}/interviews`, { token, json: { mode: 'mixed', questionCount: 3 } })).body.data;
    const upload = (index) => {
      const form = new FormData();
      form.append('audio', new Blob([new Uint8Array(fakeWebm(index))], { type: 'audio/webm' }), 'answer.webm');
      form.append('questionIndex', String(index));
      return call('POST', `${API}/interviews/${session._id}/recordings`, { token, form });
    };
    expect((await upload(0)).status === 403, 'a recording was accepted without consent');
    const consent = await call('PUT', `${API}/interviews/voice-settings`, { token, json: { recordingConsent: true, retentionDays: 7 } });
    expect(consent.status === 200 && consent.body.data.recordingConsent === true, `consent ${consent.status}`);
    for (const index of [0, 1]) {
      const stored = await upload(index);
      expect(stored.status === 201, `upload ${index}: ${stored.status}`);
      expect(!JSON.stringify(stored.body).includes('/app/storage'), 'the storage path is returned to the client');
    }
    account.recordings = [0, 1].map((index) => ({ sessionId: session._id, questionId: session.questions[index].questionId, index }));
    for (const r of account.recordings) {
      const audio = await fetchAudio(token, r);
      expect(audio.status === 200 && audio.bytes.equals(fakeWebm(r.index)), `playback ${audio.status}, ${audio.bytes.length} bytes`);
    }
    expect((await fetch(audioUrl(account.recordings[0]))).status === 401, 'a recording can be fetched without signing in');
    return 'two recordings stored and played back';
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

  await check('after a restart the recordings are still there; deleting one removes it', async () => {
    const login = await call('POST', `${API}/auth/login`, { json: { email: account.email, password: account.password } });
    const token = login.body.data.accessToken;
    for (const r of account.recordings) {
      const audio = await fetchAudio(token, r);
      expect(audio.status === 200 && audio.bytes.equals(fakeWebm(r.index)), `recording ${r.index} after restart: ${audio.status}`);
    }
    const [first] = account.recordings;
    const removed = await call('DELETE', `${API}/interviews/${first.sessionId}/recordings/${encodeURIComponent(first.questionId)}`, { token });
    expect(removed.status === 200 && removed.body.data.deleted === 1 && removed.body.data.pendingDeletion === 0, `delete ${removed.status} ${JSON.stringify(removed.body?.data)}`);
    expect((await fetchAudio(token, first)).status === 404, 'a deleted recording can still be played');
    const left = (await call('GET', `${API}/interviews/${first.sessionId}/recordings`, { token })).body.data.recordings;
    expect(left.length === 1, `${left.length} recordings listed after deleting one of two`);
    return 'recordings persisted on the storage volume; one deleted, one kept';
  });
}

async function afterExpiryRun() {
  const account = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  await check('after expiry and the retention job no recording can be listed or played', async () => {
    const login = await call('POST', `${API}/auth/login`, { json: { email: account.email, password: account.password } });
    const token = login.body.data.accessToken;
    const kept = account.recordings[1];
    const listed = (await call('GET', `${API}/interviews/${kept.sessionId}/recordings`, { token })).body.data.recordings;
    expect(listed.length === 0, `${listed.length} recordings still listed`);
    expect((await fetchAudio(token, kept)).status === 404, 'an expired recording can still be played');
  });
}

await (afterExpiry ? afterExpiryRun() : verifyOnly ? verifyRun() : fullRun());
const failed = results.filter((ok) => !ok).length;
console.log(`\nSUMMARY ${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
