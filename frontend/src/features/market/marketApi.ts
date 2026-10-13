import apiClient from '../../lib/axios';

/** Mirrors backend/src/services/market/MarketHistoryService.ts. */
export type MarketDataset = 'sourced' | 'synthetic_fixture';

/** Mirrors backend/src/services/market/employerDiversity.ts. */
export type EmployerDiversityReason = 'too_few_employers' | 'one_employer_dominates';
export const EMPLOYER_REASON_TEXT: Record<EmployerDiversityReason, string> = {
  too_few_employers: 'The postings come from fewer than 5 employers, so they describe those employers, not the market.',
  one_employer_dominates: 'One employer supplies more than half of the postings, so no figure is given.',
};

export type InsufficiencyReason =
  | 'no_registered_source'
  | 'no_records'
  | 'too_few_postings'
  | 'too_few_months_with_postings'
  | EmployerDiversityReason;

export interface MarketHistory {
  dataset: MarketDataset;
  isSynthetic: boolean;
  query: { dataset: MarketDataset; skill?: string; country?: string; from: string; to: string };
  buckets: Array<{ month: string; postings: number; sources: string[] }>;
  totals: { distinctPostings: number; monthsWithPostings: number; undatedExcluded: number; distinctEmployers: number; largestEmployerShare: number | null };
  sources: Array<{ id: string; name: string; url: string; licence: string; attribution: string; postings: number }>;
  freshness: { latestPostedAt: string | null; latestRetrievedAt: string | null };
  sufficiency: {
    sufficient: boolean;
    reasons: InsufficiencyReason[];
    minimums: { distinctPostings: number; monthsWithPostings: number };
  };
  caveats: string[];
}

export interface MarketHistoryFilters {
  dataset: MarketDataset;
  skill?: string;
  country?: string;
  from?: string;
  to?: string;
}

export async function fetchMarketHistory(filters: MarketHistoryFilters): Promise<MarketHistory> {
  const params: Record<string, string> = { dataset: filters.dataset };
  for (const key of ['skill', 'country', 'from', 'to'] as const) {
    const value = filters[key]?.trim();
    if (value) params[key] = value;
  }
  const res = await apiClient.get('/market/history', { params });
  return res.data.data as MarketHistory;
}

export const REASON_TEXT: Record<InsufficiencyReason, (h: MarketHistory) => string> = {
  no_registered_source: () =>
    'No licensed market data source is registered yet, so SkillBridge holds no real job-market records. Nothing is estimated in their place.',
  no_records: () => 'No postings match these filters in this period.',
  too_few_postings: h =>
    `Only ${h.totals.distinctPostings} distinct posting${h.totals.distinctPostings === 1 ? '' : 's'} match; at least ${h.sufficiency.minimums.distinctPostings} are needed before a trend can be read.`,
  too_few_months_with_postings: h =>
    `Postings fall in ${h.totals.monthsWithPostings} month${h.totals.monthsWithPostings === 1 ? '' : 's'}; at least ${h.sufficiency.minimums.monthsWithPostings} are needed.`,
  too_few_employers: () => EMPLOYER_REASON_TEXT.too_few_employers,
  one_employer_dominates: () => EMPLOYER_REASON_TEXT.one_employer_dominates,
};

/** Mirrors backend/src/services/market/MarketSkillTrendService.ts. */
export type TrendReason =
  | 'no_registered_source'
  | 'no_records'
  | 'too_few_months_with_postings'
  | 'too_few_postings_per_half'
  | 'too_few_skill_mentions'
  | EmployerDiversityReason;

export interface WindowShare {
  months: string[];
  mentions: number;
  postings: number;
  share: number | null;
}

export interface SkillTrends {
  dataset: MarketDataset;
  isSynthetic: boolean;
  query: { from: string; to: string; granularity: 'month' | 'quarter'; country?: string; skills?: string[] };
  periods: Array<{ period: string; postings: number }>;
  totals: { distinctPostings: number; undatedExcluded: number; postingsWithoutRecognisedSkills: number; monthsWithPostings: number };
  skills: Array<{
    skill: string;
    mentions: number;
    share: number | null;
    byPeriod: Array<{ period: string; mentions: number; postings: number; share: number | null }>;
    change: {
      described: boolean;
      reasons: TrendReason[];
      earlier: WindowShare;
      recent: WindowShare;
      changePoints: number | null;
      z: number | null;
      direction: 'higher_share' | 'lower_share' | 'no_clear_change' | null;
    };
  }>;
  sufficiency: { sufficient: boolean; reasons: TrendReason[] };
  minimums: { postingsPerHalf: number; monthsWithPostings: number; skillMentions: number; zThreshold: number };
  caveats: string[];
}

export async function fetchSkillTrends(filters: MarketHistoryFilters & { granularity: 'month' | 'quarter' }): Promise<SkillTrends> {
  const params: Record<string, string> = { dataset: filters.dataset, granularity: filters.granularity };
  if (filters.country?.trim()) params.country = filters.country.trim();
  if (filters.from?.trim()) params.from = filters.from.trim();
  if (filters.to?.trim()) params.to = filters.to.trim();
  if (filters.skill?.trim()) params.skills = filters.skill.trim();
  const res = await apiClient.get('/market/skill-trends', { params });
  return res.data.data as SkillTrends;
}

export const TREND_REASON_TEXT: Record<TrendReason, (t: SkillTrends) => string> = {
  no_registered_source: () => 'No licensed market data source is registered, so there are no real postings to mine.',
  no_records: () => 'No postings match these filters in this period.',
  too_few_months_with_postings: t =>
    `Postings fall in ${t.totals.monthsWithPostings} month${t.totals.monthsWithPostings === 1 ? '' : 's'}; at least ${t.minimums.monthsWithPostings} are needed to compare halves of the period.`,
  too_few_postings_per_half: t => `Each half of the period needs at least ${t.minimums.postingsPerHalf} dated postings.`,
  too_few_skill_mentions: t => `Fewer than ${t.minimums.skillMentions} postings mention it.`,
  too_few_employers: () => EMPLOYER_REASON_TEXT.too_few_employers,
  one_employer_dominates: () => EMPLOYER_REASON_TEXT.one_employer_dominates,
};

/**
 * MarketOpportunitySummary (contract v2) for Career Lab / next-best-action consumers.
 * Mirrors backend/src/services/market/MarketOpportunitySummary.ts. Only evidenceClass
 * 'sourced_valid' (usableForRecommendations) may inform a real recommendation.
 */
export interface MarketOpportunitySummary {
  contractVersion: 2;
  careerId: string;
  careerTitle: string;
  location: { country: string | null; label: string };
  period: { from: string; to: string };
  dataset: MarketDataset;
  evidenceClass: 'sourced_valid' | 'sourced_sparse' | 'no_legitimate_source' | 'synthetic_test_data';
  usableForRecommendations: boolean;
  matchingRule: string | null;
  sourcedObservations: number;
  distinctPostings: number;
  sources: Array<{ id: string; name: string; licence: string; postings: number }>;
  freshness: { latestPostedAt: string | null; latestRetrievedAt: string | null; ageDays: number | null };
  demand: null | { monthly: Array<{ month: string; postings: number }>; minimums: { distinctPostings: number; monthsWithPostings: number } };
  available: boolean;
  insufficientDataReasons: string[];
}

export async function fetchMarketOpportunitySummary(
  careerId: string,
  options: { country?: string; from?: string; to?: string; dataset?: MarketDataset } = {}
): Promise<MarketOpportunitySummary> {
  const params: Record<string, string> = { dataset: options.dataset ?? 'sourced' };
  if (options.country) params.country = options.country;
  if (options.from) params.from = options.from;
  if (options.to) params.to = options.to;
  const res = await apiClient.get(`/market/careers/${encodeURIComponent(careerId)}/summary`, { params });
  return res.data.data as MarketOpportunitySummary;
}

/** C3 salary insights. Mirrors backend/src/services/market/MarketSalaryService.ts. */
export type SalaryPeriod = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
export type SalaryReason = 'no_registered_source' | 'no_records' | 'no_salary_records' | 'too_few_complete_ranges' | EmployerDiversityReason;
export type SalaryExclusion = 'no_salary_stated' | 'country_not_stated' | 'implausible_range' | 'invalid_amount';

export interface SalaryGroup {
  key: string;
  country: string;
  currency: string;
  period: SalaryPeriod;
  postings: number;
  completeRanges: {
    count: number;
    lower: number | null;
    upper: number | null;
    midpoint: number | null;
    midpointQuartiles: { p25: number; median: number; p75: number } | null;
    distribution: Array<{ from: number; to: number; postings: number }>;
  };
  minimumOnly: { count: number; medianMinimum: number | null };
  maximumOnly: { count: number; medianMaximum: number | null };
  sufficient: boolean;
  reasons: SalaryReason[];
  employers: { distinct: number; largestShare: number | null; sufficient: boolean };
  remotePostings: number;
  sources: Array<{ id: string; name: string; licence: string; url: string; attribution: string; postings: number }>;
  collection: { firstRetrievedAt: string; latestRetrievedAt: string };
  postedBetween: { earliest: string; latest: string };
}

export interface SalaryInsights {
  dataset: MarketDataset;
  isSynthetic: boolean;
  status: 'data_unavailable' | 'insufficient_data' | 'available';
  reasons: SalaryReason[];
  query: { from: string; to: string; country?: string; currency?: string; period?: SalaryPeriod; skill?: string };
  totals: {
    postingsConsidered: number;
    postingsWithUsableSalary: number;
    outsideCurrencyOrPeriodFilter: number;
    undatedExcluded: number;
    excluded: Record<SalaryExclusion, number>;
    scanLimitReached: boolean;
  };
  groups: SalaryGroup[];
  available: { currencies: string[]; periods: SalaryPeriod[]; countries: string[] };
  method: string[];
  minimums: { forMedian: number; forDistribution: number; forOneBoundMedian: number };
  caveats: string[];
}

export interface SalaryFilters {
  dataset: MarketDataset;
  country?: string;
  currency?: string;
  period?: SalaryPeriod | '';
  skill?: string;
  from?: string;
  to?: string;
}

export async function fetchSalaryInsights(filters: SalaryFilters): Promise<SalaryInsights> {
  const params: Record<string, string> = { dataset: filters.dataset };
  for (const key of ['country', 'currency', 'period', 'skill', 'from', 'to'] as const) {
    const value = filters[key]?.trim();
    if (value) params[key] = value;
  }
  const res = await apiClient.get('/market/salaries', { params });
  return res.data.data as SalaryInsights;
}

export const SALARY_REASON_TEXT: Record<SalaryReason, (s: SalaryInsights) => string> = {
  no_registered_source: () =>
    'No licensed market data source is registered, so SkillBridge holds no real salary records. No salary figure is estimated in their place.',
  no_records: () => 'No postings match these filters in this period.',
  no_salary_records: () => 'Postings match, but none states a usable salary.',
  too_few_complete_ranges: s =>
    `No group has the ${s.minimums.forMedian} complete salary ranges needed before a median is given. Counts are shown instead.`,
  too_few_employers: () => EMPLOYER_REASON_TEXT.too_few_employers,
  one_employer_dominates: () => EMPLOYER_REASON_TEXT.one_employer_dominates,
};

export const EXCLUSION_TEXT: Record<SalaryExclusion, string> = {
  no_salary_stated: 'No salary stated',
  country_not_stated: 'Salary stated, country not stated',
  implausible_range: 'Range maximum more than 10× its minimum',
  invalid_amount: 'Missing or non-positive amount',
};

export const PERIOD_LABEL: Record<SalaryPeriod, string> = {
  YEAR: 'per year',
  MONTH: 'per month',
  WEEK: 'per week',
  DAY: 'per day',
  HOUR: 'per hour',
};

/** C2 guarded forecast. Mirrors backend/src/services/market/MarketForecastService.ts. */
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

export interface MarketForecast {
  dataset: MarketDataset;
  isSynthetic: boolean;
  status: 'forecast_unavailable' | 'insufficient_data' | 'available';
  reasons: ForecastReason[];
  query: { to: string; horizon: number; skill?: string; country?: string };
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
    points: Array<{ month: string; point: number; low80: number; high80: number }>;
    backtest: Record<ForecastMethodName, { mae: Array<number | null>; origins: number }>;
  };
  minimums: {
    historyMonths: number;
    medianMonthlyPostings: number;
    maxEmptyMonths: number;
    backtestOrigins: number;
    maxDataAgeDays: number;
    maxMergedDuplicateShare: number;
  };
  method: string[];
  caveats: string[];
}

export async function fetchMarketForecast(filters: MarketHistoryFilters): Promise<MarketForecast> {
  const params: Record<string, string> = { dataset: filters.dataset };
  if (filters.skill?.trim()) params.skill = filters.skill.trim();
  if (filters.country?.trim()) params.country = filters.country.trim();
  const res = await apiClient.get('/market/forecast', { params });
  return res.data.data as MarketForecast;
}

export const METHOD_LABEL: Record<ForecastMethodName, string> = {
  naive_last_value: 'Naive baseline (same as last month)',
  linear_trend_12m: 'Linear trend over the last 12 months',
};

export const FORECAST_REASON_TEXT: Record<ForecastReason, (f: MarketForecast) => string> = {
  no_registered_source: () => 'No licensed market data source is registered, so there is no real history to forecast from.',
  no_records: () => 'No dated postings match these filters.',
  history_too_short: f => `${f.checks.historyMonths} month${f.checks.historyMonths === 1 ? '' : 's'} of history; at least ${f.minimums.historyMonths} are needed.`,
  too_few_postings_per_month: f => `A median of ${f.checks.medianMonthlyPostings ?? 0} postings a month; at least ${f.minimums.medianMonthlyPostings} are needed.`,
  too_many_empty_months: f => `${f.checks.emptyMonths} months have no postings; at most ${f.minimums.maxEmptyMonths} are allowed.`,
  latest_month_empty: () => 'The latest complete month has no postings, which more likely means collection stopped than that demand fell.',
  stale_data: f => (f.checks.dataAgeDays === null ? 'The retrieval date is unknown.' : `The latest data was retrieved ${f.checks.dataAgeDays} days ago; at most ${f.minimums.maxDataAgeDays} are allowed.`),
  mixed_countries: f => `Postings come from ${f.checks.countries.join(', ')}. Choose one country: different markets are not forecast together.`,
  duplicate_heavy: f => `${Math.round((f.checks.mergedDuplicateShare ?? 0) * 100)}% of postings were merged cross-posts, so the counts are not reliable enough.`,
  too_few_backtest_origins: f => `Only ${f.checks.backtestOrigins} past months are available to test the method; ${f.minimums.backtestOrigins} are needed to estimate its error.`,
};
