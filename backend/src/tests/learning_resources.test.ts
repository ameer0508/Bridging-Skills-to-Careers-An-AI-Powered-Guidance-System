import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import RecommendationService from '../services/RecommendationService.js';
import RecalculationRun from '../models/RecalculationRun.js';
import { LEARNING_RESOURCES } from '../seed/learningResources.js';
import { CAREER_TAXONOMY } from '../seed/careerTaxonomy.js';
import { canonicalSkillName } from '../utils/skillLexicon.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness, resumeForm, type HttpHarness } from './helpers/httpHarness.js';

/**
 * Free learning resources: the catalogue's integrity and stated coverage, resources matched to a
 * user's real gaps, and the user's own bookmarks.
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

export async function runLearningResourceTests() {
  console.log('🧪 Running Learning Resource Tests...');

  // === The catalogue ============================================================================
  const requirementSkills = new Set((CAREER_TAXONOMY as unknown as Array<{ requirements: Array<{ skill: string }> }>).flatMap(c => c.requirements.map(r => r.skill)));
  const urls = new Set<string>();
  for (const resource of LEARNING_RESOURCES) {
    const url = new URL(resource.url);
    assert.equal(url.protocol, 'https:', `${resource.title}: https only`);
    assert.ok(!url.username && !url.search.includes('utm_') && !/ref=|affiliate/i.test(resource.url), `${resource.title}: no credentials, tracking or affiliate parameters`);
    assert.ok(!urls.has(resource.url), `duplicate link ${resource.url}`);
    urls.add(resource.url);
    assert.ok(resource.title && resource.provider, 'a resource names its title and who publishes it');
    for (const skill of resource.targetSkills) assert.equal(canonicalSkillName(skill), skill, `${resource.title}: "${skill}" is a canonical skill name`);
    // Nothing unmeasured is attached
    assert.deepEqual(Object.keys(resource).sort(), ['difficulty', 'provider', 'targetSkills', 'title', 'type', 'url']);
  }
  const covered = [...requirementSkills].filter(skill => LEARNING_RESOURCES.some(r => r.targetSkills.includes(skill)));
  const uncovered = [...requirementSkills].filter(skill => !covered.includes(skill));
  assert.ok(covered.length >= 39);
  console.log(`  ✓ Catalogue: ${LEARNING_RESOURCES.length} https links without tracking; ${covered.length} of ${requirementSkills.size} career requirement skills have one; none for ${uncovered.length} (${uncovered.slice(0, 4).join(', ')}, ...)`);

  await ensureFakeAiService();
  await CareerService.seedInitialTaxonomy();
  await RecommendationService.seedInitialResources();
  const h = await startHttpHarness();

  try {
    const alice = await h.registerUser('alice');
    const bob = await h.registerUser('bob');
    const nobody = await h.registerUser('nobody');
    assert.ok([200, 201].includes((await h.api('POST', '/resumes/upload', { token: alice.token, form: resumeForm(RESUME) })).status));
    await waitForResume(h, alice.token);
    const careers = (await h.api('GET', '/careers/catalog', { token: alice.token })).body.data.careers as Array<{ id: string; title: string }>;
    const idOf = (title: string) => careers.find(c => c.title === title)!.id;
    const forCareer = async (token: string, careerId?: string) => (await h.api('GET', `/learning-resources${careerId ? `?careerId=${careerId}` : ''}`, { token })).body.data;

    // === Matched to real gaps =====================================================================
    const top = await forCareer(alice.token);
    assert.equal(top.hasProfile, true);
    assert.equal(top.career.title, 'Frontend Engineer');
    const gaps = (await h.api('GET', `/careers/${top.career.id}/counterfactuals`, { token: alice.token })).body.data.singleChanges as any[];
    assert.deepEqual(
      [...top.groups.map((g: any) => g.skill), ...top.withoutResources].sort(),
      gaps.map(g => g.skillName).sort(),
      'every gap is either given resources or listed as having none; nothing else is shown'
    );
    assert.deepEqual(top.groups.map((g: any) => g.skill), gaps.map(g => g.skillName).filter(s => !top.withoutResources.includes(s)), 'in the order of the gaps, most valuable first');
    assert.deepEqual(top.coverage, { gapSkills: gaps.length, withResources: top.groups.length });
    assert.ok(!top.groups.some((g: any) => g.currentStatus === 'applied'));
    for (const group of top.groups) {
      for (const resource of group.resources) {
        assert.ok(resource.url.startsWith('https://') && resource.host && !resource.host.startsWith('www.'));
        assert.equal(resource.thirdParty, true);
        assert.match(resource.cost, /not re-checked/);
        assert.equal(resource.myStatus, null);
        assert.ok(!('rating' in resource) && !('estimatedTime' in resource) && !('price' in resource), 'no rating, duration or price is shown');
      }
    }
    assert.match(top.note, /third-party/);
    assert.match(top.note, /cannot promise they stay free/);
    assert.match(top.note, /not a course completion/);
    assert.equal(top.catalogue.resources, LEARNING_RESOURCES.length);

    // A career with gaps the catalogue does not cover says so
    const design = await forCareer(alice.token, idOf('UI/UX Designer'));
    assert.ok(design.withoutResources.includes('User Research') && design.withoutResources.includes('Wireframing'));
    assert.ok(design.coverage.withResources < design.coverage.gapSkills);
    const empty = await forCareer(nobody.token);
    assert.deepEqual([empty.hasProfile, empty.groups, empty.career], [false, [], null], 'no profile, no generic list');
    console.log(`  ✓ Matching: ${top.coverage.withResources} of ${top.coverage.gapSkills} gaps for ${top.career.title} have resources; gaps without one are named; nothing generic without a profile`);

    // === The user's own marks ======================================================================
    const state = async () => JSON.stringify([(await h.api('GET', '/skills/me', { token: alice.token })).body.data, await RecalculationRun.countDocuments({ userId: alice.userId }), (await h.api('GET', '/activity', { token: alice.token })).body.data.streak]);
    const before = await state();
    const resource = top.groups[0].resources[0];
    const mark = (token: string, id: string, status: unknown) => h.api('PUT', `/learning-resources/${id}/status`, { token, json: { status } });
    assert.equal((await mark(alice.token, resource.id, 'saved')).body.data.resource.myStatus, 'saved');
    assert.equal((await mark(alice.token, resource.id, 'done')).body.data.resource.myStatus, 'done');
    assert.equal((await forCareer(alice.token)).groups[0].resources[0].myStatus, 'done');
    const mine = (await h.api('GET', '/learning-resources/mine', { token: alice.token })).body.data.resources;
    assert.deepEqual(mine.map((r: any) => [r.id, r.myStatus]), [[resource.id, 'done']]);
    assert.equal(await state(), before, 'marking a resource as worked through changes no skill, score, recalculation or streak');
    assert.deepEqual((await h.api('GET', '/learning-resources/mine', { token: bob.token })).body.data.resources, [], "another user's marks are their own");
    assert.equal((await forCareer(bob.token, top.career.id)).hasProfile, false);
    assert.equal((await mark(alice.token, resource.id, null)).body.data.resource.myStatus, null);
    assert.deepEqual((await h.api('GET', '/learning-resources/mine', { token: alice.token })).body.data.resources, []);

    for (const [id, status, code, expected] of [
      [resource.id, 'completed', 400, 'VALIDATION_ERROR'],
      [resource.id, { $ne: null }, 400, 'VALIDATION_ERROR'],
      [resource.id, undefined, 400, 'VALIDATION_ERROR'],
      ['not-an-id', 'saved', 404, 'RESOURCE_NOT_FOUND'],
      [new mongoose.Types.ObjectId().toString(), 'saved', 404, 'RESOURCE_NOT_FOUND']
    ] as Array<[string, unknown, number, string]>) {
      const res = await mark(alice.token, id, status);
      assert.equal(res.status, code, `${id} ${JSON.stringify(status)}`);
      assert.equal(res.body.error.code, expected);
    }
    assert.equal((await h.api('GET', '/learning-resources?careerId=nope', { token: alice.token })).status, 400);
    assert.equal((await h.api('GET', `/learning-resources?careerId=${new mongoose.Types.ObjectId()}`, { token: alice.token })).status, 404);
    for (const [method, path] of [['GET', '/learning-resources'], ['GET', '/learning-resources/mine'], ['PUT', `/learning-resources/${resource.id}/status`]] as const) {
      assert.equal((await h.api(method, path, method === 'PUT' ? { json: { status: 'saved' } } : {})).status, 401, `${method} ${path} requires sign-in`);
    }
    console.log('  ✓ Marks: saved and worked-through are private bookmarks that change no score or streak; invalid requests rejected; sign-in required');

    console.log('✅ Learning Resource Tests Passed\n');
  } finally {
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runLearningResourceTests();
    } catch (err) {
      console.error('❌ Learning Resource Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
