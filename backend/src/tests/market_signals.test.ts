import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { registerMarketSource, SYNTHETIC_FIXTURE_SOURCE } from '../config/marketSources.js';
import { Career } from '../models/Career.js';
import MarketPosting from '../models/MarketPosting.js';
import MarketImportBatch from '../models/MarketImportBatch.js';
import MarketIngestionService from '../services/market/MarketIngestionService.js';
import MarketSignalService, {
  compareWithMarketTieBreak,
  demandDirection,
  MarketInfluence,
  MarketSignals,
  sourcesConflict,
} from '../services/market/MarketSignalService.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * C5/R4 market signals. The same career is evaluated under counterfactual evidence: no source,
 * valid sourced data, stale data (same records, later date), synthetic data (same counts),
 * sparse data and conflicting sources. Influence must be neutral in every case except valid,
 * consistent sourced evidence, and the tie-break contract must never reorder anything else.
 */

const NOW = new Date('2026-10-10T00:00:00Z');
const PERIOD = { from: '2025-10', to: '2026-09' };
const MONTHS = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
const RETRIEVED = '2026-10-01T00:00:00.000Z';

const RISING = [3, 3, 3, 3, 3, 3, 8, 8, 8, 8, 8, 8];
const FALLING = [8, 8, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3];
const FLAT = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
const SPARSE = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
const LATE_ONLY = [0, 0, 0, 0, 0, 0, 5, 5, 5, 5, 5, 5];

function postings(prefix: string, counts: number[], description = 'SQL and Excel reporting') {
  return counts.flatMap((n, i) =>
    Array.from({ length: n }, (_, k) => ({
      sourceRecordId: `${prefix}-${i}-${k}`,
      title: 'Data Analyst',
      company: `${prefix} Employer ${i}-${k}`,
      location: 'Pune',
      country: 'IN',
      postedAt: `${MONTHS[i]}-${String(2 + k).padStart(2, '0')}T09:00:00.000Z`,
      description,
    }))
  );
}

const testSource = (id: string) =>
  registerMarketSource({
    id,
    name: `Test source ${id}`,
    url: `https://example.org/${id}`,
    licence: 'CC BY 4.0 (test)',
    attribution: id,
    dataset: 'sourced',
    verifiedOn: '2026-10-12',
    retentionDays: null,
  });

export async function runMarketSignalTests() {
  console.log('🧪 Running Market Signals (C5/R4) Tests...');
  const importer = new mongoose.Types.ObjectId().toString();
  const analyst = await Career.findOneAndUpdate({ title: 'Data Analyst' }, { $setOnInsert: { title: 'Data Analyst' } }, { upsert: true, new: true });
  const career = { id: analyst._id.toString(), title: analyst.title };
  const reset = async () => {
    await MarketPosting.deleteMany({});
    await MarketImportBatch.deleteMany({});
  };
  const load = (sourceId: string, counts: number[]) =>
    MarketIngestionService.importBatch({ sourceId, retrievedAt: RETRIEVED, postings: postings(sourceId, counts) }, importer);
  const signals = (dataset: 'sourced' | 'synthetic_fixture' = 'sourced', now = NOW, skills?: string[]) =>
    MarketSignalService.signalsForCareer(career, { dataset, ...PERIOD, skills }, now);
  const neutral = (s: MarketSignals, reason: string) => {
    assert.equal(s.influence.mode, 'neutral', `${reason}: influence must be neutral`);
    assert.ok(s.influence.mode === 'neutral' && s.influence.reasons.includes(reason as never), `${reason}: got ${JSON.stringify(s.influence)}`);
  };

  // === Pure parts =================================================================================
  const monthly = (counts: number[]) => counts.map((postings, i) => ({ month: MONTHS[i], postings }));
  assert.equal(demandDirection(monthly(RISING)).direction, 'rising');
  assert.equal(demandDirection(monthly(FALLING)).direction, 'falling');
  assert.equal(demandDirection(monthly(FLAT)).direction, 'stable');
  assert.equal(demandDirection(monthly(SPARSE)).direction, null, 'too few per half: no direction');
  assert.equal(demandDirection(monthly([...RISING, 99])).recent.months.length, 6, 'odd length drops the middle month');
  assert.equal(sourcesConflict([{ direction: 'rising' }, { direction: 'falling' }] as never), true);
  assert.equal(sourcesConflict([{ direction: 'rising' }, { direction: null }] as never), false);
  console.log('  ✓ Direction (two-period Poisson test) and source conflict rules');

  // === Counterfactuals ============================================================================
  await reset();
  const s0 = await signals();
  neutral(s0, 'no_registered_source');
  assert.equal(s0.evidenceClass, 'no_legitimate_source');

  const unregisterA = testSource('sig-a');
  const unregisterB = testSource('sig-b');
  try {
    // Valid, rising
    await load('sig-a', RISING);
    const valid = await signals('sourced', NOW, ['SQL']);
    assert.deepEqual(valid.influence, { mode: 'evidence', demandDirection: 'rising', distinctPostings: 66, asOf: RETRIEVED });
    assert.equal(valid.evidenceClass, 'sourced_valid');
    assert.deepEqual([valid.demand.direction.earlier.postings, valid.demand.direction.recent.postings], [18, 48]);
    assert.equal(valid.provenance.sources[0].licence, 'CC BY 4.0 (test)');
    assert.equal(valid.dataAsOf, RETRIEVED);
    assert.equal(valid.skills[0].skill, 'SQL');
    assert.equal(valid.skills[0].usable, false, 'a skill change below the C4 minimums is not usable');
    const { separation, ...rest } = valid;
    assert.ok(!/score|boost|weight|multiplier/i.test(JSON.stringify(rest)), 'no score, boost or weight is produced');
    assert.match(separation, /say nothing about the applicant/);

    // Stale: the same records, read 4 months later
    neutral(await signals('sourced', new Date('2027-02-10T00:00:00Z')), 'stale_data');

    // Sparse
    await reset();
    await load('sig-a', SPARSE);
    neutral(await signals(), 'too_few_postings');

    // Conflicting sources: one rising, one falling, together enough postings
    await reset();
    await load('sig-a', RISING);
    await load('sig-b', FALLING);
    const conflict = await signals();
    assert.equal(conflict.evidenceClass, 'sourced_valid', 'the combined data passes the summary minimums');
    neutral(conflict, 'conflicting_sources');
    assert.deepEqual(conflict.demand.bySource.map(s => [s.sourceId, s.direction]), [['sig-a', 'rising'], ['sig-b', 'falling']]);

    // Stable and undetermined directions are evidence, but carry no direction to act on
    await reset();
    await load('sig-a', FLAT);
    const flat = await signals();
    assert.deepEqual([flat.influence.mode, flat.influence.mode === 'evidence' && flat.influence.demandDirection], ['evidence', 'stable']);
    await reset();
    await load('sig-a', LATE_ONLY);
    const late = await signals();
    assert.deepEqual([late.influence.mode, late.influence.mode === 'evidence' && late.influence.demandDirection], ['evidence', null]);

    // Synthetic: the same rising counts, but generated
    await reset();
    await MarketIngestionService.importBatch({ sourceId: SYNTHETIC_FIXTURE_SOURCE.id, retrievedAt: RETRIEVED, postings: postings('syn', RISING) }, importer);
    const synthetic = await signals('synthetic_fixture', NOW, ['SQL']);
    neutral(synthetic, 'synthetic_test_data');
    assert.ok(synthetic.skills.every(s => !s.usable), 'synthetic skill signals are never usable');
    console.log('  ✓ Counterfactuals: valid → evidence (rising); no source, stale, sparse, conflicting and synthetic → neutral; stable/undetermined carry no direction');

    // === Integration contract: tie-break only =========================================================
    const evidence = (d: 'rising' | 'falling' | 'stable' | null): MarketInfluence => ({ mode: 'evidence', demandDirection: d, distinctPostings: 50, asOf: RETRIEVED });
    const neutralInfluence: MarketInfluence = { mode: 'neutral', reasons: ['no_registered_source'] };
    const items = [
      { id: 'a', own: 0.9, market: evidence('falling') },
      { id: 'b', own: 0.7, market: evidence('falling') },
      { id: 'c', own: 0.7, market: evidence('rising') },
      { id: 'd', own: 0.7, market: neutralInfluence },
      { id: 'e', own: 0.5, market: evidence('rising') },
      { id: 'f', own: 0.5, market: evidence(null) },
    ];
    const baseline = [...items].sort((x, y) => y.own - x.own).map(i => i.id);
    const withMarket = [...items].sort((x, y) => y.own - x.own || compareWithMarketTieBreak(x.market, y.market)).map(i => i.id);
    assert.deepEqual(baseline, ['a', 'b', 'c', 'd', 'e', 'f']);
    assert.deepEqual(withMarket, ['a', 'c', 'b', 'd', 'e', 'f'], 'only the tied b/c pair is reordered');
    const ownAfter = withMarket.map(id => items.find(i => i.id === id)!.own);
    assert.ok(ownAfter.every((v, i) => i === 0 || ownAfter[i - 1] >= v), 'the consumer ordering is never overridden');
    const allNeutral = items.map(i => ({ ...i, market: neutralInfluence }));
    assert.deepEqual([...allNeutral].sort((x, y) => y.own - x.own || compareWithMarketTieBreak(x.market, y.market)).map(i => i.id), baseline, 'neutral signals change nothing');
    assert.equal(compareWithMarketTieBreak(evidence('rising'), neutralInfluence), 0);
    assert.equal(compareWithMarketTieBreak(undefined, evidence('rising')), 0);
    console.log('  ✓ Contract: the market only breaks exact ties, and only between two directed evidence signals');

    // === HTTP ======================================================================================
    const h = await startHttpHarness();
    try {
      assert.equal((await h.api('GET', `/market/careers/${career.id}/signals`)).status, 401);
      const user = await h.registerUser('signals-viewer');
      const ok = await h.api('GET', `/market/careers/${career.id}/signals?from=${PERIOD.from}&to=${PERIOD.to}&skills=sql,excel`, { token: user.token });
      assert.equal(ok.status, 200);
      assert.equal(ok.body.data.contractVersion, 1);
      assert.deepEqual(ok.body.data.skills.map((s: { skill: string }) => s.skill).sort(), ['Excel', 'SQL']);
      assert.equal(ok.body.data.influence.mode, 'neutral', 'the sourced view is empty after the synthetic reset');
      assert.equal((await h.api('GET', `/market/careers/${new mongoose.Types.ObjectId()}/signals`, { token: user.token })).status, 404);
      const bad = ['not-an-id/signals', `${career.id}/signals?skills=NotARealSkill`, `${career.id}/signals?skills=${Array(11).fill('sql').join(',')}`, `${career.id}/signals?boost=2`, `${career.id}/signals?from=2026-13`];
      for (const path of bad) assert.equal((await h.api('GET', `/market/careers/${path}`, { token: user.token })).status, 400, `${path} is rejected`);
      console.log(`  ✓ HTTP: sign-in required, unknown career 404, ${bad.length} invalid requests rejected`);
    } finally {
      await h.close();
    }
  } finally {
    unregisterA();
    unregisterB();
    await reset();
  }
  console.log('✅ Market Signals (C5/R4) Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runMarketSignalTests();
    } catch (err) {
      console.error('❌ Market Signal Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
