import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import { Career } from '../models/Career.js';
import { CareerMatch } from '../models/CareerMatch.js';
import { CareerReadiness } from '../models/CareerReadiness.js';
import { GapAnalysis } from '../models/GapAnalysis.js';
import { AIExplanation } from '../models/AIExplanation.js';
import { joinNames, summarizeNextAction, summarizeReadiness, summarizeSkillGaps } from '../services/explanations/summaries.js';
import { effortFact } from '../services/explanations/GuidanceExplanationSubjects.js';
import { ciTestDatabaseUri } from './career_explanations.test.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * Verified summaries and the experimental local-AI flag (docs/AI_EXPLANATIONS.md):
 *  - summaries are fixed templates over the facts: exact figures and statuses, no model;
 *  - ENABLE_LOCAL_AI_EXPLANATIONS is off by default and enforced on the server: no generation (also
 *    by direct requests), no saved AI text returned, ownership still checked first;
 *  - AI wording, even when it is one of the known plausible-but-wrong claims, never becomes the
 *    verified summary.
 */

const READINESS_FACTS = {
  career_title: 'Backend Developer', readiness_score: 41, tier: 'Developing',
  dimensions: [
    { name: 'Technical Skills', score: 62, weight_percent: 50 }, { name: 'Professional Experience', score: 35, weight_percent: 25 },
    { name: 'Project Portfolio', score: 20, weight_percent: 15 }, { name: 'Education & Certifications', score: 10, weight_percent: 10 },
  ],
  required_total: 5, required_missing_skills: ['Docker', 'System Design'], requirements_total: 7, requirements_covered: 4,
  requirements_assessed: 1, evidence_shares: { assessed: 10, self_reported: 0, stated: 80, inferred: 10 },
};
const GAP_FACTS = {
  career_title: 'Backend Developer',
  gaps: [
    { skill: 'Docker', importance: 'required', kind: 'missing', impact: 60 },
    { skill: 'System Design', importance: 'required', kind: 'missing', impact: 40 },
    { skill: 'SQL', importance: 'required', kind: 'limited_evidence', impact: 40 },
    { skill: 'Kubernetes', importance: 'preferred', kind: 'missing', impact: 27 },
  ],
  strengths: [{ skill: 'Python', impact: 60 }],
};
const ACTION_FACTS = {
  career_title: 'Backend Developer', action_title: 'Do the practice project Containerised REST API', kind: 'project',
  skills: ['Docker', 'REST APIs'], rank: 1, total_actions: 5, score_before: 64, score_after: 70, impact: 6, required_gaps_addressed: 2,
  needs_learning_first: ['Docker'], effort: { low: 20, high: 40, unit: 'hours', basis: 'assumption' },
  hours_per_week: 10, weeks_low: 2, weeks_high: 4, fits_two_weeks: false,
};
// Claims a validator cannot judge; none may appear in rule-written text
const UNSUPPORTED = /\b(close to|mainly|matters most|quickest|quick fix|nearly as important|cannot go above|also improves|salar|demand|guarantee(?!\b)|hired|will raise|will increase)/i;

export async function runExplanationFlagTests() {
  console.log('🧪 Running Explanation Flag and Verified Summary Tests...');

  // --- Templates ----------------------------------------------------------------------------
  assert.equal(joinNames(['A']), 'A');
  assert.equal(joinNames(['A', 'B']), 'A and B');
  assert.equal(joinNames(['A', 'B', 'C']), 'A, B and C');

  const readiness = summarizeReadiness(READINESS_FACTS);
  assert.deepEqual(readiness.sentences, [
    'Your readiness for Backend Developer is 41/100, in the “Developing” tier.',
    'It combines four dimensions by weight: Technical Skills 62/100 (weight 50%), Professional Experience 35/100 (weight 25%), Project Portfolio 20/100 (weight 15%), Education & Certifications 10/100 (weight 10%).',
    'Your highest dimension is Technical Skills (62/100) and your lowest is Education & Certifications (10/100).',
    'You show evidence for 3 of 5 required skills.',
    "Not found: Docker and System Design. Each required skill that is not found takes part of the weighted total off (at most 40% in all); in SkillBridge's calculation, evidence for them would reduce that deduction.",
    '4 of 7 requirements for this career are covered; 1 of them was checked in a SkillBridge skill check.',
    'Of the credited evidence, 80% comes from your resume, 0% from portfolio projects you recorded, 10% from SkillBridge skill checks and 10% from related skills.',
    'Readiness describes the evidence in your profile; it is not a prediction of interview or hiring outcomes.',
  ]);
  const tied = summarizeReadiness({ ...READINESS_FACTS, dimensions: READINESS_FACTS.dimensions.map(d => ({ ...d, score: 30 })) });
  assert.ok(tied.sentences.includes('All four dimensions score 30/100.'), 'ties are stated as ties, never as one strongest dimension');
  const noShares = summarizeReadiness({ ...READINESS_FACTS, evidence_shares: { assessed: null, self_reported: null, stated: null, inferred: null } });
  assert.ok(noShares.sentences.includes('No skill evidence is credited yet.'));

  const gaps = summarizeSkillGaps(GAP_FACTS);
  assert.deepEqual(gaps.sentences, [
    'SkillBridge orders your 4 gaps for Backend Developer by priority: required skills that are not found come first, then the others, each by its priority score out of 100.',
    '2 required skills are not found: Docker and System Design.',
    'SQL is a required skill shown only weakly: it already counts, and stronger evidence would raise its contribution.',
    'Well evidenced: Python.',
  ]);
  assert.deepEqual(gaps.items, [
    'Docker: required, not found, priority 60/100',
    'System Design: required, not found, priority 40/100',
    'SQL: required, shown only weakly, priority 40/100',
    'Kubernetes: preferred, not found, priority 27/100',
  ], 'the gaps in the engine\'s order, with their own importance, status and priority');

  const action = summarizeNextAction(ACTION_FACTS);
  assert.deepEqual(action.sentences, [
    'SkillBridge ranks “Do the practice project Containerised REST API” first of 5 possible actions for Backend Developer.',
    'It is a practice project that adds evidence for Docker and REST APIs.',
    "In SkillBridge's scoring it would move your match score from 64 to 70 (+6). This is a hypothetical change, not a guarantee.",
    'It addresses 2 required skills you have not yet shown in use.',
    'You would need to learn Docker first.',
    'Effort: 20 to 40 hours (an assumed planning range, not a measurement).',
    'At your 10 hours a week that is about 2 to 4 weeks, so it does not fit into two weeks.',
    'The ranking adds the score change, points for required skills it addresses and for fitting your weekly hours, and subtracts points when a skill must be learnt first; a tie goes to the action with less effort.',
  ]);
  const check = summarizeNextAction({ ...ACTION_FACTS, kind: 'verify', action_title: 'Take the Docker skill check', skills: ['Docker'],
    needs_learning_first: [], required_gaps_addressed: 1, effort: { low: 20, high: 20, unit: 'minutes', basis: 'time limit' },
    hours_per_week: null, weeks_low: null, weeks_high: null, fits_two_weeks: null });
  assert.ok(check.sentences.includes('It is a SkillBridge skill check for Docker.'));
  assert.ok(check.sentences.includes('Nothing has to be learnt first.'));
  assert.ok(check.sentences.includes('Effort: 20 minutes (the time limit of the skill check).'));
  assert.ok(check.sentences.includes('Set your weekly hours to see how it fits your schedule.'));
  // Corrected claims (audit): readiness is not a plain weighted total when a deduction applies, and
  // evidence for a missing skill is only guaranteed to reduce the deduction, not to raise the
  // rounded score; rounded effort is said to be approximate
  const allReadiness = readiness.sentences.join(' ');
  assert.ok(!/weighted total of four|of the total\)|would raise readiness/.test(allReadiness), 'no unsupported readiness claim');
  assert.deepEqual(effortFact({ low: 10.25, high: 20.25, basis: 'assumption' }), { low: 10, high: 20, unit: 'hours', basis: 'assumption', approximate: true });
  assert.deepEqual(effortFact({ low: 0.25, high: 0.25, basis: 'time limit' }), { low: 15, high: 15, unit: 'minutes', basis: 'time limit', approximate: false });
  assert.deepEqual(effortFact({ low: 20, high: 40, basis: 'assumption' }), { low: 20, high: 40, unit: 'hours', basis: 'assumption', approximate: false });
  const rounded = summarizeNextAction({ ...ACTION_FACTS, effort: { low: 10, high: 20, unit: 'hours', basis: 'assumption', approximate: true } });
  assert.ok(rounded.sentences.includes('Effort: about 10 to 20 hours (an assumed planning range, not a measurement).'), 'rounded effort says "about"');
  for (const text of [readiness, gaps, action, check].flatMap(s => [...s.sentences, ...s.items])) {
    assert.ok(!UNSUPPORTED.test(text.replace('not a guarantee', '')), `rule-written text makes no unsupported claim: ${text}`);
  }
  console.log('  ✓ Verified summaries state the facts exactly: figures, tiers, ties, order, status, effort and capacity');

  // --- The flag, over HTTP --------------------------------------------------------------------
  const fakeAi = await ensureFakeAiService();
  await CareerService.seedInitialTaxonomy();
  const [career] = await Career.find().sort({ title: 1 }).limit(1).lean();
  const h = await startHttpHarness();
  const originalFlag = process.env.ENABLE_LOCAL_AI_EXPLANATIONS;
  const calls = () => fakeAi.explain.paths.length;
  try {
    const alice = await h.registerUser('flag-alice');
    const bob = await h.registerUser('flag-bob');
    const uid = new mongoose.Types.ObjectId(alice.userId);
    await CareerMatch.create({ userId: uid, careerId: career._id, matchScore: 64, confidence: 50, summary: 'Synthetic.', breakdown: [
      { skillName: 'Python', importance: 'required', weight: 3, status: 'applied', evidenceScore: 80, pointsEarned: 9, pointsPossible: 9 },
      { skillName: 'Docker', importance: 'required', weight: 3, status: 'missing', evidenceScore: 0, pointsEarned: 0, pointsPossible: 9 },
    ] });
    await CareerReadiness.create({ userId: uid, careerId: career._id, overallScore: 41, readinessTier: 'Developing', interpretation: 'Synthetic.',
      dimensions: READINESS_FACTS.dimensions.map(d => ({ name: d.name, score: d.score, weight: d.weight_percent / 100 })),
      evidenceBasis: { assessed: 10, selfReported: 0, stated: 80, inferred: 10, requirementsTotal: 2, requirementsCovered: 1, requirementsAssessed: 0, requiredMissing: 1 } });
    await GapAnalysis.create({ userId: uid, careerId: career._id, criticalGaps: [{ skillName: 'Docker', impactScore: 60, reason: 'Synthetic.' }], weakAreas: [], strengthAreas: [] });
    const api = (method: string, path: string, token = alice.token) => h.api(method, path, { token });
    const paths = {
      career: `/careers/${career._id}/explanation`,
      readiness: `/careers/${career._id}/explanations/readiness`,
      gaps: `/careers/${career._id}/explanations/skill-gap`,
      action: `/careers/${career._id}/explanations/next-action`,
    };

    // Off by default (no setting at all)
    delete process.env.ENABLE_LOCAL_AI_EXPLANATIONS;
    const before = calls();
    for (const [name, path] of Object.entries(paths)) {
      const read = await api('GET', path);
      assert.equal(read.status, 200, `${name}: ${JSON.stringify(read.body)}`);
      assert.equal(read.body.data.aiEnabled, false, `${name}: reported as off`);
      assert.equal(read.body.data.explanation, null, `${name}: no AI text`);
      const generated = await api('POST', path);
      assert.equal(generated.status, 403, `${name}: generation refused`);
      assert.equal(generated.body.error.code, 'AI_EXPLANATIONS_DISABLED');
      assert.equal((await api('POST', path, bob.token)).status, 404, `${name}: another user is still not found, flag or not`);
      assert.equal((await h.api('POST', path)).status, 401, `${name}: sign-in still required`);
    }
    assert.equal(calls(), before, 'the AI service is never called while the flag is off');
    const off = (await api('GET', paths.readiness)).body.data;
    assert.equal(off.summary.source, 'skillbridge_rules');
    assert.equal(off.summary.sentences[0], `Your readiness for ${career.title} is 41/100, in the “Developing” tier.`);
    assert.ok((await api('GET', paths.gaps)).body.data.summary.items[0].startsWith('Docker: required, not found, priority 60/100'));
    assert.equal((await api('GET', paths.career)).body.data.summary, null, 'career match has no summary: its breakdown is shown beside it');
    for (const value of ['false', '0', 'off', 'no', 'TRUE-ish', '']) {
      process.env.ENABLE_LOCAL_AI_EXPLANATIONS = value;
      assert.equal((await api('POST', paths.readiness)).status, 403, `"${value}" does not turn it on`);
    }
    console.log('  ✓ Off by default and enforced on the server: no generation, also by direct requests; summaries still shown');

    // On: AI wording is separate from the verified summary, even when it is a known wrong claim
    process.env.ENABLE_LOCAL_AI_EXPLANATIONS = 'true';
    fakeAi.explain.mode = 'ok';
    fakeAi.explain.text = 'Most of your credited evidence comes from skill checks.';
    const generated = await api('POST', paths.readiness);
    assert.equal(generated.status, 200);
    const on = (await api('GET', paths.readiness)).body.data;
    assert.equal(on.aiEnabled, true);
    assert.equal(on.explanation.text, 'Most of your credited evidence comes from skill checks.', 'the AI wording is returned as AI wording');
    assert.equal(on.explanation.provider, 'fake_local');
    assert.deepEqual(on.summary.sentences, off.summary.sentences, 'the verified summary is unchanged by any AI text');
    assert.ok(on.summary.sentences.some((s: string) => s.includes('80% comes from your resume')), 'and still states the true figure');
    assert.ok(!on.summary.sentences.join(' ').includes('Most of your credited evidence'), 'AI text never enters the summary');

    // Turned off again: the saved AI text is no longer returned, and the record is kept, not deleted
    process.env.ENABLE_LOCAL_AI_EXPLANATIONS = 'false';
    const hidden = (await api('GET', paths.readiness)).body.data;
    assert.equal(hidden.explanation, null, 'a cached AI explanation does not bypass the flag');
    assert.equal(await AIExplanation.countDocuments({ userId: uid, subject: 'readiness' }), 1, 'saved evidence is preserved');
    console.log('  ✓ AI wording stays separate from the verified summary, and a cached one is hidden while the flag is off');

    console.log('✅ Explanation Flag and Verified Summary Tests Passed\n');
  } finally {
    if (originalFlag === undefined) delete process.env.ENABLE_LOCAL_AI_EXPLANATIONS;
    else process.env.ENABLE_LOCAL_AI_EXPLANATIONS = originalFlag;
    Object.assign(fakeAi.explain, { mode: 'ok', text: 'Deterministic test explanation of your match.' });
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const ciUri = ciTestDatabaseUri(process.env.EXPLANATION_TEST_MONGODB_URI);
    const mongoServer = ciUri ? null : await MongoMemoryServer.create();
    await mongoose.connect(ciUri ?? mongoServer!.getUri());
    if (ciUri) await mongoose.connection.dropDatabase();
    try {
      await runExplanationFlagTests();
    } catch (err) {
      console.error('❌ Explanation Flag Test Failed:', err);
      process.exitCode = 1;
    } finally {
      if (ciUri) await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
      await mongoServer?.stop();
    }
  })();
}
