import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { registerMarketSource } from '../config/marketSources.js';
import MarketPosting from '../models/MarketPosting.js';
import MarketImportBatch from '../models/MarketImportBatch.js';
import MarketIngestionService from '../services/market/MarketIngestionService.js';
import MarketSkillTrendService, { TREND_MINIMUMS, twoProportionZ } from '../services/market/MarketSkillTrendService.js';
import { buildSyntheticMarketFixture } from '../seed/marketFixture.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * C4 skill trend mining: shares over a stable denominator, a skill counted once per posting
 * whatever alias was used, duplicates and conflicting re-imports never inflating counts, a change
 * stated only with enough data and a significant difference, and real and synthetic data apart.
 */

const RETRIEVED = '2026-10-01T00:00:00.000Z';
const FULL = { from: '2025-10', to: '2026-09' };
const importer = new mongoose.Types.ObjectId().toString();
const trends = (extra: Partial<Parameters<typeof MarketSkillTrendService.trends>[0]> = {}) =>
  MarketSkillTrendService.trends({ dataset: 'synthetic_fixture', granularity: 'quarter', limit: 15, ...FULL, ...extra });

export async function runMarketSkillTrendTests() {
  console.log('🧪 Running Market Skill Trend (C4) Tests...');
  await MarketPosting.deleteMany({});
  await MarketImportBatch.deleteMany({});

  // === The test statistic =======================================================================
  assert.ok((twoProportionZ(0, 72, 20, 144) as number) > TREND_MINIMUMS.zThreshold);
  assert.ok(Math.abs(twoProportionZ(36, 72, 72, 144) as number) < 1e-9, 'equal shares give z = 0');
  assert.equal(twoProportionZ(0, 0, 3, 10), null);
  assert.equal(twoProportionZ(0, 10, 0, 10), null, 'no variance, no statistic');
  console.log('  ✓ Two-proportion z: positive for a rise, zero for equal shares, undefined without data');

  // === Synthetic fixture =======================================================================
  const fixture = buildSyntheticMarketFixture({ endMonth: '2026-09', retrievedAt: RETRIEVED });
  await MarketIngestionService.importBatch(fixture, importer);
  const first = await trends();
  assert.equal(first.isSynthetic, true);
  assert.match(first.caveats[0], /SYNTHETIC TEST DATA/);
  assert.deepEqual(first.periods.map(p => p.period), ['2025-Q4', '2026-Q1', '2026-Q2', '2026-Q3']);
  assert.equal(first.periods.reduce((s, p) => s + p.postings, 0), first.totals.distinctPostings, 'periods add up to the denominator');
  assert.equal(first.totals.undatedExcluded, 1);
  assert.equal(first.sufficiency.sufficient, true);

  const kubernetes = first.skills.find(s => s.skill === 'Kubernetes');
  assert.ok(kubernetes, 'Kubernetes is among the most mentioned skills');
  assert.equal(kubernetes.change.earlier.mentions, 0);
  assert.equal(kubernetes.change.recent.mentions, 20);
  assert.equal(kubernetes.change.direction, 'higher_share');
  const python = first.skills.find(s => s.skill === 'Python');
  assert.equal(python?.change.direction, 'no_clear_change', 'a steady share is not reported as a trend');
  assert.equal(python?.share, (python?.mentions ?? 0) / first.totals.distinctPostings);
  console.log('  ✓ Fixture: stable denominator, undated excluded, rising Kubernetes detected, steady Python not called a trend');

  // === Duplicates and contradictions ==============================================================
  await MarketIngestionService.importBatch({ ...fixture, retrievedAt: '2026-10-05T00:00:00.000Z' }, importer);
  const original = fixture.postings[0] as Record<string, unknown>;
  await MarketIngestionService.importBatch({ ...fixture, postings: [{ ...original, title: 'Kubernetes Platform Lead', description: 'Kubernetes everywhere' }] }, importer);
  const again = await trends();
  assert.equal(again.totals.distinctPostings, first.totals.distinctPostings, 're-observations add no postings');
  assert.equal(again.skills.find(s => s.skill === 'Kubernetes')?.mentions, 20, 'a contradicting re-import does not change the stored posting');
  console.log('  ✓ Re-imports and contradicting records leave every count unchanged');

  // === Windows ================================================================================
  const lastQuarter = await trends({ from: '2026-07', to: '2026-09' });
  assert.ok(lastQuarter.sufficiency.reasons.includes('too_few_months_with_postings'));
  const k3 = lastQuarter.skills.find(s => s.skill === 'Kubernetes');
  assert.equal(k3?.mentions, 20, 'counts are still shown');
  assert.equal(k3?.change.direction, null, 'but no change is stated');
  const monthly = await trends({ granularity: 'month', skills: ['Kubernetes'] });
  assert.equal(monthly.periods.length, 12);
  assert.deepEqual(monthly.skills[0].byPeriod.slice(-3).map(p => p.mentions), [6, 7, 7]);
  const gb = await trends({ country: 'GB' });
  assert.ok(gb.totals.distinctPostings > 0 && gb.totals.distinctPostings < first.totals.distinctPostings);
  console.log('  ✓ Windows: a short period gives counts without a trend; monthly and country filters change the denominator');

  // === Aliases, sparse sourced data, zero observations ===========================================
  const sourcedEmpty = await trends({ dataset: 'sourced' });
  assert.deepEqual(sourcedEmpty.sufficiency.reasons, ['no_registered_source', 'no_records']);
  assert.deepEqual(sourcedEmpty.skills, [], 'synthetic postings never appear in sourced results');

  const unregister = registerMarketSource({
    id: 'test-trend-source', name: 'Test trend source', url: 'https://example.org/jobs', licence: 'CC BY 4.0 (test)',
    attribution: 'Test', dataset: 'sourced', verifiedOn: '2026-10-12', retentionDays: null,
  });
  try {
    await MarketIngestionService.importBatch({
      sourceId: 'test-trend-source',
      retrievedAt: RETRIEVED,
      postings: [
        { sourceRecordId: 's1', title: 'Database Engineer', description: 'We run Postgres.', postedAt: '2026-08-03T00:00:00Z' },
        { sourceRecordId: 's2', title: 'Backend Engineer', description: 'PostgreSQL and Postgres tuning.', postedAt: '2026-08-04T00:00:00Z' },
        { sourceRecordId: 's3', title: 'Office Manager', description: 'Keep the office running.', postedAt: '2026-08-05T00:00:00Z' },
      ],
    }, importer);
    const sparse = await trends({ dataset: 'sourced', skills: ['PostgreSQL', 'Rust'] });
    const pg = sparse.skills.find(s => s.skill === 'PostgreSQL');
    assert.equal(pg?.mentions, 2, 'two aliases in one posting count once');
    assert.equal(pg?.share, 2 / 3, 'the posting without any known skill stays in the denominator');
    assert.equal(sparse.totals.postingsWithoutRecognisedSkills, 1);
    assert.deepEqual(pg?.change.reasons, ['too_few_months_with_postings', 'too_few_postings_per_half', 'too_few_employers', 'too_few_skill_mentions']);
    const rust = sparse.skills.find(s => s.skill === 'Rust');
    assert.deepEqual([rust?.mentions, rust?.share], [0, 0], 'zero observations are a measured zero, not missing');
    assert.equal(sparse.sources[0].licence, 'CC BY 4.0 (test)');
    console.log('  ✓ Aliases count once per posting; sparse sourced data gives counts with reasons; zero mentions are zero');

    // === HTTP ==================================================================================
    const h = await startHttpHarness();
    try {
      assert.equal((await h.api('GET', '/market/skill-trends')).status, 401);
      const user = await h.registerUser('trends');
      const res = await h.api('GET', `/market/skill-trends?dataset=synthetic_fixture&from=${FULL.from}&to=${FULL.to}&skills=k8s,python`, { token: user.token });
      assert.equal(res.status, 200, JSON.stringify(res.body));
      assert.deepEqual(res.body.data.skills.map((s: { skill: string }) => s.skill), ['Kubernetes', 'Python'], 'aliases in the request are canonicalised');
      const defaults = (await h.api('GET', '/market/skill-trends', { token: user.token })).body.data;
      assert.equal(defaults.dataset, 'sourced');
      assert.equal(defaults.query.granularity, 'quarter');
      const bad = ['granularity=week', 'limit=0', 'limit=51', 'skills=NotASkillAtAll', `skills=${Array(11).fill('Python').join(',')}`, 'from=2026-05&to=2026-01', 'extra=1'];
      for (const q of bad) {
        assert.equal((await h.api('GET', `/market/skill-trends?${q}`, { token: user.token })).status, 400, `${q} is rejected`);
      }
      console.log(`  ✓ HTTP: sign-in required, aliases canonicalised, sourced data by default, ${bad.length} invalid queries rejected`);
    } finally {
      await h.close();
    }
  } finally {
    unregister();
  }

  console.log('✅ Market Skill Trend (C4) Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runMarketSkillTrendTests();
    } catch (err) {
      console.error('❌ Market Skill Trend Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
