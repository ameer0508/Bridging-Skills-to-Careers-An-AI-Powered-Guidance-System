/**
 * How old a job listing is, said truthfully (X7).
 *
 * Age comes only from the publication date the provider gave. A listing without one is
 * "undated", never assumed to be new. Built-in sample listings carry dates generated for the
 * demonstration, so they are reported as samples and given no age at all. The thresholds are a
 * stated policy, not a measure of whether a vacancy is still open: only the employer knows that.
 */
export const LISTING_FRESHNESS_POLICY = {
  /** Up to this many days since publication: new. */
  newWithinDays: 7,
  /** Up to this many days: recent. Beyond it: old. */
  recentWithinDays: 30
} as const;

export type ListingFreshnessStatus = 'new' | 'recent' | 'old' | 'undated' | 'sample';

export interface ListingFreshness {
  status: ListingFreshnessStatus;
  /** Whole days since publication; null for undated and sample listings. */
  ageDays: number | null;
  label: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function listingFreshness(listing: { postedAt?: string | Date | null; isSample?: boolean }, now: Date = new Date()): ListingFreshness {
  if (listing.isSample) {
    return { status: 'sample', ageDays: null, label: 'Sample listing: its date is part of the demonstration, not a real posting date' };
  }
  const posted = listing.postedAt ? new Date(listing.postedAt) : null;
  if (!posted || Number.isNaN(posted.getTime())) {
    return { status: 'undated', ageDays: null, label: 'No posting date given by the source' };
  }
  // A date in the future is a source error; it is treated as published today, not as "newer than new"
  const ageDays = Math.max(0, Math.floor((now.getTime() - posted.getTime()) / DAY_MS));
  const status: ListingFreshnessStatus =
    ageDays <= LISTING_FRESHNESS_POLICY.newWithinDays ? 'new' : ageDays <= LISTING_FRESHNESS_POLICY.recentWithinDays ? 'recent' : 'old';
  const when = ageDays === 0 ? 'today' : ageDays === 1 ? '1 day ago' : `${ageDays} days ago`;
  return { status, ageDays, label: status === 'old' ? `Posted ${when}; it may no longer be open` : `Posted ${when}` };
}

/** One key for the same role re-posted by the same employer in the same place, whatever the source. */
export function repostKey(listing: { title?: string | null; company?: string | null; location?: string | null }): string {
  return [listing.title, listing.company, listing.location].map(v => (v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()).join('|');
}

/**
 * Counts outbound provider searches per UTC day so a live provider's quota is never exceeded.
 * Cached results and built-in samples do not count. In memory: a restart resets the count, which
 * can only make the service more cautious about nothing, so the cap is kept well below any quota.
 */
export class ProviderDailyQuota {
  private day = '';
  private used = 0;

  constructor(private readonly limit: number) {}

  private roll(now: Date): void {
    const today = now.toISOString().slice(0, 10);
    if (today !== this.day) {
      this.day = today;
      this.used = 0;
    }
  }

  /** Takes one call from today's allowance; false when none is left. */
  public take(now: Date = new Date()): boolean {
    this.roll(now);
    if (this.used >= this.limit) return false;
    this.used++;
    return true;
  }

  public status(now: Date = new Date()): { limit: number; used: number; remaining: number; resetsAt: string } {
    this.roll(now);
    const next = new Date(`${this.day}T00:00:00.000Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    return { limit: this.limit, used: this.used, remaining: Math.max(0, this.limit - this.used), resetsAt: next.toISOString() };
  }
}

export function providerDailyLimit(raw: string | undefined = process.env.JOB_PROVIDER_DAILY_QUOTA): number {
  const value = Number(raw);
  // Default 50 searches a day; never unlimited
  return Number.isInteger(value) && value >= 0 && value <= 10000 ? value : 50;
}
