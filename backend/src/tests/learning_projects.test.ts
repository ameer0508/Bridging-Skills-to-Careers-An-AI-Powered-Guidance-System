import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import RecalculationRun from '../models/RecalculationRun.js';
import { PROJECT_BRIEFS, PROJECT_BRIEFS_VERSION } from '../seed/projectBriefs.js';
import { CAREER_TAXONOMY } from '../seed/careerTaxonomy.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness, resumeForm, type HttpHarness } from './helpers/httpHarness.js';

/**
 * Practice projects: the catalogue of briefs, suggestions drawn from a user's real gaps and
 * ranked with the shared scenario engine, and the projects a user takes on.
 */

const RESUME = [
  'Sam Candidate',
  'Email: sam.candidate@example.com',
  '',
  'Experience:',
  'Frontend Developer at Example Co (2022-2023)',
  'Built dashboards with React, JavaScript, HTML and CSS.',
  '',
  'Projects:',
  'Shop API',
  'REST service written in Node.js, tracked with Git.',
  '',
  'Skills:',
  'React, JavaScript, HTML, CSS, Node.js, Git'
].join('\n');

async function waitForResume(h: HttpHarness, token: string) {
  await new Promise(r => setTimeout(r, 150));
  for (let i = 0; i < 100; i++) {
    const current = (await h.api('GET', '/resumes/me', { token })).body.data.resume;
    if (current?.parsingStatus === 'completed') return;
    assert.notEqual(current?.parsingStatus, 'failed', current?.parsingError);
    await new Promise(r => setTimeout(r, 100));
  }
  assert.fail('resume was not processed in time');
}

export async function runLearningProjectTests() {
  console.log('🧪 Running Practice Project Tests...');

  // === The catalogue ============================================================================
  const requirementNames = new Set((CAREER_TAXONOMY as unknown as Array<{ requirements: Array<{ skill: string }> }>).flatMap(c => c.requirements.map(r => r.skill)));
  const ids = new Set<string>();
  for (const brief of PROJECT_BRIEFS) {
    assert.ok(!ids.has(brief.id), `duplicate brief ${brief.id}`);
    ids.add(brief.id);
    assert.ok(brief.tasks.length >= 4 && brief.deliverables.length >= 3, `${brief.id}: tasks and deliverables`);
    assert.ok(brief.effortHours.low > 0 && brief.effortHours.low < brief.effortHours.high, `${brief.id}: effort is a range`);
    for (const skill of brief.skills) assert.ok(requirementNames.has(skill), `${brief.id}: "${skill}" is not a requirement of any career, so it could never match a gap`);
    for (const group of brief.oneOf) for (const skill of group) assert.ok(brief.skills.includes(skill), `${brief.id}: alternative "${skill}" is not among its skills`);
  }
  for (const career of CAREER_TAXONOMY as unknown as Array<{ title: string; requirements: Array<{ skill: string }> }>) {
    const covering = PROJECT_BRIEFS.filter(b => b.skills.some(s => career.requirements.some(r => r.skill === s)));
    assert.ok(covering.length >= 1, `${career.title} has no practice project`);
  }
  assert.match(PROJECT_BRIEFS_VERSION, /^[0-9a-f]{12}$/);
  console.log(`  ✓ Catalogue: ${PROJECT_BRIEFS.length} briefs, every skill is a real career requirement, every one of the ${CAREER_TAXONOMY.length} careers has at least one`);

  await ensureFakeAiService();
  await CareerService.seedInitialTaxonomy();
  const h = await startHttpHarness();

  try {
    const alice = await h.registerUser('alice');
    const bob = await h.registerUser('bob');
    const nobody = await h.registerUser('nobody');
    assert.ok([200, 201].includes((await h.api('POST', '/resumes/upload', { token: alice.token, form: resumeForm(RESUME) })).status));
    await waitForResume(h, alice.token);

    const careers = (await h.api('GET', '/careers/catalog', { token: alice.token })).body.data.careers as Array<{ id: string; title: string }>;
    const idOf = (title: string) => careers.find(c => c.title === title)!.id;
    const suggest = async (token: string, careerId?: string) => (await h.api('GET', `/projects/suggestions${careerId ? `?careerId=${careerId}` : ''}`, { token })).body.data;
    const state = async () =>
      JSON.stringify([
        (await h.api('GET', '/skills/me', { token: alice.token })).body.data,
        ((await h.api('GET', '/careers/matches', { token: alice.token })).body.data.matches as any[]).map(m => [m.careerId.title, m.matchScore]),
        await RecalculationRun.countDocuments({ userId: alice.userId })
      ]);

    // === Suggestions come from real gaps ==========================================================
    const top = await suggest(alice.token);
    assert.equal(top.hasProfile, true);
    assert.equal(top.career.title, 'Frontend Engineer', 'without a career in the request, the best match is planned for');
    assert.ok(top.suggestions.length >= 1 && top.suggestions.length <= 5);
    const gaps = (await h.api('GET', `/careers/${top.career.id}/counterfactuals`, { token: alice.token })).body.data.singleChanges as any[];
    const gapNames = new Set(gaps.map(g => g.skillName));
    for (const s of top.suggestions) {
      assert.ok(s.practises.length >= 1);
      for (const p of s.practises) {
        assert.ok(gapNames.has(p.skill), `${s.briefId}: ${p.skill} is not a gap for this career`);
        assert.notEqual(p.currentStatus, 'applied', 'a skill already shown in use is not offered as a gap');
        assert.ok(s.why.includes(p.skill));
      }
      assert.ok(s.why.startsWith('Frontend Engineer asks for'));
      assert.ok(s.tasks.length >= 4 && s.deliverables.length >= 3);
      assert.equal(s.weeks, null, 'no weeks without weekly hours');
      assert.equal(s.started, null);
      // The stated effect is exactly what the Career Lab what-if gives for the same change
      const replay = (await h.api('POST', '/careers/what-if', { token: alice.token, json: { changes: [{ type: 'add_project', skills: s.practises.map((p: any) => p.skill) }], careerIds: [top.career.id] } })).body.data.careers[0];
      assert.deepEqual(s.hypotheticalScore, { before: replay.scoreBefore, after: replay.scoreAfter, delta: replay.scoreDelta }, `${s.briefId}: score effect`);
      assert.ok(s.hypotheticalScore.delta > 0);
    }
    const deltas = top.suggestions.map((s: any) => s.hypotheticalScore.delta);
    assert.deepEqual(deltas, [...deltas].sort((a, b) => b - a), 'most useful first');
    assert.match(top.note, /hypothetical/i);
    assert.ok(!top.suggestions.some((s: any) => s.briefId === 'product-strategy-brief'), 'a project for unrelated skills is not suggested');

    // A different career gives different projects, for its own gaps
    const ops = await suggest(alice.token, idOf('DevOps Engineer'));
    assert.equal(ops.career.title, 'DevOps Engineer');
    const pipeline = ops.suggestions.find((s: any) => s.briefId === 'containerised-pipeline');
    assert.ok(pipeline && pipeline.practises.some((p: any) => p.skill === 'Docker' && p.importance === 'required' && p.currentStatus === 'missing'));
    assert.ok(pipeline.requiredGapsClosed >= 1);
    assert.ok(!pipeline.practises.some((p: any) => p.skill === 'Git'), 'Git is already shown in a project, so it is not listed as practised');

    // Where a brief offers alternatives, one of them is counted
    const mobile = (await suggest(alice.token, idOf('Mobile App Developer'))).suggestions.find((s: any) => s.briefId === 'mobile-app');
    const frameworks = mobile.practises.filter((p: any) => ['React Native', 'Flutter', 'Kotlin', 'Swift'].includes(p.skill));
    assert.equal(frameworks.length, 1, 'one mobile framework per project, not four');
    assert.deepEqual(mobile.alternatives, [['React Native', 'Flutter', 'Kotlin', 'Swift']]);

    // Weekly hours turn effort into weeks
    assert.equal((await h.api('PUT', '/users/me/learning-preferences', { token: alice.token, json: { hoursPerWeek: 5 } })).status, 200);
    for (const s of (await suggest(alice.token)).suggestions) {
      assert.deepEqual(s.weeks, { low: Math.ceil(s.effortHours.low / 5), high: Math.ceil(s.effortHours.high / 5) });
    }

    const empty = await suggest(nobody.token);
    assert.deepEqual([empty.hasProfile, empty.career, empty.suggestions], [false, null, []], 'no profile, no generic suggestions');
    const emptyFor = await suggest(nobody.token, idOf('Frontend Engineer'));
    assert.deepEqual([emptyFor.hasProfile, emptyFor.suggestions], [false, []]);
    console.log(`  ✓ Suggestions: ${top.suggestions.length} for ${top.career.title}, each for real gaps, ranked by the what-if score change (${deltas.join(', ')}); none without a profile`);

    // === Taking a project on changes no score ======================================================
    const before = await state();
    const chosen = top.suggestions[0];
    const started = await h.api('POST', '/projects', { token: alice.token, json: { briefId: chosen.briefId } });
    assert.equal(started.status, 201);
    const project = started.body.data.project;
    assert.deepEqual(
      { status: project.status, done: project.tasksDone, skills: project.targetSkills, startedAt: project.startedAt, completedAt: project.completedAt },
      { status: 'planned', done: 0, skills: chosen.practises.map((p: any) => p.skill), startedAt: null, completedAt: null }
    );
    assert.match(project.evidence, /not skill evidence/);
    const again = await h.api('POST', '/projects', { token: alice.token, json: { briefId: chosen.briefId } });
    assert.equal(again.status, 200);
    assert.equal(again.body.data.project.id, project.id, 'a brief is taken on once');
    assert.deepEqual((await suggest(alice.token)).suggestions.find((s: any) => s.briefId === chosen.briefId).started, { projectId: project.id, status: 'planned' });

    const patch = (token: string, id: string, json: unknown) => h.api('PATCH', `/projects/${id}`, { token, json });
    const ticked = (await patch(alice.token, project.id, { task: { index: 0, done: true } })).body.data.project;
    assert.deepEqual({ status: ticked.status, done: ticked.tasksDone, started: Boolean(ticked.startedAt) }, { status: 'in_progress', done: 1, started: true }, 'ticking a task off starts the project');
    const completed = (await patch(alice.token, project.id, { status: 'completed' })).body.data.project;
    assert.ok(completed.status === 'completed' && completed.completedAt);
    assert.equal(await state(), before, 'starting, working on and completing a project changes no skill, score or recalculation');
    const reopened = (await patch(alice.token, project.id, { status: 'in_progress' })).body.data.project;
    assert.deepEqual([reopened.status, reopened.completedAt], ['in_progress', null]);
    const reset = (await patch(alice.token, project.id, { status: 'planned' })).body.data.project;
    assert.deepEqual([reset.status, reset.startedAt, reset.tasksDone], ['planned', null, 1]);
    console.log('  ✓ Taken-on project: tasks and status are the user\'s own record; nothing about it is counted as evidence');

    // === Relevance, ownership, validation ==========================================================
    assert.equal((await h.api('POST', '/projects', { token: alice.token, json: { briefId: 'product-strategy-brief' } })).body.error.code, 'PROJECT_NOT_RELEVANT');
    assert.equal((await h.api('POST', '/projects', { token: alice.token, json: { briefId: 'no-such-brief' } })).body.error.code, 'PROJECT_BRIEF_NOT_FOUND');
    assert.equal((await h.api('POST', '/projects', { token: nobody.token, json: { briefId: chosen.briefId } })).body.error.code, 'PROJECT_NOT_RELEVANT', 'nothing can be taken on without a profile');

    assert.deepEqual((await h.api('GET', '/projects', { token: bob.token })).body.data.projects, []);
    assert.equal((await patch(bob.token, project.id, { status: 'completed' })).status, 404);
    assert.equal((await h.api('DELETE', `/projects/${project.id}`, { token: bob.token })).status, 404);
    assert.equal((await h.api('GET', '/projects', { token: alice.token })).body.data.projects.length, 1);

    const bad: Array<[string, string, unknown, number, string]> = [
      ['POST', '/projects', {}, 400, 'VALIDATION_ERROR'],
      ['POST', '/projects', { briefId: { $ne: '' } }, 400, 'VALIDATION_ERROR'],
      ['POST', '/projects', { briefId: chosen.briefId, careerId: 'nope' }, 400, 'VALIDATION_ERROR'],
      ['POST', '/projects', { briefId: chosen.briefId, userId: bob.userId }, 400, 'VALIDATION_ERROR'],
      ['PATCH', `/projects/${project.id}`, {}, 400, 'VALIDATION_ERROR'],
      ['PATCH', `/projects/${project.id}`, { status: 'verified' }, 400, 'VALIDATION_ERROR'],
      ['PATCH', `/projects/${project.id}`, { task: { index: 99, done: true } }, 400, 'VALIDATION_ERROR'],
      ['PATCH', `/projects/${project.id}`, { task: { index: 0, done: 'yes' } }, 400, 'VALIDATION_ERROR'],
      ['PATCH', `/projects/${project.id}`, { status: 'completed', evidenceScore: 100 }, 400, 'VALIDATION_ERROR'],
      ['PATCH', '/projects/not-an-id', { status: 'completed' }, 404, 'PROJECT_NOT_FOUND'],
      ['GET', '/projects/suggestions?careerId=nope', undefined, 400, 'VALIDATION_ERROR'],
      ['GET', `/projects/suggestions?careerId=${new mongoose.Types.ObjectId()}`, undefined, 404, 'CAREER_NOT_FOUND']
    ];
    for (const [method, path, json, status, code] of bad) {
      const res = await h.api(method, path, { token: alice.token, json });
      assert.equal(res.status, status, `${method} ${path} ${JSON.stringify(json)?.slice(0, 50)}`);
      assert.equal(res.body.error.code, code);
    }
    for (const [method, path] of [['GET', '/projects/suggestions'], ['GET', '/projects'], ['POST', '/projects'], ['PATCH', `/projects/${project.id}`], ['DELETE', `/projects/${project.id}`]] as const) {
      assert.equal((await h.api(method, path, method === 'GET' || method === 'DELETE' ? {} : { json: {} })).status, 401, `${method} ${path} requires sign-in`);
    }
    assert.equal((await h.api('DELETE', `/projects/${project.id}`, { token: alice.token })).status, 200);
    assert.equal((await h.api('DELETE', `/projects/${project.id}`, { token: alice.token })).status, 404);
    assert.equal((await suggest(alice.token)).suggestions.find((s: any) => s.briefId === chosen.briefId).started, null);
    console.log(`  ✓ ${bad.length} invalid requests rejected; irrelevant projects cannot be taken on; projects are private to their owner`);

    console.log('✅ Practice Project Tests Passed\n');
  } finally {
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runLearningProjectTests();
    } catch (err) {
      console.error('❌ Practice Project Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
