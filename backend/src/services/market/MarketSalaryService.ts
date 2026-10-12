import { getMarketSource, listMarketSources, MarketDataset } from '../../config/marketSources.js';
import MarketPosting, { SalaryPeriod } from '../../models/MarketPosting.js';

/**
 * Salary insights (C3) from the salaries stated in stored postings (docs/MARKET_INTELLIGENCE.md §5b).
 *
 * - The unit is a distinct stored posting: duplicates were merged on import (C1), and undated
 *   postings are left out, as in the history.
 * - A statistic never mixes countries, currencies or pay periods. Each (country, currency,
 *   period) is its own market, and amounts are never converted.
 * - Complete ranges, "from" figures (minimum only) and "up to" figures (maximum only) are summarised
 *   separately; a single bound is not treated as a range.
 * - Below the minimum sample, only counts are given. No median is computed from a handful of
 *   postings.
 */
export const SALARY_MINIMUMS = {
  /** Postings with a complete range before a median is given. */
  forMedian: 10,
  /** Postings with a complete range before quartiles and the distribution are given. */
  forDistribution: 20,
  /** Postings stating one bound before the median of that bound is given. */
  forOneBoundMedian: 10,
} as const;

/** A stated maximum more than this many times the stated minimum is treated as a data error. */
export const MAX_RANGE_RATIO = 10;

/** Upper limit on postings read for one request; the response says when it was reached. */
export const MAX_POSTINGS_SCANNED = 50_000;

const HISTOGRAM_BINS = 6;

export type SalaryStatus = 'data_unavailable' | 'insufficient_data' | 'available';

export type SalaryReason =
  | 'no_registered_source'
  | 'no_records'
  | 'no_salary_records'
  | 'too_few_complete_ranges';

export type ExclusionReason = 'no_salary_stated' | 'country_not_stated' | 'implausible_range' | 'invalid_amount';

export interface SalaryQuery {
  dataset: MarketDataset;
  /** ISO 3166-1 alpha-2, upper case. */
  country?: string;
  /** ISO 4217, upper case. */
  currency?: string;
  period?: SalaryPeriod;
  /** Canonical lexicon skill name. */
  skill?: string;
  /** Inclusive, YYYY-MM. */
  from: string;
  /** Inclusive, YYYY-MM. */
  to: string;
}

export interface Quartiles {
  p25: number;
  median: number;
  p75: number;
}

export interface SalaryGroup {
  key: string;
  country: string;
  currency: string;
  period: SalaryPeriod;
  /** Distinct postings in this market with a usable salary of any shape. */
  postings: number;
  completeRanges: {
    count: number;
    /** Median of the stated minimums, of the stated maximums and of the range midpoints. */
    lower: number | null;
    upper: number | null;
    midpoint: number | null;
    /** Quartiles of the midpoints; null below SALARY_MINIMUMS.forDistribution. */
    midpointQuartiles: Quartiles | null;
    /** Midpoints in equal-width bins; empty below SALARY_MINIMUMS.forDistribution. */
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
  status: SalaryStatus;
  reasons: SalaryReason[];
  query: SalaryQuery;
  totals: {
    /** Dated postings in the period matching country and skill, before salary is looked at. */
    postingsConsidered: number;
    /** Included in a group below. */
    postingsWithUsableSalary: number;
    /** Usable salary, but in a currency or period the filters leave out. */
    outsideCurrencyOrPeriodFilter: number;
    undatedExcluded: number;
    excluded: Record<ExclusionReason, number>;
    scanLimitReached: boolean;
  };
  groups: SalaryGroup[];
  /** Currencies and periods present before the currency and period filters, for the filter menus. */
  available: { currencies: string[]; periods: SalaryPeriod[]; countries: string[] };
  method: string[];
  minimums: typeof SALARY_MINIMUMS;
  caveats: string[];
}

/** Linear-interpolation quantile (Hyndman and Fan type 7) of an ascending list. */
export function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) throw new Error('quantile of an empty list');
  const h = (sorted.length - 1) * p;
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  return sorted[lo] + (h - lo) * (sorted[hi] - sorted[lo]);
}

/** Whole units for every period except hourly pay, which keeps two decimals. */
export function roundAmount(value: number, period: SalaryPeriod): number {
  return period === 'HOUR' ? Math.round(value * 100) / 100 : Math.round(value);
}

const median = (values: number[]) => quantile([...values].sort((a, b) => a - b), 0.5);

/** Equal-width bins between the smallest and largest value; every value lands in exactly one bin. */
export function histogram(values: number[], bins: number, period: SalaryPeriod): Array<{ from: number; to: number; postings: number }> {
  const sorted = [...values].sort((a, b) => a - b);
  const low = sorted[0];
  const high = sorted[sorted.length - 1];
  if (low === high) return [{ from: roundAmount(low, period), to: roundAmount(high, period), postings: sorted.length }];
  const width = (high - low) / bins;
  const counts = new Array<number>(bins).fill(0);
  for (const v of sorted) counts[Math.min(bins - 1, Math.floor((v - low) / width))] += 1;
  return counts.map((postings, i) => ({
    from: roundAmount(low + i * width, period),
    to: roundAmount(i === bins - 1 ? high : low + (i + 1) * width, period),
    postings,
  }));
}

export type SalaryShape = 'complete' | 'minimum_only' | 'maximum_only';

/** Classifies one stated salary, or says why it cannot be used. */
export function classifySalary(salary: { min: number | null; max: number | null } | null):
  | { usable: true; shape: SalaryShape }
  | { usable: false; reason: ExclusionReason } {
  if (!salary) return { usable: false, reason: 'no_salary_stated' };
  const valid = (v: number | null) => v === null || (typeof v === 'number' && Number.isFinite(v) && v > 0);
  if (!valid(salary.min) || !valid(salary.max) || (salary.min === null && salary.max === null)) {
    return { usable: false, reason: 'invalid_amount' };
  }
  if (salary.min !== null && salary.max !== null) {
    if (salary.min > salary.max) return { usable: false, reason: 'invalid_amount' };
    if (salary.max > salary.min * MAX_RANGE_RATIO) return { usable: false, reason: 'implausible_range' };
    return { usable: true, shape: 'complete' };
  }
  return { usable: true, shape: salary.min !== null ? 'minimum_only' : 'maximum_only' };
}

const PERIOD_ORDER: SalaryPeriod[] = ['YEAR', 'MONTH', 'WEEK', 'DAY', 'HOUR'];

interface ScannedPosting {
  sourceId: string;
  country: string;
  remote: boolean | null;
  postedAt: Date;
  firstSeenAt: Date;
  lastSeenAt: Date;
  salary: { min: number | null; max: number | null; currency: string; period: SalaryPeriod } | null;
}

export const SALARY_METHOD = [
  'Each distinct stored posting counts once; postings without a publication date are left out.',
  'Salaries are grouped by country, currency and pay period. Groups are never combined and amounts are never converted.',
  `Complete ranges are summarised by the median of their minimums, of their maximums and of their midpoints ((min + max) / 2). Quartiles use linear interpolation (type 7).`,
  'Postings that state only a minimum ("from") or only a maximum ("up to") are summarised on their own and never treated as ranges.',
  `A median needs ${SALARY_MINIMUMS.forMedian} complete ranges in the group; quartiles and the distribution need ${SALARY_MINIMUMS.forDistribution}.`,
  `A range whose maximum is more than ${MAX_RANGE_RATIO} times its minimum, a missing country, and missing or non-positive amounts are excluded and counted.`,
];

class MarketSalaryService {
  async insights(query: SalaryQuery): Promise<SalaryInsights> {
    const isSynthetic = query.dataset === 'synthetic_fixture';
    const caveats = [
      'These are salaries advertised in the postings SkillBridge holds, not what people are actually paid, and not the whole job market.',
      'Postings that state a salary may differ from those that do not.',
      'Each group is one country, one currency and one pay period. Compare groups with care: they are not converted to a common unit.',
    ];
    if (isSynthetic) caveats.unshift('SYNTHETIC TEST DATA: these salaries are generated and describe no real jobs.');

    const empty = (status: SalaryStatus, reasons: SalaryReason[]): SalaryInsights => ({
      dataset: query.dataset,
      isSynthetic,
      status,
      reasons,
      query,
      totals: {
        postingsConsidered: 0,
        postingsWithUsableSalary: 0,
        outsideCurrencyOrPeriodFilter: 0,
        undatedExcluded: 0,
        excluded: { no_salary_stated: 0, country_not_stated: 0, implausible_range: 0, invalid_amount: 0 },
        scanLimitReached: false,
      },
      groups: [],
      available: { currencies: [], periods: [], countries: [] },
      method: SALARY_METHOD,
      minimums: SALARY_MINIMUMS,
      caveats,
    });

    // No licensed source: there is nothing real to summarise, and nothing is estimated instead
    if (!listMarketSources().some(s => s.dataset === query.dataset)) return empty('data_unavailable', ['no_registered_source']);

    const base: Record<string, unknown> = { dataset: query.dataset };
    if (query.country) base.country = query.country;
    if (query.skill) base.skills = query.skill;
    const [ty, tm] = query.to.split('-').map(Number);
    const dated = { ...base, postedAt: { $gte: new Date(`${query.from}-01T00:00:00.000Z`), $lt: new Date(Date.UTC(ty, tm, 1)) } };

    const [scanned, undatedExcluded] = await Promise.all([
      MarketPosting.find(dated)
        .select('sourceId country remote postedAt firstSeenAt lastSeenAt salary')
        .sort({ postedAt: 1, _id: 1 })
        .limit(MAX_POSTINGS_SCANNED + 1)
        .lean<ScannedPosting[]>(),
      MarketPosting.countDocuments({ ...base, postedAt: null }),
    ]);
    const scanLimitReached = scanned.length > MAX_POSTINGS_SCANNED;
    const postings = scanLimitReached ? scanned.slice(0, MAX_POSTINGS_SCANNED) : scanned;

    const result = empty('insufficient_data', []);
    result.totals.postingsConsidered = postings.length;
    result.totals.undatedExcluded = undatedExcluded;
    result.totals.scanLimitReached = scanLimitReached;

    const currencies = new Set<string>();
    const periods = new Set<SalaryPeriod>();
    const countries = new Set<string>();
    const grouped = new Map<string, Array<ScannedPosting & { shape: SalaryShape }>>();

    for (const p of postings) {
      const verdict = classifySalary(p.salary);
      if (!verdict.usable) {
        result.totals.excluded[verdict.reason] += 1;
        continue;
      }
      if (!p.country) {
        result.totals.excluded.country_not_stated += 1;
        continue;
      }
      const salary = p.salary!;
      currencies.add(salary.currency);
      periods.add(salary.period);
      countries.add(p.country);
      if ((query.currency && salary.currency !== query.currency) || (query.period && salary.period !== query.period)) {
        result.totals.outsideCurrencyOrPeriodFilter += 1;
        continue;
      }
      const key = `${p.country}|${salary.currency}|${salary.period}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push({ ...p, shape: verdict.shape });
    }

    result.available = {
      currencies: [...currencies].sort(),
      periods: PERIOD_ORDER.filter(p => periods.has(p)),
      countries: [...countries].sort(),
    };
    result.groups = [...grouped.entries()].map(([key, members]) => this.summarise(key, members));
    result.groups.sort((a, b) => b.postings - a.postings || a.key.localeCompare(b.key));
    result.totals.postingsWithUsableSalary = result.groups.reduce((s, g) => s + g.postings, 0);

    if (postings.length === 0) result.reasons = ['no_records'];
    else if (result.groups.length === 0) result.reasons = ['no_salary_records'];
    else if (!result.groups.some(g => g.sufficient)) result.reasons = ['too_few_complete_ranges'];
    result.status = result.reasons.length === 0 ? 'available' : 'insufficient_data';
    return result;
  }

  private summarise(key: string, members: Array<ScannedPosting & { shape: SalaryShape }>): SalaryGroup {
    const [country, currency, period] = key.split('|') as [string, string, SalaryPeriod];
    const complete = members.filter(m => m.shape === 'complete');
    const minOnly = members.filter(m => m.shape === 'minimum_only').map(m => m.salary!.min!);
    const maxOnly = members.filter(m => m.shape === 'maximum_only').map(m => m.salary!.max!);
    const round = (v: number) => roundAmount(v, period);

    const enoughForMedian = complete.length >= SALARY_MINIMUMS.forMedian;
    const enoughForDistribution = complete.length >= SALARY_MINIMUMS.forDistribution;
    const midpoints = complete.map(m => (m.salary!.min! + m.salary!.max!) / 2).sort((a, b) => a - b);

    const bySource = new Map<string, number>();
    for (const m of members) bySource.set(m.sourceId, (bySource.get(m.sourceId) ?? 0) + 1);
    // reduce rather than Math.min(...list): a group can hold tens of thousands of postings
    const extreme = (pick: (m: ScannedPosting) => Date, which: 'min' | 'max') =>
      new Date(members.reduce((acc, m) => (which === 'min' ? Math.min : Math.max)(acc, new Date(pick(m)).getTime()), which === 'min' ? Infinity : -Infinity)).toISOString();

    return {
      key,
      country,
      currency,
      period,
      postings: members.length,
      completeRanges: {
        count: complete.length,
        lower: enoughForMedian ? round(median(complete.map(m => m.salary!.min!))) : null,
        upper: enoughForMedian ? round(median(complete.map(m => m.salary!.max!))) : null,
        midpoint: enoughForMedian ? round(quantile(midpoints, 0.5)) : null,
        midpointQuartiles: enoughForDistribution
          ? { p25: round(quantile(midpoints, 0.25)), median: round(quantile(midpoints, 0.5)), p75: round(quantile(midpoints, 0.75)) }
          : null,
        distribution: enoughForDistribution ? histogram(midpoints, HISTOGRAM_BINS, period) : [],
      },
      minimumOnly: {
        count: minOnly.length,
        medianMinimum: minOnly.length >= SALARY_MINIMUMS.forOneBoundMedian ? round(median(minOnly)) : null,
      },
      maximumOnly: {
        count: maxOnly.length,
        medianMaximum: maxOnly.length >= SALARY_MINIMUMS.forOneBoundMedian ? round(median(maxOnly)) : null,
      },
      sufficient: enoughForMedian,
      reasons: enoughForMedian ? [] : ['too_few_complete_ranges'],
      remotePostings: members.filter(m => m.remote === true).length,
      sources: [...bySource.entries()]
        .map(([id, count]) => {
          const meta = getMarketSource(id);
          return {
            id,
            name: meta?.name ?? id,
            licence: meta?.licence ?? 'unknown (source no longer registered)',
            url: meta?.url ?? '',
            attribution: meta?.attribution ?? '',
            postings: count,
          };
        })
        .sort((a, b) => b.postings - a.postings),
      collection: {
        firstRetrievedAt: extreme(m => m.firstSeenAt, 'min'),
        latestRetrievedAt: extreme(m => m.lastSeenAt, 'max'),
      },
      postedBetween: {
        earliest: extreme(m => m.postedAt, 'min'),
        latest: extreme(m => m.postedAt, 'max'),
      },
    };
  }
}

export default new MarketSalaryService();
