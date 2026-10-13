import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import ResumeService, { RESUME_STUCK_AFTER_MS } from '../services/ResumeService.js';
import Resume from '../models/Resume.js';
import { LearningRoadmap } from '../models/LearningRoadmap.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness, resumeForm, type HttpHarness } from './helpers/httpHarness.js';

/**
 * Resume lifecycle over HTTP: replace, download, reprocess, failure recovery, deletion,
 * what happens to derived data, and cross-user isolation.
 */

const FRONTEND_RESUME = [
  'Sam Candidate',
  'Email: sam.candidate@example.com',
  '',
  'Experience:',
  'Frontend Developer at Example Co (2022-2024)',
  'Built dashboards with React, JavaScript, HTML and CSS.',
  '',
  'Skills:',
  'React, JavaScript, HTML, CSS, Git'
].join('\n');

const BACKEND_RESUME = [
  'Sam Candidate',
  'Email: sam.candidate@example.com',
  '',
  'Experience:',
  'Backend Developer at Example Co (2024-2025)',
  'Built services with Node.js, Python and Docker.',
  '',
  'Skills:',
  'Node.js, Python, Docker, Git'
].join('\n');

async function waitForParsing(h: HttpHarness, token: string) {
  let resume: any = null;
  for (let i = 0; i < 100; i++) {
    resume = (await h.api('GET', '/resumes/me', { token })).body.data.resume;
    if (resume && ['completed', 'failed'].includes(resume.parsingStatus)) return resume;
    await new Promise(r => setTimeout(r, 100));
  }
  return resume;
}

const skillNames = async (h: HttpHarness, token: string): Promise<string[]> => {
  const res = await h.api('GET', '/skills/me', { token });
  const categories = res.body.data.categories as Record<string, Array<{ name: string }>> | Array<{ skills: Array<{ name: string }> }>;
  const groups = Array.isArray(categories) ? categories.map(c => c.skills) : Object.values(categories);
  return groups.flat().map(s => s.name).sort();
};

export async function runResumeLifecycleTests() {
  console.log('🧪 Running Resume Lifecycle Tests (HTTP)...');
  const fakeAi = await ensureFakeAiService();
  await CareerService.seedInitialTaxonomy();
  const h = await startHttpHarness();

  try {
    const alice = await h.registerUser('alice');
    const bob = await h.registerUser('bob');

    // --- Nothing to act on yet ------------------------------------------------
    for (const [method, path] of [['POST', '/resumes/reprocess'], ['DELETE', '/resumes'], ['GET', '/resumes/download']] as const) {
      const res = await h.api(method, path, { token: alice.token });
      assert.equal(res.status, 404, `${method} ${path} without a resume`);
      assert.equal(res.body.error.code, 'RESUME_NOT_FOUND');
    }
    assert.equal((await h.api('POST', '/resumes/reprocess')).status, 401, 'reprocess requires authentication');
    console.log('  ✓ Reprocess, delete and download return 404 when there is no resume; 401 without a token');

    // --- First upload -----------------------------------------------------------
    assert.equal((await h.api('POST', '/resumes/upload', { token: alice.token, form: resumeForm(FRONTEND_RESUME, 'frontend.pdf') })).status, 201);
    let resume = await waitForParsing(h, alice.token);
    assert.equal(resume.parsingStatus, 'completed', resume.parsingError);
    assert.equal(resume.isStuck, false);
    assert.equal(resume.personalInfo.fullName.value, 'Sam Candidate', 'candidate name is returned to the client');
    assert.equal(resume.skillChanges.comparedToPrevious, false, 'a first upload has nothing to compare against');
    assert.deepEqual(resume.skillChanges.removed, []);
    assert.deepEqual(await skillNames(h, alice.token), ['CSS', 'Git', 'HTML', 'JavaScript', 'React']);

    // A completed roadmap item is the user's own history and must survive everything below
    const matchesBefore = (await h.api('GET', '/careers/matches', { token: alice.token })).body.data.matches;
    assert.ok(matchesBefore.length > 0);
    const careerId: string = matchesBefore[0].careerId._id;
    const roadmap = (await h.api('GET', `/roadmap/${careerId}`, { token: alice.token })).body.data.roadmap;
    const itemId: string = roadmap.phases[0].items[0]._id;
    const itemTitle: string = roadmap.phases[0].items[0].title;
    assert.equal((await h.api('PATCH', `/roadmap/${careerId}/items/${itemId}/status`, { token: alice.token, json: { status: 'completed' } })).status, 200);
    console.log('  ✓ Upload: parsed, candidate name returned, first-upload skill report, roadmap item completed');

    // --- Download: own file only ---------------------------------------------------
    const download = await h.api('GET', '/resumes/download', { token: alice.token });
    assert.equal(download.status, 200);
    assert.match(download.headers.get('content-disposition') || '', /attachment; filename\*=UTF-8''frontend\.pdf/);
    assert.ok(String(download.body).includes('Frontend Developer at Example Co'), 'download returns the stored file');
    assert.equal((await h.api('GET', '/resumes/download', { token: bob.token })).status, 404, "another user cannot download Alice's file");
    assert.equal((await h.api('GET', '/resumes/download')).status, 401);
    console.log('  ✓ Download: returns the owner\'s file as an attachment; other users get 404, anonymous 401');

    // --- File names in other scripts, and client-supplied paths --------------------------------
    const carol = await h.registerUser('carol-names');
    const C = (method: string, p: string, form?: FormData) => h.api(method, p, { token: carol.token, form });
    assert.equal((await C('POST', '/resumes/upload', resumeForm(FRONTEND_RESUME, 'रिज़्यूमे.pdf'))).status, 201);
    assert.equal((await C('GET', '/resumes/me')).body.data.resume.originalFileName, 'रिज़्यूमे.pdf', 'a Devanagari name is stored as typed, not as Latin-1 mojibake');
    const named = await C('GET', '/resumes/download');
    assert.equal(named.headers.get('content-disposition'), `attachment; filename*=UTF-8''${encodeURIComponent('रिज़्यूमे.pdf')}`);
    assert.equal((await C('PUT', '/resumes/replace', resumeForm(BACKEND_RESUME, '../../uploads/Currículo José.pdf'))).status, 200);
    assert.equal((await C('GET', '/resumes/me')).body.data.resume.originalFileName, 'Currículo José.pdf', 'accents kept; a client-supplied path is reduced to the base name');
    assert.equal((await C('PUT', '/resumes/replace', resumeForm(BACKEND_RESUME, 'C:\\Users\\x\\plain-ascii.pdf'))).status, 200);
    assert.equal((await C('GET', '/resumes/me')).body.data.resume.originalFileName, 'plain-ascii.pdf', 'ASCII names are unchanged apart from the path');
    console.log('  ✓ File names: Devanagari and accented names stored and downloaded correctly; paths reduced to the base name; ASCII unchanged');

    // --- Replace --------------------------------------------------------------------
    const badReplace = new FormData();
    badReplace.append('resume', new Blob(['MZ not a pdf'], { type: 'application/pdf' }), 'resume.pdf');
    assert.equal((await h.api('PUT', '/resumes/replace', { token: alice.token, form: badReplace })).status, 400, 'invalid replacement is rejected');
    assert.deepEqual(await skillNames(h, alice.token), ['CSS', 'Git', 'HTML', 'JavaScript', 'React'], 'a rejected replacement changes nothing');

    assert.equal((await h.api('PUT', '/resumes/replace', { token: alice.token, form: resumeForm(BACKEND_RESUME, 'backend.pdf') })).status, 200);
    resume = await waitForParsing(h, alice.token);
    assert.equal(resume.parsingStatus, 'completed', resume.parsingError);
    assert.equal(resume.originalFileName, 'backend.pdf');
    assert.deepEqual(await skillNames(h, alice.token), ['Docker', 'Git', 'Node.js', 'Python']);
    assert.equal(resume.skillChanges.comparedToPrevious, true);
    assert.deepEqual(resume.skillChanges.added, ['Docker', 'Node.js', 'Python']);
    assert.deepEqual(resume.skillChanges.removed, ['CSS', 'HTML', 'JavaScript', 'React']);
    assert.equal(resume.skillChanges.unchangedCount, 1);
    const matchesAfterReplace = (await h.api('GET', '/careers/matches', { token: alice.token })).body.data.matches;
    assert.ok(matchesAfterReplace.every((m: any) => !m.matchingSkills.includes('React')), 'matches no longer credit the old resume');
    assert.equal(await Resume.countDocuments({ userId: alice.userId, isActive: true }), 1, 'exactly one active resume');
    console.log('  ✓ Replace: invalid file rejected, skills and matches rebuilt, added/removed skills reported');

    // --- Reprocess --------------------------------------------------------------------
    const extractCallsBefore = fakeAi.requests.filter(r => r === 'POST /api/v1/extract').length;
    const reprocess = await h.api('POST', '/resumes/reprocess', { token: alice.token });
    assert.equal(reprocess.status, 202);
    resume = await waitForParsing(h, alice.token);
    assert.equal(resume.parsingStatus, 'completed');
    assert.equal(fakeAi.requests.filter(r => r === 'POST /api/v1/extract').length, extractCallsBefore + 1, 'the stored file was extracted again');
    assert.deepEqual(await skillNames(h, alice.token), ['Docker', 'Git', 'Node.js', 'Python'], 'reprocessing the same file gives the same skills');
    assert.deepEqual([resume.skillChanges.added, resume.skillChanges.removed], [[], []]);

    // In flight: a second request is refused instead of starting a duplicate job
    fakeAi.extract.mode = 'slow';
    assert.equal((await h.api('POST', '/resumes/reprocess', { token: alice.token })).status, 202);
    const concurrent = await h.api('POST', '/resumes/reprocess', { token: alice.token });
    assert.equal(concurrent.status, 409);
    assert.equal(concurrent.body.error.code, 'RESUME_PROCESSING');
    fakeAi.extract.mode = 'ok';
    assert.equal((await waitForParsing(h, alice.token)).parsingStatus, 'completed');
    console.log('  ✓ Reprocess: re-extracts the stored file, is idempotent, and refuses a duplicate while running');

    // --- Failure and recovery -----------------------------------------------------------
    fakeAi.extract.mode = 'fail';
    assert.equal((await h.api('POST', '/resumes/reprocess', { token: alice.token })).status, 202);
    resume = await waitForParsing(h, alice.token);
    assert.equal(resume.parsingStatus, 'failed');
    assert.ok(resume.parsingError, 'the failure reason is reported');
    assert.deepEqual(await skillNames(h, alice.token), ['Docker', 'Git', 'Node.js', 'Python'], 'a failed run keeps the last good skill profile');
    fakeAi.extract.mode = 'ok';
    assert.equal((await h.api('POST', '/resumes/reprocess', { token: alice.token })).status, 202, 'a failed resume can be reprocessed');
    resume = await waitForParsing(h, alice.token);
    assert.equal(resume.parsingStatus, 'completed');
    assert.equal(resume.parsingError, undefined, 'the old error is cleared after a successful run');

    // Stuck job: marked processing long ago (as after a crash) -> reported as stuck and recoverable
    const active = await Resume.findOne({ userId: alice.userId, isActive: true });
    await Resume.updateOne(
      { _id: active!._id },
      { $set: { parsingStatus: 'processing', parsingStartedAt: new Date(Date.now() - RESUME_STUCK_AFTER_MS - 1000) } }
    );
    resume = (await h.api('GET', '/resumes/me', { token: alice.token })).body.data.resume;
    assert.equal(resume.isStuck, true);
    assert.equal((await h.api('POST', '/resumes/reprocess', { token: alice.token })).status, 202, 'a stuck job can be reprocessed');
    assert.equal((await waitForParsing(h, alice.token)).parsingStatus, 'completed');

    // Restart recovery: in-flight jobs become failed-with-reason, nothing is deleted
    await Resume.updateOne({ _id: active!._id }, { $set: { parsingStatus: 'processing', parsingStartedAt: new Date() } });
    assert.equal(await new ResumeService().recoverInterruptedJobs(), 1);
    resume = (await h.api('GET', '/resumes/me', { token: alice.token })).body.data.resume;
    assert.equal(resume.parsingStatus, 'failed');
    assert.match(resume.parsingError, /interrupted/i);
    assert.equal(await new ResumeService().recoverInterruptedJobs(), 0, 'recovery is idempotent');
    assert.equal((await h.api('POST', '/resumes/reprocess', { token: alice.token })).status, 202);
    assert.equal((await waitForParsing(h, alice.token)).parsingStatus, 'completed');
    console.log('  ✓ Recovery: failed, stuck and interrupted jobs are reported honestly and can be reprocessed');

    // --- Isolation --------------------------------------------------------------------------
    assert.equal((await h.api('POST', '/resumes/reprocess', { token: bob.token })).status, 404);
    assert.equal((await h.api('DELETE', '/resumes', { token: bob.token })).status, 404);
    assert.equal((await h.api('GET', '/resumes/me', { token: bob.token })).body.data.resume, null);
    assert.equal((await h.api('GET', '/resumes/me', { token: alice.token })).body.data.resume.originalFileName, 'backend.pdf');
    console.log("  ✓ Isolation: another user's reprocess/delete cannot reach Alice's resume");

    // --- Delete ----------------------------------------------------------------------------
    assert.equal((await h.api('DELETE', '/resumes', { token: alice.token })).status, 200);
    assert.equal((await h.api('GET', '/resumes/me', { token: alice.token })).body.data.resume, null);
    assert.deepEqual(await skillNames(h, alice.token), [], 'skills from the deleted resume are gone');
    const snapshot = (await h.api('GET', '/users/me/career-snapshot', { token: alice.token })).body.data;
    assert.equal(snapshot.resumeInfo.hasResume, false);
    assert.equal(snapshot.totalSkills ?? 0, 0);
    const recs = (await h.api('GET', '/recommendations', { token: alice.token })).body.data;
    const recList = Array.isArray(recs) ? recs : (Object.values(recs).find(Array.isArray) as any[]) ?? [];
    assert.equal(recList.filter((r: any) => r.status === 'active').length, 0, 'no active recommendations without a resume');
    assert.equal((await h.api('GET', '/resumes/download', { token: alice.token })).status, 404);
    assert.equal((await h.api('DELETE', '/resumes', { token: alice.token })).status, 404, 'deleting twice reports not found');

    const roadmaps = await LearningRoadmap.find({ userId: alice.userId });
    assert.ok(roadmaps.length > 0, 'roadmaps are kept when the resume is deleted');
    assert.ok(JSON.stringify(roadmaps).includes('"status":"completed"'), `the completed roadmap item ("${itemTitle}") is preserved`);
    assert.equal(await Resume.countDocuments({ userId: alice.userId }), 2, 'resume records are kept as history, marked inactive');

    // A fresh upload works after deletion
    assert.equal((await h.api('POST', '/resumes/upload', { token: alice.token, form: resumeForm(FRONTEND_RESUME) })).status, 201);
    assert.equal((await waitForParsing(h, alice.token)).parsingStatus, 'completed');
    assert.ok((await skillNames(h, alice.token)).includes('React'));
    console.log('  ✓ Delete: derived data cleared, roadmap history and completed items preserved, re-upload works');

    console.log('✅ Resume Lifecycle Tests Passed\n');
  } finally {
    fakeAi.extract.mode = 'ok';
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runResumeLifecycleTests();
    } catch (err) {
      console.error('❌ Resume Lifecycle Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
