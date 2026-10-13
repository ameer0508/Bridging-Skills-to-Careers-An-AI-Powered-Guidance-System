import './setupEnv.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import RecommendationService from '../services/RecommendationService.js';
import Resume from '../models/Resume.js';
import VoiceRecording from '../models/VoiceRecording.js';
import MarketPosting from '../models/MarketPosting.js';
import { activateEmployerSource } from '../config/marketSources.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness, resumeForm, type HttpHarness } from './helpers/httpHarness.js';

/**
 * X12: a user can delete their account and everything stored about it. Data is created in as
 * many places as possible (resume file, recordings, matches, plans, exams, portfolio, chat,
 * applications, language checks...), then the account is deleted and no collection may still
 * hold its id, no file may remain, its token is refused, and another user is untouched.
 */

const RESUME = ['Sam Candidate', 'Email: sam@example.com', '', 'Experience:', 'Frontend Developer at Example Co (2022-2023)', 'Built dashboards with React and SQL.', '', 'Projects:', 'Shop API', 'REST service in Node.js, tracked with Git.', '', 'Skills:', 'React, JavaScript, Node.js, SQL, Git'].join('\n');

async function waitForResume(h: HttpHarness, token: string) {
  for (let i = 0; i < 100; i++) {
    const current = (await h.api('GET', '/resumes/me', { token })).body.data.resume;
    if (current?.parsingStatus === 'completed') return;
    await new Promise(r => setTimeout(r, 100));
  }
  assert.fail('resume was not processed in time');
}

/** Every document in any collection that refers to the id, by any field holding it. */
async function documentsMentioning(id: string): Promise<Record<string, number>> {
  const found: Record<string, number> = {};
  const oid = new mongoose.Types.ObjectId(id);
  for (const name of mongoose.modelNames()) {
    const model = mongoose.model(name);
    const fields = Object.keys(model.schema.paths).filter(p => /^(userId|user|ownerId|importedBy)$/.test(p));
    for (const field of fields) {
      const n = await model.countDocuments({ [field]: { $in: [oid, id] } });
      if (n) found[`${name}.${field}`] = n;
    }
  }
  return found;
}

export async function runAccountDeletionTests() {
  console.log('🧪 Running Account Deletion (X12) Tests...');
  const fakeAi = await ensureFakeAiService();
  fakeAi.interview.mode = 'unavailable';
  await CareerService.seedInitialTaxonomy();
  await RecommendationService.seedInitialResources();
  const h = await startHttpHarness();
  try {
    const alice = await h.registerUser('delete-alice');
    const bob = await h.registerUser('delete-bob');
    const A = (method: string, p: string, json?: unknown) => h.api(method, p, { token: alice.token, json });

    // === Data everywhere ===========================================================================
    for (const token of [alice.token, bob.token]) {
      assert.ok([200, 201].includes((await h.api('POST', '/resumes/upload', { token, form: resumeForm(RESUME) })).status));
      await waitForResume(h, token);
    }
    assert.ok([200, 201].includes((await h.api('PUT', '/resumes/replace', { token: alice.token, form: resumeForm(RESUME, 'second.pdf') })).status), 'a replaced resume file too');
    await waitForResume(h, alice.token);
    const careerId = (await A('GET', '/careers/matches')).body.data.matches[0].careerId._id;
    await A('GET', `/roadmap/${careerId}`);
    await A('POST', '/portfolio', { title: 'Shop API', skills: ['Node.js'], completedOn: '2026-01-15', evidenceUrl: 'https://github.com/sam/shop-api' });
    await A('PUT', '/portfolio/share', { enabled: true });
    await A('POST', '/exams/gate-cs-2026/attempts', { count: 2, mode: 'practice' });
    await A('PUT', '/exams/gate-cs-2026/plan', { hoursPerWeek: 5 });
    await A('POST', '/languages/resume-analyses/text', { text: 'Habilidades\nPython, SQL y Docker en producción.' });
    await A('PUT', '/languages/settings', { uiLanguage: 'hi' });
    // An employer posting, published under the contribution terms (mirrored into the market records)
    await A('PUT', '/employer/organization', { organizationName: 'Alice Analytics (SYNTHETIC)' });
    const job = (await A('POST', '/employer/postings', { title: 'Data Analyst', description: 'Weekly reporting in SQL and Excel for the sales team, with clear written summaries. SYNTHETIC TEST DATA.', city: 'Pune', state: 'Maharashtra', workMode: 'onsite', employmentType: 'full_time', skills: ['SQL'] })).body.data.posting;
    assert.equal((await A('POST', `/employer/postings/${job.id}/publish`, { termsVersion: 'employer-contribution-v1', authorizedToPost: true, realOpening: true, grantsUses: true })).status, 200);
    assert.equal(await MarketPosting.countDocuments({ sourceRecordId: job.id }), 1, 'the posting is in the market records before deletion');
    await A('POST', '/careers/transition-plans', { targetCareerId: careerId });
    await A('POST', '/skills/assessments', { skill: 'Git' });
    await A('POST', '/applications/manual', { title: 'Data Analyst', company: 'Example Ltd', appliedAt: '2026-09-02T00:00:00.000Z' });
    await A('POST', '/ai', {});
    await A('POST', '/interviews/assessments', { skills: ['SQL'], count: 3 });
    const round = (await A('POST', '/interviews', { targetCareerTitle: 'Data Analyst', questionCount: 2 })).body.data._id;
    await A('PUT', '/interviews/voice-settings', { recordingConsent: true, retentionDays: 7 });
    const form = new FormData();
    form.append('audio', new Blob([new Uint8Array(Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.from('fake-webm')]))], { type: 'audio/webm' }), 'answer.webm');
    form.append('questionIndex', '0');
    form.append('durationSec', '5');
    assert.equal((await h.api('POST', `/interviews/${round}/recordings`, { token: alice.token, form })).status, 201);

    const uploadRoot = path.resolve(process.env.UPLOAD_DIR as string);
    const resumeFiles = (await Resume.find({ userId: alice.userId }).lean()).map(r => path.join(uploadRoot, r.storagePath));
    const recordingFiles = (await VoiceRecording.find({ userId: alice.userId }).lean()).map(r => r.storagePath);
    assert.ok(resumeFiles.length >= 2 && resumeFiles.filter(f => fs.existsSync(f)).length === 1, 'two resume records; replacing already removed the old file, the current one exists');
    assert.ok(recordingFiles.length === 1 && fs.existsSync(recordingFiles[0]), 'the recording exists before deletion');
    const before = await documentsMentioning(alice.userId);
    assert.ok(Object.keys(before).length >= 15, `data in ${Object.keys(before).length} collections: ${Object.keys(before).join(', ')}`);
    const bobBefore = await documentsMentioning(bob.userId);
    console.log(`  ✓ Set-up: Alice has data in ${Object.keys(before).length} collections, ${resumeFiles.length} resume records and 1 recording`);

    // === Safeguards ===================================================================================
    assert.equal((await h.api('DELETE', '/users/me', { json: { password: 'Password123!', confirm: 'DELETE' } })).status, 401);
    for (const body of [{ password: 'wrong', confirm: 'DELETE' }, { confirm: 'DELETE' }, { password: 'x' }, { password: 'x', confirm: 'delete' }, { password: 'x', confirm: 'DELETE', extra: 1 }]) {
      const res = await A('DELETE', '/users/me', body);
      assert.ok([400, 403].includes(res.status), `${JSON.stringify(body)} answered ${res.status}`);
    }
    assert.deepEqual(await documentsMentioning(alice.userId), before, 'nothing deleted without the password and the confirmation');
    console.log('  ✓ Safeguards: signed out 401; wrong or missing password, missing or wrong confirmation, extra fields: nothing deleted');

    // === Deletion =====================================================================================
    const password = 'Password123!'; // the password registerUser sets
    const deleted = await A('DELETE', '/users/me', { password, confirm: 'DELETE' });
    assert.equal(deleted.status, 200, JSON.stringify(deleted.body));
    assert.equal(deleted.body.data.recordingsPendingDeletion, 0);
    assert.deepEqual(await documentsMentioning(alice.userId), {}, 'no collection still refers to the account');
    assert.ok(resumeFiles.every(f => !fs.existsSync(f)), 'no resume file remains');
    assert.ok(!fs.existsSync(recordingFiles[0]), 'the recording removed');
    assert.equal(await mongoose.connection.collection('users').countDocuments({ _id: new mongoose.Types.ObjectId(alice.userId) }), 0);
    for (const p of ['/portfolio', '/careers/matches', '/exams/gate-cs-2026/attempts']) {
      assert.equal((await A('GET', p)).status, 401, `${p}: the old token is refused`);
    }
    assert.equal((await A('POST', '/portfolio', { title: 'After deletion', skills: ['Git'], completedOn: '2026-01-01' })).status, 401, 'and cannot create new data');
    assert.deepEqual(await documentsMentioning(bob.userId), bobBefore, "Bob's data is untouched");
    assert.equal(await MarketPosting.countDocuments({ sourceRecordId: job.id }), 0, "Alice's employer posting left the market records");
    assert.equal((await h.api('GET', '/careers/matches', { token: bob.token })).status, 200);
    console.log(`  ✓ Deletion: ${Object.values(deleted.body.data.documentsDeleted as Record<string, number>).reduce((a, b) => a + b, 0)} documents in ${Object.keys(deleted.body.data.documentsDeleted).length} collections and every file removed; the token is refused; Bob unaffected`);
  } finally {
    activateEmployerSource()(); // publishing registered the employer source; later suites expect none
    await h.close();
  }
  console.log('✅ Account Deletion (X12) Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runAccountDeletionTests();
    } catch (err) {
      console.error('❌ Account Deletion Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
      process.exit();
    }
  })();
}
