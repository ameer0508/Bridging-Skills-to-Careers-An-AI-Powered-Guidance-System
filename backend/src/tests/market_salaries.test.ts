import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { registerMarketSource } from '../config/marketSources.js';
import MarketPosting from '../models/MarketPosting.js';
import MarketImportBatch from '../models/MarketImportBatch.js';
import MarketIngestionService from '../services/market/MarketIngestionService.js';
import MarketSalaryService, {
  classifySalary,
  histogram,
  MAX_RANGE_RATIO,
  quantile,
  roundAmount,
  SALARY_MINIMUMS,
  SalaryInsights,
} from '../services/market/MarketSalaryService.js';
import { buildSyntheticMarketFixture } from '../seed/marketFixture.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * C3 salary insights: stated salaries only, one statistic per country, currency and pay period,
 * no conversion, complete ranges kept apart from one-bound figures, exclusions counted, minimum
 * samples before any median, provenance on every group, C1 duplicates counted once, synthetic
 * data kept apart and labelled, and DATA UNAVAILABLE while no licensed source is registered.
 */

const FIXTURE_END = '2026-09';
const RETRIEVED = '2026-10-01T00:00:00.000Z';
const PERIOD = { from: '2025-10', to: FIXTURE_END };

/** Every posting considered is either in a group, outside the currency/period filter, or excluded with a reason. */
function assertAccounted(r: SalaryInsights) {
  const excluded = Object.values(r.totals.excluded).reduce((a, b) => a + b, 0);
  assert.equal(r.totals.postingsWithUsableSalary + r.totals.outsideCurrencyOrPeriodFilter + excluded, r.totals.postingsConsidered, 'every posting is accounted for');
  for (const g of r.groups) {
    assert.equal(g.completeRanges.count + g.minimumOnly.count + g.maximumOnly.count, g.postings, `${g.key}: shapes add up`);
    assert.equal(g.sources.reduce((s, x) => s + x.postings, 0), g.postings, `${g.key}: sources add up`);
  }
  assert.equal(new Set(r.groups.map(g => g.key)).size, r.groups.length, 'one group per country, currency and period');
}

export async function runMarketSalaryTests() {
  console.log('🧪 Running Market Salary Insights (C3) Tests...');
  await MarketPosting.deleteMany({});
  await MarketImportBatch.deleteMany({});
  const importer = new mongoose.Types.ObjectId().toString();

  // === Statistics ===============================================================================
  assert.equal(quantile([1, 2, 3, 4], 0.5), 2.5);
  assert.equal(quantile([1, 2, 3, 4], 0.25), 1.75);
  assert.equal(quantile([7], 0.75), 7);
  assert.equal(roundAmount(1234.567, 'YEAR'), 1235);
  assert.equal(roundAmount(12.345, 'HOUR'), 12.35, 'hourly pay keeps two decimals');
  const bins = histogram([10, 20, 30, 40, 50, 60, 70], 3, 'YEAR');
  assert.equal(bins.reduce((s, b) => s + b.postings, 0), 7, 'every value lands in one bin');
  assert.deepEqual([bins[0].from, bins[bins.length - 1].to], [10, 70]);
  assert.deepEqual(histogram([5, 5, 5], 6, 'YEAR'), [{ from: 5, to: 5, postings: 3 }], 'identical values make one bin, not six empty ones');

  assert.deepEqual(classifySalary(null), { usable: false, reason: 'no_salary_stated' });
  assert.deepEqual(classifySalary({ min: 100, max: 200 }), { usable: true, shape: 'complete' });
  assert.deepEqual(classifySalary({ min: 100, max: null }), { usable: true, shape: 'minimum_only' });
  assert.deepEqual(classifySalary({ min: null, max: 200 }), { usable: true, shape: 'maximum_only' });
  assert.deepEqual(classifySalary({ min: null, max: null }), { usable: false, reason: 'invalid_amount' });
  assert.deepEqual(classifySalary({ min: 0, max: 200 }), { usable: false, reason: 'invalid_amount' });
  assert.deepEqual(classifySalary({ min: 300, max: 200 }), { usable: false, reason: 'invalid_amount' });
  assert.deepEqual(classifySalary({ min: 100, max: 100 * MAX_RANGE_RATIO + 1 }), { usable: false, reason: 'implausible_range' });
  assert.deepEqual(classifySalary({ min: 100, max: 100 * MAX_RANGE_RATIO }), { usable: true, shape: 'complete' });
  console.log('  ✓ Quantiles (type 7), rounding, histogram bins and salary shapes');

  // === No licensed source: DATA UNAVAILABLE ===================================================
  const none = await MarketSalaryService.insights({ dataset: 'sourced', ...PERIOD });
  assert.equal(none.status, 'data_unavailable');
  assert.deepEqual(none.reasons, ['no_registered_source']);
  assert.deepEqual(none.groups, []);
  assert.equal(none.isSynthetic, false);
  console.log('  ✓ No licensed source: data_unavailable, no groups, nothing estimated');

  // === Synthetic fixture: demonstration only ==================================================
  await MarketIngestionService.importBatch(buildSyntheticMarketFixture({ endMonth: FIXTURE_END, retrievedAt: RETRIEVED }), importer);
  const demo = await MarketSalaryService.insights({ dataset: 'synthetic_fixture', ...PERIOD });
  assertAccounted(demo);
  assert.equal(demo.isSynthetic, true);
  assert.match(demo.caveats[0], /^SYNTHETIC TEST DATA/);
  assert.equal(demo.status, 'available');
  assert.deepEqual(demo.groups.map(g => g.key).sort(), ['GB|GBP|YEAR', 'IN|INR|YEAR']);
  assert.ok(demo.groups.every(g => g.sources.every(s => s.id === 'skillbridge-synthetic-fixture')));
  assert.equal(demo.totals.undatedExcluded, 1, 'the undated fixture posting is left out');

  // The figures equal an independent computation from the stored postings
  const stored = await MarketPosting.find({ dataset: 'synthetic_fixture', country: 'IN', 'salary.currency': 'INR', postedAt: { $ne: null } }).lean();
  const complete = stored.filter(p => p.salary && p.salary.min !== null && p.salary.max !== null);
  const mids = complete.map(p => (p.salary!.min! + p.salary!.max!) / 2).sort((a, b) => a - b);
  const india = demo.groups.find(g => g.key === 'IN|INR|YEAR')!;
  assert.equal(india.completeRanges.count, complete.length);
  assert.equal(india.completeRanges.midpoint, Math.round(quantile(mids, 0.5)));
  assert.equal(india.completeRanges.midpointQuartiles!.p25, Math.round(quantile(mids, 0.25)));
  assert.ok(india.minimumOnly.count > 0 && india.maximumOnly.count > 0, 'one-bound salaries are kept apart from ranges');
  assert.equal(india.completeRanges.distribution.reduce((s, b) => s + b.postings, 0), complete.length);

  // Re-importing the same records adds nothing (C1 duplicate control carries through)
  await MarketIngestionService.importBatch(buildSyntheticMarketFixture({ endMonth: FIXTURE_END, retrievedAt: RETRIEVED }), importer);
  const again = await MarketSalaryService.insights({ dataset: 'synthetic_fixture', ...PERIOD });
  assert.deepEqual(again.groups.map(g => [g.key, g.postings, g.completeRanges.midpoint]), demo.groups.map(g => [g.key, g.postings, g.completeRanges.midpoint]));
  console.log(`  ✓ Synthetic demo: labelled, ${demo.groups.length} separate markets, figures match the stored postings, re-import changes nothing`);

  // === A licensed source with known values ======================================================
  const unregister = registerMarketSource({
    id: 'test-salary-source',
    name: 'Test salary source',
    url: 'https://example.org/open-jobs',
    licence: 'CC BY 4.0 (test)',
    attribution: 'Test salary source, CC BY 4.0',
    dataset: 'sourced',
    verifiedOn: '2026-10-12',
    retentionDays: null,
  });
  try {
    const postings: Record<string, unknown>[] = [];
    const add = (id: string, extra: Record<string, unknown>) =>
      postings.push({ sourceRecordId: id, title: `Python Developer ${id}`, company: 'Example Ltd', location: 'Pune', country: 'IN', postedAt: '2026-08-10T00:00:00Z', ...extra });
    // Ten yearly INR ranges: minimums 10k..100k, maximums twice that
    for (let i = 1; i <= 10; i++) add(`y${i}`, { salary: { min: i * 10000, max: i * 20000, currency: 'INR', period: 'year' } });
    // Monthly INR pay is another market, even in the same country and currency
    for (let i = 1; i <= 3; i++) add(`m${i}`, { salary: { min: 50000, max: 70000, currency: 'INR', period: 'MONTH' } });
    // US dollars are another market
    add('us1', { country: 'US', location: 'Austin', salary: { min: 90000, max: 120000, currency: 'USD', period: 'YEAR' } });
    add('us2', { country: 'US', location: 'Austin', salary: { min: 100000, max: 140000, currency: 'USD', period: 'YEAR' } });
    // One-bound figures
    add('from1', { salary: { min: 40000, currency: 'INR', period: 'YEAR' } });
    add('upto1', { salary: { max: 900000, currency: 'INR', period: 'YEAR' } });
    // Excluded, each for a stated reason
    add('wild', { salary: { min: 1000, max: 50000, currency: 'INR', period: 'YEAR' } });
    add('nocountry', { country: undefined, salary: { min: 1, max: 2, currency: 'INR', period: 'YEAR' } });
    add('nosalary', {});
    add('undated', { postedAt: undefined, salary: { min: 10, max: 20, currency: 'INR', period: 'YEAR' } });
    add('old', { postedAt: '2024-01-10T00:00:00Z', salary: { min: 10, max: 20, currency: 'INR', period: 'YEAR' } });
    // The y1 posting again under another id: one posting, counted once
    postings.push({ ...postings[0], sourceRecordId: 'y1-crosspost' });

    const batch = await MarketIngestionService.importBatch({ sourceId: 'test-salary-source', retrievedAt: RETRIEVED, postings }, importer);
    assert.equal(batch.counts.duplicates, 1);

    const real = await MarketSalaryService.insights({ dataset: 'sourced', ...PERIOD });
    assertAccounted(real);
    assert.equal(real.status, 'available');
    assert.equal(real.isSynthetic, false);
    assert.ok(!real.caveats.some(c => /SYNTHETIC/.test(c)));
    assert.deepEqual(real.totals.excluded, { no_salary_stated: 1, country_not_stated: 1, implausible_range: 1, invalid_amount: 0 });
    assert.equal(real.totals.undatedExcluded, 1);
    assert.equal(real.totals.postingsConsidered, 20, 'the 2024 posting is outside the period; the cross-post is one posting');
    assert.deepEqual(real.groups.map(g => g.key), ['IN|INR|YEAR', 'IN|INR|MONTH', 'US|USD|YEAR']);

    const yearly = real.groups[0];
    assert.equal(yearly.postings, 12);
    assert.deepEqual(
      { count: yearly.completeRanges.count, lower: yearly.completeRanges.lower, upper: yearly.completeRanges.upper, midpoint: yearly.completeRanges.midpoint },
      { count: 10, lower: 55000, upper: 110000, midpoint: 82500 }
    );
    assert.equal(yearly.completeRanges.midpointQuartiles, null, `quartiles need ${SALARY_MINIMUMS.forDistribution} ranges`);
    assert.deepEqual(yearly.completeRanges.distribution, []);
    assert.deepEqual(yearly.minimumOnly, { count: 1, medianMinimum: null }, 'one "from" figure is counted, not summarised');
    assert.deepEqual(yearly.maximumOnly, { count: 1, medianMaximum: null });
    assert.equal(yearly.sources[0].licence, 'CC BY 4.0 (test)');
    assert.equal(yearly.collection.latestRetrievedAt, RETRIEVED);
    assert.equal(yearly.postedBetween.earliest, '2026-08-10T00:00:00.000Z');

    const monthly = real.groups[1];
    assert.equal(monthly.sufficient, false);
    assert.deepEqual([monthly.completeRanges.midpoint, monthly.completeRanges.lower], [null, null], 'three ranges give no median');
    assert.deepEqual(monthly.reasons, ['too_few_complete_ranges']);
    console.log('  ✓ Sourced: exact medians, periods and currencies never mixed, one-bound kept apart, 4 exclusions counted, provenance kept');

    // Filters
    const usd = await MarketSalaryService.insights({ dataset: 'sourced', currency: 'USD', ...PERIOD });
    assertAccounted(usd);
    assert.deepEqual(usd.groups.map(g => g.key), ['US|USD|YEAR']);
    assert.equal(usd.totals.outsideCurrencyOrPeriodFilter, 15);
    assert.equal(usd.status, 'insufficient_data', 'two US postings give no median');
    assert.deepEqual(usd.reasons, ['too_few_complete_ranges']);
    assert.deepEqual(usd.available.currencies, ['INR', 'USD'], 'filter menus list what exists before filtering');
    assert.deepEqual((await MarketSalaryService.insights({ dataset: 'sourced', period: 'MONTH', ...PERIOD })).groups.map(g => g.key), ['IN|INR|MONTH']);
    assert.deepEqual((await MarketSalaryService.insights({ dataset: 'sourced', country: 'US', ...PERIOD })).groups.map(g => g.key), ['US|USD|YEAR']);
    assert.equal((await MarketSalaryService.insights({ dataset: 'sourced', from: '2024-01', to: '2024-01' })).groups[0].key, 'IN|INR|YEAR');
    const nothing = await MarketSalaryService.insights({ dataset: 'sourced', from: '2025-01', to: '2025-02' });
    assert.deepEqual([nothing.status, nothing.reasons], ['insufficient_data', ['no_records']]);
    const skillMiss = await MarketSalaryService.insights({ dataset: 'sourced', skill: 'Kubernetes', ...PERIOD });
    assert.deepEqual(skillMiss.reasons, ['no_records']);
    console.log('  ✓ Country, currency, period, time and skill filters; empty periods say no records');

    // Sourced and synthetic stay apart in both directions
    assert.ok(real.groups.every(g => g.sources.every(s => s.id === 'test-salary-source')));
    const demoAfter = await MarketSalaryService.insights({ dataset: 'synthetic_fixture', ...PERIOD });
    assert.equal(demoAfter.totals.postingsConsidered, demo.totals.postingsConsidered);
    console.log('  ✓ Sourced and synthetic salaries never mix');

    // === HTTP ===================================================================================
    const h = await startHttpHarness();
    try {
      assert.equal((await h.api('GET', '/market/salaries')).status, 401);
      const user = await h.registerUser('salary-viewer');
      const ok = await h.api('GET', `/market/salaries?from=${PERIOD.from}&to=${PERIOD.to}&currency=inr&period=year`, { token: user.token });
      assert.equal(ok.status, 200);
      assert.deepEqual(ok.body.data.groups.map((g: { key: string }) => g.key), ['IN|INR|YEAR'], 'lower-case codes are accepted and normalised');
      const demoHttp = await h.api('GET', `/market/salaries?dataset=synthetic_fixture&from=${PERIOD.from}&to=${PERIOD.to}`, { token: user.token });
      assert.equal(demoHttp.body.data.isSynthetic, true);
      const bad = [
        'currency=RUPEES',
        'period=FORTNIGHT',
        'country=IND',
        'from=2026-13',
        'from=2026-05&to=2026-01',
        'from=2019-01&to=2026-01',
        'skill=NotARealSkill',
        'dataset=everything',
        'user=someone-else',
      ];
      for (const q of bad) assert.equal((await h.api('GET', `/market/salaries?${q}`, { token: user.token })).status, 400, `${q} is rejected`);
      console.log(`  ✓ HTTP: sign-in required, codes normalised, synthetic flagged, ${bad.length} invalid queries rejected`);
    } finally {
      await h.close();
    }
  } finally {
    unregister();
  }

  const afterUnregister = await MarketSalaryService.insights({ dataset: 'sourced', ...PERIOD });
  assert.equal(afterUnregister.status, 'data_unavailable', 'without a registered source the stored records are not shown as real data');
  console.log('✅ Market Salary Insights (C3) Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runMarketSalaryTests();
    } catch (err) {
      console.error('❌ Market Salary Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
