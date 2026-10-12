import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { registerMarketSource } from '../config/marketSources.js';
import { Career } from '../models/Career.js';
import MarketPosting from '../models/MarketPosting.js';
import MarketImportBatch from '../models/MarketImportBatch.js';
import MarketIngestionService from '../services/market/MarketIngestionService.js';
import MarketOpportunityService from '../services/market/MarketOpportunityService.js';
import { MARKET_SUMMARY_CONTRACT_VERSION, STALE_AFTER_DAYS } from '../services/market/MarketOpportunitySummary.js';
import { buildSyntheticMarketFixture } from '../seed/marketFixture.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * MarketOpportunitySummary producer: the four evidence classes, only valid sourced history usable
 * for recommendations, staleness, a checkable title-matching rule, and no opportunity score.
 */

const importer = new mongoose.Types.ObjectId().toString();
const PERIOD = { from: '2026-05', to: '2026-09' };
const NOW = new Date('2026-10-10T00:00:00Z');

export async function runMarketOpportunitySummaryTests() {
  console.log('🧪 Running Market Opportunity Summary (contract producer) Tests...');
  await MarketPosting.deleteMany({});
  await MarketImportBatch.deleteMany({});
  const analyst = await Career.findOneAndUpdate({ title: 'Data Analyst' }, { $setOnInsert: { title: 'Data Analyst' } }, { upsert: true, new: true });
  const wizard = await Career.findOneAndUpdate({ title: 'Rust Wizard' }, { $setOnInsert: { title: 'Rust Wizard' } }, { upsert: true, new: true });
  const careerRef = { id: analyst._id.toString(), title: analyst.title };
  const summary = (dataset: 'sourced' | 'synthetic_fixture', now = NOW, career = careerRef) =>
    MarketOpportunityService.summaryForCareer(career, { dataset, ...PERIOD }, now);

  // No legitimate source
  const none = await summary('sourced');
  assert.equal(none.contractVersion, MARKET_SUMMARY_CONTRACT_VERSION);
  assert.equal(none.evidenceClass, 'no_legitimate_source');
  assert.deepEqual(none.insufficientDataReasons, ['no_registered_source']);
  assert.equal(none.usableForRecommendations, false);

  // Synthetic test data
  await MarketIngestionService.importBatch(buildSyntheticMarketFixture({ endMonth: '2026-09', retrievedAt: '2026-10-01T00:00:00Z' }), importer);
  const synthetic = await summary('synthetic_fixture');
  assert.equal(synthetic.evidenceClass, 'synthetic_test_data');
  assert.equal(synthetic.usableForRecommendations, false, 'synthetic data never informs real recommendations');
  assert.ok(synthetic.distinctPostings > 0);
  assert.ok(synthetic.insufficientDataReasons.includes('synthetic_test_data'));
  assert.equal(synthetic.demand, null);
  assert.ok(!('opportunityScore' in synthetic), 'no opportunity score');
  assert.equal((await summary('sourced')).evidenceClass, 'no_legitimate_source', 'synthetic records never count as sourced');
  console.log('  ✓ No legitimate source and synthetic test data are told apart; neither is usable for recommendations');

  const unregister = registerMarketSource({
    id: 'test-summary-source', name: 'Test summary source', url: 'https://example.org/jobs', licence: 'CC BY 4.0 (test)',
    attribution: 'Test', dataset: 'sourced', verifiedOn: '2026-10-12', retentionDays: null,
  });
  try {
    // Sparse sourced history
    await MarketIngestionService.importBatch({
      sourceId: 'test-summary-source',
      retrievedAt: '2026-10-01T00:00:00Z',
      postings: [
        { sourceRecordId: 'sp-1', title: 'Senior Data Analyst', postedAt: '2026-08-02T00:00:00Z', country: 'IN' },
        { sourceRecordId: 'sp-2', title: 'Data Analysts wanted', postedAt: '2026-08-03T00:00:00Z' },
        { sourceRecordId: 'sp-3', title: 'Data Analytics Engineer', postedAt: '2026-08-04T00:00:00Z' },
      ],
    }, importer);
    const sparse = await summary('sourced');
    assert.equal(sparse.evidenceClass, 'sourced_sparse');
    assert.equal(sparse.distinctPostings, 1, 'only whole-word title matches count ("Data Analysts", "Data Analytics" do not)');
    assert.match(sparse.matchingRule ?? '', /whole words/);
    assert.deepEqual(sparse.insufficientDataReasons, ['too_few_postings', 'too_few_months_with_postings']);
    assert.equal(sparse.demand, null);

    // Valid sourced history: 40 postings over 4 months, retrieved recently
    const postings = Array.from({ length: 40 }, (_, i) => ({
      sourceRecordId: `ok-${i}`,
      title: i % 2 ? 'Data Analyst' : 'Junior Data Analyst',
      company: `Employer ${i}`,
      postedAt: `2026-0${5 + (i % 4)}-${String(1 + (i % 20)).padStart(2, '0')}T00:00:00Z`,
    }));
    await MarketIngestionService.importBatch({ sourceId: 'test-summary-source', retrievedAt: '2026-10-01T00:00:00Z', postings }, importer);
    await MarketIngestionService.importBatch({ sourceId: 'test-summary-source', retrievedAt: '2026-10-05T00:00:00Z', postings: postings.slice(0, 5) }, importer);
    const valid = await summary('sourced');
    assert.equal(valid.evidenceClass, 'sourced_valid');
    assert.equal(valid.usableForRecommendations, true);
    assert.equal(valid.available, true);
    assert.equal(valid.distinctPostings, 41);
    assert.equal(valid.sourcedObservations, 46, 'observations include re-observations; distinct postings do not');
    assert.equal(valid.freshness.ageDays, 5);
    assert.equal(valid.demand?.monthly.length, 5);
    assert.equal(valid.demand?.monthly.reduce((s, m) => s + m.postings, 0), 41);
    assert.equal(valid.sources[0].licence, 'CC BY 4.0 (test)');

    // The same history, read long after it was collected
    const later = new Date(new Date('2026-10-05T00:00:00Z').getTime() + (STALE_AFTER_DAYS + 1) * 24 * 60 * 60 * 1000);
    const stale = await summary('sourced', later);
    assert.equal(stale.evidenceClass, 'sourced_sparse');
    assert.deepEqual(stale.insufficientDataReasons, ['stale_data']);
    assert.equal(stale.usableForRecommendations, false);

    const unmapped = await summary('sourced', NOW, { id: wizard._id.toString(), title: wizard.title });
    assert.deepEqual(unmapped.insufficientDataReasons, ['career_not_mapped_to_postings']);
    console.log('  ✓ Sourced history: sparse, valid (usable, with demand), stale and unmapped are each reported as such');

    // HTTP
    const h = await startHttpHarness();
    try {
      const path = `/market/careers/${analyst._id}/summary?from=${PERIOD.from}&to=${PERIOD.to}`;
      assert.equal((await h.api('GET', path)).status, 401);
      const user = await h.registerUser('summary');
      const res = await h.api('GET', path, { token: user.token });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.careerTitle, 'Data Analyst');
      assert.ok(['sourced_valid', 'sourced_sparse'].includes(res.body.data.evidenceClass));
      assert.equal((await h.api('GET', '/market/careers/not-an-id/summary', { token: user.token })).status, 400);
      assert.equal((await h.api('GET', `/market/careers/${new mongoose.Types.ObjectId()}/summary`, { token: user.token })).status, 404);
      assert.equal((await h.api('GET', `${path}&dataset=both`, { token: user.token })).status, 400);
      assert.equal((await h.api('GET', `${path}&score=1`, { token: user.token })).status, 400);
      console.log('  ✓ HTTP: sign-in required; invalid id 400; unknown career 404; invalid query 400');
    } finally {
      await h.close();
    }
  } finally {
    unregister();
  }

  console.log('✅ Market Opportunity Summary Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runMarketOpportunitySummaryTests();
    } catch (err) {
      console.error('❌ Market Opportunity Summary Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
