import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import CareerScenarioService, { type ScenarioSkill } from '../services/CareerScenarioService.js';
import { NBA_WEIGHTS, rankNextActions, type NextActionInput, type RankedAction } from '../services/NextBestAction.js';
import { CAREER_TAXONOMY } from '../seed/careerTaxonomy.js';
import { SKILL_ASSESSMENTS } from '../seed/skillAssessments.js';
import { EVIDENCE_POINTS } from '../services/EvidenceCalculator.js';
import { skillKeys } from '../utils/skillMatching.js';
import type { ICareerRequirement } from '../models/CareerRequirement.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness, resumeForm, type HttpHarness } from './helpers/httpHarness.js';

/**
 * Next-best-action ranking (R3): properties of the ranking, a reproducible comparison with a
 * baseline on synthetic profiles, and the endpoint against a real profile.
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

// ---- Synthetic profiles ---------------------------------------------------------------------------

type Taxonomy = Array<{ title: string; requirements: Array<{ skill: string; importance: string; weight: number }> }>;
const TAXONOMY = CAREER_TAXONOMY as unknown as Taxonomy;
const REQUIREMENT_KEYS = new Set(TAXONOMY.flatMap(c => c.requirements.flatMap(r => skillKeys(r.skill))));
const requirementsOf = (career: Taxonomy[number]) => career.requirements.map(r => ({ skillName: r.skill, importance: r.importance, weight: r.weight })) as unknown as ICareerRequirement[];

const listed = (name: string): ScenarioSkill => ({ canonicalName: name, aliases: [], evidenceScore: EVIDENCE_POINTS.listed, evidences: [{ sourceType: 'resume_skills', description: 'listed', weight: 0.2 }], hypothetical: false });
const inProject = (name: string): ScenarioSkill => ({
  canonicalName: name,
  aliases: [],
  evidenceScore: EVIDENCE_POINTS.listed + EVIDENCE_POINTS.projects[0],
  evidences: [{ sourceType: 'resume_skills', description: 'listed', weight: 0.2 }, { sourceType: 'resume_projects', description: 'project', weight: 0.6 }],
  hypothetical: false
});
const atWork = (name: string): ScenarioSkill => ({
  canonicalName: name,
  aliases: [],
  evidenceScore: EVIDENCE_POINTS.listed + EVIDENCE_POINTS.experience[0],
  evidences: [{ sourceType: 'resume_skills', description: 'listed', weight: 0.2 }, { sourceType: 'resume_experience', description: 'role', weight: 0.8 }],
  hypothetical: false
});

/** Three fixed profiles per career: a starter, someone half-way, and someone experienced with gaps. */
function profiles(career: Taxonomy[number]): Array<{ label: string; input: NextActionInput }> {
  const names = career.requirements.map(r => r.skill);
  const make = (label: string, skills: ScenarioSkill[], hoursPerWeek: number | null) => ({
    label: `${career.title} / ${label}`,
    input: { skills, requirements: requirementsOf(career), requirementKeys: REQUIREMENT_KEYS, hoursPerWeek, verifiedSkills: [], briefStatus: {}, unpublishedProjects: [] }
  });
  return [
    make('starter', names.slice(0, 2).map(listed), 5),
    make('half-way', names.filter((_, i) => i % 2 === 0).map(inProject), 10),
    make('experienced', [...names.filter((_, i) => i !== 0 && i !== 3).map(atWork), ...(names[3] ? [listed(names[3])] : [])], null)
  ];
}

/** Takes actions one after another, each time re-ranking, and returns the score gained. */
function follow(start: NextActionInput, choose: (actions: RankedAction[]) => RankedAction | undefined, limit: { actions?: number; hours?: number }) {
  let state: NextActionInput = { ...start, verifiedSkills: [...start.verifiedSkills], briefStatus: { ...start.briefStatus } };
  const first = rankNextActions(state);
  let hours = 0;
  let taken = 0;
  let score = first.scoreNow;
  for (;;) {
    if (limit.actions !== undefined && taken >= limit.actions) break;
    const ranked = rankNextActions(state);
    const affordable = limit.hours === undefined ? ranked.actions : ranked.actions.filter(a => hours + a.factors.effortHours.high <= limit.hours!);
    const action = choose(affordable);
    if (!action) break;
    state = {
      ...state,
      skills: CareerScenarioService.applyChanges(state.skills, action.changes, state.requirementKeys).map(s => ({ ...s, hypothetical: false })),
      verifiedSkills: action.kind === 'verify' ? [...state.verifiedSkills, action.id.slice('verify:'.length)] : state.verifiedSkills,
      briefStatus: action.kind === 'project' ? { ...state.briefStatus, [action.id.slice('project:'.length)]: 'completed' } : state.briefStatus
    };
    hours += action.factors.effortHours.high;
    taken++;
    score = action.factors.scoreAfter;
  }
  return { gain: score - first.scoreNow, hours, taken };
}

const byRank = (actions: RankedAction[]) => [...actions].sort((a, b) => a.rank - b.rank)[0];
const byBaseline = (actions: RankedAction[]) => [...actions].sort((a, b) => a.baselineRank - b.baselineRank)[0];
const mean = (values: number[]) => Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100;

export async function runNextBestActionTests() {
  console.log('🧪 Running Next-Best-Action Tests...');

  // === Properties of the ranking, on every synthetic profile =====================================
  const cases = TAXONOMY.flatMap(profiles);
  assert.equal(cases.length, TAXONOMY.length * 3);
  let actionsSeen = 0;
  for (const { label, input } of cases) {
    const ranked = rankNextActions(input);
    assert.deepEqual(rankNextActions(input), ranked, `${label}: the same profile gives the same ranking`);
    assert.deepEqual(ranked.actions.map(a => a.rank), ranked.actions.map((_, i) => i + 1));
    assert.deepEqual(ranked.actions.map(a => a.baselineRank).sort((a, b) => a - b), ranked.actions.map((_, i) => i + 1), `${label}: the baseline orders the same actions`);
    for (const action of ranked.actions) {
      actionsSeen++;
      const f = action.factors;
      assert.ok(f.impact > 0 && f.scoreAfter - f.scoreBefore === f.impact && f.scoreBefore === ranked.scoreNow, `${label} ${action.id}: impact`);
      // The score can be recomputed from the published factors and weights
      const recomputed = f.impact + NBA_WEIGHTS.requiredGap * Math.min(2, f.requiredGapsAddressed) + (f.capacity.fitsTwoWeeks ? NBA_WEIGHTS.fitsCapacity : 0) - (f.needsLearningFirst.length > 0 ? NBA_WEIGHTS.needsLearningFirst : 0);
      assert.equal(action.score, recomputed, `${label} ${action.id}: score follows from its factors`);
      assert.deepEqual([f.market.value, f.market.weight], [null, 0], 'market demand is unknown and carries no weight');
      assert.ok(f.effortHours.low <= f.effortHours.high && f.effortHours.low > 0);
      if (input.hoursPerWeek === null) assert.deepEqual([f.capacity.weeks, f.capacity.fitsTwoWeeks], [null, null], 'no hours, no capacity claim');
      else assert.equal(f.capacity.fitsTwoWeeks, f.effortHours.high <= 2 * input.hoursPerWeek);
      if (f.needsLearningFirst.length > 0) assert.equal(f.effortHours.basis, 'assumption', 'learning time is an assumption, never a fact');
      assert.ok(action.reasons.length >= 2 && action.reasons[0].includes('(hypothetical)'));
      assert.ok(action.skills.length > 0 && action.changes.length > 0);
    }
    for (let i = 1; i < ranked.actions.length; i++) assert.ok(ranked.actions[i - 1].score >= ranked.actions[i].score, `${label}: ordered by score`);
  }

  // Specific behaviours
  const frontend = TAXONOMY.find(c => c.title === 'Frontend Engineer')!;
  const base: NextActionInput = { skills: ['JavaScript', 'React'].map(inProject), requirements: requirementsOf(frontend), requirementKeys: REQUIREMENT_KEYS, hoursPerWeek: null, verifiedSkills: [], briefStatus: {}, unpublishedProjects: [] };
  const ids = (input: NextActionInput) => rankNextActions(input).actions.map(a => a.id);
  assert.ok(ids(base).includes('verify:JavaScript') && ids(base).includes('verify:TypeScript'));
  assert.ok(!ids({ ...base, verifiedSkills: ['JavaScript'] }).includes('verify:JavaScript'), 'a verified skill is not offered again');
  const ts = rankNextActions(base).actions.find(a => a.id === 'verify:TypeScript')!;
  assert.deepEqual(ts.factors.needsLearningFirst, ['TypeScript'], 'a skill check for a skill not on the profile says it must be learnt first');
  const js = rankNextActions(base).actions.find(a => a.id === 'verify:JavaScript')!;
  assert.deepEqual([js.factors.needsLearningFirst, js.factors.effortHours], [[], { low: 0.25, high: 0.25, basis: 'time limit' }]);
  assert.ok(ids(base).includes('project:task-tracker-web'));
  const done = { ...base, briefStatus: { 'task-tracker-web': 'completed' }, unpublishedProjects: [{ id: 'p1', title: 'Task tracker web app', skills: ['TypeScript', 'HTML'] }] };
  assert.ok(!ids(done).includes('project:task-tracker-web') && ids(done).includes('portfolio:p1'), 'a finished project is offered as a portfolio entry, not as a project to do');
  assert.match(rankNextActions({ ...base, briefStatus: { 'task-tracker-web': 'in_progress' } }).actions.find(a => a.id === 'project:task-tracker-web')!.title, /^Continue/);
  const withHours = rankNextActions({ ...base, hoursPerWeek: 10 }).actions.find(a => a.id === 'verify:JavaScript')!;
  assert.equal(withHours.score, js.score + NBA_WEIGHTS.fitsCapacity, 'stated hours add the capacity points to an action that fits');
  const full = rankNextActions({ ...base, skills: frontend.requirements.map(r => ({ ...atWork(r.skill), evidenceScore: 100 })), verifiedSkills: Object.keys(SKILL_ASSESSMENTS) });
  assert.deepEqual(full.actions, [], 'nothing is suggested when nothing would raise the score');
  console.log(`  ✓ Ranking: deterministic and auditable on ${cases.length} synthetic profiles (${actionsSeen} ranked actions); market neutral; prerequisites, capacity and finished work handled`);

  // === Evaluation against the baseline (gap importance only) =====================================
  const three = cases.map(({ input }) => ({ adaptive: follow(input, byRank, { actions: 3 }), baseline: follow(input, byBaseline, { actions: 3 }) }));
  const budget = cases.map(({ input }) => ({ adaptive: follow(input, byRank, { hours: 40 }), baseline: follow(input, byBaseline, { hours: 40 }) }));
  const tally = (rows: typeof three) => ({
    adaptive: mean(rows.map(r => r.adaptive.gain)),
    baseline: mean(rows.map(r => r.baseline.gain)),
    better: rows.filter(r => r.adaptive.gain > r.baseline.gain).length,
    equal: rows.filter(r => r.adaptive.gain === r.baseline.gain).length,
    worse: rows.filter(r => r.adaptive.gain < r.baseline.gain).length,
    adaptiveHours: mean(rows.map(r => r.adaptive.hours)),
    baselineHours: mean(rows.map(r => r.baseline.hours))
  });
  const first3 = tally(three);
  const in40 = tally(budget);
  console.log(`    first three actions: mean gain ${first3.adaptive} points (baseline ${first3.baseline}); better in ${first3.better}, equal in ${first3.equal}, worse in ${first3.worse} of ${cases.length}; assumed hours ${first3.adaptiveHours} vs ${first3.baselineHours}`);
  console.log(`    within 40 assumed hours: mean gain ${in40.adaptive} points (baseline ${in40.baseline}); better in ${in40.better}, equal in ${in40.equal}, worse in ${in40.worse} of ${cases.length}`);
  assert.ok(first3.adaptive >= first3.baseline, 'over three actions the ranking gains at least as much as the baseline on average');
  assert.ok(in40.adaptive >= in40.baseline, 'within a fixed effort budget the ranking gains at least as much as the baseline on average');
  assert.equal(first3.better + first3.equal + first3.worse, cases.length);
  console.log('  ✓ Evaluation: compared with ordering by gap importance alone, on the same candidates and the same scoring');

  // === The endpoint, on a real profile ============================================================
  await ensureFakeAiService();
  await CareerService.seedInitialTaxonomy();
  const h = await startHttpHarness();
  try {
    const alice = await h.registerUser('alice');
    const nobody = await h.registerUser('nobody');
    assert.ok([200, 201].includes((await h.api('POST', '/resumes/upload', { token: alice.token, form: resumeForm(RESUME) })).status));
    await waitForResume(h, alice.token);
    const next = async (token = alice.token, query = '') => (await h.api('GET', `/recommendations/next-actions${query}`, { token })).body.data;

    let result = await next();
    assert.deepEqual([result.hasProfile, result.career.title], [true, 'Frontend Engineer']);
    assert.ok(result.actions.length >= 1 && result.actions.length <= 5 && result.totalCandidates >= result.actions.length);
    assert.deepEqual(result.weights, NBA_WEIGHTS);
    assert.match(result.note, /Market demand is not used/);
    for (const action of result.actions) {
      // The published impact is what the Career Lab gives for the same changes
      const replay = (await h.api('POST', '/careers/what-if', { token: alice.token, json: { changes: action.changes, careerIds: [result.career.id] } })).body.data.careers[0];
      assert.deepEqual([action.factors.scoreBefore, action.factors.scoreAfter], [replay.scoreBefore, replay.scoreAfter], `${action.id}: impact equals the what-if result`);
      assert.equal(action.factors.capacity.fitsTwoWeeks, null);
    }

    // R2 for skill checks: the predicted score is the real score after passing
    const verify = result.actions.find((a: any) => a.kind === 'verify' && a.factors.needsLearningFirst.length === 0);
    assert.ok(verify, 'a skill check for a skill on the profile is among the next actions');
    const skill = verify.id.slice('verify:'.length);
    const attempt = (await h.api('POST', '/skills/assessments', { token: alice.token, json: { skill } })).body.data.attempt;
    const answers = attempt.questions.map((q: any) => {
      const question = SKILL_ASSESSMENTS[skill].find(b => b.prompt === q.prompt)!;
      return q.options.indexOf(question.options[question.answer]);
    });
    assert.equal((await h.api('POST', `/skills/assessments/${attempt.attemptId}/submit`, { token: alice.token, json: { answers } })).body.data.passed, true);
    result = await next();
    assert.equal(result.scoreNow, verify.factors.scoreAfter, `after really passing the ${skill} skill check the match is what the action predicted`);
    assert.ok(!result.actions.some((a: any) => a.id === verify.id), 'the action is no longer suggested');
    const stored = ((await h.api('GET', '/careers/matches', { token: alice.token })).body.data.matches as any[]).find(m => m.careerId.title === 'Frontend Engineer');
    assert.equal(stored.matchScore, result.scoreNow, 'the ranking starts from the stored match score');

    // Weekly hours enter the ranking; a finished project becomes a portfolio action
    assert.equal((await h.api('PUT', '/users/me/learning-preferences', { token: alice.token, json: { hoursPerWeek: 10 } })).status, 200);
    result = await next();
    assert.ok(result.actions.every((a: any) => a.factors.capacity.hoursPerWeek === 10 && typeof a.factors.capacity.fitsTwoWeeks === 'boolean'));
    const projectAction = (await next(alice.token, `?careerId=${result.career.id}`)).actions.find((a: any) => a.kind === 'project');
    assert.ok(projectAction);
    const project = (await h.api('POST', '/projects', { token: alice.token, json: { briefId: projectAction.id.slice('project:'.length) } })).body.data.project;
    assert.match((await next()).actions.find((a: any) => a.id === projectAction.id).title, /^Continue/);
    assert.equal((await h.api('PATCH', `/projects/${project.id}`, { token: alice.token, json: { status: 'completed' } })).status, 200);
    result = await next();
    const portfolioAction = result.actions.find((a: any) => a.id === `portfolio:${project.id}`);
    assert.ok(portfolioAction && !result.actions.some((a: any) => a.id === projectAction.id), 'the finished project is now a portfolio action');
    const added = await h.api('POST', '/portfolio', { token: alice.token, json: { title: project.title, skills: portfolioAction.skills, completedOn: new Date().toISOString().slice(0, 10), evidenceUrl: 'https://example.com/sam/work', sourceProjectId: project.id } });
    assert.equal(added.status, 201);
    result = await next();
    assert.ok(!result.actions.some((a: any) => a.id === portfolioAction.id));
    assert.ok(result.scoreNow > portfolioAction.factors.scoreBefore, 'recording the work raised the real score');

    const none = await next(nobody.token);
    assert.deepEqual([none.hasProfile, none.actions, none.scoreNow], [false, [], null], 'no profile, no generic advice');
    assert.equal((await h.api('GET', '/recommendations/next-actions?careerId=nope', { token: alice.token })).status, 400);
    assert.equal((await h.api('GET', `/recommendations/next-actions?careerId=${new mongoose.Types.ObjectId()}`, { token: alice.token })).status, 404);
    assert.equal((await h.api('GET', '/recommendations/next-actions')).status, 401);
    console.log('  ✓ Endpoint: impact equals the what-if result; a passed skill check gives exactly the predicted score; actions follow real progress; none without a profile');

    console.log('✅ Next-Best-Action Tests Passed\n');
  } finally {
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runNextBestActionTests();
    } catch (err) {
      console.error('❌ Next-Best-Action Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
