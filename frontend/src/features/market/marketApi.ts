import apiClient from '../../lib/axios';

/** Mirrors backend/src/services/market/MarketHistoryService.ts. */
export type MarketDataset = 'sourced' | 'synthetic_fixture';

export type InsufficiencyReason =
  | 'no_registered_source'
  | 'no_records'
  | 'too_few_postings'
  | 'too_few_months_with_postings';

export interface MarketHistory {
  dataset: MarketDataset;
  isSynthetic: boolean;
  query: { dataset: MarketDataset; skill?: string; country?: string; from: string; to: string };
  buckets: Array<{ month: string; postings: number; sources: string[] }>;
  totals: { distinctPostings: number; monthsWithPostings: number; undatedExcluded: number };
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
};

/** Mirrors backend/src/services/market/MarketSkillTrendService.ts. */
export type TrendReason =
  | 'no_registered_source'
  | 'no_records'
  | 'too_few_months_with_postings'
  | 'too_few_postings_per_half'
  | 'too_few_skill_mentions';

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
export type SalaryReason = 'no_registered_source' | 'no_records' | 'no_salary_records' | 'too_few_complete_ranges';
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
