import { getMarketSource, listMarketSources, MarketDataset } from '../../config/marketSources.js';
import MarketPosting from '../../models/MarketPosting.js';

/**
 * Dated posting history (C1). Every figure is a count of distinct postings actually held from a
 * registered source, grouped by the month the employer published them. Below the minimums the
 * counts are still returned, as raw observations, but `sufficiency.sufficient` is false and the
 * reasons say why no trend may be read from them.
 */
export const HISTORY_MINIMUMS = {
  distinctPostings: 30,
  monthsWithPostings: 3,
} as const;

export const MAX_HISTORY_MONTHS = 60;

export type InsufficiencyReason =
  | 'no_registered_source'
  | 'no_records'
  | 'too_few_postings'
  | 'too_few_months_with_postings';

export interface HistoryQuery {
  dataset: MarketDataset;
  /** Canonical lexicon skill name. */
  skill?: string;
  /** ISO 3166-1 alpha-2. */
  country?: string;
  /** Inclusive, YYYY-MM. */
  from: string;
  /** Inclusive, YYYY-MM. */
  to: string;
}

export interface HistoryBucket {
  month: string;
  postings: number;
  sources: string[];
}

export interface HistorySource {
  id: string;
  name: string;
  url: string;
  licence: string;
  attribution: string;
  postings: number;
}

export interface MarketHistory {
  dataset: MarketDataset;
  isSynthetic: boolean;
  query: HistoryQuery;
  buckets: HistoryBucket[];
  totals: {
    distinctPostings: number;
    monthsWithPostings: number;
    /** Postings matching the filters whose publication date is unknown; not in any bucket. */
    undatedExcluded: number;
  };
  sources: HistorySource[];
  freshness: { latestPostedAt: string | null; latestRetrievedAt: string | null };
  sufficiency: {
    sufficient: boolean;
    reasons: InsufficiencyReason[];
    minimums: typeof HISTORY_MINIMUMS;
  };
  caveats: string[];
}

/** Months from `from` to `to` inclusive, as YYYY-MM. */
export function monthRange(from: string, to: string): string[] {
  const [fromYear, fromMonth] = from.split('-').map(Number);
  const [toYear, toMonth] = to.split('-').map(Number);
  const months: string[] = [];
  for (let index = fromYear * 12 + fromMonth - 1; index <= toYear * 12 + toMonth - 1; index++) {
    months.push(`${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`);
  }
  return months;
}

const monthStart = (month: string) => new Date(`${month}-01T00:00:00.000Z`);
const nextMonthStart = (month: string) => {
  const d = monthStart(month);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
};

class MarketHistoryService {
  async history(query: HistoryQuery): Promise<MarketHistory> {
    const months = monthRange(query.from, query.to);
    const base: Record<string, unknown> = { dataset: query.dataset };
    if (query.skill) base.skills = query.skill;
    if (query.country) base.country = query.country;

    const dated = { ...base, postedAt: { $gte: monthStart(query.from), $lt: nextMonthStart(query.to) } };

    const [grouped, bySource, undatedExcluded, latest] = await Promise.all([
      MarketPosting.aggregate<{ _id: string; postings: number; sources: string[] }>([
        { $match: dated },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$postedAt' } },
            postings: { $sum: 1 },
            sources: { $addToSet: '$sourceId' },
          },
        },
      ]),
      MarketPosting.aggregate<{ _id: string; postings: number }>([
        { $match: dated },
        { $group: { _id: '$sourceId', postings: { $sum: 1 } } },
      ]),
      MarketPosting.countDocuments({ ...base, postedAt: null }),
      MarketPosting.aggregate<{ latestPostedAt: Date | null; latestRetrievedAt: Date | null }>([
        { $match: dated },
        { $group: { _id: null, latestPostedAt: { $max: '$postedAt' }, latestRetrievedAt: { $max: '$lastSeenAt' } } },
      ]),
    ]);

    const byMonth = new Map(grouped.map(g => [g._id, g]));
    const buckets = months.map(month => ({
      month,
      postings: byMonth.get(month)?.postings ?? 0,
      sources: (byMonth.get(month)?.sources ?? []).sort(),
    }));
    const distinctPostings = buckets.reduce((sum, b) => sum + b.postings, 0);
    const monthsWithPostings = buckets.filter(b => b.postings > 0).length;

    const reasons: InsufficiencyReason[] = [];
    if (!listMarketSources().some(s => s.dataset === query.dataset)) reasons.push('no_registered_source');
    if (distinctPostings === 0) reasons.push('no_records');
    else {
      if (distinctPostings < HISTORY_MINIMUMS.distinctPostings) reasons.push('too_few_postings');
      if (monthsWithPostings < HISTORY_MINIMUMS.monthsWithPostings) reasons.push('too_few_months_with_postings');
    }

    const sources = bySource
      .map(s => {
        const meta = getMarketSource(s._id);
        return {
          id: s._id,
          name: meta?.name ?? s._id,
          url: meta?.url ?? '',
          licence: meta?.licence ?? 'unknown (source no longer registered)',
          attribution: meta?.attribution ?? '',
          postings: s.postings,
        };
      })
      .sort((a, b) => b.postings - a.postings);

    const caveats = [
      'Counts are postings held from the listed sources, not the whole job market.',
      'Months with zero postings mean none were held for that month, which can also mean the source was not collected then.',
    ];
    if (query.dataset === 'synthetic_fixture') caveats.unshift('SYNTHETIC TEST DATA: these postings are generated and describe no real jobs.');
    if (sources.length === 1) caveats.push('All postings come from a single source.');

    return {
      dataset: query.dataset,
      isSynthetic: query.dataset === 'synthetic_fixture',
      query,
      buckets,
      totals: { distinctPostings, monthsWithPostings, undatedExcluded },
      sources,
      freshness: {
        latestPostedAt: latest[0]?.latestPostedAt ? new Date(latest[0].latestPostedAt).toISOString() : null,
        latestRetrievedAt: latest[0]?.latestRetrievedAt ? new Date(latest[0].latestRetrievedAt).toISOString() : null,
      },
      sufficiency: { sufficient: reasons.length === 0, reasons, minimums: HISTORY_MINIMUMS },
      caveats,
    };
  }
}

export default new MarketHistoryService();
