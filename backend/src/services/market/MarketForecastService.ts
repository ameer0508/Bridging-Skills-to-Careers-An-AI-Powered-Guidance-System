import { listMarketSources, MarketDataset } from '../../config/marketSources.js';
import MarketPosting from '../../models/MarketPosting.js';
import MarketHistoryService from './MarketHistoryService.js';

/**
 * Cautious demand forecasting (C2) on top of the C1 monthly counts (docs/MARKET_INTELLIGENCE.md §5c).
 *
 * A forecast is given only when the history is long, dense, fresh, from one country and not
 * dominated by merged duplicates. Two deterministic methods are compared by rolling-origin
 * backtesting on the history itself: a naive baseline (next month = last month) and a linear trend
 * fitted to the last 12 months. The one with the lower backtest error is used, and both errors are
 * reported. The 80% range comes from the backtest errors, not from an assumed distribution.
 *
 * A forecast of postings is not a forecast of employment or hiring.
 */
export const FORECAST_MINIMUMS = {
  /** Months from the first month with postings to the last complete month. */
  historyMonths: 24,
  /** Median distinct postings per month over that history. */
  medianMonthlyPostings: 10,
  /** Months with no postings allowed inside that history. */
  maxEmptyMonths: 2,
  /** Backtest origins needed per horizon before an error-based range can be given. */
  backtestOrigins: 8,
  /** The latest retrieval may be at most this many days old. */
  maxDataAgeDays: 60,
  /** Share of postings that were merged cross-posts above which counts are considered unreliable. */
  maxMergedDuplicateShare: 0.5,
} as const;

export const TREND_WINDOW = 12;
export const MAX_HORIZON = 3;
const HISTORY_SPAN_MONTHS = 36;
const DAY_MS = 24 * 60 * 60 * 1000;

export type ForecastReason =
  | 'no_registered_source'
  | 'no_records'
  | 'history_too_short'
  | 'too_few_postings_per_month'
  | 'too_many_empty_months'
  | 'latest_month_empty'
  | 'stale_data'
  | 'mixed_countries'
  | 'duplicate_heavy'
  | 'too_few_backtest_origins';

export type ForecastMethodName = 'naive_last_value' | 'linear_trend_12m';

export type ForecastMethod = (train: number[], horizon: number) => number[];

/** Baseline: every future month equals the last observed month. */
export const naiveForecast: ForecastMethod = (train, horizon) => Array.from({ length: horizon }, () => train[train.length - 1]);

/** Ordinary least squares line through the last TREND_WINDOW months, extended; never below zero. */
export const linearTrendForecast: ForecastMethod = (train, horizon) => {
  const window = train.slice(-TREND_WINDOW);
  const n = window.length;
  if (n < 2) return naiveForecast(train, horizon);
  const meanX = (n - 1) / 2;
  const meanY = window.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  window.forEach((y, x) => {
    num += (x - meanX) * (y - meanY);
    den += (x - meanX) ** 2;
  });
  const slope = num / den;
  const intercept = meanY - slope * meanX;
  return Array.from({ length: horizon }, (_, h) => Math.max(0, intercept + slope * (n - 1 + h + 1)));
};

export const METHODS: Record<ForecastMethodName, ForecastMethod> = {
  naive_last_value: naiveForecast,
  linear_trend_12m: linearTrendForecast,
};

export interface BacktestResult {
  /** Mean absolute error at each horizon (index 0 = one month ahead); null without origins. */
  mae: Array<number | null>;
  /** Absolute errors at each horizon, in origin order. */
  absErrors: number[][];
  origins: number[];
}

/**
 * Rolling-origin evaluation. For each origin, the method sees only months before it and predicts
 * the next `horizon` months, which are then compared with what happened. No month at or after an
 * origin is ever passed to the method, so there is no leakage.
 */
export function backtest(series: number[], method: ForecastMethod, horizon: number, minTrain = TREND_WINDOW): BacktestResult {
  const absErrors: number[][] = Array.from({ length: horizon }, () => []);
  const origins: number[] = [];
  for (let origin = minTrain; origin + horizon <= series.length; origin++) {
    const prediction = method(series.slice(0, origin), horizon);
    origins.push(origin);
    for (let h = 0; h < horizon; h++) absErrors[h].push(Math.abs(prediction[h] - series[origin + h]));
  }
  const mae = absErrors.map(errs => (errs.length ? errs.reduce((s, e) => s + e, 0) / errs.length : null));
  return { mae, absErrors, origins };
}

/** Empirical quantile with linear interpolation. */
function quantile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const h = (sorted.length - 1) * p;
  const lo = Math.floor(h);
  return sorted[lo] + (h - lo) * (sorted[Math.ceil(h)] - sorted[lo]);
}

const median = (values: number[]) => quantile(values, 0.5);

export interface ForecastPoint {
  month: string;
  /** Whole postings; never a fraction. */
  point: number;
  /** 80% range from the 80th percentile of backtest absolute errors at this horizon. */
  low80: number;
  high80: number;
}

/** Pure forecast from a monthly series, used by the service and by the evaluation tests. */
export function forecastSeries(series: number[], horizon: number) {
  const evaluations = (Object.keys(METHODS) as ForecastMethodName[]).map(name => ({ name, ...backtest(series, METHODS[name], horizon) }));
  const score = (e: (typeof evaluations)[number]) => e.mae.reduce<number>((s, v) => s + (v ?? Infinity), 0);
  // The baseline is listed first, so a tie keeps the simpler method
  const chosen = evaluations.reduce((best, e) => (score(e) < score(best) ? e : best));
  const prediction = METHODS[chosen.name](series, horizon);
  const points = prediction.map((value, h) => {
    const spread = chosen.absErrors[h].length ? quantile(chosen.absErrors[h], 0.8) : 0;
    return {
      point: Math.round(value),
      low80: Math.max(0, Math.floor(value - spread)),
      high80: Math.ceil(value + spread),
    };
  });
  return { chosen: chosen.name, evaluations, points };
}

export interface ForecastQuery {
  dataset: MarketDataset;
  skill?: string;
  country?: string;
  /** Last complete month used, YYYY-MM. */
  to: string;
  horizon: number;
}

export interface MarketForecast {
  dataset: MarketDataset;
  isSynthetic: boolean;
  status: 'forecast_unavailable' | 'insufficient_data' | 'available';
  reasons: ForecastReason[];
  query: ForecastQuery;
  history: Array<{ month: string; postings: number }>;
  checks: {
    historyMonths: number;
    medianMonthlyPostings: number | null;
    emptyMonths: number;
    countries: string[];
    mergedDuplicateShare: number | null;
    dataAgeDays: number | null;
    backtestOrigins: number;
  };
  forecast: null | {
    method: ForecastMethodName;
    points: ForecastPoint[];
    backtest: Record<ForecastMethodName, { mae: Array<number | null>; origins: number }>;
  };
  minimums: typeof FORECAST_MINIMUMS;
  method: string[];
  caveats: string[];
}

export const FORECAST_METHOD_TEXT = [
  'Counts are distinct postings per month from C1 (duplicates merged, undated postings left out).',
  `Two deterministic methods are compared: a naive baseline (each future month equals the last month) and a straight line fitted by least squares to the last ${TREND_WINDOW} months.`,
  'Each method is backtested on the history itself: at every past month it sees only earlier months and predicts the next ones. The method with the lower mean absolute error is used; ties keep the baseline.',
  'The 80% range at each horizon is the forecast plus or minus the 80th percentile of that method\'s backtest errors at the same horizon.',
  `A forecast needs ${FORECAST_MINIMUMS.historyMonths} months of history with a median of at least ${FORECAST_MINIMUMS.medianMonthlyPostings} postings a month, at most ${FORECAST_MINIMUMS.maxEmptyMonths} empty months, data retrieved within ${FORECAST_MINIMUMS.maxDataAgeDays} days, one country, and no more than half the postings merged as cross-posts.`,
];

const monthsBefore = (month: string, count: number) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 - count, 1)).toISOString().slice(0, 7);
};
const monthsAfter = (month: string, count: number) => monthsBefore(month, -count);

class MarketForecastService {
  async forecast(query: ForecastQuery, now = new Date()): Promise<MarketForecast> {
    const isSynthetic = query.dataset === 'synthetic_fixture';
    const caveats = [
      'This forecasts how many postings SkillBridge would hold from its sources. It does not forecast employment, hiring or your chances.',
      'Sources change what they publish and when they are collected; a change in collection looks the same as a change in demand.',
    ];
    if (isSynthetic) caveats.unshift('SYNTHETIC TEST DATA: generated postings. This is a demonstration of the method, not a prediction of anything real.');

    const result: MarketForecast = {
      dataset: query.dataset,
      isSynthetic,
      status: 'insufficient_data',
      reasons: [],
      query,
      history: [],
      checks: { historyMonths: 0, medianMonthlyPostings: null, emptyMonths: 0, countries: [], mergedDuplicateShare: null, dataAgeDays: null, backtestOrigins: 0 },
      forecast: null,
      minimums: FORECAST_MINIMUMS,
      method: FORECAST_METHOD_TEXT,
      caveats,
    };

    if (!listMarketSources().some(s => s.dataset === query.dataset)) {
      return { ...result, status: 'forecast_unavailable', reasons: ['no_registered_source'] };
    }

    const from = monthsBefore(query.to, HISTORY_SPAN_MONTHS - 1);
    const history = await MarketHistoryService.history({ dataset: query.dataset, skill: query.skill, country: query.country, from, to: query.to });
    const firstWithPostings = history.buckets.findIndex(b => b.postings > 0);
    if (firstWithPostings === -1) return { ...result, reasons: ['no_records'] };

    const used = history.buckets.slice(firstWithPostings).map(b => ({ month: b.month, postings: b.postings }));
    const series = used.map(b => b.postings);
    result.history = used;

    const match: Record<string, unknown> = {
      dataset: query.dataset,
      postedAt: { $gte: new Date(`${used[0].month}-01T00:00:00.000Z`), $lt: new Date(`${monthsAfter(query.to, 1)}-01T00:00:00.000Z`) },
    };
    if (query.skill) match.skills = query.skill;
    if (query.country) match.country = query.country;
    const [countries, merged] = await Promise.all([
      MarketPosting.distinct('country', match) as Promise<string[]>,
      MarketPosting.countDocuments({ ...match, 'alsoSeenIn.0': { $exists: true } }),
    ]);

    const latest = history.freshness.latestRetrievedAt ? new Date(history.freshness.latestRetrievedAt) : null;
    const checks = result.checks;
    checks.historyMonths = series.length;
    checks.medianMonthlyPostings = median(series);
    checks.emptyMonths = series.filter(v => v === 0).length;
    checks.countries = countries.map(c => c || 'not stated').sort();
    checks.mergedDuplicateShare = history.totals.distinctPostings ? Math.round((merged / history.totals.distinctPostings) * 1000) / 1000 : null;
    checks.dataAgeDays = latest ? Math.floor((now.getTime() - latest.getTime()) / DAY_MS) : null;
    checks.backtestOrigins = Math.max(0, series.length - TREND_WINDOW - query.horizon + 1);

    const reasons: ForecastReason[] = [];
    if (series.length < FORECAST_MINIMUMS.historyMonths) reasons.push('history_too_short');
    if (checks.medianMonthlyPostings < FORECAST_MINIMUMS.medianMonthlyPostings) reasons.push('too_few_postings_per_month');
    if (checks.emptyMonths > FORECAST_MINIMUMS.maxEmptyMonths) reasons.push('too_many_empty_months');
    if (series[series.length - 1] === 0) reasons.push('latest_month_empty');
    if (checks.dataAgeDays === null || checks.dataAgeDays > FORECAST_MINIMUMS.maxDataAgeDays) reasons.push('stale_data');
    if (!query.country && countries.length > 1) reasons.push('mixed_countries');
    if ((checks.mergedDuplicateShare ?? 0) > FORECAST_MINIMUMS.maxMergedDuplicateShare) reasons.push('duplicate_heavy');
    if (checks.backtestOrigins < FORECAST_MINIMUMS.backtestOrigins) reasons.push('too_few_backtest_origins');
    result.reasons = reasons;
    if (reasons.length > 0) return result;

    const { chosen, evaluations, points } = forecastSeries(series, query.horizon);
    const round = (v: number | null) => (v === null ? null : Math.round(v * 10) / 10);
    result.status = 'available';
    result.forecast = {
      method: chosen,
      points: points.map((p, h) => ({ month: monthsAfter(query.to, h + 1), ...p })),
      backtest: Object.fromEntries(evaluations.map(e => [e.name, { mae: e.mae.map(round), origins: e.origins.length }])) as Record<
        ForecastMethodName,
        { mae: Array<number | null>; origins: number }
      >,
    };
    return result;
  }
}

/** The last month that has fully ended, YYYY-MM. */
export const lastCompleteMonth = (now = new Date()) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);

export default new MarketForecastService();
