import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import SavedOpportunity, { ApplicationStatus } from '../models/SavedOpportunity.js';
import { computeOutcomes, conversion, OUTCOME_MIN_SAMPLE } from '../services/applications/ApplicationOutcomeService.js';
import { startHttpHarness, type HttpHarness } from './helpers/httpHarness.js';

/**
 * C6 application outcome analytics: saved is not applied, each stage counts once per application,
 * the cohort is filtered by application date, demo listings are excluded unless asked for, every
 * rate carries its counts and status, and nobody sees anyone else's applications.
 */

const NOW = new Date(Date.UTC(2026, 9, 12));
const day = (iso: string) => new Date(`${iso}T10:00:00Z`);
let seq = 0;

/** A tracked job with the given history; the current status is the last event. */
function job(history: Array<[ApplicationStatus, string]>, extra: { isSample?: boolean; appliedAt?: Date } = {}) {
  const statusHistory = history.map(([status, date]) => ({ status, changedAt: day(date) }));
  return { _id: `job-${++seq}`, status: history[history.length - 1][0], statusHistory, ...extra };
}

export async function runApplicationOutcomeTests() {
  console.log('🧪 Running Application Outcome Analytics (C6) Tests...');

  // === Rates ==================================================================================
  assert.deepEqual(conversion(0, 0), { numerator: 0, denominator: 0, rate: null, status: 'no_observations' });
  assert.deepEqual(conversion(0, 6), { numerator: 0, denominator: 6, rate: 0, status: 'measured' }, 'zero conversions is a measured zero');
  assert.equal(conversion(1, OUTCOME_MIN_SAMPLE - 1).status, 'insufficient_sample');
  console.log('  ✓ Rates: no observations, zero conversions and small samples are three different answers');

  // === Counting rules ===========================================================================
  const empty = computeOutcomes([], {}, NOW);
  assert.equal(empty.funnel.applied, 0);
  assert.equal(empty.rates.appliedToInterview.status, 'no_observations');
  assert.deepEqual(empty.period, { from: '2026-10', to: '2026-10', observedUntil: NOW.toISOString() });

  const savedOnly = computeOutcomes([job([['saved', '2026-09-01']]), job([['saved', '2026-09-01'], ['withdrawn', '2026-09-03']])], {}, NOW);
  assert.equal(savedOnly.funnel.applied, 0, 'saving, or withdrawing a saved job, is not applying');
  assert.equal(savedOnly.scope.savedNotApplied, 2);

  const bouncing = job([['saved', '2026-08-01'], ['applied', '2026-08-02'], ['interviewing', '2026-08-10'], ['applied', '2026-08-11'], ['interviewing', '2026-08-15'], ['offer', '2026-08-20']]);
  const repeat = computeOutcomes([bouncing], {}, NOW);
  assert.deepEqual([repeat.funnel.applied, repeat.funnel.reachedInterview, repeat.funnel.reachedOffer], [1, 1, 1], 'repeat transitions count once');
  assert.equal(repeat.dataQuality.repeatedTransitionsIgnored, 2);

  const inferred = computeOutcomes([job([['saved', '2026-07-01'], ['interviewing', '2026-07-09']])], {}, NOW);
  assert.equal(inferred.funnel.applied, 1, 'an interview means an application was made');
  assert.equal(inferred.dataQuality.inferredApplicationDates, 1);
  assert.equal(inferred.period.from, '2026-07');

  const offerDirect = computeOutcomes([job([['applied', '2026-06-01'], ['offer', '2026-06-20']])], {}, NOW);
  assert.equal(offerDirect.rates.appliedToOffer.numerator, 1);
  assert.equal(offerDirect.rates.interviewToOffer.status, 'no_observations', 'no interview recorded, so no interview-to-offer rate');
  assert.equal(offerDirect.dataQuality.offersWithoutRecordedInterview, 1);

  const scrambled = computeOutcomes([job([['interviewing', '2026-05-10'], ['applied', '2026-05-02'], ['saved', '2026-05-01']])], {}, NOW);
  assert.equal(scrambled.dataQuality.historiesOutOfOrder, 1);
  assert.equal(scrambled.funnel.reachedInterview, 1, 'events are read in date order');
  assert.equal(scrambled.dataQuality.milestonesDatedBeforeApplication, 0);

  const early = computeOutcomes([job([['interviewing', '2026-04-01'], ['applied', '2026-04-05']], { appliedAt: day('2026-04-05') })], {}, NOW);
  assert.equal(early.dataQuality.milestonesDatedBeforeApplication, 1);

  const zero = computeOutcomes(Array.from({ length: 6 }, () => job([['applied', '2026-09-02'], ['rejected', '2026-09-20']])), {}, NOW);
  assert.deepEqual(zero.rates.appliedToInterview, { numerator: 0, denominator: 6, rate: 0, status: 'measured' });
  assert.equal(zero.funnel.rejected, 6);
  console.log('  ✓ Counting: saved ≠ applied, repeats once, inferred applications, offers without interviews, out-of-order and early milestones');

  // === Period and demo listings ===================================================================
  const jan = job([['applied', '2026-01-15'], ['interviewing', '2026-04-02']]);
  const mar = job([['applied', '2026-03-03'], ['interviewing', '2026-03-20'], ['offer', '2026-05-01']]);
  const demo = job([['applied', '2026-03-05'], ['offer', '2026-03-25']], { isSample: true });
  const marchOnly = computeOutcomes([jan, mar, demo], { from: '2026-03', to: '2026-03' }, NOW);
  assert.equal(marchOnly.funnel.applied, 1, 'the cohort is the applications made in the period');
  assert.equal(marchOnly.funnel.reachedOffer, 1, "a cohort's later outcomes are followed after the period");
  assert.equal(marchOnly.scope.demoListingApplicationsExcluded, 1);
  assert.deepEqual(marchOnly.monthly, [{ month: '2026-03', applications: 1, reachedInterview: 1, reachedOffer: 1 }]);
  const withDemo = computeOutcomes([jan, mar, demo], { from: '2026-03', to: '2026-03', includeDemoListings: true }, NOW);
  assert.equal(withDemo.funnel.applied, 2);
  assert.match(withDemo.caveats[0], /demo listings/);
  const all = computeOutcomes([jan, mar], {}, NOW);
  assert.equal(all.period.from, '2026-01');
  assert.equal(all.monthly.length, 10);
  assert.equal(all.rates.appliedToInterview.status, 'insufficient_sample');
  console.log('  ✓ Period: cohort by application month, outcomes followed to today; demo listings excluded unless included');

  // === HTTP ======================================================================================
  await SavedOpportunity.deleteMany({});
  const h: HttpHarness = await startHttpHarness();
  try {
    assert.equal((await h.api('GET', '/applications/outcomes')).status, 401);
    const alice = await h.registerUser('outcomes-a');
    const bob = await h.registerUser('outcomes-b');

    const track = async (token: string, id: string, statuses: ApplicationStatus[], isSample = false) => {
      const saved = await h.api('POST', '/opportunities/save', {
        token,
        json: { externalId: id, provider: 'Manual entry', title: `Role ${id}`, company: 'Example Employer', applicationUrl: 'https://jobs.example.com/x', isSample },
      });
      assert.equal(saved.status, 201, JSON.stringify(saved.body));
      for (const status of statuses) {
        const res = await h.api('PATCH', `/opportunities/saved/${id}/status`, { token, json: { status } });
        assert.equal(res.status, 200, JSON.stringify(res.body));
      }
    };
    await track(alice.token, 'a1', ['applied', 'interviewing', 'offer']);
    await track(alice.token, 'a2', ['applied', 'interviewing', 'applied', 'interviewing']);
    await track(alice.token, 'a3', ['applied', 'rejected']);
    await track(alice.token, 'a4', []);
    await track(alice.token, 'a5', ['applied', 'offer'], true);

    const res = await h.api('GET', '/applications/outcomes', { token: alice.token });
    assert.equal(res.status, 200);
    const d = res.body.data;
    assert.deepEqual(d.funnel, { applied: 3, reachedInterview: 2, reachedOffer: 1, rejected: 1, withdrawn: 0, stillOpen: 1 });
    assert.deepEqual(d.rates.appliedToInterview, { numerator: 2, denominator: 3, rate: 2 / 3, status: 'insufficient_sample' });
    assert.equal(d.rates.interviewToOffer.numerator, 1);
    assert.equal(d.scope.savedNotApplied, 1);
    assert.equal(d.scope.demoListingApplicationsExcluded, 1);
    assert.equal(d.dataQuality.repeatedTransitionsIgnored, 2);
    const demoIncluded = (await h.api('GET', '/applications/outcomes?includeDemoListings=true', { token: alice.token })).body.data;
    assert.equal(demoIncluded.funnel.applied, 4);

    const forBob = (await h.api('GET', '/applications/outcomes', { token: bob.token })).body.data;
    assert.equal(forBob.funnel.applied, 0, "another user's applications are never counted");
    assert.equal(forBob.scope.savedNotApplied, 0);
    assert.equal(forBob.rates.appliedToOffer.status, 'no_observations');
    console.log('  ✓ HTTP: sign-in required; counts from the API; demo listings opt-in; another user sees none of it');

    // Date filtering on stored history: move a1 back to January
    await SavedOpportunity.updateOne(
      { userId: alice.userId, externalId: 'a1' },
      {
        $set: {
          appliedAt: day('2026-01-10'),
          statusHistory: [
            { status: 'saved', changedAt: day('2026-01-09') },
            { status: 'applied', changedAt: day('2026-01-10') },
            { status: 'interviewing', changedAt: day('2026-02-01') },
            { status: 'offer', changedAt: day('2026-02-20') },
          ],
        },
      }
    );
    const january = (await h.api('GET', '/applications/outcomes?from=2026-01&to=2026-01', { token: alice.token })).body.data;
    assert.deepEqual([january.funnel.applied, january.funnel.reachedOffer], [1, 1]);
    assert.equal(january.monthly.length, 1);
    const recent = (await h.api('GET', `/applications/outcomes?from=${new Date().toISOString().slice(0, 7)}`, { token: alice.token })).body.data;
    assert.equal(recent.funnel.applied, 2, 'the January application is outside this period');

    for (const q of ['from=2026-13', 'from=2026-05&to=2026-01', 'from=2019-01&to=2026-01', 'includeDemoListings=maybe', 'user=someone-else', 'from=2099-01']) {
      assert.equal((await h.api('GET', `/applications/outcomes?${q}`, { token: alice.token })).status, 400, `${q} is rejected`);
    }
    console.log('  ✓ HTTP: period filters use stored event dates; 6 invalid queries rejected');
  } finally {
    await h.close();
  }

  console.log('✅ Application Outcome Analytics (C6) Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runApplicationOutcomeTests();
    } catch (err) {
      console.error('❌ Application Outcome Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
