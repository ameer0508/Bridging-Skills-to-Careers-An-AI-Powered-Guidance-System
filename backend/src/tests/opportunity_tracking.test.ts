import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import env from '../config/env.js';
import CareerService from '../services/CareerService.js';
import SavedOpportunity from '../models/SavedOpportunity.js';
import { formatSalary } from '../services/OpportunityService.js';
import { SAMPLE_PROVIDER_NAME } from '../services/opportunities/sampleOpportunities.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness, resumeForm, type HttpHarness } from './helpers/httpHarness.js';

/**
 * Job search filters, honest labelling of demo and unavailable results, and application
 * tracking (status history, notes, reminders, deletion semantics, isolation) over HTTP.
 * No request leaves the machine: the live provider is replaced by a stub.
 */

const RESUME = [
  'Sam Candidate',
  'Email: sam.candidate@example.com',
  '',
  'Experience:',
  'Frontend Developer at Example Co (2022-2024)',
  'Built dashboards with React, JavaScript, HTML and CSS.',
  '',
  'Skills:',
  'React, JavaScript, HTML, CSS, Node.js, Git'
].join('\n');

async function uploadAndWait(h: HttpHarness, token: string) {
  assert.equal((await h.api('POST', '/resumes/upload', { token, form: resumeForm(RESUME) })).status, 201);
  for (let i = 0; i < 100; i++) {
    const resume = (await h.api('GET', '/resumes/me', { token })).body.data.resume;
    if (resume?.parsingStatus === 'completed') return;
    await new Promise(r => setTimeout(r, 100));
  }
  assert.fail('resume was not processed in time');
}

export async function runOpportunityTrackingTests() {
  console.log('🧪 Running Job Search & Application Tracking Tests (HTTP)...');
  await ensureFakeAiService();
  await CareerService.seedInitialTaxonomy();
  const h = await startHttpHarness();
  const realFetch = globalThis.fetch;
  const envRecord = env as unknown as Record<string, string | undefined>;
  const originalKey = envRecord.RAPIDAPI_KEY;

  try {
    const alice = await h.registerUser('alice');
    const bob = await h.registerUser('bob');
    await uploadAndWait(h, alice.token);
    const search = async (qs: string, token = alice.token) => (await h.api('GET', `/opportunities?${qs}`, { token })).body.data;

    // --- Demo listings are labelled as such ---------------------------------------------------
    const all = await search('search=Developer%20Engineer%20Analyst%20Associate&limit=50');
    assert.equal(all.meta.source, 'sample');
    assert.equal(all.providerHealth.status, 'PENDING_CREDS');
    assert.ok(all.opportunities.length >= 8);
    for (const job of all.opportunities) {
      assert.equal(job.isSample, true);
      assert.equal(job.provider, SAMPLE_PROVIDER_NAME);
      assert.match(job.company, /\(demo listing\)$/);
      assert.ok(job.matchExplanation.length > 0, 'every posting explains its score or why it has none');
    }
    assert.ok(all.meta.fetchedAt && typeof all.meta.fromCache === 'boolean');
    console.log('  ✓ Without a provider key every result is a labelled demo listing with source "sample"');

    // --- Keyword, location and the other filters ------------------------------------------------
    const analyst = await search('search=Analyst');
    assert.deepEqual(analyst.opportunities.map((o: any) => o.title), ['Data Analyst']);
    assert.deepEqual((await search('search=zzzunmatched')).opportunities, [], 'no keyword match returns nothing, not everything');

    const pune = await search('search=Engineer&location=Pune');
    assert.ok(pune.opportunities.length > 0 && pune.opportunities.every((o: any) => /Pune/.test(o.location)));

    const remote = await search('search=Engineer%20Developer&remote=true&limit=50');
    assert.ok(remote.opportunities.length > 0 && remote.opportunities.every((o: any) => o.remote === true));

    const contract = await search('search=Engineer%20Developer&employmentType=CONTRACT&limit=50');
    assert.ok(contract.opportunities.length > 0 && contract.opportunities.every((o: any) => o.employmentType === 'CONTRACT'));
    const intern = await search('search=Intern&employmentType=INTERNSHIP');
    assert.ok(intern.opportunities.length > 0 && intern.opportunities.every((o: any) => o.employmentType === 'INTERN'));

    const week = await search('search=Engineer%20Developer%20Analyst%20Associate&datePosted=week&limit=50');
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    assert.ok(week.opportunities.length > 0 && week.opportunities.every((o: any) => new Date(o.postedAt).getTime() >= weekAgo));
    assert.ok(week.opportunities.length < all.opportunities.length, 'older postings are filtered out');

    // Salary: only postings that state a salary can pass, and the response says how many could not
    const paid = await search('search=Engineer%20Developer%20Analyst%20Associate&salaryMin=1200000&limit=50');
    assert.ok(paid.opportunities.length > 0);
    assert.ok(paid.opportunities.every((o: any) => o.salary && (o.salary.max ?? o.salary.min) >= 1200000));
    assert.equal(paid.meta.salaryDataAvailable, true);
    assert.equal(paid.meta.salaryFilter.requestedMin, 1200000);
    assert.ok(paid.meta.salaryFilter.excludedWithoutSalary >= 3, 'postings without a stated salary are counted, not guessed');
    const unpaid = await search('search=Associate');
    assert.equal(unpaid.meta.salaryDataAvailable, false, 'the client is told when no result states a salary');
    console.log('  ✓ Filters: keyword, location, remote, employment type, date posted and salary (stated salaries only)');

    // --- Sorting, pagination, deduplication ------------------------------------------------------------
    const byDate = (await search('search=Engineer%20Developer%20Analyst&sortBy=date&limit=50')).opportunities;
    const times = byDate.map((o: any) => new Date(o.postedAt).getTime());
    assert.deepEqual(times, [...times].sort((a, b) => b - a), 'newest first');
    const bySalary = (await search('search=Engineer%20Developer%20Analyst&sortBy=salary&limit=50')).opportunities;
    const tops = bySalary.map((o: any) => (o.salary ? o.salary.max : -1));
    assert.deepEqual(tops, [...tops].sort((a, b) => b - a), 'highest salary first, undisclosed last');
    const byMatch = (await search('search=Engineer%20Developer%20Analyst%20Associate&limit=50')).opportunities;
    const scores = byMatch.map((o: any) => o.skillbridgeMatchScore ?? -1);
    assert.deepEqual(scores, [...scores].sort((a, b) => b - a), 'best match first, unscored last');

    const firstPage = await search('search=Engineer%20Developer&limit=2');
    assert.equal(firstPage.opportunities.length, 2);
    assert.ok(firstPage.meta.total > 2 && firstPage.meta.hasMore === true);
    assert.equal(firstPage.meta.limit, 2);

    const fullStack = await search('search=Stack');
    assert.equal(fullStack.opportunities.filter((o: any) => o.title === 'Full Stack Developer').length, 1, 're-posted role appears once');
    assert.equal(fullStack.meta.duplicatesRemoved, 1);
    console.log('  ✓ Sorting (match, date, salary), page size with hasMore, and re-post deduplication');

    // --- Scores and explanations ----------------------------------------------------------------------------
    const frontend = (await search('search=Frontend')).opportunities[0];
    assert.equal(frontend.matchStatus, 'SCORED');
    assert.ok(frontend.matchedSkills.includes('React'));
    assert.equal(typeof frontend.skillbridgeMatchScore, 'number');
    assert.ok(frontend.requirements.length > 0);
    const support = (await search('search=Support')).opportunities[0];
    assert.equal(support.matchStatus, 'NO_REQUIREMENTS');
    assert.equal(support.skillbridgeMatchScore, null, 'a posting that names no skills is not given a score');
    const forBob = (await search('search=Frontend', bob.token)).opportunities[0];
    assert.equal(forBob.matchStatus, 'NO_CANDIDATE_EVIDENCE');
    assert.equal(forBob.skillbridgeMatchScore, null);
    console.log('  ✓ Matching: matched/missing skills and explanation; unscoreable postings and users are reported as such');

    // --- Request validation ------------------------------------------------------------------------------------
    for (const qs of ['page=0', 'limit=500', 'sortBy=popularity', 'datePosted=yesterday', 'salaryMin=lots', 'employmentType=GIG', 'minScore=900']) {
      const res = await h.api('GET', `/opportunities?${qs}`, { token: alice.token });
      assert.equal(res.status, 400, `rejected: ${qs}`);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    }
    console.log('  ✓ Invalid search parameters are rejected with 400');

    // --- Live provider: mapped honestly; failure is not replaced by demo data ------------------------------------
    envRecord.RAPIDAPI_KEY = 'test-key-not-real';
    let providerMode: 'ok' | 'down' = 'ok';
    const providerCalls: string[] = [];
    globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (!url.includes('jsearch.p.rapidapi.com')) return realFetch(input, init);
      providerCalls.push(url);
      if (providerMode === 'down') return new Response('upstream error', { status: 502, statusText: 'Bad Gateway' });
      return new Response(JSON.stringify({
        data: [
          { job_id: 'live-1', job_title: 'React Developer', employer_name: 'Real Employer Ltd', job_description: 'Needs React and TypeScript.', job_city: 'Pune', job_country: 'IN', job_is_remote: false, job_employment_type: 'FULLTIME', job_min_salary: 800000, job_max_salary: 1200000, job_salary_currency: 'INR', job_salary_period: 'YEAR', job_posted_at_timestamp: Math.floor(Date.now() / 1000) - 3600, job_apply_link: 'https://jobs.example.com/apply/1' },
          { job_id: 'live-2', job_title: 'Platform Engineer', employer_name: 'Another Employer', job_description: 'Details on request.' },
          { job_id: 'live-3', job_title: 'Bad Link', employer_name: 'Link Co', job_description: 'x', job_apply_link: 'javascript:alert(1)' }
        ]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as typeof fetch;

    const live = await search('search=LiveQueryOne&location=Pune&datePosted=month&limit=50');
    assert.equal(live.meta.source, 'live');
    assert.equal(live.providerHealth.status, 'UP');
    assert.ok(providerCalls[0].includes('LiveQueryOne%20in%20Pune') && providerCalls[0].includes('date_posted=month'), 'keywords, location and date reach the provider');
    assert.ok(live.opportunities.every((o: any) => o.isSample === false), 'live results are never flagged as demo');
    assert.deepEqual(live.opportunities.map((o: any) => o.externalId), ['live-1'], 'a date filter drops postings with no publication date');
    assert.equal(live.meta.excludedWithoutDate, 2);
    const liveAll = await search('search=LiveQueryTwo&limit=50');
    const undated = liveAll.opportunities.find((o: any) => o.externalId === 'live-2');
    assert.equal(undated.postedAt, null, 'no publication date is invented');
    assert.equal(undated.salary, null);
    assert.equal(undated.location, 'Location not stated');
    assert.equal(undated.employmentType, 'NOT_STATED');
    assert.ok(/^https:\/\/www\.google\.com\/search/.test(liveAll.opportunities.find((o: any) => o.externalId === 'live-3').applicationUrl), 'an unsafe apply link is replaced');
    const livePaid = liveAll.opportunities.find((o: any) => o.externalId === 'live-1');
    assert.deepEqual(livePaid.salary, { min: 800000, max: 1200000, currency: 'INR', period: 'YEAR' });

    providerMode = 'down';
    const down = await search('search=LiveQueryThree');
    assert.deepEqual(down.opportunities, [], 'a failing provider is not papered over with demo listings');
    assert.equal(down.meta.source, 'unavailable');
    assert.equal(down.providerHealth.status, 'DOWN');
    assert.match(down.providerHealth.message, /502/);
    globalThis.fetch = realFetch;
    envRecord.RAPIDAPI_KEY = originalKey;
    console.log('  ✓ Live provider (stubbed): honest field mapping, source "live"; a failure returns "unavailable", not demo data');

    // --- Saving and tracking -------------------------------------------------------------------------------------------
    assert.equal(formatSalary(null), 'Salary not disclosed');
    assert.equal(formatSalary({ min: 900000, max: 1500000, currency: 'INR', period: 'YEARLY' }), 'INR 900,000 - 1,500,000 per year');
    assert.equal(formatSalary({ max: 50 }), '50', 'currency and period are not assumed');

    const job = (await search('search=Stack')).opportunities[0];
    const saved = await h.api('POST', '/opportunities/save', { token: alice.token, json: job });
    assert.equal(saved.status, 201);
    assert.equal(saved.body.data.savedOpportunity.isSample, true, 'a saved demo listing stays labelled');
    assert.equal(saved.body.data.savedOpportunity.salary, 'INR 900,000 - 1,500,000 per year');
    assert.equal(saved.body.data.savedOpportunity.reminderDue, false);
    assert.ok(saved.body.data.savedOpportunity.matchExplanation.length > 0);
    assert.equal((await h.api('POST', '/opportunities/save', { token: alice.token, json: job })).status, 201, 'saving twice is idempotent');
    assert.equal((await h.api('GET', '/opportunities/saved', { token: alice.token })).body.data.total, 1);
    assert.equal((await h.api('POST', '/opportunities/save', { token: alice.token, json: { ...job, applicationUrl: 'javascript:alert(1)' } })).status, 400);
    assert.equal((await h.api('POST', '/opportunities/save', { token: alice.token, json: { title: 'x' } })).status, 400);

    const id = job.externalId;
    const statusUrl = `/opportunities/saved/${id}/status`;
    assert.equal((await h.api('PATCH', statusUrl, { token: alice.token, json: { status: 'applied', notes: 'Applied through the careers page' } })).status, 200);
    assert.equal((await h.api('PATCH', statusUrl, { token: alice.token, json: { status: 'applied' } })).status, 200);
    const interviewing = await h.api('PATCH', statusUrl, { token: alice.token, json: { status: 'interviewing' } });
    const record = interviewing.body.data.savedOpportunity;
    assert.deepEqual(record.statusHistory.map((e: any) => e.status), ['saved', 'applied', 'interviewing'], 'each real transition is recorded once');
    assert.equal(record.statusHistory[1].note, 'Applied through the careers page');
    assert.ok(record.appliedAt, 'the application date is recorded');
    assert.equal((await h.api('PATCH', statusUrl, { token: alice.token, json: { status: 'hired' } })).status, 400);
    assert.equal((await h.api('PATCH', statusUrl, { token: alice.token, json: { status: 'offer', userId: bob.userId } })).status, 400, 'unknown fields are rejected');
    console.log('  ✓ Tracking: idempotent save, unsafe links rejected, status history with notes and application date');

    // Notes and reminders
    const detailsUrl = `/opportunities/saved/${id}`;
    const noted = await h.api('PATCH', detailsUrl, { token: alice.token, json: { notes: 'Recruiter: <b>Asha</b> <script>alert(1)</script>' } });
    assert.equal(noted.status, 200);
    assert.equal(noted.body.data.savedOpportunity.notes, 'Recruiter: Asha', 'notes are stored as plain text');
    assert.equal(noted.body.data.savedOpportunity.statusHistory.length, 3, 'editing notes is not a status change');

    assert.equal((await h.api('PATCH', detailsUrl, { token: alice.token, json: { reminderAt: 'next tuesday' } })).status, 400);
    assert.equal((await h.api('PATCH', detailsUrl, { token: alice.token, json: { reminderAt: new Date(Date.now() - 86400000).toISOString() } })).status, 400, 'a reminder cannot be set in the past');
    assert.equal((await h.api('PATCH', detailsUrl, { token: alice.token, json: {} })).status, 400);
    const future = new Date(Date.now() + 3 * 86400000).toISOString();
    const reminded = await h.api('PATCH', detailsUrl, { token: alice.token, json: { reminderAt: future, reminderNote: 'Follow up with the recruiter' } });
    assert.equal(reminded.status, 200);
    assert.equal(reminded.body.data.savedOpportunity.reminderAt, future);
    assert.equal(reminded.body.data.savedOpportunity.reminderNote, 'Follow up with the recruiter');
    assert.equal(reminded.body.data.savedOpportunity.reminderDue, false);
    assert.equal((await h.api('GET', '/opportunities/telemetry', { token: alice.token })).body.data.remindersDue, 0);

    // Time passes: the reminder becomes due and is surfaced in the list, telemetry and Command Center
    await SavedOpportunity.updateOne({ userId: alice.userId, externalId: id }, { $set: { reminderAt: new Date(Date.now() - 60000) } });
    assert.equal((await h.api('GET', '/opportunities/saved', { token: alice.token })).body.data.savedOpportunities[0].reminderDue, true);
    assert.equal((await h.api('GET', '/opportunities/telemetry', { token: alice.token })).body.data.remindersDue, 1);
    const snapshot = (await h.api('GET', '/users/me/career-snapshot', { token: alice.token })).body.data;
    assert.equal(snapshot.opportunities.remindersDue, 1);
    assert.equal(snapshot.opportunities.interviewing, 1);
    assert.equal(snapshot.opportunities.total, 1);
    const cleared = await h.api('PATCH', detailsUrl, { token: alice.token, json: { reminderAt: null } });
    assert.equal(cleared.body.data.savedOpportunity.reminderAt, null);
    assert.equal(cleared.body.data.savedOpportunity.reminderNote, '');
    console.log('  ✓ Notes and follow-up reminders: validated, persisted, reported as due, cleared');

    // --- Consistent not-found semantics and isolation --------------------------------------------------------------
    for (const [method, path, json] of [
      ['PATCH', `/opportunities/saved/${id}/status`, { status: 'offer' }],
      ['PATCH', `/opportunities/saved/${id}`, { notes: 'intrusion' }],
      ['DELETE', `/opportunities/saved/${id}`, undefined],
      ['DELETE', `/opportunities/${id}/save`, undefined]
    ] as const) {
      const res = await h.api(method, path, { token: bob.token, json });
      assert.equal(res.status, 404, `Bob ${method} ${path}`);
      assert.equal(res.body.error.code, 'SAVED_OPPORTUNITY_NOT_FOUND');
    }
    assert.equal((await h.api('DELETE', '/opportunities/saved/does-not-exist', { token: alice.token })).status, 404, 'unknown id is 404 for the owner too');
    assert.equal((await h.api('GET', '/opportunities/saved', { token: bob.token })).body.data.total, 0);
    const untouched = (await h.api('GET', '/opportunities/saved', { token: alice.token })).body.data.savedOpportunities[0];
    assert.equal(untouched.status, 'interviewing');
    assert.equal(untouched.notes, 'Recruiter: Asha');
    assert.equal((await h.api('GET', '/opportunities/saved')).status, 401);

    assert.equal((await h.api('DELETE', `/opportunities/saved/${id}`, { token: alice.token })).status, 200);
    assert.equal((await h.api('GET', '/opportunities/saved', { token: alice.token })).body.data.total, 0);
    assert.equal((await h.api('DELETE', `/opportunities/${id}/save`, { token: alice.token })).status, 404, 'deleting again reports not found');
    console.log("  ✓ Saved-job routes: 404 for unknown or other users' records on every operation; owner's data untouched");

    console.log('✅ Job Search & Application Tracking Tests Passed\n');
  } finally {
    globalThis.fetch = realFetch;
    envRecord.RAPIDAPI_KEY = originalKey;
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runOpportunityTrackingTests();
    } catch (err) {
      console.error('❌ Job Tracking Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
