import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import { PortfolioEntry } from '../models/PortfolioEntry.js';
import { SKILL_ASSESSMENTS } from '../seed/skillAssessments.js';
import { EVIDENCE_POINTS } from '../services/EvidenceCalculator.js';
import { PORTFOLIO_LIMITS } from '../services/PortfolioService.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness, resumeForm, type HttpHarness } from './helpers/httpHarness.js';

/**
 * Portfolio: entries as self-reported project evidence, how they combine with resume and
 * skill-check evidence, what survives resume changes, and the optional public link.
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

const [FIRST, SECOND, THIRD] = EVIDENCE_POINTS.projects;
const today = new Date().toISOString().slice(0, 10);

export async function runPortfolioTests() {
  console.log('🧪 Running Portfolio Evidence Tests...');
  await ensureFakeAiService();
  await CareerService.seedInitialTaxonomy();
  const h = await startHttpHarness();

  try {
    const alice = await h.registerUser('alice');
    const bob = await h.registerUser('bob');
    assert.ok([200, 201].includes((await h.api('POST', '/resumes/upload', { token: alice.token, form: resumeForm(RESUME) })).status));
    await waitForResume(h, alice.token);

    const skillsOf = async (token = alice.token) =>
      Object.fromEntries(((await h.api('GET', '/skills/freshness', { token })).body.data.skills as any[]).map(s => [s.name, s])) as Record<string, any>;
    const portfolio = async (token = alice.token) => (await h.api('GET', '/portfolio', { token })).body.data;
    const scoreOf = async (title: string) => ((await h.api('GET', '/careers/matches', { token: alice.token })).body.data.matches as any[]).find(m => m.careerId.title === title)?.matchScore ?? 0;
    const entryBody = (extra: Record<string, unknown> = {}) => ({ title: 'Deploy tool', description: 'A <b>small</b> CLI', skills: ['docker', 'Node.js'], completedOn: today, ...extra });

    // === An entry without a link is recorded but earns nothing ====================================
    const start = await portfolio();
    assert.deepEqual([start.entries, start.share], [[], { enabled: false, token: null, showName: false, sharedEntries: 0 }]);
    const nodeBefore = (await skillsOf())['Node.js'].evidenceScore;
    assert.equal(nodeBefore, EVIDENCE_POINTS.listed + FIRST, 'Node.js is listed and used in one resume project');
    const devopsBefore = await scoreOf('DevOps Engineer');

    const created = await h.api('POST', '/portfolio', { token: alice.token, json: entryBody() });
    assert.equal(created.status, 201);
    const entry = created.body.data.entry;
    assert.deepEqual(
      { title: entry.title, description: entry.description, skills: entry.skills, verification: entry.verification, counts: entry.countsTowardsScores, visibility: entry.visibility, url: entry.evidenceUrl },
      {
        title: 'Deploy tool',
        description: 'A small CLI',
        skills: [{ skill: 'Docker', points: 0, countedElsewhere: null, countedElsewhereBecause: null, verifiedBySkillCheck: false }, { skill: 'Node.js', points: 0, countedElsewhere: null, countedElsewhereBecause: null, verifiedBySkillCheck: false }],
        verification: 'self_reported',
        counts: false,
        visibility: 'private',
        url: null
      },
      'skill names are canonical, markup is removed, the entry is private and self-reported'
    );
    assert.equal(created.body.data.recalculation.status, 'skipped_duplicate', 'no score input changed');
    let skills = await skillsOf();
    assert.equal(skills.Docker, undefined, 'an entry without a link does not put a new skill on the profile');
    assert.equal(skills['Node.js'].evidenceScore, nodeBefore);
    assert.deepEqual([skills['Node.js'].lastEvidencedAt.slice(0, 10), skills['Node.js'].verification, skills['Node.js'].status], [today, 'self_attested', 'current'], 'it does date the skill, labelled as the user\'s own record');

    // === With a link it counts like a project on a resume =========================================
    // What the Career Lab predicts for one more Node.js project
    const predicted = (await h.api('POST', '/careers/what-if', { token: alice.token, json: { changes: [{ type: 'add_project', skills: ['Node.js'] }] } })).body.data.hypotheticalSkills[0].evidenceScore;
    const linked = await h.api('PUT', `/portfolio/${entry.id}`, { token: alice.token, json: entryBody({ evidenceUrl: 'https://example.com/sam/deploy-tool' }) });
    assert.equal(linked.status, 200);
    assert.deepEqual(linked.body.data.entry.skills.map((s: any) => [s.skill, s.points]), [['Docker', FIRST], ['Node.js', SECOND]], 'first project for Docker, second for Node.js');
    assert.equal(linked.body.data.recalculation.status, 'completed');
    skills = await skillsOf();
    assert.equal(skills['Node.js'].evidenceScore, nodeBefore + SECOND);
    assert.equal(skills['Node.js'].evidenceScore, predicted, 'the same score the what-if engine gave for one more project');
    assert.equal(skills.Docker.evidenceScore, FIRST, 'a skill known only from the portfolio has the project points and no "listed in a resume" points');
    assert.equal(skills.Docker.verification, 'self_attested');
    assert.ok((await scoreOf('DevOps Engineer')) > devopsBefore);
    const next = (await h.api('POST', '/careers/what-if', { token: alice.token, json: { changes: [{ type: 'add_project', skills: ['Node.js'] }] } })).body.data.hypotheticalSkills[0].evidenceScore;
    assert.equal(next, nodeBefore + SECOND + THIRD, 'a further project is counted as the third');

    // Saving the same entry again changes nothing
    const same = await h.api('PUT', `/portfolio/${entry.id}`, { token: alice.token, json: entryBody({ evidenceUrl: 'https://example.com/sam/deploy-tool' }) });
    assert.equal(same.body.data.recalculation.status, 'skipped_duplicate');
    assert.equal((await skillsOf())['Node.js'].evidenceScore, nodeBefore + SECOND, 'evidence is rebuilt from the entries, never added twice');
    console.log(`  ✓ Evidence: no link, no points; with a link ${FIRST} for a first project and ${SECOND} for a second, equal to the what-if prediction; idempotent`);

    // === A portfolio claim is never assessed evidence ==============================================
    const attempt = (await h.api('POST', '/skills/assessments', { token: alice.token, json: { skill: 'Docker' } })).body.data.attempt;
    const answers = attempt.questions.map((q: any) => {
      const question = SKILL_ASSESSMENTS.Docker.find(b => b.prompt === q.prompt)!;
      return q.options.indexOf(question.options[question.answer]);
    });
    assert.equal((await h.api('POST', `/skills/assessments/${attempt.attemptId}/submit`, { token: alice.token, json: { answers } })).body.data.passed, true);
    const shown = (await portfolio()).entries[0];
    assert.deepEqual(shown.skills.map((s: any) => [s.skill, s.verifiedBySkillCheck]), [['Docker', true], ['Node.js', false]], 'only the skill that was assessed is marked, and the entry stays self-reported');
    assert.equal(shown.verification, 'self_reported');
    const dockerDoc = (await mongoose.model('UserSkill').find({ userId: alice.userId }).populate('skillId')).find((d: any) => d.skillId.canonicalName === 'Docker');
    assert.deepEqual(dockerDoc.evidences.map((e: any) => [e.sourceType, e.verification, e.points]).sort(), [['assessment', 'assessed', EVIDENCE_POINTS.assessment], ['portfolio_project', 'self_attested', FIRST]], 'the two kinds of evidence are stored separately');
    assert.equal(dockerDoc.evidenceScore, FIRST + EVIDENCE_POINTS.assessment);

    // === From a practice project: only once it is marked complete ==================================
    const suggestion = (await h.api('GET', '/projects/suggestions', { token: alice.token })).body.data.suggestions[0];
    const project = (await h.api('POST', '/projects', { token: alice.token, json: { briefId: suggestion.briefId } })).body.data.project;
    const fromProject = (extra = {}) => ({ title: project.title, skills: project.targetSkills.slice(0, 2), completedOn: today, evidenceUrl: 'https://example.com/sam/practice', sourceProjectId: project.id, ...extra });
    const tooEarly = await h.api('POST', '/portfolio', { token: alice.token, json: fromProject() });
    assert.equal(tooEarly.status, 409);
    assert.equal(tooEarly.body.error.code, 'PROJECT_NOT_COMPLETED', 'an unfinished project cannot be recorded as finished work');
    assert.equal((await h.api('PATCH', `/projects/${project.id}`, { token: alice.token, json: { status: 'completed' } })).status, 200);
    const second = await h.api('POST', '/portfolio', { token: alice.token, json: fromProject() });
    assert.equal(second.status, 201);
    assert.equal(second.body.data.entry.sourceProjectId, project.id);
    assert.equal((await h.api('POST', '/portfolio', { token: alice.token, json: fromProject({ title: 'Again' }) })).body.error.code, 'PROJECT_ALREADY_IN_PORTFOLIO');
    assert.equal((await h.api('POST', '/portfolio', { token: bob.token, json: fromProject() })).body.error.code, 'PROJECT_NOT_FOUND', "another user's project cannot be claimed");
    console.log('  ✓ Provenance: a skill check marks only the assessed skill; entries stay self-reported; an unfinished practice project cannot be added');

    // === Sharing is off until switched on, and shows shared entries only ===========================
    const secondId = second.body.data.entry.id as string;
    assert.equal((await h.api('GET', `/portfolio/shared/${'a'.repeat(48)}`)).status, 404);
    const on = (await h.api('PUT', '/portfolio/share', { token: alice.token, json: { enabled: true } })).body.data.share;
    assert.match(on.token, /^[0-9a-f]{48}$/);
    const publicView = async (token: string) => h.api('GET', `/portfolio/shared/${token}`);
    let seen = await publicView(on.token);
    assert.equal(seen.status, 200);
    assert.deepEqual([seen.body.data.entries, seen.body.data.ownerName], [[], null], 'switching the link on shares nothing by itself');

    assert.equal((await h.api('PUT', `/portfolio/${secondId}`, { token: alice.token, json: fromProject({ visibility: 'shared' }) })).status, 200);
    seen = await publicView(on.token);
    assert.equal(seen.body.data.entries.length, 1, 'the private entry is not shown');
    assert.deepEqual(Object.keys(seen.body.data.entries[0]).sort(), ['completedOn', 'description', 'evidenceUrl', 'skills', 'title']);
    assert.equal(seen.body.data.entries[0].title, project.title);
    const raw = JSON.stringify(seen.body);
    assert.ok(!raw.includes(alice.userId) && !raw.includes(secondId) && !/@/.test(raw.replace(/https:\/\/\S+/g, '')), 'no ids, e-mail address or name leave the server');
    assert.match(seen.body.data.note, /not a professional certification/);

    const named = (await h.api('PUT', '/portfolio/share', { token: alice.token, json: { showName: true } })).body.data.share;
    assert.equal(named.token, on.token, 'changing the name setting keeps the link');
    assert.ok((await publicView(on.token)).body.data.ownerName, 'the name appears only once the owner allows it');

    assert.equal((await h.api('PUT', '/portfolio/share', { token: alice.token, json: { enabled: false } })).body.data.share.token, null);
    assert.equal((await publicView(on.token)).status, 404, 'a switched-off link stops working');
    const again = (await h.api('PUT', '/portfolio/share', { token: alice.token, json: { enabled: true } })).body.data.share;
    assert.notEqual(again.token, on.token);
    assert.equal((await publicView(on.token)).status, 404, 'the old link never works again');
    assert.equal((await publicView(again.token)).status, 200);
    assert.equal((await h.api('PUT', '/portfolio/share', { token: bob.token, json: { enabled: true } })).body.data.share.sharedEntries, 0);
    console.log('  ✓ Sharing: off by default, shared entries only, no ids or contact details, name only by choice, a new link each time it is switched on');

    // === Ownership and validation ===================================================================
    assert.deepEqual((await portfolio(bob.token)).entries, []);
    assert.equal((await h.api('PUT', `/portfolio/${entry.id}`, { token: bob.token, json: entryBody() })).status, 404);
    assert.equal((await h.api('DELETE', `/portfolio/${entry.id}`, { token: bob.token })).status, 404);

    const tomorrow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const bad: Array<[unknown, string]> = [
      [entryBody({ title: 'x' }), 'VALIDATION_ERROR'],
      [entryBody({ skills: [] }), 'VALIDATION_ERROR'],
      [entryBody({ skills: Array.from({ length: PORTFOLIO_LIMITS.skillsPerEntry + 1 }, () => 'Git') }), 'VALIDATION_ERROR'],
      [entryBody({ skills: ['Underwater Basket Weaving'] }), 'UNKNOWN_SKILL'],
      [entryBody({ skills: [{ $ne: '' }] }), 'VALIDATION_ERROR'],
      [entryBody({ completedOn: tomorrow }), 'VALIDATION_ERROR'],
      [entryBody({ completedOn: '12/10/2026' }), 'VALIDATION_ERROR'],
      [entryBody({ completedOn: '2026-13-45' }), 'VALIDATION_ERROR'],
      [entryBody({ evidenceUrl: 'http://example.com/x' }), 'VALIDATION_ERROR'],
      [entryBody({ evidenceUrl: 'javascript:alert(1)' }), 'VALIDATION_ERROR'],
      [entryBody({ evidenceUrl: 'https://user:secret@example.com/x' }), 'VALIDATION_ERROR'],
      [entryBody({ evidenceUrl: 'not a url' }), 'VALIDATION_ERROR'],
      [entryBody({ visibility: 'public' }), 'VALIDATION_ERROR'],
      [entryBody({ verification: 'assessed' }), 'VALIDATION_ERROR'],
      [entryBody({ userId: bob.userId }), 'VALIDATION_ERROR'],
      [entryBody({ sourceProjectId: 'nope' }), 'VALIDATION_ERROR']
    ];
    for (const [json, code] of bad) {
      const res = await h.api('POST', '/portfolio', { token: alice.token, json });
      assert.equal(res.body.error?.code, code, JSON.stringify(json).slice(0, 110));
      assert.equal(res.status, 400);
    }
    assert.equal((await h.api('PUT', '/portfolio/share', { token: alice.token, json: {} })).status, 400);
    assert.equal((await h.api('PUT', '/portfolio/not-an-id', { token: alice.token, json: entryBody() })).status, 404);
    for (const [method, path] of [['GET', '/portfolio'], ['POST', '/portfolio'], ['PUT', '/portfolio/share'], ['PUT', `/portfolio/${entry.id}`], ['DELETE', `/portfolio/${entry.id}`]] as const) {
      assert.equal((await h.api(method, path, method === 'GET' || method === 'DELETE' ? {} : { json: {} })).status, 401, `${method} ${path} requires sign-in`);
    }
    assert.equal((await portfolio()).entries.length, 2, 'rejected requests stored nothing');

    await PortfolioEntry.insertMany(Array.from({ length: PORTFOLIO_LIMITS.entries }, (_, i) => ({ userId: bob.userId, title: `Filler ${i}`, skills: [], completedOn: new Date() })));
    assert.equal((await h.api('POST', '/portfolio', { token: bob.token, json: entryBody() })).body.error.code, 'PORTFOLIO_FULL');
    console.log(`  ✓ ${bad.length} invalid entries rejected (unknown skills, future dates, non-https or credentialed links, forged verification); private per user; capped at ${PORTFOLIO_LIMITS.entries}`);

    // === What survives the resume ===================================================================
    assert.equal((await h.api('POST', '/resumes/reprocess', { token: alice.token })).status, 202);
    await waitForResume(h, alice.token);
    skills = await skillsOf();
    assert.equal(skills['Node.js'].evidenceScore, nodeBefore + SECOND, 'after reprocessing, the portfolio project is again counted after the resume project');
    assert.equal(skills.Docker.evidenceScore, FIRST + EVIDENCE_POINTS.assessment);

    assert.equal((await h.api('DELETE', '/resumes', { token: alice.token })).status, 200);
    skills = await skillsOf();
    assert.equal(skills['Node.js'].evidenceScore, FIRST, 'with the resume gone, the portfolio project is the first project for Node.js');
    assert.equal(skills.Docker.evidenceScore, FIRST + EVIDENCE_POINTS.assessment);
    assert.equal(skills.React, undefined, 'skills known only from the resume are gone');
    // Stored matches (careers scoring above 10) equal a fresh calculation from what is left
    const careers = (await h.api('GET', '/careers/catalog', { token: alice.token })).body.data.careers as Array<{ id: string; title: string }>;
    const fresh = (await h.api('POST', '/careers/compare', { token: alice.token, json: { careerIds: ['DevOps Engineer', 'Backend Engineer', 'Frontend Engineer'].map(t => careers.find(c => c.title === t)!.id) } })).body.data.careers as any[];
    assert.ok(fresh.find(c => c.careerTitle === 'DevOps Engineer').matchScore > 0);
    for (const row of fresh) assert.equal(await scoreOf(row.careerTitle), row.matchScore > 10 ? row.matchScore : 0, `${row.careerTitle}: stored match is current`);

    // === Removing an entry removes its evidence =====================================================
    assert.equal((await h.api('DELETE', `/portfolio/${entry.id}`, { token: alice.token })).status, 200);
    skills = await skillsOf();
    assert.equal(skills['Node.js'], undefined, 'a skill that rested on that entry alone leaves the profile');
    assert.equal(skills.Docker.evidenceScore, EVIDENCE_POINTS.assessment, 'the skill check is untouched');
    assert.equal((await h.api('DELETE', `/portfolio/${entry.id}`, { token: alice.token })).status, 404);
    console.log('  ✓ Lifecycle: portfolio and skill-check evidence survive reprocessing and deleting the resume; removing an entry removes exactly its evidence');

    console.log('✅ Portfolio Evidence Tests Passed\n');
  } finally {
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runPortfolioTests();
    } catch (err) {
      console.error('❌ Portfolio Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
