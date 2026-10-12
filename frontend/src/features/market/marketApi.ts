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
