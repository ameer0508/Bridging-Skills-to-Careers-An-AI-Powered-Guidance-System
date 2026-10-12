/**
 * Reads when a period written on a resume ended, e.g. "2022 - 2024", "Jan 2021 - Present",
 * "(06/2020 to 03/2022)". Used to date skill evidence. Anything that cannot be read with
 * certainty returns null: an unknown date is reported as unknown, never guessed.
 */

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11
};

export interface PeriodEnd {
  /** Last day the period is known to cover; null when it could not be determined. */
  end: Date | null;
  /** True when the period is written as still running ("Present", "Current"). */
  ongoing: boolean;
}

const lastDayOfMonth = (year: number, month: number): Date => new Date(Date.UTC(year, month + 1, 0));

export function parsePeriodEnd(text: string | null | undefined, now: Date = new Date()): PeriodEnd {
  const value = (text || '').trim();
  if (!value) return { end: null, ongoing: false };

  if (/\b(present|current|currently|now|ongoing|till date|to date)\b/i.test(value)) {
    return { end: now, ongoing: true };
  }

  // The last date written in the text is the end of the period
  const pattern = /(?:\b(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\.?\s+|\b(0?[1-9]|1[0-2])\s*[/.-]\s*)?\b((?:19|20)\d{2})\b/gi;
  let match: RegExpExecArray | null;
  let last: RegExpExecArray | null = null;
  while ((match = pattern.exec(value))) last = match;
  if (!last) return { end: null, ongoing: false };

  const year = Number(last[3]);
  const month = last[1] ? MONTHS[last[1].toLowerCase().slice(0, last[1].toLowerCase().startsWith('sept') ? 4 : 3)] : last[2] ? Number(last[2]) - 1 : 11;
  const end = lastDayOfMonth(year, month);
  if (year > now.getUTCFullYear() + 1) return { end: null, ongoing: false }; // not a plausible date
  return { end: end.getTime() > now.getTime() ? now : end, ongoing: false };
}

/** Whole months between two dates, never negative. */
export const monthsBetween = (earlier: Date, later: Date): number =>
  Math.max(0, (later.getUTCFullYear() - earlier.getUTCFullYear()) * 12 + (later.getUTCMonth() - earlier.getUTCMonth()));
