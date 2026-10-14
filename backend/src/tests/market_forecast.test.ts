import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { registerMarketSource, SYNTHETIC_FIXTURE_SOURCE } from '../config/marketSources.js';
import MarketPosting from '../models/MarketPosting.js';
import MarketImportBatch from '../models/MarketImportBatch.js';
import MarketIngestionService from '../services/market/MarketIngestionService.js';
import MarketForecastService, {
  backtest,
  FORECAST_MINIMUMS,
  forecastSeries,
  ForecastMethod,
  lastCompleteMonth,
  linearTrendForecast,
  naiveForecast,
} from '../services/market/MarketForecastService.js';
import { buildSyntheticMarketFixture } from '../seed/marketFixture.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * C2 cautious forecasting: deterministic methods, rolling-origin backtests without leakage, a
 * held-out evaluation against the naive baseline on synthetic series, error-based ranges, and
 * refusal on short, sparse, stale, mixed-country, duplicate-heavy or unregistered data.
 */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Five synthetic shapes of 36 monthly counts. */
const SCENARIOS: Record<string, (t: number, r: () => number, state: { level: number }) => number> = {
  rising_trend: (t, r) => 20 + 1.5 * t + (r() - 0.5) * 8,
  flat_noisy: (_t, r) => 40 + (r() - 0.5) * 14,
  seasonal: (t, r) => 40 + 10 * Math.sin((2 * Math.PI * t) / 12) + (r() - 0.5) * 6,
  random_walk: (_t, r, s) => (s.level = Math.max(5, s.level + (r() - 0.5) * 10)),
  step_change: (t, r) => (t < 30 ? 30 : 60) + (r() - 0.5) * 6,
};

const series = (shape: string, seed: number, length = 36) => {
  const r = rng(seed);
  const state = { level: 40 };
  return Array.from({ length }, (_, t) => Math.max(0, Math.round(SCENARIOS[shape](t, r, state))));
};

const monthsEndingAt = (end: string, count: number) => {
  const [y, m] = end.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => new Date(Date.UTC(y, m - count + i, 1)).toISOString().slice(0, 7));
};

export async function runMarketForecastTests() {
  console.log('🧪 Running Market Demand Forecast (C2) Tests...');

  // === Methods =================================================================================
  assert.deepEqual(naiveForecast([3, 5, 9], 3), [9, 9, 9]);
  const line = Array.from({ length: 12 }, (_, t) => 5 + 2 * t);
  assert.deepEqual(linearTrendForecast(line, 2).map(v => Math.round(v * 1e9) / 1e9), [29, 31], 'a straight line is continued exactly');
  assert.ok(linearTrendForecast([50, 40, 30, 20, 10, 0], 3).every(v => v === 0), 'never below zero');
  assert.ok(linearTrendForecast([...Array(20).fill(1000), ...line], 1)[0] === 29, 'only the last 12 months are fitted');
  console.log('  ✓ Naive baseline and 12-month linear trend behave as documented');

  // === No leakage ================================================================================
  const s = series('rising_trend', 1);
  const seen: number[][] = [];
  const spy: ForecastMethod = (train, h) => {
    seen.push([...train]);
    return naiveForecast(train, h);
  };
  const bt = backtest(s, spy, 3);
  bt.origins.forEach((origin, i) => assert.deepEqual(seen[i], s.slice(0, origin), `origin ${origin} saw only earlier months`));
  const altered = [...s];
  for (let i = 20; i < altered.length; i++) altered[i] = 999;
  // Backtest errors at origins before month 20 do not change when months 20+ change
  const clean = backtest(s, linearTrendForecast, 1).absErrors[0];
  const dirty = backtest(altered, linearTrendForecast, 1).absErrors[0];
  assert.deepEqual(dirty.slice(0, 20 - 12), clean.slice(0, 20 - 12), 'earlier origins are unaffected by later months');
  const predictionAt20 = linearTrendForecast(s.slice(0, 20), 1)[0];
  assert.equal(linearTrendForecast(altered.slice(0, 20), 1)[0], predictionAt20, 'changing later months does not change an earlier prediction');
  console.log(`  ✓ Rolling-origin backtest: ${bt.origins.length} origins, each saw only earlier months`);

  // === Held-out evaluation on synthetic series ===================================================
  // For each series, the last 3 months are held out; the forecast is made from the 33 before them.
  const SEEDS = 40;
  const table: Record<string, { chosenMae: number; naiveMae: number; trendMae: number; coverage: number; trendChosen: number }> = {};
  for (const shape of Object.keys(SCENARIOS)) {
    let chosenErr = 0;
    let naiveErr = 0;
    let trendErr = 0;
    let covered = 0;
    let trendChosen = 0;
    let n = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const full = series(shape, seed * 7 + shape.length);
      const train = full.slice(0, 33);
      const actual = full.slice(33);
      const result = forecastSeries(train, 3);
      const naive = naiveForecast(train, 3);
      const trend = linearTrendForecast(train, 3);
      if (result.chosen === 'linear_trend_12m') trendChosen += 1;
      actual.forEach((a, h) => {
        chosenErr += Math.abs(result.points[h].point - a);
        naiveErr += Math.abs(naive[h] - a);
        trendErr += Math.abs(trend[h] - a);
        if (a >= result.points[h].low80 && a <= result.points[h].high80) covered += 1;
        n += 1;
      });
    }
    table[shape] = {
      chosenMae: Math.round((chosenErr / n) * 10) / 10,
      naiveMae: Math.round((naiveErr / n) * 10) / 10,
      trendMae: Math.round((trendErr / n) * 10) / 10,
      coverage: Math.round((covered / n) * 100) / 100,
      trendChosen,
    };
  }
  console.log('    held-out (last 3 of 36 months, 40 seeds each):');
  for (const [shape, r] of Object.entries(table)) {
    console.log(`      ${shape.padEnd(13)} chosen MAE ${r.chosenMae}  naive ${r.naiveMae}  trend ${r.trendMae}  80% coverage ${r.coverage}  trend chosen ${r.trendChosen}/${SEEDS}`);
  }
  assert.ok(table.rising_trend.chosenMae < table.rising_trend.naiveMae, 'on a rising trend the selected method beats the baseline');
  assert.ok(table.rising_trend.trendChosen >= SEEDS * 0.9, 'the backtest selects the trend method on trending data');
  assert.ok(table.flat_noisy.chosenMae <= table.flat_noisy.naiveMae * 1.15, 'on flat noisy data selection costs little against the baseline');
  for (const shape of ['rising_trend', 'flat_noisy', 'seasonal', 'random_walk']) {
    assert.ok(table[shape].coverage >= 0.6 && table[shape].coverage <= 1, `${shape}: 80% range covers ${table[shape].coverage}`);
  }
  assert.ok(table.step_change.coverage < table.flat_noisy.coverage, 'a sudden level change is a documented failure: ranges miss it');
  console.log('  ✓ Held-out evaluation: beats the baseline on trends, near it on noise, ranges calibrated except after a sudden change');

  // === Service: guarded availability ============================================================
  await MarketPosting.deleteMany({});
  await MarketImportBatch.deleteMany({});
  const importer = new mongoose.Types.ObjectId().toString();
  const to = lastCompleteMonth();

  const none = await MarketForecastService.forecast({ dataset: 'sourced', to, horizon: 3 });
  assert.deepEqual([none.status, none.reasons, none.forecast], ['forecast_unavailable', ['no_registered_source'], null]);

  // The C1 fixture covers 12 months: too short to forecast
  await MarketIngestionService.importBatch(buildSyntheticMarketFixture({ endMonth: to, retrievedAt: new Date().toISOString() }), importer);
  const short = await MarketForecastService.forecast({ dataset: 'synthetic_fixture', country: 'IN', to, horizon: 3 });
  assert.equal(short.status, 'insufficient_data');
  assert.ok(short.reasons.includes('history_too_short') && short.reasons.includes('too_few_backtest_origins'));
  const mixed = await MarketForecastService.forecast({ dataset: 'synthetic_fixture', to, horizon: 3 });
  assert.ok(mixed.reasons.includes('mixed_countries'), 'India and the UK are not one market');
  assert.equal(short.forecast, null);
  console.log('  ✓ No source: forecast_unavailable. 12-month fixture: history too short; two countries: refused');

  // A long, dense synthetic history in one country
  await MarketPosting.deleteMany({});
  const months = monthsEndingAt(to, 30);
  const longSeries = series('rising_trend', 99, 30);
  const postings: Record<string, unknown>[] = [];
  months.forEach((month, i) => {
    for (let k = 0; k < longSeries[i]; k++) {
      postings.push({ sourceRecordId: `long-${i}-${k}`, title: 'Backend Developer', company: `Synthetic Employer ${i}-${k}`, location: 'Pune', country: 'IN', postedAt: `${month}-${String(1 + (k % 27)).padStart(2, '0')}T09:00:00.000Z`, description: 'Python and SQL' });
    }
  });
  const retrievedAt = new Date().toISOString();
  for (let i = 0; i < postings.length; i += 2000) {
    await MarketIngestionService.importBatch({ sourceId: SYNTHETIC_FIXTURE_SOURCE.id, retrievedAt, postings: postings.slice(i, i + 2000) }, importer);
  }
  const ok = await MarketForecastService.forecast({ dataset: 'synthetic_fixture', to, horizon: 3 });
  assert.equal(ok.status, 'available', `reasons: ${ok.reasons.join(', ')}`);
  assert.equal(ok.isSynthetic, true);
  assert.match(ok.caveats[0], /^SYNTHETIC TEST DATA/);
  assert.equal(ok.forecast!.points.length, 3);
  assert.equal(ok.forecast!.points[0].month > to, true, 'forecast months follow the last complete month');
  assert.ok(ok.forecast!.points.every(p => Number.isInteger(p.point) && p.low80 <= p.point && p.point <= p.high80));
  assert.deepEqual(ok.history.map(h => h.postings), longSeries);
  assert.equal(ok.checks.backtestOrigins, 30 - 12 - 3 + 1);
  assert.ok(ok.forecast!.backtest.naive_last_value.mae.every(v => typeof v === 'number'));
  assert.equal(ok.checks.countries.join(), 'IN');
  const one = await MarketForecastService.forecast({ dataset: 'synthetic_fixture', to, horizon: 1, skill: 'Python' });
  assert.equal(one.forecast!.points.length, 1);
  const kotlin = await MarketForecastService.forecast({ dataset: 'synthetic_fixture', to, horizon: 3, skill: 'Kotlin' });
  assert.deepEqual(kotlin.reasons, ['no_records']);
  // The same dense series, but every posting from one employer: no forecast
  await MarketPosting.updateMany({ dataset: 'synthetic_fixture' }, { $set: { company: 'One Big Employer' } });
  const concentrated = await MarketForecastService.forecast({ dataset: 'synthetic_fixture', to, horizon: 3 });
  assert.notEqual(concentrated.status, 'available');
  assert.equal(concentrated.forecast, null);
  assert.ok(concentrated.reasons.includes('too_few_employers') && concentrated.reasons.includes('one_employer_dominates'), concentrated.reasons.join(', '));
  await MarketPosting.updateMany({ dataset: 'synthetic_fixture' }, [{ $set: { company: { $concat: ['Synthetic Employer ', '$sourceRecordId'] } } }]);
  assert.equal((await MarketForecastService.forecast({ dataset: 'synthetic_fixture', to, horizon: 3 })).status, 'available', 'diverse employers again: forecast given');
  console.log(`  ✓ 30 dense synthetic months: forecast given with method ${ok.forecast!.method}, error-based ranges and both backtests; refused when one employer supplies them all`);

  // A licensed source whose data is sparse, stale and duplicate-heavy
  const unregister = registerMarketSource({
    id: 'test-forecast-source',
    name: 'Test forecast source',
    url: 'https://example.org/jobs',
    licence: 'CC BY 4.0 (test)',
    attribution: 'Test',
    dataset: 'sourced',
    verifiedOn: '2026-10-12',
    retentionDays: null,
  });
  try {
    const old = new Date(Date.now() - 200 * 86_400_000).toISOString();
    const sparse = monthsEndingAt(lastCompleteMonth(new Date(old)), 26)
      .filter((_m, i) => i % 3 !== 0)
      .map((month, i) => ({ sourceRecordId: `s-${i}`, title: 'Data Analyst', company: `Employer ${i}`, country: 'IN', postedAt: `${month}-10T00:00:00.000Z` }));
    await MarketIngestionService.importBatch({ sourceId: 'test-forecast-source', retrievedAt: old, postings: sparse }, importer);
    // The same postings again under new ids: merged as cross-posts
    await MarketIngestionService.importBatch({ sourceId: 'test-forecast-source', retrievedAt: old, postings: sparse.map(p => ({ ...p, sourceRecordId: `dup-${p.sourceRecordId}` })) }, importer);
    const bad = await MarketForecastService.forecast({ dataset: 'sourced', to: lastCompleteMonth(new Date(old)), horizon: 3 });
    assert.equal(bad.status, 'insufficient_data');
    for (const reason of ['too_few_postings_per_month', 'too_many_empty_months', 'stale_data', 'duplicate_heavy'] as const) {
      assert.ok(bad.reasons.includes(reason), `${reason} reported (got ${bad.reasons.join(', ')})`);
    }
    assert.equal(bad.forecast, null, 'no figure is produced from insufficient records');
    const gap = await MarketForecastService.forecast({ dataset: 'sourced', to: lastCompleteMonth(), horizon: 3 });
    assert.ok(gap.reasons.includes('latest_month_empty'), 'a recent month with no postings is reported, not read as a fall');
    console.log('  ✓ Sparse, stale, duplicate-heavy and gapped sourced data: refused with every reason named');

    // === HTTP ===================================================================================
    const h = await startHttpHarness();
    try {
      assert.equal((await h.api('GET', '/market/forecast')).status, 401);
      const user = await h.registerUser('forecast-viewer');
      const sourced = await h.api('GET', '/market/forecast', { token: user.token });
      assert.equal(sourced.status, 200);
      assert.equal(sourced.body.data.status, 'insufficient_data');
      assert.equal(sourced.body.data.forecast, null);
      const demo = await h.api('GET', '/market/forecast?dataset=synthetic_fixture&horizon=2', { token: user.token });
      assert.deepEqual([demo.body.data.status, demo.body.data.forecast.points.length, demo.body.data.isSynthetic], ['available', 2, true]);
      const thisMonth = new Date().toISOString().slice(0, 7);
      const bad = [`to=${thisMonth}`, 'horizon=4', 'horizon=0', 'skill=NotARealSkill', 'country=IND', 'to=2026-13', 'window=6'];
      for (const q of bad) assert.equal((await h.api('GET', `/market/forecast?${q}`, { token: user.token })).status, 400, `${q} is rejected`);
      console.log(`  ✓ HTTP: sign-in required, sourced answer carries no figure, synthetic demo flagged, ${bad.length} invalid queries rejected`);
    } finally {
      await h.close();
    }
  } finally {
    unregister();
  }

  const unavailable = await MarketForecastService.forecast({ dataset: 'sourced', to, horizon: 3 });
  assert.equal(unavailable.status, 'forecast_unavailable', 'stored records without a registered source are not forecast');
  assert.ok(FORECAST_MINIMUMS.historyMonths >= 24);
  console.log('✅ Market Demand Forecast (C2) Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runMarketForecastTests();
    } catch (err) {
      console.error('❌ Market Forecast Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
