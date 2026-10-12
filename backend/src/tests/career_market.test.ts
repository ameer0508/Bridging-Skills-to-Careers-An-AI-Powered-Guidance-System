import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import { classifyMarketSummary, defaultMarketPeriod, marketEvidenceForCareers } from '../services/CareerMarketEvidence.js';
import { marketFactor, rankNextActions, NBA_WEIGHTS, type NextActionInput } from '../services/NextBestAction.js';
import MarketOpportunityService from '../services/market/MarketOpportunityService.js';
import MarketIngestionService from '../services/market/MarketIngestionService.js';
import { MARKET_SUMMARY_CONTRACT_VERSION, STALE_AFTER_DAYS, unavailableSummary, type MarketOpportunitySummary } from '../services/market/MarketOpportunitySummary.js';
import { HISTORY_MINIMUMS } from '../services/market/MarketHistoryService.js';
import { registerMarketSource } from '../config/marketSources.js';
import { buildSyntheticMarketFixture } from '../seed/marketFixture.js';
import MarketPosting from '../models/MarketPosting.js';
import MarketImportBatch from '../models/MarketImportBatch.js';
import { CAREER_TAXONOMY } from '../seed/careerTaxonomy.js';
import { EVIDENCE_POINTS } from '../services/EvidenceCalculator.js';
import { skillKeys } from '../utils/skillMatching.js';
import type { ICareerRequirement } from '../models/CareerRequirement.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness, resumeForm, type HttpHarness } from './helpers/httpHarness.js';

/**
 * Career Lab and next-best-action as consumers of the market module's MarketOpportunitySummary:
 * a posting count is shown only for valid, fresh, sourced evidence; everything else is
 * "unavailable" with its reason; market evidence never changes a score or a ranking.
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

const career = { id: new mongoose.Types.ObjectId().toString(), title: 'Frontend Engineer' };
const period = { from: '2026-01', to: '2026-10' };

/** A summary as the market module would return it for valid sourced history. */
const validSummary = (overrides: Partial<MarketOpportunitySummary> = {}): MarketOpportunitySummary => ({
  contractVersion: MARKET_SUMMARY_CONTRACT_VERSION,
  careerId: career.id,
  careerTitle: career.title,
  location: { country: null, label: 'All countries' },
  period,
  dataset: 'sourced',
  evidenceClass: 'sourced_valid',
  usableForRecommendations: true,
  matchingRule: 'Posting title contains "Frontend Engineer" as whole words (case-insensitive).',
  sourcedObservations: 44,
  distinctPostings: 40,
  sources: [{ id: 's', name: 'Test source', licence: 'CC BY 4.0 (test)', postings: 40 }],
  freshness: { latestPostedAt: '2026-09-20T00:00:00.000Z', latestRetrievedAt: '2026-10-05T00:00:00.000Z', ageDays: 7 },
  demand: { monthly: [{ month: '2026-07', postings: 10 }, { month: '2026-08', postings: 15 }, { month: '2026-09', postings: 15 }, { month: '2026-10', postings: 0 }], minimums: HISTORY_MINIMUMS },
  available: true,
  insufficientDataReasons: [],
  ...overrides
});

export async function runCareerMarketTests() {
  console.log('🧪 Running Career Lab Market Evidence Tests...');

  // === Reading the contract =====================================================================
  const valid = classifyMarketSummary(validSummary());
  assert.deepEqual([valid.state, valid.usable, valid.label], ['sourced_valid', true, '40 postings']);
  assert.deepEqual(
    { n: valid.evidence!.distinctPostings, months: valid.evidence!.monthsWithPostings, where: valid.evidence!.location, period: valid.evidence!.period, source: valid.evidence!.sources[0], age: valid.evidence!.ageDays },
    { n: 40, months: 3, where: 'All countries', period, source: { name: 'Test source', licence: 'CC BY 4.0 (test)', postings: 40 }, age: 7 },
    'a real count comes with its source, licence, location, period, sample size and freshness'
  );

  const cases: Array<[string, MarketOpportunitySummary | null, string]> = [
    ['no source', unavailableSummary(career, period, ['no_registered_source']), 'no_source'],
    ['sparse', validSummary({ evidenceClass: 'sourced_sparse', usableForRecommendations: false, available: false, demand: null, distinctPostings: 4, insufficientDataReasons: ['too_few_postings'] }), 'sparse'],
    ['nothing matched', validSummary({ evidenceClass: 'sourced_sparse', usableForRecommendations: false, available: false, demand: null, distinctPostings: 0, insufficientDataReasons: ['career_not_mapped_to_postings'] }), 'sparse'],
    ['stale', validSummary({ evidenceClass: 'sourced_sparse', usableForRecommendations: false, available: false, demand: null, insufficientDataReasons: ['stale_data'] }), 'stale'],
    ['synthetic', validSummary({ dataset: 'synthetic_fixture', evidenceClass: 'synthetic_test_data', usableForRecommendations: false, available: false, demand: null, insufficientDataReasons: ['synthetic_test_data'] }), 'synthetic'],
    ['missing', null, 'error'],
    ['other contract version', { ...validSummary(), contractVersion: 3 } as unknown as MarketOpportunitySummary, 'error'],
    // Inconsistent summaries are never trusted
    ['synthetic claiming to be valid', validSummary({ dataset: 'synthetic_fixture' }), 'synthetic'],
    ['valid class but flagged unusable', validSummary({ usableForRecommendations: false }), 'sparse'],
    ['valid class but a reason given', validSummary({ insufficientDataReasons: ['too_few_postings'] }), 'sparse'],
    ['valid class without demand', validSummary({ demand: null }), 'sparse'],
    ['valid class with no postings', validSummary({ distinctPostings: 0 }), 'sparse']
  ];
  for (const [label, summary, state] of cases) {
    const read = classifyMarketSummary(summary);
    assert.deepEqual([read.state, read.usable, read.evidence, read.label], [state, false, null, 'Market data unavailable'], `${label}: unavailable, with no number at all`);
    assert.ok(read.detail.length > 20 && !/\d/.test(read.detail), `${label}: the reason is given in words, without a figure that could be read as demand`);
  }
  assert.deepEqual(defaultMarketPeriod(new Date('2026-10-12T00:00:00Z')), { from: '2025-11', to: '2026-10' });
  console.log(`  ✓ Contract: a count only for valid, fresh, sourced evidence; ${cases.length} other cases (no source, sparse, stale, synthetic, missing, inconsistent) are unavailable without a figure`);

  // === R3: market evidence has no influence on the ranking =======================================
  type Taxonomy = Array<{ title: string; requirements: Array<{ skill: string; importance: string; weight: number }> }>;
  const frontend = (CAREER_TAXONOMY as unknown as Taxonomy).find(c => c.title === 'Frontend Engineer')!;
  const input: NextActionInput = {
    skills: ['JavaScript', 'React'].map(name => ({ canonicalName: name, aliases: [], evidenceScore: EVIDENCE_POINTS.listed, evidences: [{ sourceType: 'resume_skills', description: 'listed', weight: 0.2 }], hypothetical: false })),
    requirements: frontend.requirements.map(r => ({ skillName: r.skill, importance: r.importance, weight: r.weight })) as unknown as ICareerRequirement[],
    requirementKeys: new Set((CAREER_TAXONOMY as unknown as Taxonomy).flatMap(c => c.requirements.flatMap(r => skillKeys(r.skill)))),
    hoursPerWeek: 10,
    verifiedSkills: [],
    briefStatus: {},
    unpublishedProjects: []
  };
  const order = (market?: Parameters<typeof marketFactor>[0]) => rankNextActions({ ...input, market }).actions.map(a => [a.id, a.score, a.rank]);
  const withoutMarket = order(undefined);
  assert.ok(withoutMarket.length > 3);
  for (const [label, summary] of cases) {
    const evidence = classifyMarketSummary(summary);
    assert.deepEqual(order(evidence), withoutMarket, `${label}: ranking and scores are identical to having no market data`);
    assert.deepEqual([marketFactor(evidence).value, marketFactor(evidence).weight, marketFactor(evidence).eligible], [null, 0, false], `${label}: zero market influence`);
  }
  // Even valid evidence does not move the ranking: the factor is recorded, its weight is still 0
  assert.deepEqual(order(valid), withoutMarket, 'valid market evidence does not change the ranking either');
  assert.deepEqual([marketFactor(valid).value, marketFactor(valid).weight, marketFactor(valid).eligible], [40, 0, true]);
  assert.equal(NBA_WEIGHTS.market, 0);
  assert.equal(marketFactor(undefined).state, 'not_looked_up');
  console.log('  ✓ R3: synthetic, sparse, stale, missing and even valid market evidence leave every score and rank unchanged (weight 0)');

  // === Through the API ==========================================================================
  await ensureFakeAiService();
  await CareerService.seedInitialTaxonomy();
  await MarketPosting.deleteMany({});
  await MarketImportBatch.deleteMany({});
  const h = await startHttpHarness();
  const importer = new mongoose.Types.ObjectId().toString();
  let unregister: (() => void) | null = null;
  try {
    const alice = await h.registerUser('alice');
    assert.ok([200, 201].includes((await h.api('POST', '/resumes/upload', { token: alice.token, form: resumeForm(RESUME) })).status));
    await waitForResume(h, alice.token);
    const careers = (await h.api('GET', '/careers/catalog', { token: alice.token })).body.data.careers as Array<{ id: string; title: string }>;
    const idOf = (title: string) => careers.find(c => c.title === title)!.id;
    const ids = ['Frontend Engineer', 'DevOps Engineer', 'Data Analyst'].map(idOf);
    const compare = async () => (await h.api('POST', '/careers/compare', { token: alice.token, json: { careerIds: ids } })).body.data;
    const scores = (result: any) => result.careers.map((c: any) => [c.careerTitle, c.matchScore, c.effort.pointsToClose]);

    // 1. No licensed source
    const none = await compare();
    assert.deepEqual(none.careers.map((c: any) => [c.market.state, c.market.usable, c.market.evidence]), ids.map(() => ['no_source', false, null]));
    assert.deepEqual([none.marketData.available, none.marketData.careersWithEvidence], [false, 0]);
    assert.match(none.marketData.reason, /^Market data unavailable/);
    const baselineScores = scores(none);

    // The single-career endpoint behind the Careers page gives the same answer
    const single = await h.api('GET', `/careers/${ids[0]}/market-evidence`, { token: alice.token });
    assert.deepEqual([single.status, single.body.data.state, single.body.data.usable, single.body.data.evidence], [200, 'no_source', false, null]);
    assert.equal((await h.api('GET', `/careers/${ids[0]}/market-evidence`)).status, 401);
    assert.equal((await h.api('GET', '/careers/nope/market-evidence', { token: alice.token })).status, 400);
    assert.equal((await h.api('GET', `/careers/${new mongoose.Types.ObjectId()}/market-evidence`, { token: alice.token })).status, 404);

    // 2. Generated fixture data is present, but a comparison never reads it
    await MarketIngestionService.importBatch(buildSyntheticMarketFixture({ endMonth: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 1, 1)).toISOString().slice(0, 7), retrievedAt: new Date().toISOString() }), importer);
    assert.ok((await MarketPosting.countDocuments({ dataset: 'synthetic_fixture' })) > 0);
    const withSynthetic = await compare();
    assert.ok(withSynthetic.careers.every((c: any) => !c.market.usable && c.market.evidence === null), 'synthetic postings never appear as opportunities');
    assert.ok(!JSON.stringify(withSynthetic.careers.map((c: any) => c.market)).match(/"distinctPostings"/));

    // 3. A licensed source with sparse, valid and no history for the three careers
    unregister = registerMarketSource({ id: 'test-career-market', name: 'Test market source', url: 'https://example.org/jobs', licence: 'CC BY 4.0 (test)', attribution: 'Test', dataset: 'sourced', verifiedOn: '2026-10-12', retentionDays: null });
    const now = new Date();
    const monthsAgo = (n: number, day: number) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - n, day)).toISOString();
    const frontendPostings = Array.from({ length: 36 }, (_, i) => ({ sourceRecordId: `fe-${i}`, title: i % 2 ? 'Frontend Engineer' : 'Senior Frontend Engineer', company: `Employer ${i}`, postedAt: monthsAgo(1 + (i % 4), 1 + (i % 20)) }));
    await MarketIngestionService.importBatch({ sourceId: 'test-career-market', retrievedAt: now.toISOString(), postings: [...frontendPostings, { sourceRecordId: 'ops-1', title: 'DevOps Engineer', company: 'Employer X', postedAt: monthsAgo(1, 3) }] }, importer);

    const sourced = await compare();
    const byTitle = Object.fromEntries(sourced.careers.map((c: any) => [c.careerTitle, c.market])) as Record<string, any>;
    const fromService = await MarketOpportunityService.summaryForCareer({ id: idOf('Frontend Engineer'), title: 'Frontend Engineer' }, { dataset: 'sourced', ...defaultMarketPeriod() });
    assert.deepEqual([byTitle['Frontend Engineer'].state, byTitle['Frontend Engineer'].usable], ['sourced_valid', true]);
    assert.equal(byTitle['Frontend Engineer'].evidence.distinctPostings, fromService.distinctPostings, 'the count is the market module\'s own figure');
    assert.equal(fromService.distinctPostings, 36);
    assert.deepEqual(byTitle['Frontend Engineer'].evidence.sources, [{ name: 'Test market source', licence: 'CC BY 4.0 (test)', postings: 36 }]);
    assert.deepEqual([byTitle['Frontend Engineer'].evidence.location, byTitle['Frontend Engineer'].evidence.period, byTitle['Frontend Engineer'].evidence.ageDays], ['All countries', defaultMarketPeriod(), 0]);
    assert.deepEqual([byTitle['DevOps Engineer'].state, byTitle['DevOps Engineer'].evidence], ['sparse', null], 'one posting is too few: unavailable, not "1 posting"');
    assert.deepEqual([byTitle['Data Analyst'].state, byTitle['Data Analyst'].evidence], ['sparse', null], 'no matching posting is unavailable, not zero');
    assert.deepEqual([sourced.marketData.available, sourced.marketData.careersWithEvidence], [true, 1]);
    const singleValid = (await h.api('GET', `/careers/${idOf('Frontend Engineer')}/market-evidence`, { token: alice.token })).body.data;
    assert.deepEqual([singleValid.state, singleValid.evidence.distinctPostings], ['sourced_valid', 36]);
    assert.match(sourced.marketData.reason, /unavailable, not zero/);
    assert.deepEqual(scores(sourced), baselineScores, 'market evidence changes no match score and no effort figure');

    // The next-action ranking sees the evidence and is unmoved by it
    const next = (await h.api('GET', `/recommendations/next-actions?careerId=${idOf('Frontend Engineer')}`, { token: alice.token })).body.data;
    assert.ok(next.actions.length > 0 && next.actions.every((a: any) => a.factors.market.eligible === true && a.factors.market.weight === 0 && a.factors.market.value === 36));
    unregister();
    unregister = null;
    const nextWithout = (await h.api('GET', `/recommendations/next-actions?careerId=${idOf('Frontend Engineer')}`, { token: alice.token })).body.data;
    assert.deepEqual(nextWithout.actions.map((a: any) => [a.id, a.score]), next.actions.map((a: any) => [a.id, a.score]), 'the same ranking with and without valid market evidence');
    assert.ok(nextWithout.actions.every((a: any) => a.factors.market.eligible === false && a.factors.market.value === null));

    // 4. The same history, long after it was collected, is stale
    unregister = registerMarketSource({ id: 'test-career-market', name: 'Test market source', url: 'https://example.org/jobs', licence: 'CC BY 4.0 (test)', attribution: 'Test', dataset: 'sourced', verifiedOn: '2026-10-12', retentionDays: null });
    await MarketPosting.updateMany({ sourceId: 'test-career-market' }, { $set: { lastSeenAt: new Date(Date.now() - (STALE_AFTER_DAYS + 2) * 24 * 60 * 60 * 1000) } });
    const stale = (await compare()).careers.find((c: any) => c.careerTitle === 'Frontend Engineer').market;
    assert.deepEqual([stale.state, stale.usable, stale.evidence], ['stale', false, null]);

    // 5. A client cannot supply or steer the evidence
    for (const extra of [{ market: valid }, { dataset: 'synthetic_fixture' }, { marketData: { available: true } }]) {
      assert.equal((await h.api('POST', '/careers/compare', { token: alice.token, json: { careerIds: ids, ...extra } })).status, 400, JSON.stringify(Object.keys(extra)));
    }
    assert.equal((await h.api('POST', '/careers/compare', { json: { careerIds: ids } })).status, 401);

    // A failing market module leaves the comparison working
    const original = MarketOpportunityService.summaryForCareer;
    MarketOpportunityService.summaryForCareer = async () => {
      throw new Error('market store unavailable');
    };
    try {
      const degraded = await compare();
      assert.deepEqual(scores(degraded), baselineScores);
      assert.ok(degraded.careers.every((c: any) => c.market.state === 'error' && c.market.evidence === null));
      assert.equal((await marketEvidenceForCareers([career])).get(career.id)!.state, 'error');
    } finally {
      MarketOpportunityService.summaryForCareer = original;
    }
    console.log('  ✓ Comparison: no source, synthetic-only, sparse, unmatched, valid and stale are each shown as what they are; scores never move; client input cannot supply evidence; a market failure degrades gracefully');

    console.log('✅ Career Lab Market Evidence Tests Passed\n');
  } finally {
    if (unregister) unregister();
    await MarketPosting.deleteMany({});
    await MarketImportBatch.deleteMany({});
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runCareerMarketTests();
    } catch (err) {
      console.error('❌ Career Market Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
