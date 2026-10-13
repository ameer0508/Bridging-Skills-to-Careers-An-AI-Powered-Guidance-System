// Recorded answers (D1) through the browser's REAL capture and codec path, in Edge and Chrome.
//
// The browser's own fake capture device plays a generated 440 Hz tone (SYNTHETIC TEST DATA) as
// if it were a microphone. Everything after that is real: getUserMedia, the MediaStream track,
// MediaRecorder's WebM/Opus encoder, the multipart upload, server storage, the owner-only audio
// endpoint and the browser's own decoder. It is NOT a physical microphone and does not replace
// the owner's manual test (docs/MANUAL_VOICE_TEST_PLAN.md). Run with
//   E2E_TEST_FILE=./tests/voiceRealCodec.mjs node run.mjs
import fs from 'node:fs';
import path from 'node:path';
import { Reporter, apiClient, completeOnboarding, expect, gotoAndSettle, launchBrowser, register, watch } from '../lib/harness.mjs';

const PASSWORD = 'Password123!';
const TONE_HZ = 440;
const ANSWER = 'I would agree the definitions with both teams first, then build one report that both sign off.';

/** A 4-second, 48 kHz, 16-bit mono WAV of a 440 Hz sine tone. */
function toneWav(file) {
  const rate = 48_000;
  const samples = rate * 4;
  const data = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i += 1) data.writeInt16LE(Math.round(Math.sin((2 * Math.PI * TONE_HZ * i) / rate) * 0.5 * 32767), i * 2);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([header, data]));
}

/** Wraps (does not replace) getUserMedia so the test can count requests and see the real tracks. */
const watchMicrophone = () => {
  const real = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  const mic = { requests: 0, tracks: [] };
  window.__mic = mic;
  navigator.mediaDevices.getUserMedia = async (constraints) => {
    mic.requests += 1;
    const stream = await real(constraints);
    stream.getTracks().forEach((t) => mic.tracks.push(t));
    return stream;
  };
};

/** Decodes audio with the browser's own decoder and measures it. */
const analyseInPage = async (src) => {
  const buffer = await (await fetch(src)).arrayBuffer();
  // decodeAudioData detaches the buffer, so its size is read first
  const bytes = buffer.byteLength;
  const audio = await new OfflineAudioContext(1, 48_000, 48_000).decodeAudioData(buffer);
  const d = audio.getChannelData(0);
  let sum = 0;
  let crossings = 0;
  for (let i = 0; i < d.length; i += 1) {
    sum += d[i] * d[i];
    if (i > 0 && d[i - 1] < 0 !== d[i] < 0) crossings += 1;
  }
  return { bytes, duration: audio.duration, rms: Math.sqrt(sum / d.length), hz: crossings / 2 / audio.duration };
};

async function runChannel(t, channel, { webUrl, apiUrl, tmpDir }, wav) {
  const stamp = `${Date.now()}.${channel}`;
  const tag = (name) => `[${channel}] ${name}`;
  let browser;
  try {
    ({ browser } = await launchBrowser({
      channel,
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${wav}`],
    }));
  } catch (error) {
    t.record(tag('browser available'), false, String(error.message).split('\n')[0], Date.now());
    return;
  }
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await context.addInitScript(watchMicrophone);
  const page = await context.newPage();
  const log = watch(page, apiUrl);
  const api = apiClient(page, apiUrl);
  const latestSession = async () => (await api('GET', '/interviews/history')).data.history[0];
  let round;
  let first;

  const recordFor = async (ms) => {
    await page.getByRole('button', { name: /^Record (answer|again)$/ }).click();
    await page.getByRole('button', { name: /Stop recording/ }).waitFor({ timeout: 10_000 });
    await page.waitForTimeout(ms);
    await page.getByRole('button', { name: /Stop recording/ }).click();
    await page.getByRole('button', { name: 'Listen' }).waitFor({ timeout: 15_000 });
  };
  const audioUrl = (session, questionId) => `/interviews/${session}/recordings/${encodeURIComponent(questionId)}/audio`;

  try {
    await t.step(tag('register and open a round'), async () => {
      await register(page, webUrl, 'Codec Tester', `codec.${stamp}@example.com`, PASSWORD);
      await completeOnboarding(page, 'Data Analyst');
      await gotoAndSettle(page, `${webUrl}/interview-agent`, 2000);
      await page.getByRole('button', { name: /ENTER INTERVIEW STUDIO/ }).click();
      await page.locator('textarea').first().waitFor({ timeout: 20_000 });
      round = (await latestSession())._id;
      return `browser ${browser.version()}`;
    });

    await t.step(tag('the microphone is not requested before consent'), async () => {
      await page.getByRole('button', { name: 'Record spoken answers' }).click();
      await page.getByTestId('recording-consent').waitFor({ timeout: 10_000 });
      expect((await page.evaluate(() => window.__mic.requests)) === 0, 'getUserMedia was called before consent');
      const dialog = page.getByTestId('recording-consent');
      await dialog.getByLabel('Keep recordings').selectOption('7');
      await dialog.getByRole('button', { name: 'Allow recording' }).click();
      await page.getByTestId('recording-status').waitFor({ timeout: 10_000 });
      expect((await page.evaluate(() => window.__mic.requests)) === 0, 'consent alone opened the microphone');
    });

    await t.step(tag('a real capture track is recorded by the real encoder, and released on stop'), async () => {
      await recordFor(2500);
      const mic = await page.evaluate(() => ({
        requests: window.__mic.requests,
        tracks: window.__mic.tracks.map((x) => ({ kind: x.kind, label: x.label, state: x.readyState })),
        mime: MediaRecorder.isTypeSupported('audio/webm;codecs=opus'),
      }));
      expect(mic.requests === 1 && mic.tracks.length === 1 && mic.tracks[0].kind === 'audio', `tracks ${JSON.stringify(mic)}`);
      expect(mic.tracks.every((x) => x.state === 'ended'), `the microphone was not released: ${JSON.stringify(mic.tracks)}`);
      const stored = (await api('GET', `/interviews/${round}/recordings`)).data.recordings;
      expect(stored.length === 1 && stored[0].mimeType === 'audio/webm' && stored[0].bytes > 4000, `stored ${JSON.stringify(stored)}`);
      first = stored[0];
      return `device "${mic.tracks[0].label}" (browser fake device, not a physical microphone); ${first.bytes} bytes ${first.mimeType}, ${first.durationSec}s`;
    });

    await t.step(tag('playback decodes to the recorded tone'), async () => {
      await page.getByRole('button', { name: 'Listen' }).click();
      const player = page.getByTestId('recording-player');
      await player.waitFor({ timeout: 10_000 });
      const measured = await page.evaluate(analyseInPage, await player.getAttribute('src'));
      expect(measured.bytes === first.bytes, `played ${measured.bytes} bytes, stored ${first.bytes}`);
      expect(measured.duration >= 1.5 && measured.duration <= 4, `decoded duration ${measured.duration}`);
      expect(measured.rms > 0.05, `audio is silent (rms ${measured.rms})`);
      expect(Math.abs(measured.hz - TONE_HZ) < 40, `decoded pitch ${measured.hz.toFixed(0)} Hz, expected ${TONE_HZ}`);
      const playable = await player.evaluate((el) => new Promise((resolve) => {
        if (el.readyState >= 1) resolve(true);
        el.addEventListener('loadedmetadata', () => resolve(true), { once: true });
        el.addEventListener('error', () => resolve(false), { once: true });
        setTimeout(() => resolve(el.readyState >= 1), 5000);
      }));
      expect(playable, 'the audio element could not load the recording');
      return `decoded ${measured.duration.toFixed(2)}s, rms ${measured.rms.toFixed(3)}, ${measured.hz.toFixed(0)} Hz`;
    });

    await t.step(tag('the recording survives a reload byte for byte'), async () => {
      await page.reload();
      await page.waitForTimeout(2000);
      const listed = (await api('GET', `/interviews/${round}/recordings`)).data.recordings;
      const audio = await api('GET', audioUrl(round, first.questionId));
      const bytes = Number(audio.headers.get('content-length'));
      expect(listed.length === 1 && audio.status === 200 && bytes === first.bytes, `after reload: ${listed.length} listed, ${audio.status}, ${bytes} bytes`);
    });

    await t.step(tag('a second account cannot list or play it'), async () => {
      const other = await browser.newContext();
      const otherPage = await other.newPage();
      const otherApi = apiClient(otherPage, apiUrl);
      await register(otherPage, webUrl, 'Codec Other', `codec.other.${stamp}@example.com`, PASSWORD);
      await completeOnboarding(otherPage, 'Data Analyst');
      const play = (await otherApi('GET', audioUrl(round, first.questionId))).status;
      const list = (await otherApi('GET', `/interviews/${round}/recordings`)).status;
      const remove = (await otherApi('DELETE', `/interviews/${round}/recordings/${encodeURIComponent(first.questionId)}`)).status;
      await other.close();
      const still = (await api('GET', `/interviews/${round}/recordings`)).data.recordings.length;
      expect(play === 404 && list === 404 && remove === 404 && still === 1, `other account: play ${play}, list ${list}, delete ${remove}; owner still has ${still}`);
    });

    await t.step(tag('recording again replaces the answer; deletion is final'), async () => {
      await gotoAndSettle(page, `${webUrl}/interview-agent`, 2000);
      await page.getByRole('button', { name: /ENTER INTERVIEW STUDIO/ }).click();
      await page.locator('textarea').first().waitFor({ timeout: 20_000 });
      round = (await latestSession())._id;
      await recordFor(1500);
      const before = (await api('GET', `/interviews/${round}/recordings`)).data.recordings;
      await recordFor(2500);
      const after = (await api('GET', `/interviews/${round}/recordings`)).data.recordings;
      expect(before.length === 1 && after.length === 1, `replacement: ${before.length} then ${after.length} listed`);
      expect(after[0].bytes !== before[0].bytes && new Date(after[0].createdAt) > new Date(before[0].createdAt), `the replacement is not the new take: ${JSON.stringify([before[0], after[0]])}`);
      await page.getByRole('button', { name: 'Delete recording' }).click();
      await page.getByRole('button', { name: 'Record answer' }).waitFor({ timeout: 10_000 });
      await page.reload();
      await page.waitForTimeout(2000);
      const gone = (await api('GET', `/interviews/${round}/recordings`)).data.recordings.length;
      const play = (await api('GET', audioUrl(round, after[0].questionId))).status;
      expect(gone === 0 && play === 404, `after delete and reload: ${gone} listed, audio ${play}`);
    });

    await t.step(tag('"until this round ends" deletes the recording when the round is concluded'), async () => {
      await gotoAndSettle(page, `${webUrl}/interview-agent`, 2000);
      await page.getByRole('button', { name: /ENTER INTERVIEW STUDIO/ }).click();
      await page.locator('textarea').first().waitFor({ timeout: 20_000 });
      round = (await latestSession())._id;
      page.once('dialog', (d) => d.accept());
      await page.getByRole('button', { name: 'Turn off recording' }).click();
      await page.getByRole('button', { name: 'Record spoken answers' }).click();
      const dialog = page.getByTestId('recording-consent');
      await dialog.getByLabel('Keep recordings').selectOption('0');
      await dialog.getByRole('button', { name: 'Allow recording' }).click();
      await page.getByTestId('recording-status').waitFor({ timeout: 10_000 });
      await recordFor(1500);
      const during = (await api('GET', `/interviews/${round}/recordings`)).data.recordings.length;
      await page.getByLabel('Your answer').fill(ANSWER);
      await page.getByRole('button', { name: /Submit for AI Evaluation/ }).click();
      await page.waitForTimeout(1500);
      await page.getByRole('button', { name: /Conclude Round/ }).click();
      await page.waitForTimeout(3000);
      const after = (await api('GET', `/interviews/${round}/recordings`)).data.recordings.length;
      expect(during === 1 && after === 0, `recordings during the round ${during}, after concluding ${after}`);
    });

    await t.step(tag('no unexpected API failures or console errors'), async () => {
      const failed = log.failed.filter((f) => !/^404 GET \/interviews\/[a-f0-9]+\/recordings\/[^/]+\/audio$/.test(f));
      expect(failed.length === 0, `API failures: ${failed.join(', ')}`);
      const consoleErrors = log.console.filter((c) => !/status of 404/.test(c));
      expect(consoleErrors.length === 0, `console errors: ${consoleErrors.slice(0, 4).join(' | ')}`);
    });
  } finally {
    await browser.close();
  }

  // A denied microphone: the same browser WITHOUT the auto-accept flag, so the real permission
  // check refuses. Typing must still work.
  await t.step(tag('a denied microphone is explained and typing still works'), async () => {
    const { browser: strict } = await launchBrowser({ channel, args: ['--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${wav}`] });
    try {
      const ctx = await strict.newContext({ viewport: { width: 1366, height: 900 } });
      await ctx.addInitScript(watchMicrophone);
      const p = await ctx.newPage();
      const papi = apiClient(p, apiUrl);
      await register(p, webUrl, 'Codec Denied', `codec.denied.${stamp}@example.com`, PASSWORD);
      await completeOnboarding(p, 'Data Analyst');
      await gotoAndSettle(p, `${webUrl}/interview-agent`, 2000);
      await p.getByRole('button', { name: /ENTER INTERVIEW STUDIO/ }).click();
      await p.locator('textarea').first().waitFor({ timeout: 20_000 });
      await p.getByRole('button', { name: 'Record spoken answers' }).click();
      const dialog = p.getByTestId('recording-consent');
      await dialog.getByRole('button', { name: 'Allow recording' }).click();
      await p.getByTestId('recording-status').waitFor({ timeout: 10_000 });
      await p.getByRole('button', { name: 'Record answer' }).click();
      await p.getByText('The microphone could not be used').waitFor({ timeout: 10_000 });
      const tracks = await p.evaluate(() => window.__mic.tracks.length);
      await p.getByLabel('Your answer').fill(ANSWER);
      await p.getByRole('button', { name: /Submit for AI Evaluation/ }).click();
      await p.waitForTimeout(1500);
      const stored = (await papi('GET', '/interviews/history')).data.history[0];
      expect(tracks === 0, `a track was opened despite the refusal (${tracks})`);
      expect(stored.questions[0].answerInputMethod === 'typed' && /definitions/.test(stored.questions[0].candidateResponse), 'the typed answer was not stored');
    } finally {
      await strict.close();
    }
  });
}

export async function run(env) {
  const t = new Reporter();
  const wav = path.join(env.tmpDir, 'synthetic-tone-440hz.wav');
  toneWav(wav);
  const channels = (process.env.E2E_CODEC_CHANNELS || 'msedge,chrome').split(',').map((c) => c.trim()).filter(Boolean);
  for (const channel of channels) await runChannel(t, channel, env, wav);
  const failures = t.results.filter((r) => !r.ok).length;
  console.log(`\nSUMMARY ${t.results.length - failures}/${t.results.length} passed`);
  return failures;
}
