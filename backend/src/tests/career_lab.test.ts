import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import RecalculationRun from '../models/RecalculationRun.js';
import { AFFECTED_MODULES } from '../services/RecalculationService.js';
import { FRESHNESS_POLICY, freshnessOf } from '../services/SkillFreshnessService.js';
import { parsePeriodEnd, monthsBetween } from '../utils/periods.js';
import EvidenceCalculator from '../services/EvidenceCalculator.js';
import CareerScenarioService from '../services/CareerScenarioService.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness, resumeForm, type HttpHarness } from './helpers/httpHarness.js';

/**
 * Shared intelligence foundation and the Career Lab: dated evidence, event-driven recalculation
 * with an audit trail, career comparison, what-if analysis, counterfactual explanations, skill
 * freshness and transition plans.
 */

const resumeText = (projectLine: string, skills: string) =>
  [
    'Sam Candidate',
    'Email: sam.candidate@example.com',
    '',
    'Experience:',
    'Frontend Developer at Example Co (2022-2023)',
    'Built dashboards with React, JavaScript, HTML and CSS.',
    '',
    'Projects:',
    'Shop API',
    projectLine,
    '',
    'Skills:',
    skills
  ].join('\n');

const RESUME = resumeText('REST service written in Node.js, tracked with Git.', 'React, JavaScript, HTML, CSS, Node.js, Git');
// The same resume with Docker used in the project and listed as a skill
const RESUME_WITH_DOCKER = resumeText('REST service written in Node.js and Docker, tracked with Git.', 'React, JavaScript, HTML, CSS, Node.js, Git, Docker');

async function upload(h: HttpHarness, token: string, text: string, method: 'POST' | 'PUT' = 'POST') {
  const res = await h.api(method, method === 'POST' ? '/resumes/upload' : '/resumes/replace', { token, form: resumeForm(text) });
  assert.ok([200, 201].includes(res.status), `upload ${res.status}`);
  for (let i = 0; i < 100; i++) {
    const resume = (await h.api('GET', '/resumes/me', { token })).body.data.resume;
    if (resume?.parsingStatus === 'completed') return;
    assert.notEqual(resume?.parsingStatus, 'failed', resume?.parsingError);
    await new Promise(r => setTimeout(r, 100));
  }
  assert.fail('resume was not processed in time');
}

const history = async (h: HttpHarness, token: string) => (await h.api('GET', '/users/me/intelligence-history', { token })).body.data.runs as any[];

export async function runCareerLabTests() {
  console.log('🧪 Running Career Lab & Intelligence Foundation Tests...');

  // === Reading dates from a resume ===========================================================
  const now = new Date(Date.UTC(2026, 9, 12));
  assert.equal(parsePeriodEnd('2022 - 2024', now).end?.toISOString().slice(0, 10), '2024-12-31');
  assert.equal(parsePeriodEnd('(Jan 2021 - Mar 2023)', now).end?.toISOString().slice(0, 10), '2023-03-31');
  assert.equal(parsePeriodEnd('06/2020 to 09/2022', now).end?.toISOString().slice(0, 10), '2022-09-30');
  assert.deepEqual(parsePeriodEnd('Jan 2024 - Present', now), { end: now, ongoing: true });
  assert.equal(parsePeriodEnd('2025 - 2027', now).end?.getTime(), now.getTime(), 'an end date in the future is capped at today');
  for (const unreadable of ['', 'two years', 'Summer internship', null, undefined]) {
    assert.deepEqual(parsePeriodEnd(unreadable, now), { end: null, ongoing: false }, `"${unreadable}" has no date and none is guessed`);
  }
  assert.equal(monthsBetween(new Date(Date.UTC(2024, 11, 31)), now), 22);
  assert.equal(monthsBetween(now, new Date(Date.UTC(2020, 0, 1))), 0);

  const at = (monthsAgo: number) => new Date(Date.UTC(2026, 9 - monthsAgo, 12));
  const evidence = (observedAt: Date | null, extra = {}) => ({ sourceType: 'resume_experience' as const, description: 'role', weight: 0.8, observedAt, ...extra });
  assert.equal(freshnessOf([evidence(at(FRESHNESS_POLICY.currentWithinMonths))], now).status, 'current');
  assert.equal(freshnessOf([evidence(at(FRESHNESS_POLICY.currentWithinMonths + 1))], now).status, 'aging');
  assert.equal(freshnessOf([evidence(at(FRESHNESS_POLICY.agingWithinMonths + 1))], now).status, 'stale');
  assert.equal(freshnessOf([evidence(null)], now).status, 'undated', 'no date means undated, not stale');
  assert.equal(freshnessOf([evidence(at(60)), evidence(at(2))], now).status, 'current', 'the most recent dated evidence decides');
  assert.equal(freshnessOf([evidence(at(50), { ongoing: true })], now).monthsSinceLastUse, 0);
  console.log('  ✓ Dates: period ends are read from resume text; unreadable periods stay undated; freshness thresholds hold');

  // === R2 evaluation: the hypothetical evidence model against the real evidence calculator ====
  // For every combination of existing evidence (0-3 roles, 0-3 projects, with or without a
  // certification) and every kind of addition, the score the what-if engine predicts must equal
  // the score the real calculator gives once the resume really contains that addition.
  {
    const SKILL = 'Docker';
    const parsed = (roles: number, projects: number, certified: boolean) =>
      ({
        id: 'synthetic',
        experience: Array.from({ length: roles }, (_, i) => ({
          role: { value: `Engineer ${i + 1}` },
          company: { value: `Company ${i + 1}` },
          duration: { value: `${2018 + i} - ${2019 + i}` },
          responsibilities: [{ value: `Ran services with ${SKILL}.` }]
        })),
        projects: Array.from({ length: projects }, (_, i) => ({ name: { value: `Project ${i + 1}` }, description: { value: `Built with ${SKILL}.` }, technologies: [], contributions: [] })),
        certifications: certified ? [{ value: `${SKILL} Certified Associate` }] : [],
        education: []
      }) as unknown as Parameters<typeof EvidenceCalculator.calculateForSkill>[2];
    const real = (roles: number, projects: number, certified: boolean) => EvidenceCalculator.calculateForSkill(SKILL, [], parsed(roles, projects, certified));

    let cases = 0;
    const mismatches: string[] = [];
    for (let roles = 0; roles <= 3; roles++) {
      for (let projects = 0; projects <= 3; projects++) {
        for (const certified of [false, true]) {
          const base = real(roles, projects, certified);
          const start = [{ canonicalName: SKILL, aliases: [], evidenceScore: base.score, evidences: base.evidences, hypothetical: false }];
          const additions: Array<[string, Parameters<typeof CareerScenarioService.applyChanges>[1][number], number]> = [
            ['project', { type: 'add_project', skills: [SKILL] }, real(roles, projects + 1, certified).score],
            ['role', { type: 'add_experience', skills: [SKILL] }, real(roles + 1, projects, certified).score],
            ['certification', { type: 'add_certification', skills: [SKILL] }, real(roles, projects, true).score]
          ];
          for (const [label, change, expected] of additions) {
            const predicted = CareerScenarioService.applyChanges(start, [change], new Set())[0].evidenceScore;
            cases++;
            if (predicted !== expected) mismatches.push(`roles=${roles} projects=${projects} cert=${certified} +${label}: predicted ${predicted}, real ${expected}`);
          }
        }
      }
    }
    // A skill that is not on the resume at all, then gains each kind of evidence
    for (const [label, change, expected] of [
      ['project', { type: 'add_project', skills: [SKILL] }, real(0, 1, false).score],
      ['role', { type: 'add_experience', skills: [SKILL] }, real(1, 0, false).score],
      ['certification', { type: 'add_certification', skills: [SKILL] }, real(0, 0, true).score],
      ['listing', { type: 'add_skill', skill: SKILL }, real(0, 0, false).score]
    ] as Array<[string, Parameters<typeof CareerScenarioService.applyChanges>[1][number], number]>) {
      const predicted = CareerScenarioService.applyChanges([], [change], new Set()).find(s => s.canonicalName === SKILL)!.evidenceScore;
      cases++;
      if (predicted !== expected) mismatches.push(`new skill +${label}: predicted ${predicted}, real ${expected}`);
    }
    assert.deepEqual(mismatches, [], `hypothetical evidence differs from real evidence:\n  ${mismatches.join('\n  ')}`);
    assert.equal(cases, 100);
    console.log(`  ✓ R2 evaluation: predicted evidence equals real evidence in all ${cases} cases (0-3 roles x 0-3 projects x certification x addition)`);
  }

  const fakeAi = await ensureFakeAiService();
  void fakeAi;
  await CareerService.seedInitialTaxonomy();
  const h = await startHttpHarness();

  try {
    const alice = await h.registerUser('alice');
    const bob = await h.registerUser('bob');
    const noResume = await h.registerUser('nobody');

    // === R1. Event-driven recalculation with an audit trail ===================================
    assert.deepEqual(await history(h, alice.token), []);
    await upload(h, alice.token, RESUME);

    let runs = await history(h, alice.token);
    assert.equal(runs.length, 1, 'one resume produced exactly one recalculation');
    assert.equal(runs[0].trigger, 'resume_processed');
    assert.equal(runs[0].status, 'completed');
    assert.deepEqual(runs[0].modulesRecomputed, ['matches', 'readiness', 'recommendations']);
    assert.equal(runs[0].before.topMatchScore, null);
    assert.equal(runs[0].after.skillCount, 6);
    assert.ok(runs[0].after.topMatchScore > 0 && runs[0].after.readinessScore > 0 && runs[0].after.activeRecommendations > 0);
    assert.ok(runs[0].scoringVersion && runs[0].taxonomyVersion);

    const matchesBefore = (await h.api('GET', '/careers/matches', { token: alice.token })).body.data.matches as any[];
    const matchIds = matchesBefore.map(m => m._id).sort();

    // Changing the target role refreshes recommendations only; matches are not rebuilt
    assert.equal((await h.api('PUT', '/users/me', { token: alice.token, json: { targetRole: 'Frontend Engineer' } })).status, 200);
    for (let i = 0; i < 50 && (await history(h, alice.token)).length < 2; i++) await new Promise(r => setTimeout(r, 100));
    runs = await history(h, alice.token);
    assert.equal(runs.length, 2);
    assert.equal(runs[0].trigger, 'target_role_changed');
    assert.deepEqual(runs[0].modulesRecomputed, ['recommendations']);
    assert.deepEqual(runs[0].modulesSkipped, ['matches', 'readiness']);
    const matchesAfterRole = (await h.api('GET', '/careers/matches', { token: alice.token })).body.data.matches as any[];
    assert.deepEqual(matchesAfterRole.map(m => m._id).sort(), matchIds, 'match records were left untouched');
    assert.equal(runs[0].after.topMatchScore, runs[0].before.topMatchScore);

    // The same change again has the same inputs: recorded, but nothing is recomputed
    assert.equal((await h.api('PUT', '/users/me', { token: alice.token, json: { targetRole: 'Frontend Engineer' } })).status, 200);
    for (let i = 0; i < 50 && (await history(h, alice.token)).length < 3; i++) await new Promise(r => setTimeout(r, 100));
    runs = await history(h, alice.token);
    assert.equal(runs[0].status, 'skipped_duplicate');
    assert.deepEqual(runs[0].modulesRecomputed, []);
    assert.deepEqual(runs[0].after, runs[0].before);

    // Ten simultaneous triggers are serialised: one completes, the rest are recognised as duplicates
    const { default: RecalculationService } = await import('../services/RecalculationService.js');
    const burst = await Promise.all(Array.from({ length: 10 }, () => RecalculationService.run(alice.userId, 'manual')));
    assert.equal(burst.filter(r => r.status === 'completed').length, 1, 'concurrent identical triggers recompute once');
    assert.equal(burst.filter(r => r.status === 'skipped_duplicate').length, 9);
    assert.equal(await mongoose.model('CareerMatch').countDocuments({ userId: alice.userId }), matchIds.length, 'no duplicate match records');

    // The dependency table is what the tests above observed
    assert.deepEqual(AFFECTED_MODULES.target_role_changed, ['recommendations']);
    assert.deepEqual(AFFECTED_MODULES.interview_completed, ['recommendations']);
    assert.deepEqual(AFFECTED_MODULES.roadmap_progress, []);
    assert.equal((await h.api('GET', '/users/me/intelligence-history')).status, 401);
    assert.deepEqual(await history(h, bob.token), [], "another user's history is empty");
    console.log('  ✓ R1 recalculation: one run per event, only affected modules recomputed, duplicates and bursts collapse to one');

    const careers = (await h.api('GET', '/careers/catalog', { token: alice.token })).body.data.careers as Array<{ id: string; title: string }>;
    assert.equal(careers.length, 14);
    const idOf = (title: string) => careers.find(c => c.title === title)!.id;
    const frontend = idOf('Frontend Engineer');
    const devops = idOf('DevOps Engineer');
    const fullStack = idOf('Full Stack Developer');

    // === A1. Compare ===========================================================================
    const compared = (await h.api('POST', '/careers/compare', { token: alice.token, json: { careerIds: [frontend, devops, fullStack] } })).body.data;
    assert.deepEqual(compared.careers.map((c: any) => c.careerTitle), ['Frontend Engineer', 'DevOps Engineer', 'Full Stack Developer'], 'in the order asked for');
    for (const row of compared.careers) {
      const stored = matchesBefore.find(m => m.careerId._id === row.careerId);
      if (stored) assert.equal(row.matchScore, stored.matchScore, `${row.careerTitle}: comparison uses the same score as the match list`);
      const r = row.requirements;
      assert.equal(r.required.total + r.preferred.total + r.supporting.total, r.total);
      assert.equal(row.evidence.applied + row.evidence.listedOnly + row.evidence.inferred + row.effort.skillsToAcquire.length, r.total, 'every requirement is counted once');
      assert.ok(row.effort.pointsToClose >= 0 && row.effort.pointsToClose <= row.effort.pointsPossible);
      assert.ok(row.sharedWithOthers.every((s: string) => row.effort.skillsToAcquire.includes(s)));
      assert.ok(!JSON.stringify(row).match(/hours|weeks|months/i), 'no time estimate is invented');
    }
    assert.deepEqual([compared.marketData.available, /^Market data unavailable/.test(compared.marketData.reason)], [false, true], 'the opportunities dimension is reported as unavailable, not as zero');
    assert.ok(compared.careers.every((c: any) => !('openings' in c) && !('opportunities' in c)), 'no opportunity count is invented');
    const fe = compared.careers[0];
    const ops = compared.careers[1];
    assert.ok(fe.matchScore > ops.matchScore && fe.effort.pointsToClose < ops.effort.pointsToClose, 'a frontend resume is closer to the frontend career');
    assert.ok(ops.effort.requiredSkillsToAcquire.includes('Docker'));
    console.log('  ✓ A1 compare: same scores as the match list, requirement and evidence counts add up, effort in skills and points only');

    // === A2. What-if, and R2: the hypothetical equals reality ===================================
    const skillsBefore = JSON.stringify((await h.api('GET', '/skills/me', { token: alice.token })).body.data);
    const runsBefore = await RecalculationRun.countDocuments({ userId: alice.userId });
    const whatIf = (await h.api('POST', '/careers/what-if', { token: alice.token, json: { changes: [{ type: 'add_project', skills: ['Docker'], name: 'Deploy tool' }] } })).body.data;
    assert.equal(whatIf.careers.length, 14);
    assert.deepEqual(whatIf.hypotheticalSkills, [{ name: 'Docker', evidenceScore: 35 }], 'listed (10) plus a first project (25), as real evidence would earn');
    const opsIf = whatIf.careers.find((c: any) => c.careerId === devops);
    assert.ok(opsIf.scoreDelta > 0 && opsIf.scoreAfter === opsIf.scoreBefore + opsIf.scoreDelta);
    assert.equal(opsIf.missingRequiredAfter, opsIf.missingRequiredBefore - 1);
    assert.deepEqual(opsIf.requirementChanges.map((r: any) => r.skillName), ['Docker'], 'only the requirement the change touches moves');
    assert.equal(opsIf.requirementChanges[0].statusBefore, 'missing');
    assert.equal(opsIf.requirementChanges[0].statusAfter, 'applied');
    assert.ok(opsIf.requirementChanges[0].pointsDelta > 0);
    assert.ok(whatIf.careers.every((c: any) => c.scoreDelta >= 0), 'adding evidence never lowers a score');
    assert.ok(whatIf.careers[0].scoreDelta >= whatIf.careers.at(-1).scoreDelta, 'largest change first');
    assert.match(whatIf.note, /do not predict hiring outcomes/);

    // Nothing was saved by asking
    assert.equal(JSON.stringify((await h.api('GET', '/skills/me', { token: alice.token })).body.data), skillsBefore);
    assert.equal(await RecalculationRun.countDocuments({ userId: alice.userId }), runsBefore, 'a what-if triggers no recalculation');
    assert.deepEqual(((await h.api('GET', '/careers/matches', { token: alice.token })).body.data.matches as any[]).map(m => m.matchScore), matchesAfterRole.map(m => m.matchScore));

    // Removing a skill is hypothetical too, and lowers what depends on it
    const without = (await h.api('POST', '/careers/what-if', { token: alice.token, json: { changes: [{ type: 'remove_skill', skill: 'React' }], careerIds: [frontend] } })).body.data;
    assert.ok(without.careers[0].scoreDelta < 0);

    // Now make it real: the same resume with Docker in the project. Every career's real score must equal the prediction.
    await upload(h, alice.token, RESUME_WITH_DOCKER, 'PUT');
    const realMatches = (await h.api('GET', '/careers/matches', { token: alice.token })).body.data.matches as any[];
    let checked = 0;
    for (const predicted of whatIf.careers) {
      const real = realMatches.find(m => m.careerId._id === predicted.careerId);
      // Careers scoring 10 or less are not stored as matches
      if (!real) {
        assert.ok(predicted.scoreAfter <= 10, `${predicted.careerTitle}: predicted ${predicted.scoreAfter} but no match was stored`);
        continue;
      }
      assert.equal(real.matchScore, predicted.scoreAfter, `${predicted.careerTitle}: what-if said ${predicted.scoreAfter}, reality is ${real.matchScore}`);
      checked++;
    }
    assert.ok(checked >= 5, `compared ${checked} careers`);
    console.log(`  ✓ A2 what-if / R2: nothing is saved; after really adding the evidence, ${checked} career scores equal the hypothetical ones exactly`);

    // === A5. Counterfactual explanations =======================================================
    const cf = (await h.api('GET', `/careers/${devops}/counterfactuals?targetScore=60`, { token: alice.token })).body.data;
    const realOps = realMatches.find(m => m.careerId._id === devops);
    assert.equal(cf.baseline.score, realOps ? realOps.matchScore : cf.baseline.score);
    assert.ok(cf.singleChanges.length > 0);
    const deltas = cf.singleChanges.map((c: any) => c.scoreDelta);
    assert.deepEqual(deltas, [...deltas].sort((a, b) => b - a), 'most effective change first');
    assert.ok(cf.singleChanges.every((c: any) => c.scoreDelta >= 0 && c.scoreAfter === cf.baseline.score + c.scoreDelta));
    assert.ok(!cf.singleChanges.some((c: any) => c.currentStatus === 'applied'), 'requirements already applied are not suggested');
    const steps = cf.pathToTarget.steps;
    assert.ok(steps.length > 0 && steps.every((s: any, i: number) => s.scoreAfter > (i === 0 ? cf.baseline.score : steps[i - 1].scoreAfter)), 'each step raises the score');
    assert.equal(cf.pathToTarget.finalScore, steps.at(-1).scoreAfter);
    assert.equal(cf.pathToTarget.reached, cf.pathToTarget.finalScore >= 60);
    // The path's final score is what the what-if endpoint gives for the same set of changes
    const replay = (await h.api('POST', '/careers/what-if', {
      token: alice.token,
      json: { changes: steps.slice(0, 10).map((s: any) => ({ type: 'add_project', skills: [s.skillName] })), careerIds: [devops] }
    })).body.data;
    if (steps.length <= 10) assert.equal(replay.careers[0].scoreAfter, cf.pathToTarget.finalScore, 'the path agrees with the what-if engine');
    // An unreachable target is reported as not reached, not rounded up
    const impossible = (await h.api('GET', `/careers/${devops}/counterfactuals?targetScore=100`, { token: alice.token })).body.data;
    assert.equal(impossible.pathToTarget.reached, impossible.pathToTarget.finalScore >= 100);
    assert.match(cf.note, /Not a prediction of hiring outcomes/);
    console.log('  ✓ A5 counterfactuals: ranked single changes, a monotonic path to a target score, consistent with what-if');

    // === A3. Freshness and revalidation ============================================================
    const fresh = (await h.api('GET', '/skills/freshness', { token: alice.token })).body.data;
    assert.equal(fresh.summary.total, 7);
    const react = fresh.skills.find((s: any) => s.name === 'React');
    const node = fresh.skills.find((s: any) => s.name === 'Node.js');
    assert.equal(react.lastEvidencedAt.slice(0, 10), '2023-12-31', 'dated by the end of the role it was used in');
    assert.equal(react.status, 'aging');
    assert.equal(react.verification, 'stated');
    assert.equal(react.revalidationSuggested, true);
    assert.equal(node.status, 'undated', 'a skill seen only in an undated project is undated');
    assert.equal(node.lastEvidencedAt, null);
    assert.equal(fresh.summary.current + fresh.summary.aging + fresh.summary.stale + fresh.summary.undated, fresh.summary.total);

    const scoreBefore = react.evidenceScore;
    const revalidated = await h.api('POST', `/skills/${react.userSkillId}/revalidate`, { token: alice.token, json: { note: 'Used <b>daily</b> at work' } });
    assert.equal(revalidated.status, 200);
    assert.equal(revalidated.body.data.skill.status, 'current');
    assert.equal(revalidated.body.data.skill.verification, 'self_attested', 'shown as the user\'s own confirmation, not as verified');
    assert.equal(revalidated.body.data.skill.evidenceScore, scoreBefore, 'a confirmation adds no points');
    assert.equal(revalidated.body.data.skill.basis, 'Confirmed by you: Used daily at work');
    assert.equal(revalidated.body.data.recalculation.status, 'skipped_duplicate', 'scores cannot have changed, so nothing is recomputed');

    assert.equal((await h.api('POST', `/skills/${react.userSkillId}/revalidate`, { token: bob.token, json: {} })).status, 404, "another user cannot revalidate Alice's skill");
    assert.equal((await h.api('POST', '/skills/not-an-id/revalidate', { token: alice.token, json: {} })).status, 404);
    assert.equal((await h.api('POST', `/skills/${react.userSkillId}/revalidate`, { token: alice.token, json: { note: 'x'.repeat(300) } })).status, 400);

    // The confirmation belongs to the user, not to the file: it survives reprocessing the resume
    assert.equal((await h.api('POST', '/resumes/reprocess', { token: alice.token })).status, 202);
    for (let i = 0; i < 100; i++) {
      if ((await h.api('GET', '/resumes/me', { token: alice.token })).body.data.resume?.parsingStatus === 'completed') break;
      await new Promise(r => setTimeout(r, 100));
    }
    const afterReprocess = (await h.api('GET', '/skills/freshness', { token: alice.token })).body.data.skills.find((s: any) => s.name === 'React');
    assert.equal(afterReprocess.status, 'current');
    assert.equal(afterReprocess.evidenceScore, scoreBefore);
    console.log('  ✓ A3 freshness: dated from role periods, undated when no date exists, self-confirmation is unverified, adds no points and survives reprocessing');

    // === A4. Transition plans ========================================================================
    const ml = idOf('Machine Learning Engineer');
    const created = await h.api('POST', '/careers/transition-plans', { token: alice.token, json: { targetCareerId: ml } });
    assert.equal(created.status, 201);
    const plan = created.body.data.plan;
    assert.equal(plan.targetCareerTitle, 'Machine Learning Engineer');
    assert.ok(plan.stages.length >= 1 && plan.stages.length <= 3);
    assert.equal(plan.stages.at(-1).careerId, ml, 'the last stage is the target');
    const allSkills = plan.stages.flatMap((s: any) => s.skillsToAcquire);
    assert.equal(new Set(allSkills).size, allSkills.length, 'a skill is assigned to one stage only');
    for (const stage of plan.stages) {
      assert.ok(stage.projectedScore >= stage.scoreAtCreation, `${stage.careerTitle}: projected ${stage.projectedScore} < current ${stage.scoreAtCreation}`);
      assert.equal(stage.currentScore, stage.scoreAtCreation);
      assert.equal(stage.reached, stage.skillsToAcquire.length === 0);
      assert.deepEqual(stage.skillsStillMissing, stage.skillsToAcquire);
    }
    if (plan.stages.length > 1) {
      assert.ok(plan.stages[0].scoreAtCreation > plan.stages.at(-1).scoreAtCreation, 'earlier stages are closer to the current profile');
    }
    assert.equal(plan.outdated, false);
    // The projected score is what the what-if engine gives for acquiring every listed skill
    const cumulative = (await h.api('POST', '/careers/what-if', { token: alice.token, json: { changes: [{ type: 'add_project', skills: allSkills.slice(0, 10) }], careerIds: [ml] } })).body.data;
    if (allSkills.length <= 10) assert.equal(cumulative.careers[0].scoreAfter, plan.stages.at(-1).projectedScore);

    assert.equal((await h.api('POST', '/careers/transition-plans', { token: alice.token, json: { targetCareerId: ml } })).status, 201);
    const plans = (await h.api('GET', '/careers/transition-plans', { token: alice.token })).body.data.plans;
    assert.equal(plans.length, 1, 'creating the same plan again replaces it');
    assert.deepEqual((await h.api('GET', '/careers/transition-plans', { token: bob.token })).body.data.plans, []);
    assert.equal((await h.api('DELETE', `/careers/transition-plans/${plans[0].id}`, { token: bob.token })).status, 404);
    assert.equal((await h.api('POST', '/careers/transition-plans', { token: noResume.token, json: { targetCareerId: ml } })).body.error.code, 'NO_SKILL_PROFILE');
    assert.equal((await h.api('DELETE', `/careers/transition-plans/${plans[0].id}`, { token: alice.token })).status, 200);
    assert.equal((await h.api('DELETE', `/careers/transition-plans/${plans[0].id}`, { token: alice.token })).status, 404);
    console.log(`  ✓ A4 transition plan: ${plan.stages.map((s: any) => s.careerTitle).join(' → ')}; projected scores agree with what-if; private to its owner`);

    // === Validation, ownership and the empty profile ====================================================
    const unknownCareer = new mongoose.Types.ObjectId().toString();
    const bad: Array<[string, string, unknown, number, string]> = [
      ['POST', '/careers/compare', { careerIds: [frontend] }, 400, 'VALIDATION_ERROR'],
      ['POST', '/careers/compare', { careerIds: [frontend, frontend] }, 400, 'VALIDATION_ERROR'],
      ['POST', '/careers/compare', { careerIds: [frontend, 'nope'] }, 400, 'VALIDATION_ERROR'],
      ['POST', '/careers/compare', { careerIds: [frontend, unknownCareer] }, 404, 'CAREER_NOT_FOUND'],
      ['POST', '/careers/compare', { careerIds: [frontend, devops, fullStack, ml, idOf('Data Analyst')] }, 400, 'VALIDATION_ERROR'],
      ['POST', '/careers/what-if', { changes: [] }, 400, 'VALIDATION_ERROR'],
      ['POST', '/careers/what-if', { changes: [{ type: 'win_lottery' }] }, 400, 'VALIDATION_ERROR'],
      ['POST', '/careers/what-if', { changes: [{ type: 'add_skill', skill: { $ne: '' } }] }, 400, 'VALIDATION_ERROR'],
      ['POST', '/careers/what-if', { changes: [{ type: 'add_skill', skill: 'Underwater Basket Weaving' }] }, 400, 'UNKNOWN_SKILL'],
      ['POST', '/careers/what-if', { changes: [{ type: 'add_project', skills: [] }] }, 400, 'VALIDATION_ERROR'],
      ['POST', '/careers/what-if', { changes: [{ type: 'add_skill', skill: 'Docker', userId: bob.userId }] }, 400, 'VALIDATION_ERROR'],
      ['GET', `/careers/${unknownCareer}/counterfactuals`, undefined, 404, 'CAREER_NOT_FOUND'],
      ['GET', '/careers/nope/counterfactuals', undefined, 400, 'VALIDATION_ERROR'],
      ['GET', `/careers/${devops}/counterfactuals?targetScore=900`, undefined, 400, 'VALIDATION_ERROR'],
      ['POST', '/careers/transition-plans', { targetCareerId: unknownCareer }, 404, 'CAREER_NOT_FOUND'],
      ['POST', '/careers/transition-plans', {}, 400, 'VALIDATION_ERROR']
    ];
    for (const [method, path, json, status, code] of bad) {
      const res = await h.api(method, path, { token: alice.token, json });
      assert.equal(res.status, status, `${method} ${path} ${JSON.stringify(json)?.slice(0, 50)}`);
      assert.equal(res.body.error.code, code);
    }
    for (const [method, path] of [['POST', '/careers/compare'], ['POST', '/careers/what-if'], ['GET', '/careers/transition-plans'], ['GET', '/skills/freshness'], ['GET', '/careers/catalog']] as const) {
      assert.equal((await h.api(method, path, method === 'POST' ? { json: {} } : {})).status, 401, `${path} requires sign-in`);
    }

    // A user with no resume gets real zeros and a flag, not sample numbers
    const emptyCompare = (await h.api('POST', '/careers/compare', { token: noResume.token, json: { careerIds: [frontend, devops] } })).body.data;
    assert.equal(emptyCompare.hasProfile, false);
    assert.ok(emptyCompare.careers.every((c: any) => c.matchScore === 0 && c.evidence.averageEvidenceScore === null));
    assert.deepEqual((await h.api('GET', '/skills/freshness', { token: noResume.token })).body.data.summary, { total: 0, current: 0, aging: 0, stale: 0, undated: 0 });
    // ...but can still ask what a first project would do
    const fromNothing = (await h.api('POST', '/careers/what-if', { token: noResume.token, json: { changes: [{ type: 'add_project', skills: ['React', 'JavaScript'] }], careerIds: [frontend] } })).body.data;
    assert.equal(fromNothing.hasProfile, false);
    assert.ok(fromNothing.careers[0].scoreBefore === 0 && fromNothing.careers[0].scoreAfter > 0);
    console.log(`  ✓ ${bad.length} invalid requests rejected; every endpoint requires sign-in; an empty profile gets zeros and hasProfile=false`);

    console.log('✅ Career Lab & Intelligence Foundation Tests Passed\n');
  } finally {
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runCareerLabTests();
    } catch (err) {
      console.error('❌ Career Lab Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
