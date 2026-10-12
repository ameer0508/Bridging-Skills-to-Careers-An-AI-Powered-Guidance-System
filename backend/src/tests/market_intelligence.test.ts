import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { registerMarketSource, SYNTHETIC_FIXTURE_SOURCE } from '../config/marketSources.js';
import MarketPosting from '../models/MarketPosting.js';
import MarketImportBatch from '../models/MarketImportBatch.js';
import User from '../models/User.js';
import MarketIngestionService, { postingFingerprint, postingSkills, MAX_POSTINGS_PER_IMPORT } from '../services/market/MarketIngestionService.js';
import MarketHistoryService, { HISTORY_MINIMUMS, monthRange } from '../services/market/MarketHistoryService.js';
import { buildSyntheticMarketFixture } from '../seed/marketFixture.js';
import { unavailableSummary, MARKET_SUMMARY_CONTRACT_VERSION } from '../services/market/MarketOpportunitySummary.js';
import { signAccessToken } from '../utils/jwt.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * C1 sourced market history: provenance-checked import, duplicate control, skill extraction with
 * the shared lexicon, dated monthly history with explicit sufficiency, synthetic data kept apart
 * from sourced data, and admin-only imports.
 */

const FIXTURE_END = '2026-09';
const RETRIEVED = '2026-10-01T00:00:00.000Z';
const PERIOD = { from: '2025-10', to: FIXTURE_END };

export async function runMarketIntelligenceTests() {
  console.log('🧪 Running Market Intelligence (C1) Tests...');
  await MarketPosting.deleteMany({});
  await MarketImportBatch.deleteMany({});
  const importer = new mongoose.Types.ObjectId().toString();

  // === Fingerprints and skills ================================================================
  const day = new Date('2026-03-04T10:00:00Z');
  assert.equal(
    postingFingerprint({ title: 'Backend  Developer', company: 'ACME', location: 'Pune', postedAt: day }),
    postingFingerprint({ title: 'backend developer', company: 'acme ', location: ' PUNE', postedAt: new Date('2026-03-04T23:00:00Z') }),
    'case, spacing and time of day do not change the identity of a posting'
  );
  assert.notEqual(
    postingFingerprint({ title: 'Backend Developer', company: 'ACME', location: 'Pune', postedAt: day }),
    postingFingerprint({ title: 'Backend Developer', company: 'ACME', location: 'Pune', postedAt: new Date('2026-04-04T10:00:00Z') }),
    'a repost on another day is a new posting'
  );
  assert.deepEqual(postingSkills({ title: 'Java Developer', description: 'JavaScript and React; see https://docker.example.com', skills: ['postgres', 'NotASkill'] }), [
    'PostgreSQL',
    'Java',
    'JavaScript',
    'React',
  ]);
  console.log('  ✓ Fingerprints ignore case, spacing and time of day; skills come only from the shared lexicon');

  // === Import of the synthetic fixture ==========================================================
  const fixture = buildSyntheticMarketFixture({ endMonth: FIXTURE_END, retrievedAt: RETRIEVED });
  const first = await MarketIngestionService.importBatch(fixture, importer);
  const generated = fixture.postings.length - 3;
  assert.deepEqual(
    { ...first.counts },
    { received: fixture.postings.length, inserted: generated + 1, reobserved: 0, duplicates: 1, conflicts: 0, rejected: 1 },
    'the cross-post is merged, the undated posting kept, the invalid one rejected'
  );
  assert.match(first.rejections[0].reason, /minimum is above maximum/);
  assert.equal(first.dataset, 'synthetic_fixture');
  assert.equal(await MarketPosting.countDocuments({ dataset: 'synthetic_fixture' }), generated + 1);
  const merged = await MarketPosting.findOne({ sourceRecordId: 'fixture-1' });
  assert.equal(merged?.alsoSeenIn.length, 1, 'the cross-post is recorded on the original');

  const again = await MarketIngestionService.importBatch({ ...fixture, retrievedAt: '2026-10-05T00:00:00.000Z' }, importer);
  assert.deepEqual({ ...again.counts }, { received: fixture.postings.length, inserted: 0, reobserved: generated + 2, duplicates: 0, conflicts: 0, rejected: 1 });
  const seenTwice = await MarketPosting.findOne({ sourceRecordId: 'fixture-1' });
  assert.equal(seenTwice?.observationCount, 2);
  assert.equal(seenTwice?.lastSeenAt.toISOString(), '2026-10-05T00:00:00.000Z');
  assert.equal(seenTwice?.alsoSeenIn.length, 1, 'a known cross-post is not linked twice');
  assert.equal(await MarketPosting.countDocuments(), generated + 1, 're-importing adds nothing');

  const original = fixture.postings[0] as Record<string, unknown>;
  const conflict = await MarketIngestionService.importBatch(
    { ...fixture, postings: [{ ...original, title: 'Principal Backend Developer' }] },
    importer
  );
  assert.equal(conflict.counts.conflicts, 1);
  assert.equal((await MarketPosting.findOne({ sourceRecordId: 'fixture-1' }))?.title, 'Backend Developer', 'the stored version is kept');
  console.log(`  ✓ Import: ${generated + 1} stored, cross-post merged, re-import only re-observes, conflicting record kept as first stored`);

  // === Bad imports ==============================================================================
  await assert.rejects(MarketIngestionService.importBatch({ ...fixture, sourceId: 'scraped-site' }, importer), /Unknown market source/);
  await assert.rejects(MarketIngestionService.importBatch({ ...fixture, retrievedAt: '2099-01-01T00:00:00Z' }, importer), /retrievedAt/);
  const future = await MarketIngestionService.importBatch(
    { ...fixture, postings: [{ title: 'Data Analyst', postedAt: '2026-12-01T00:00:00Z' }, { title: 'X' }, { title: 'Analyst', extra: true }] },
    importer
  );
  assert.equal(future.counts.rejected, 3, 'a posting dated after retrieval, a too-short title and an unknown field are each rejected');
  console.log('  ✓ Unregistered sources, future retrieval dates and invalid postings are refused');

  // === History =================================================================================
  const all = await MarketHistoryService.history({ dataset: 'synthetic_fixture', ...PERIOD });
  assert.equal(all.isSynthetic, true);
  assert.match(all.caveats[0], /SYNTHETIC TEST DATA/);
  assert.equal(all.buckets.length, 12);
  assert.equal(all.totals.distinctPostings, generated);
  assert.equal(all.totals.undatedExcluded, 1);
  assert.equal(all.sufficiency.sufficient, true);
  assert.ok(all.buckets[11].postings > all.buckets[0].postings, 'the fixture grows month on month');
  assert.equal(all.sources[0].id, SYNTHETIC_FIXTURE_SOURCE.id);
  assert.equal(all.freshness.latestRetrievedAt, '2026-10-05T00:00:00.000Z');

  const kubernetes = await MarketHistoryService.history({ dataset: 'synthetic_fixture', skill: 'Kubernetes', ...PERIOD });
  assert.equal(kubernetes.totals.monthsWithPostings, 3);
  assert.ok(kubernetes.totals.distinctPostings < HISTORY_MINIMUMS.distinctPostings);
  assert.deepEqual(kubernetes.sufficiency.reasons, ['too_few_postings']);

  const python = await MarketHistoryService.history({ dataset: 'synthetic_fixture', skill: 'Python', ...PERIOD });
  const gb = await MarketHistoryService.history({ dataset: 'synthetic_fixture', country: 'GB', ...PERIOD });
  assert.ok(python.totals.distinctPostings > 0 && python.totals.distinctPostings < all.totals.distinctPostings);
  assert.ok(gb.totals.distinctPostings > 0 && gb.totals.distinctPostings < all.totals.distinctPostings);

  const sourcedEmpty = await MarketHistoryService.history({ dataset: 'sourced', ...PERIOD });
  assert.deepEqual(sourcedEmpty.sufficiency.reasons, ['no_registered_source', 'no_records']);
  assert.equal(sourcedEmpty.totals.distinctPostings, 0, 'synthetic postings never count as market records');
  assert.deepEqual(monthRange('2025-11', '2026-02'), ['2025-11', '2025-12', '2026-01', '2026-02']);
  console.log('  ✓ History: monthly distinct postings, filters, undated excluded, sufficiency reasons, synthetic kept apart');

  // === A licensed source ======================================================================
  const unregister = registerMarketSource({
    id: 'test-licensed-source',
    name: 'Test licensed source',
    url: 'https://example.org/open-jobs',
    licence: 'CC BY 4.0 (test)',
    attribution: 'Test licensed source, CC BY 4.0',
    dataset: 'sourced',
    verifiedOn: '2026-10-12',
    retentionDays: null,
  });
  try {
    await MarketIngestionService.importBatch(
      {
        sourceId: 'test-licensed-source',
        retrievedAt: RETRIEVED,
        postings: ['Python', 'React', 'Docker', 'SQL'].map((skill, i) => ({ sourceRecordId: `t-${i}`, title: `${skill} Developer`, postedAt: '2026-08-10T00:00:00Z', country: 'in' })),
      },
      importer
    );
    const sourced = await MarketHistoryService.history({ dataset: 'sourced', ...PERIOD });
    assert.equal(sourced.totals.distinctPostings, 4);
    assert.deepEqual(sourced.sufficiency.reasons, ['too_few_postings', 'too_few_months_with_postings']);
    assert.equal(sourced.sources[0].licence, 'CC BY 4.0 (test)');
    assert.ok(sourced.caveats.some(c => /single source/.test(c)));
    assert.equal((await MarketHistoryService.history({ dataset: 'sourced', country: 'IN', ...PERIOD })).totals.distinctPostings, 4, 'country codes are stored upper case');
    console.log('  ✓ Sourced records carry their licence; four postings in one month are reported as insufficient');

    // === HTTP ==================================================================================
    const h = await startHttpHarness();
    try {
      const user = await h.registerUser('market');
      const adminAccount = await h.registerUser('market-admin');
      await User.updateOne({ _id: adminAccount.userId }, { role: 'admin' });
      const adminToken = signAccessToken(adminAccount.userId, 'admin');

      for (const path of ['/market/sources', '/market/history', '/market/imports']) {
        assert.equal((await h.api('GET', path)).status, 401, `${path} needs sign-in`);
      }
      const sources = await h.api('GET', '/market/sources', { token: user.token });
      assert.equal(sources.status, 200);
      assert.ok(sources.body.data.sources.some((s: { id: string }) => s.id === SYNTHETIC_FIXTURE_SOURCE.id));

      const res = await h.api('GET', `/market/history?dataset=synthetic_fixture&from=${PERIOD.from}&to=${PERIOD.to}&skill=python`, { token: user.token });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.query.skill, 'Python', 'skill names are canonicalised');
      assert.equal(res.body.data.totals.distinctPostings, python.totals.distinctPostings);

      const defaults = await h.api('GET', '/market/history', { token: user.token });
      assert.equal(defaults.body.data.dataset, 'sourced', 'real records are the default view');
      assert.equal(defaults.body.data.buckets.length, 12);

      const badQueries = [
        'from=2026-13',
        'from=2026-05&to=2026-01',
        'from=2020-01&to=2026-01',
        'skill=NotASkillAtAll',
        'dataset=everything',
        'country=India',
        'unexpected=1',
      ];
      for (const q of badQueries) {
        const bad = await h.api('GET', `/market/history?${q}`, { token: user.token });
        assert.equal(bad.status, 400, `${q} is rejected`);
      }

      const small = { sourceId: SYNTHETIC_FIXTURE_SOURCE.id, retrievedAt: RETRIEVED, postings: [{ title: 'QA Engineer', postedAt: '2026-09-01T00:00:00Z' }] };
      assert.equal((await h.api('POST', '/market/imports', { token: user.token, json: small })).status, 403, 'members cannot import');
      assert.equal((await h.api('GET', '/market/imports', { token: user.token })).status, 403);
      const imported = await h.api('POST', '/market/imports', { token: adminToken, json: small });
      assert.equal(imported.status, 201);
      assert.equal(imported.body.data.batch.counts.inserted, 1);
      assert.equal(imported.body.data.batch.importedBy, adminAccount.userId);
      assert.equal((await h.api('POST', '/market/imports', { token: adminToken, json: { ...small, sourceId: 'unknown' } })).status, 400);
      assert.equal((await h.api('POST', '/market/imports', { token: adminToken, json: { ...small, postings: [] } })).status, 400);
      const tooMany = Array.from({ length: MAX_POSTINGS_PER_IMPORT + 1 }, () => ({ title: 'QA' }));
      assert.equal((await h.api('POST', '/market/imports', { token: adminToken, json: { ...small, postings: tooMany } })).status, 400);
      const batches = await h.api('GET', '/market/imports', { token: adminToken });
      assert.equal(batches.status, 200);
      assert.ok(batches.body.data.batches.length >= 5);
      console.log(`  ✓ HTTP: sign-in required, ${badQueries.length} invalid queries rejected, imports admin-only and validated`);
    } finally {
      await h.close();
    }
  } finally {
    unregister();
  }

  // === MarketOpportunitySummary contract ======================================================
  const none = unavailableSummary({ id: 'career-1', title: 'Data Analyst' }, PERIOD, ['no_registered_source', 'no_records'], 'IN');
  assert.equal(none.contractVersion, MARKET_SUMMARY_CONTRACT_VERSION);
  assert.equal(none.available, false);
  assert.equal(none.demand, null, 'no demand figure without sufficient data');
  assert.equal(none.distinctPostings, 0);
  assert.equal(none.dataset, 'sourced');
  assert.ok(!('opportunityScore' in none), 'the contract carries no opportunity score');
  assert.throws(() => unavailableSummary({ id: 'c', title: 'x' }, PERIOD, []), /at least one reason/);
  console.log('  ✓ MarketOpportunitySummary: an unavailable summary has zero counts, no demand and its reasons');

  console.log('✅ Market Intelligence (C1) Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runMarketIntelligenceTests();
    } catch (err) {
      console.error('❌ Market Intelligence Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
