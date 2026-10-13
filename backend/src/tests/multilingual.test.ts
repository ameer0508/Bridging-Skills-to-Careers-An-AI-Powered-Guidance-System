import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import UserSkill from '../models/UserSkill.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * E5/X1 on the backend: declared languages, a persisted interface language, multilingual analyses
 * forwarded to the AI service and stored with their original lines for their owner only, file and
 * text validation, an honest 503 when the AI service is down, and no effect on career skills.
 * (Extraction quality itself is tested on the real module in ai/tests/test_multilingual.py.)
 */

export async function runMultilingualTests() {
  console.log('🧪 Running Multilingual (E5, X1) Tests...');
  await ensureFakeAiService();
  const h = await startHttpHarness();
  try {
    assert.equal((await h.api('GET', '/languages/supported')).status, 401);
    const alice = await h.registerUser('lang-alice');
    const bob = await h.registerUser('lang-bob');
    const A = (method: string, p: string, json?: unknown) => h.api(method, p, { token: alice.token, json });
    const upload = (token: string, name: string, content: string | Buffer, type = 'text/plain') => {
      const form = new FormData();
      form.append('file', new Blob([typeof content === 'string' ? content : new Uint8Array(content)], { type }), name);
      return h.api('POST', '/languages/resume-analyses', { token, form });
    };

    const supported = (await A('GET', '/languages/supported')).body.data;
    assert.deepEqual(supported.resumeLanguages.map((l: { code: string }) => l.code), ['en', 'hi', 'es']);
    assert.deepEqual(supported.uiLanguages, ['en', 'hi', 'es']);

    // === Interface language ========================================================================
    assert.equal((await A('GET', '/languages/settings')).body.data.uiLanguage, 'en', 'English until chosen');
    assert.equal((await A('PUT', '/languages/settings', { uiLanguage: 'hi' })).body.data.uiLanguage, 'hi');
    assert.equal((await A('GET', '/languages/settings')).body.data.uiLanguage, 'hi', 'the choice persists');
    for (const bad of [{ uiLanguage: 'fr' }, {}, { uiLanguage: 'es', theme: 'dark' }]) {
      assert.equal((await A('PUT', '/languages/settings', bad)).status, 400);
    }
    assert.equal((await h.api('GET', '/languages/settings', { token: bob.token })).body.data.uiLanguage, 'en', "alice's choice is not bob's");
    console.log('  ✓ Interface language: defaults to English, persists per user, 3 invalid updates refused');

    // === Analyses ======================================================================================
    const hindi = 'कौशल\nPython, SQL\nrahul@example.com\nमैं एक डेटा विश्लेषक हूँ और मुझे अनुभव है।';
    let r = await upload(alice.token, '../../secret/रिज़्यूमे.txt', hindi);
    assert.equal(r.status, 201);
    const first = r.body.data;
    assert.equal(first.fileName, 'रिज़्यूमे.txt', 'only the base name is kept');
    assert.deepEqual([first.status, first.language.language], ['extracted', 'hi']);
    assert.deepEqual(first.textRecovery, { glyphsRecovered: 0, glyphsUnrecovered: 0 }, 'glyph recovery counts are stored and returned');
    assert.deepEqual(first.fields.skills.map((s: { name: string }) => s.name).sort(), ['Python', 'SQL']);
    for (const s of first.fields.skills) assert.equal(first.originalLines[s.source.line], s.source.text, 'provenance points at the stored original line');

    r = await A('POST', '/languages/resume-analyses/text', { text: 'Compétences\nPython, SQL et beaucoup de travail en équipe.' });
    assert.deepEqual([r.status, r.body.data.status, r.body.data.language.language], [201, 'unsupported', 'fr'], 'unsupported languages are stored as refused, not guessed');
    r = await upload(alice.token, 'scan.txt', 'SCANNED page');
    assert.equal(r.body.data.status, 'scanned_unreadable');

    for (const [label, call] of [
      ['executable', () => upload(alice.token, 'cv.exe', 'MZ')],
      ['no file', () => h.api('POST', '/languages/resume-analyses', { token: alice.token, form: new FormData() })],
      ['empty file', () => upload(alice.token, 'cv.txt', '')],
      ['short text', () => A('POST', '/languages/resume-analyses/text', { text: 'too short' })],
      ['extra field', () => A('POST', '/languages/resume-analyses/text', { text: 'x'.repeat(30), language: 'hi' })],
    ] as const) {
      assert.equal((await call()).status, 400, label);
    }

    const list = (await A('GET', '/languages/resume-analyses')).body.data.analyses;
    assert.equal(list.length, 3);
    assert.ok(list.every((a: { originalLines?: unknown }) => a.originalLines === undefined), 'the list leaves out the stored text');
    assert.equal((await A('GET', `/languages/resume-analyses/${first.id}`)).body.data.originalLines.length, 4);

    // Isolation and deletion
    assert.equal((await h.api('GET', `/languages/resume-analyses/${first.id}`, { token: bob.token })).status, 404);
    assert.equal((await h.api('DELETE', `/languages/resume-analyses/${first.id}`, { token: bob.token })).status, 404);
    assert.equal((await h.api('GET', '/languages/resume-analyses', { token: bob.token })).body.data.analyses.length, 0);
    assert.equal((await A('GET', '/languages/resume-analyses/not-an-id')).status, 404);
    assert.equal((await A('DELETE', `/languages/resume-analyses/${first.id}`)).status, 200);
    assert.equal((await A('GET', `/languages/resume-analyses/${first.id}`)).status, 404, 'deleted with its stored text');
    console.log('  ✓ Analyses: stored with provenance, unsupported and scanned stated, 5 invalid inputs 400, owner-only, deletable');

    // AI service down: an honest 503, nothing stored
    const before = (await A('GET', '/languages/resume-analyses')).body.data.analyses.length;
    const saved = process.env.AI_SERVICE_URL;
    process.env.AI_SERVICE_URL = 'http://127.0.0.1:9';
    try {
      r = await A('POST', '/languages/resume-analyses/text', { text: 'Skills\nPython and SQL for reporting work' });
      assert.deepEqual([r.status, r.body.error?.code], [503, 'AI_UNAVAILABLE']);
    } finally {
      process.env.AI_SERVICE_URL = saved;
    }
    assert.equal((await A('GET', '/languages/resume-analyses')).body.data.analyses.length, before);
    assert.equal(await UserSkill.countDocuments({ userId: alice.userId }), 0, 'analyses do not change career skills');
    console.log('  ✓ AI service down: 503 with nothing stored; analyses never write career skills');
  } finally {
    await h.close();
  }
  console.log('✅ Multilingual (E5, X1) Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runMultilingualTests();
    } catch (err) {
      console.error('❌ Multilingual Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
      process.exit();
    }
  })();
}
