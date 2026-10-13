/**
 * Live job listings from OnJob.io's public jobs feed, shown in the Career Lab comparison (A1).
 *
 * What the feed licence grants (https://onjob.io/for-job-boards/, read 2026-10-13): "crawl,
 * cache and republish every listing at no cost", re-crawled daily, each listing linking back to
 * its OnJob.io url to apply. That is all this module does:
 *  - listings are held in memory only and replaced on every refresh, so a closed listing goes
 *    with the next refresh; nothing is written to the database and no history is kept;
 *  - no count, salary figure, skill frequency or trend is derived from the feed (those uses are
 *    not granted; see docs/MARKET_DATA_SOURCES.md);
 *  - each listing is shown with its own OnJob.io link, title, employer, place and date.
 *
 * The feed is third-party content: every field is validated, stripped of markup and control
 * characters and cut to length, and only https links on onjob.io are kept. Descriptions are not
 * read at all. Off unless the operator enables it under the zero-cost policy (provider
 * 'onjob_feed'); a refused call never reaches the network.
 */
import { z } from 'zod';
import { guardedFetch, checkLiveCall } from '../../config/costPolicy.js';
import logger from '../../config/logger.js';

export const ONJOB_FEED_URL = 'https://onjob.io/feeds/jobs.json';
export const ONJOB_SOURCE = {
  name: 'OnJob.io',
  url: 'https://onjob.io',
  terms: 'https://onjob.io/for-job-boards/',
  licence: 'OnJob.io jobs feed: free to crawl, cache and republish; each listing links to OnJob.io to apply',
} as const;

const MAX_PAGES = 5;
const MAX_BYTES = 25 * 1024 * 1024; // the feed keeps each page under 25 MiB
const TIMEOUT_MS = 20_000;
/** Listings are not served from a fetch older than this: the feed asks for a daily re-crawl. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const SHOWN_PER_CAREER = 5;

type EnvLike = Record<string, string | undefined>;

const hours = (env: EnvLike) => {
  const value = Number(env.ONJOB_REFRESH_HOURS);
  return Number.isFinite(value) ? Math.min(24, Math.max(1, value)) : 6;
};
const dailyLimit = (env: EnvLike) => {
  const value = Number(env.ONJOB_MAX_FETCHES_PER_DAY);
  return Number.isFinite(value) ? Math.min(24, Math.max(1, Math.floor(value))) : 8;
};

export interface LiveListing {
  title: string;
  employer: string;
  location: string;
  postedAt: string | null;
  ageDays: number | null;
  url: string;
}

export type LiveListingsState = 'listings' | 'none' | 'off' | 'unavailable';

export interface CareerLiveListings {
  state: LiveListingsState;
  detail: string;
  /** At most SHOWN_PER_CAREER, newest first. Not a count of anything. */
  listings: LiveListing[];
  source: typeof ONJOB_SOURCE;
  scope: string;
  matchingRule: string | null;
  retrievedAt: string | null;
}

export const LIVE_LISTINGS_SCOPE = 'Live listings on OnJob.io in India. One job board, not the Indian job market; how many appear says nothing about demand.';

// Titles that count as each SkillBridge career. Word boundaries, so "Engineer" alone never matches.
const TITLE_RULES: Record<string, { pattern: RegExp; rule: string }> = {
  'Software Engineer': { pattern: /\bsoftware (engineer|developer)\b/i, rule: 'Title contains "software engineer" or "software developer"' },
  'Frontend Engineer': { pattern: /\bfront[- ]?end (engineer|developer)\b/i, rule: 'Title contains "frontend engineer" or "frontend developer"' },
  'Backend Engineer': { pattern: /\bback[- ]?end (engineer|developer)\b|\bsoftware engineer\s*[–-]\s*back[- ]?end\b/i, rule: 'Title contains "backend engineer" or "backend developer"' },
  'Full Stack Developer': { pattern: /\bfull[- ]?stack (engineer|developer)\b/i, rule: 'Title contains "full stack developer" or "full stack engineer"' },
  'Data Analyst': { pattern: /\bdata analyst\b/i, rule: 'Title contains "data analyst"' },
  'Data Scientist': { pattern: /\bdata scientist\b/i, rule: 'Title contains "data scientist"' },
  'Machine Learning Engineer': { pattern: /\b(machine learning|ml) engineer\b/i, rule: 'Title contains "machine learning engineer" or "ML engineer"' },
  'DevOps Engineer': { pattern: /\bdevops\b|\bsite reliability engineer\b/i, rule: 'Title contains "DevOps" or "site reliability engineer"' },
  'Cloud Engineer': { pattern: /\bcloud (engineer|architect)\b/i, rule: 'Title contains "cloud engineer" or "cloud architect"' },
  'Mobile App Developer': { pattern: /\b(android|ios|mobile|flutter|react native)( app)? (developer|engineer)\b/i, rule: 'Title contains "Android", "iOS", "mobile", "Flutter" or "React Native" developer or engineer' },
  'Cybersecurity Analyst': { pattern: /\b(cyber ?security|security|soc) analyst\b/i, rule: 'Title contains "cybersecurity analyst", "security analyst" or "SOC analyst"' },
  'UI/UX Designer': { pattern: /\b(ui|ux|ui\/ux|ux\/ui|product) designer\b/i, rule: 'Title contains "UI designer", "UX designer", "UI/UX designer" or "product designer"' },
  'Business Analyst': { pattern: /\bbusiness analyst\b/i, rule: 'Title contains "business analyst"' },
  'Product Manager': { pattern: /\bproduct manager\b/i, rule: 'Title contains "product manager"' },
  'QA Automation Engineer': { pattern: /\b(qa|test|automation|quality assurance) (automation )?engineer\b|\bsdet\b/i, rule: 'Title contains "QA engineer", "test engineer", "automation engineer" or "SDET"' },
  'Data Engineer': { pattern: /\bdata engineer\b/i, rule: 'Title contains "data engineer"' },
  'Embedded Systems Engineer': { pattern: /\bembedded (systems? )?(engineer|developer)\b/i, rule: 'Title contains "embedded engineer", "embedded developer" or "embedded systems engineer"' },
  'Digital Marketing Analyst': { pattern: /\bdigital marketing (analyst|executive|specialist)\b/i, rule: 'Title contains "digital marketing" analyst, executive or specialist' },
  'Financial Analyst': { pattern: /\bfinancial analyst\b/i, rule: 'Title contains "financial analyst"' },
  'Health Informatics Specialist': { pattern: /\bhealth(care)? informatics\b/i, rule: 'Title contains "health informatics"' },
};

export const titleRuleFor = (careerTitle: string) => TITLE_RULES[careerTitle] ?? null;

/** Roles that teach a subject are not the job itself ("Business Analyst Trainer"). */
const TEACHING_ROLE = /\b(trainer|training|instructor|faculty|teacher|tutor|lecturer|mentor)\b/i;

// Control characters, zero-width characters and bidirectional overrides, written as escapes
// eslint-disable-next-line no-control-regex
const UNSAFE_CHARACTERS = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g;

/** Plain text from untrusted markup: no tags, no control characters, collapsed, cut to length. */
export function cleanText(raw: unknown, max = 140): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(UNSAFE_CHARACTERS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Only an https link on onjob.io is kept; anything else drops the listing. */
export function onjobUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 600) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || (url.hostname !== 'onjob.io' && url.hostname !== 'www.onjob.io') || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

const jobSchema = z.object({
  id: z.string().min(1).max(200),
  title: z.string().min(1).max(500),
  company: z.string().max(500).nullish(),
  city: z.string().max(200).nullish(),
  state: z.string().max(200).nullish(),
  country: z.string().max(200).nullish(),
  location: z.string().max(500).nullish(),
  url: z.string(),
  datePosted: z.string().max(40).nullish(),
});

interface HeldListing extends LiveListing {
  id: string;
  india: boolean;
  postedMs: number | null;
}

/** "Bengaluru, Karnataka-17, India-101" → "Bengaluru, Karnataka": the feed's numeric suffixes are dropped. */
const placeName = (value: string) => value.replace(/-\d+\b/g, '').trim();

export function parseFeedJob(raw: unknown, now: Date): HeldListing | null {
  const parsed = jobSchema.safeParse(raw);
  if (!parsed.success) return null;
  const job = parsed.data;
  const url = onjobUrl(job.url);
  const title = cleanText(job.title);
  if (!url || !title) return null;
  const country = cleanText(job.country ?? '');
  const location = cleanText(job.location ?? '', 300);
  const india = /\bindia\b/i.test(country) || /\bindia\b/i.test(location);
  const posted = job.datePosted ? Date.parse(job.datePosted) : NaN;
  const postedMs = Number.isFinite(posted) && posted <= now.getTime() + 60_000 && posted > Date.UTC(2015, 0, 1) ? posted : null;
  const place = [cleanText(job.city ?? ''), cleanText(job.state ?? '')].filter(Boolean).map(placeName).join(', ');
  return {
    id: cleanText(job.id, 200),
    title,
    employer: cleanText(job.company ?? '') || 'Employer not named',
    location: place || placeName(location) || 'India',
    postedAt: postedMs === null ? null : new Date(postedMs).toISOString(),
    ageDays: postedMs === null ? null : Math.max(0, Math.floor((now.getTime() - postedMs) / 86_400_000)),
    url,
    india,
    postedMs,
  };
}

/** Reads a response body, refusing more than MAX_BYTES. */
async function readBounded(response: Response): Promise<string> {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BYTES) throw new Error('feed page larger than the 25 MiB limit');
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new Error('feed page larger than the 25 MiB limit');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

export class OnJobLiveListingsService {
  private held: { listings: HeldListing[]; retrievedAt: Date } | null = null;
  private inFlight: Promise<void> | null = null;
  private lastAttempt = 0;
  private lastError: string | null = null;
  private fetchDay = '';
  private fetchesToday = 0;

  constructor(
    private readonly env: () => EnvLike = () => process.env,
    private fetchImpl: typeof fetch = (...args) => fetch(...args),
    private readonly clock: () => Date = () => new Date()
  ) {}

  /** Replaces the network for tests: no test reaches OnJob.io. Returns a function that restores it. */
  useFetch(impl: typeof fetch): () => void {
    const previous = this.fetchImpl;
    this.fetchImpl = impl;
    this.reset();
    return () => {
      this.fetchImpl = previous;
      this.reset();
    };
  }

  /** Whether the zero-cost policy lets the feed be fetched, and why not. */
  policy() {
    return checkLiveCall('onjob_feed', this.env());
  }

  /** Forgets everything held. For tests and for an operator turning the source off. */
  reset() {
    this.held = null;
    this.inFlight = null;
    this.lastAttempt = 0;
    this.lastError = null;
    this.fetchesToday = 0;
  }

  private async fetchAll(now: Date): Promise<HeldListing[]> {
    const listings = new Map<string, HeldListing>();
    let next: string | null = ONJOB_FEED_URL;
    const seen = new Set<string>();
    for (let page = 0; next && page < MAX_PAGES; page += 1) {
      const pageUrl = onjobUrl(next);
      if (!pageUrl || seen.has(pageUrl)) break;
      seen.add(pageUrl);
      const response = await guardedFetch(
        'onjob_feed',
        pageUrl,
        { headers: { Accept: 'application/json', 'User-Agent': 'SkillBridge/1.0 (career guidance; republishes with links back)' }, signal: AbortSignal.timeout(TIMEOUT_MS), redirect: 'error' },
        this.env(),
        this.fetchImpl
      );
      if (!response.ok) throw new Error(`feed answered ${response.status}`);
      const body = JSON.parse(await readBounded(response)) as { jobs?: unknown; next?: unknown };
      if (!Array.isArray(body.jobs)) throw new Error('feed page has no jobs list');
      for (const raw of body.jobs.slice(0, 50_000)) {
        const listing = parseFeedJob(raw, now);
        if (listing && !listings.has(listing.id)) listings.set(listing.id, listing);
      }
      next = typeof body.next === 'string' ? new URL(body.next, ONJOB_FEED_URL).toString() : null;
    }
    return [...listings.values()];
  }

  /** Refreshes the held listings when they are older than the refresh interval, within the daily allowance. */
  private async refresh(): Promise<void> {
    const env = this.env();
    const now = this.clock();
    const due = !this.held || now.getTime() - this.held.retrievedAt.getTime() >= hours(env) * 3_600_000;
    // A failed attempt is not retried for 15 minutes
    if (!due || now.getTime() - this.lastAttempt < 15 * 60_000) return;
    const day = now.toISOString().slice(0, 10);
    if (day !== this.fetchDay) {
      this.fetchDay = day;
      this.fetchesToday = 0;
    }
    if (this.fetchesToday >= dailyLimit(env)) return;
    if (!this.inFlight) {
      this.lastAttempt = now.getTime();
      this.fetchesToday += 1;
      this.inFlight = this.fetchAll(now)
        .then(listings => {
          this.held = { listings, retrievedAt: now };
          this.lastError = null;
        })
        .catch(error => {
          // Only the kind of failure is kept; nothing from the feed is logged
          this.lastError = error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'fetch_failed';
          logger.warn(`OnJob feed refresh failed (${this.lastError})`);
        })
        .finally(() => {
          this.inFlight = null;
        });
    }
    await this.inFlight;
  }

  /** Live listings per career, for careers given by title. Never throws. */
  async forCareers(careers: Array<{ id: string; title: string }>): Promise<Map<string, CareerLiveListings>> {
    const base = { listings: [] as LiveListing[], source: ONJOB_SOURCE, scope: LIVE_LISTINGS_SCOPE };
    const decision = this.policy();
    if (!decision.allowed) {
      this.held = null;
      const off: CareerLiveListings = {
        ...base,
        state: 'off',
        detail: 'Live listings are off. The operator has not enabled the OnJob.io feed under the zero-cost policy.',
        matchingRule: null,
        retrievedAt: null,
      };
      return new Map(careers.map(c => [c.id, { ...off, matchingRule: titleRuleFor(c.title)?.rule ?? null }]));
    }
    await this.refresh();
    const now = this.clock();
    const held = this.held && now.getTime() - this.held.retrievedAt.getTime() < MAX_AGE_MS ? this.held : null;
    return new Map<string, CareerLiveListings>(
      careers.map((career): [string, CareerLiveListings] => {
        const rule = titleRuleFor(career.title);
        if (!held) {
          return [career.id, {
            ...base,
            state: 'unavailable' as const,
            detail: this.lastError === 'timeout' ? 'OnJob.io did not answer in time. Live listings are unavailable.' : 'Live listings could not be loaded from OnJob.io and are unavailable.',
            matchingRule: rule?.rule ?? null,
            retrievedAt: null,
          }];
        }
        if (!rule) {
          return [career.id, { ...base, state: 'none' as const, detail: 'No title rule exists for this career, so no listings are shown.', matchingRule: null, retrievedAt: held.retrievedAt.toISOString() }];
        }
        const matches = held.listings
          .filter(l => l.india && rule.pattern.test(l.title) && !TEACHING_ROLE.test(l.title))
          .sort((a, b) => (b.postedMs ?? 0) - (a.postedMs ?? 0))
          .slice(0, SHOWN_PER_CAREER)
          .map(({ title, employer, location, postedAt, ageDays, url }) => ({ title, employer, location, postedAt, ageDays, url }));
        return [career.id, {
          ...base,
          state: matches.length > 0 ? ('listings' as const) : ('none' as const),
          detail: matches.length > 0 ? 'The newest live listings on OnJob.io whose title matches this career. Apply on OnJob.io.' : 'No live OnJob.io listing in India has a title matching this career right now.',
          listings: matches,
          matchingRule: rule.rule,
          retrievedAt: held.retrievedAt.toISOString(),
        }];
      })
    );
  }
}

export default new OnJobLiveListingsService();
