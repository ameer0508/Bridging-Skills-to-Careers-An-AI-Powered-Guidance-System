/**
 * Employer diversity behind a market figure. A count, salary or trend drawn mostly from one
 * employer describes that employer, not a role, and first-party submissions make that easy to
 * produce. Every market figure therefore needs postings from at least EMPLOYER_MINIMUMS.distinct
 * employers, none of which may supply more than EMPLOYER_MINIMUMS.maxShare of them.
 */
export const EMPLOYER_MINIMUMS = {
  distinct: 5,
  maxShare: 0.5,
} as const;

export type EmployerDiversityReason = 'too_few_employers' | 'one_employer_dominates';

export interface EmployerDiversity {
  distinctEmployers: number;
  /** Share of the postings (0-1) held by the largest employer; null with no named employer. */
  largestEmployerShare: number | null;
  /** Postings with no employer name; they never count as an employer of their own. */
  unnamed: number;
  sufficient: boolean;
  reasons: EmployerDiversityReason[];
}

export const employerKey = (company: string | null | undefined) => (company ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

/** From per-employer posting counts (keys already normalised; '' = unnamed). */
export function employerDiversity(counts: Map<string, number>): EmployerDiversity {
  const unnamed = counts.get('') ?? 0;
  const named = [...counts.entries()].filter(([key]) => key !== '');
  const total = [...counts.values()].reduce((s, n) => s + n, 0);
  const largest = named.reduce((max, [, n]) => Math.max(max, n), 0);
  const largestEmployerShare = total > 0 && named.length > 0 ? Math.round((largest / total) * 1000) / 1000 : null;
  const reasons: EmployerDiversityReason[] = [];
  if (named.length < EMPLOYER_MINIMUMS.distinct) reasons.push('too_few_employers');
  if (largestEmployerShare !== null && largestEmployerShare > EMPLOYER_MINIMUMS.maxShare) reasons.push('one_employer_dominates');
  return { distinctEmployers: named.length, largestEmployerShare, unnamed, sufficient: reasons.length === 0, reasons };
}

export const countEmployers = (companies: Array<string | null | undefined>) => {
  const counts = new Map<string, number>();
  for (const c of companies) counts.set(employerKey(c), (counts.get(employerKey(c)) ?? 0) + 1);
  return counts;
};

/** MongoDB pipeline stage grouping matched postings by normalised employer name. */
export const groupByEmployerStage = { $group: { _id: { $toLower: { $trim: { input: { $ifNull: ['$company', ''] } } } }, postings: { $sum: 1 } } };
