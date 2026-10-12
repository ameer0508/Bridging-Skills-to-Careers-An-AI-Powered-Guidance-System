import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import OpportunityService from '../services/OpportunityService.js';
import SavedOpportunity from '../models/SavedOpportunity.js';
import { LISTING_FRESHNESS_POLICY, listingFreshness, providerDailyLimit, ProviderDailyQuota, repostKey } from '../services/opportunities/freshness.js';
import type { CanonicalOpportunity, OpportunityProvider } from '../services/opportunities/OpportunityProvider.js';
import { JOB_SEARCHES_PER_MINUTE, jobSearchLimit } from '../routes/opportunities.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * X7: truthful listing freshness, duplicates across sources and repeated saves, the per-user
 * search limit, the provider's daily allowance, and the unavailable states. No real provider is
 * contacted: the "live" provider here is an in-process stand-in.
 */

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-10-12T12:00:00.000Z');
const daysAgo = (n: number, from = Date.now()) => new Date(from - n * DAY).toISOString();

const listing = (overrides: Partial<CanonicalOpportunity>): CanonicalOpportunity => ({
  externalId: 'x',
  provider: 'Stand-in Jobs',
  title: 'Backend Developer',
  company: 'Example Ltd',
  description: 'Build services with Node.js and SQL.',
  location: 'Pune, India',
  remote: false,
  employmentType: 'FULLTIME',
  salary: null,
  postedAt: null,
  applicationUrl: 'https://example.com/apply',
  sourceUrl: 'https://example.com/job',
  skills: ['Node.js', 'SQL'],
  fetchedAt: new Date().toISOString(),
  ...overrides
});

/** A provider that answers from memory and counts how often it was asked. */
class StandInProvider implements OpportunityProvider {
  name = 'Stand-in Jobs';
  calls = 0;
  fail = false;
  constructor(private listings: CanonicalOpportunity[]) {}
  async search(): Promise<CanonicalOpportunity[]> {
    this.calls++;
    if (this.fail) throw new Error('upstream timed out');
    return this.listings;
  }
  async getById(externalId: string): Promise<CanonicalOpportunity | null> {
    return this.listings.find(l => l.externalId === externalId) ?? null;
  }
  async healthCheck() {
    return { status: 'UP' as const, provider: this.name };
  }
}

export async function runJobFreshnessTests() {
  console.log('🧪 Running Job Freshness, De-duplication and Rate Limit (X7) Tests...');

  // === Freshness ================================================================================
  const at = (n: number) => listingFreshness({ postedAt: daysAgo(n, now.getTime()) }, now);
  assert.deepEqual(at(0), { status: 'new', ageDays: 0, label: 'Posted today' });
  assert.deepEqual(at(1), { status: 'new', ageDays: 1, label: 'Posted 1 day ago' });
  assert.equal(at(LISTING_FRESHNESS_POLICY.newWithinDays).status, 'new');
  assert.equal(at(LISTING_FRESHNESS_POLICY.newWithinDays + 1).status, 'recent');
  assert.equal(at(LISTING_FRESHNESS_POLICY.recentWithinDays).status, 'recent');
  assert.deepEqual(at(LISTING_FRESHNESS_POLICY.recentWithinDays + 1), { status: 'old', ageDays: 31, label: 'Posted 31 days ago; it may no longer be open' });
  for (const undated of [null, undefined, '', 'not a date']) {
    assert.deepEqual(listingFreshness({ postedAt: undated }, now), { status: 'undated', ageDays: null, label: 'No posting date given by the source' }, `"${undated}" is undated, never assumed new`);
  }
  assert.deepEqual([listingFreshness({ postedAt: daysAgo(-5, now.getTime()) }, now).status, listingFreshness({ postedAt: daysAgo(-5, now.getTime()) }, now).ageDays], ['new', 0], 'a date in the future is treated as today');
  const sample = listingFreshness({ postedAt: daysAgo(2, now.getTime()), isSample: true }, now);
  assert.deepEqual([sample.status, sample.ageDays], ['sample', null], 'a sample listing has no real age, whatever date it carries');
  assert.match(sample.label, /not a real posting date/);

  assert.equal(repostKey({ title: 'Backend Developer', company: 'Example Ltd.', location: 'Pune, India' }), repostKey({ title: ' backend  developer ', company: 'EXAMPLE LTD', location: 'Pune - India' }));
  assert.notEqual(repostKey({ title: 'Backend Developer', company: 'Example Ltd', location: 'Pune' }), repostKey({ title: 'Backend Developer', company: 'Example Ltd', location: 'Mumbai' }), 'the same title in another city is another job');

  // === Allowances ================================================================================
  const quota = new ProviderDailyQuota(2);
  const d1 = new Date('2026-10-12T23:59:00Z');
  assert.deepEqual([quota.take(d1), quota.take(d1), quota.take(d1)], [true, true, false], 'the third search of the day is refused');
  assert.deepEqual(quota.status(d1), { limit: 2, used: 2, remaining: 0, resetsAt: '2026-10-13T00:00:00.000Z' });
  assert.equal(quota.take(new Date('2026-10-13T00:00:01Z')), true, 'a new UTC day brings a new allowance');
  assert.equal(new ProviderDailyQuota(0).take(), false, 'an allowance of zero permits nothing');
  assert.deepEqual([providerDailyLimit(undefined), providerDailyLimit('5'), providerDailyLimit('0'), providerDailyLimit('-1'), providerDailyLimit('many'), providerDailyLimit('1e9')], [50, 5, 0, 50, 50, 50], 'never unlimited');
  assert.deepEqual([jobSearchLimit(undefined), jobSearchLimit('10'), jobSearchLimit('0'), jobSearchLimit('9999'), jobSearchLimit('x')], [30, 10, 30, 30, 30]);
  assert.equal(JOB_SEARCHES_PER_MINUTE, 30, 'the suites run against the real default');
  console.log('  ✓ Rules: age only from the source\'s date; undated and sample listings say so; daily allowance and per-minute limit can be lowered but never removed');

  await ensureFakeAiService();
  const h = await startHttpHarness();
  let restore: (() => void) | null = null;
  try {
    const alice = await h.registerUser('alice');
    const bob = await h.registerUser('bob');
    const search = (token: string, query = '') => h.api('GET', `/opportunities${query}`, { token });

    // === Built-in samples are never given an age ==================================================
    const samples = (await search(alice.token, '?search=Developer')).body.data;
    assert.equal(samples.meta.source, 'sample');
    assert.ok(samples.opportunities.length > 0 && samples.opportunities.every((o: any) => o.isSample && o.freshness.status === 'sample' && o.freshness.ageDays === null));
    assert.equal(samples.meta.freshness.sample, samples.opportunities.length);
    assert.deepEqual([samples.meta.providerQuota, samples.meta.unavailableReason, samples.meta.stale], [null, null, false], 'samples use no provider allowance');

    // === A live source: dates, duplicates, cache and allowance ====================================
    const provider = new StandInProvider([
      listing({ externalId: 'a', title: 'Backend Developer', postedAt: daysAgo(0) }),
      listing({ externalId: 'b', title: 'Data Engineer', postedAt: daysAgo(20) }),
      listing({ externalId: 'c', title: 'Platform Engineer', postedAt: daysAgo(90) }),
      listing({ externalId: 'd', title: 'QA Engineer', postedAt: null }),
      listing({ externalId: 'a', title: 'Backend Developer', postedAt: daysAgo(0) }), // the same record twice
      listing({ externalId: 'z9', provider: 'Another Board', title: 'backend developer', company: 'EXAMPLE LTD', postedAt: daysAgo(3) }) // the same job from a second source
    ]);
    restore = OpportunityService.useProvider(provider, 2);

    const live = (await search(alice.token, '?search=engineer')).body.data;
    assert.equal(live.meta.source, 'live');
    assert.deepEqual(live.opportunities.map((o: any) => [o.externalId, o.freshness.status, o.freshness.ageDays]).sort(), [['a', 'new', 0], ['b', 'recent', 20], ['c', 'old', 90], ['d', 'undated', null]]);
    assert.equal(live.meta.duplicatesRemoved, 2, 'the repeated record and the same job from a second source are each shown once');
    assert.deepEqual(live.meta.freshness, { new: 1, recent: 1, old: 1, undated: 1, sample: 0 });
    assert.ok(live.opportunities.every((o: any) => o.isSample === false));
    assert.deepEqual([live.meta.fromCache, live.meta.stale, live.meta.providerQuota.used, live.meta.providerQuota.remaining], [false, false, 1, 1]);
    assert.ok(live.meta.resultAgeSeconds <= 2);

    // The same search again is answered from the cache and costs nothing
    const again = (await search(bob.token, '?search=engineer')).body.data;
    assert.deepEqual([again.meta.fromCache, again.meta.providerQuota.used, provider.calls], [true, 1, 1], 'a cached search makes no request, also for another user');
    // Filtering by date hides the undated one and says so
    const recent = (await search(alice.token, '?search=engineer&datePosted=month')).body.data;
    assert.deepEqual([recent.meta.excludedWithoutDate, recent.opportunities.some((o: any) => o.freshness.status === 'undated' || o.freshness.status === 'old')], [1, false]);

    // A second distinct search uses the last allowance; a third is refused without a request
    assert.equal((await search(alice.token, '?search=analyst')).body.data.meta.providerQuota.remaining, 0);
    assert.equal(provider.calls, 2);
    const refused = (await search(alice.token, '?search=designer')).body.data;
    assert.deepEqual([refused.opportunities, refused.meta.source, refused.meta.unavailableReason, provider.calls], [[], 'unavailable', 'quota_exhausted', 2], 'no request is made once today\'s allowance is used');
    assert.match(refused.providerHealth.message, /limit of 2 job searches has been reached/);
    assert.ok(!JSON.stringify(refused).includes('"isSample":true'), 'sample listings are not slipped in when the live source is exhausted');

    // An earlier search whose cache has aged is still shown, marked as stale, rather than nothing
    for (const entry of (OpportunityService as unknown as { cache: Map<string, { timestamp: number }> }).cache.values()) entry.timestamp -= 20 * 60 * 1000;
    const stale = (await search(alice.token, '?search=engineer')).body.data;
    assert.deepEqual([stale.meta.stale, stale.meta.fromCache, stale.opportunities.length, provider.calls], [true, true, 4, 2]);
    assert.ok(stale.meta.resultAgeSeconds >= 20 * 60, 'the age of what is shown is stated');

    // A failing provider gives an explicit unavailable state
    restore();
    const failing = new StandInProvider([]);
    failing.fail = true;
    restore = OpportunityService.useProvider(failing, 5);
    const down = (await search(alice.token, '?search=engineer')).body.data;
    assert.deepEqual([down.opportunities, down.meta.source, down.meta.unavailableReason, down.providerHealth.status], [[], 'unavailable', 'provider_error', 'DOWN']);
    assert.equal(down.meta.total, 0);
    restore();
    restore = null;
    console.log('  ✓ Live source: per-listing age, duplicates across sources removed, cache costs nothing, allowance enforced, stale results marked, failures and exhaustion are explicit and never replaced by samples');

    // === Tracking the same job twice =================================================================
    const body = (overrides: Record<string, unknown> = {}) => ({ externalId: 'a', provider: 'Stand-in Jobs', title: 'Backend Developer', company: 'Example Ltd', location: 'Pune, India', applicationUrl: 'https://example.com/apply', postedAt: daysAgo(0), ...overrides });
    const save = (token: string, json: unknown) => h.api('POST', '/opportunities/save', { token, json });
    const first = await save(alice.token, body());
    assert.deepEqual([first.status, first.body.data.alreadyTracked], [201, false]);
    assert.equal((await save(alice.token, body())).status, 201, 'saving the same listing again updates it');
    assert.equal(await SavedOpportunity.countDocuments({ userId: alice.userId }), 1, 'and creates no second record');
    const twin = await save(alice.token, body({ externalId: 'z9', provider: 'Another Board', title: 'backend developer', company: 'EXAMPLE LTD' }));
    assert.deepEqual([twin.status, twin.body.data.alreadyTracked, twin.body.data.savedOpportunity.externalId], [200, true, 'a'], 'the same job from another source is recognised and the existing record returned');
    assert.match(twin.body.data.message, /already tracking this job/);
    assert.equal(await SavedOpportunity.countDocuments({ userId: alice.userId }), 1);
    assert.equal((await save(alice.token, body({ externalId: 'e', location: 'Mumbai, India' }))).status, 201, 'the same title elsewhere is a different job');
    assert.equal((await save(bob.token, body())).status, 201, "another user's tracking is their own");
    assert.deepEqual([await SavedOpportunity.countDocuments({ userId: alice.userId }), await SavedOpportunity.countDocuments({ userId: bob.userId })], [2, 1]);
    // A tracked sample stays marked as a sample
    const sampleListing = samples.opportunities[0];
    const savedSample = await save(alice.token, { externalId: sampleListing.externalId, provider: sampleListing.provider, title: sampleListing.title, company: sampleListing.company, location: sampleListing.location, applicationUrl: sampleListing.applicationUrl, isSample: true });
    assert.equal(savedSample.body.data.savedOpportunity.isSample, true);
    console.log('  ✓ Tracking: a repeated save updates, the same job from another source is not added twice, different jobs and other users are unaffected, samples stay labelled');

    // === Per-user search limit ========================================================================
    const carol = await h.registerUser('carol');
    const statuses: number[] = [];
    for (let i = 0; i < JOB_SEARCHES_PER_MINUTE + 1; i++) statuses.push((await search(carol.token, '?search=Developer')).status);
    assert.deepEqual([statuses.slice(0, -1).every(s => s === 200), statuses.at(-1)], [true, 429], `search ${JOB_SEARCHES_PER_MINUTE + 1} within a minute is refused`);
    const limited = await search(carol.token, '?search=Developer');
    assert.deepEqual([limited.status, limited.body.error.code], [429, 'JOB_SEARCH_RATE_LIMITED']);
    assert.match(limited.body.error.message, /30 times a minute/);
    assert.equal((await search(bob.token, '?search=Developer')).status, 200, 'the limit is per user');
    assert.equal((await h.api('GET', '/opportunities/saved', { token: carol.token })).status, 200, 'tracked jobs stay reachable while searching is limited');
    assert.equal((await h.api('GET', '/opportunities')).status, 401);
    console.log(`  ✓ Limit: ${JOB_SEARCHES_PER_MINUTE} searches a minute per user, with a clear message; other users and saved jobs unaffected`);

    console.log('✅ Job Freshness, De-duplication and Rate Limit (X7) Tests Passed\n');
  } finally {
    if (restore) restore();
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runJobFreshnessTests();
    } catch (err) {
      console.error('❌ Job Freshness Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
