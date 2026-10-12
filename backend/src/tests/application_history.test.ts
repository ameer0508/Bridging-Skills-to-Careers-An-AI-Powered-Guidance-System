import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import SavedOpportunity, { IStatusHistoryEntry } from '../models/SavedOpportunity.js';
import { buildTimeline, deriveState, parseEventDate } from '../services/applications/ApplicationHistoryService.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * X8 application history: dated, user-recorded events with corrections; recorded and inferred
 * events told apart; duplicates refused; status and C6 analytics recomputed after a correction;
 * opt-in reminders; manual entry of applications made elsewhere; and strict per-user isolation.
 */

const ev = (status: IStatusHistoryEntry['status'], date: string, extra: Partial<IStatusHistoryEntry> = {}): IStatusHistoryEntry => ({
  status,
  changedAt: new Date(`${date}T10:00:00Z`),
  ...extra,
});

export async function runApplicationHistoryTests() {
  console.log('🧪 Running Application History (X8) Tests...');
  await SavedOpportunity.deleteMany({});

  // === Pure rules ===============================================================================
  const scrambled = [ev('saved', '2026-05-01'), ev('offer', '2026-06-20'), ev('applied', '2026-05-03'), ev('interviewing', '2026-05-20')];
  assert.deepEqual(deriveState(scrambled), { status: 'offer', appliedAt: new Date('2026-05-03T10:00:00Z') }, 'status follows the latest dated event, not entry order');
  assert.deepEqual(deriveState([ev('saved', '2026-05-01')]), { status: 'saved', appliedAt: null });

  const onlyInterview = buildTimeline({ statusHistory: [ev('saved', '2026-04-01'), ev('interviewing', '2026-04-10')], appliedAt: undefined });
  assert.deepEqual(onlyInterview.timeline.map(t => [t.status, t.origin]), [['saved', 'recorded'], ['applied', 'inferred'], ['interviewing', 'recorded']]);
  assert.equal(onlyInterview.timeline[1].id, null, 'inferred events are not stored and have no id');
  assert.equal(onlyInterview.timeline[1].removable, false);

  const legacyApplied = buildTimeline({ statusHistory: [ev('saved', '2026-04-01')], appliedAt: new Date('2026-04-05T00:00:00Z') });
  assert.deepEqual(legacyApplied.timeline.map(t => [t.status, t.origin]), [['saved', 'recorded'], ['applied', 'inferred']], 'a stored application date without an event is shown, as C6 counts it');

  const savedOnly = buildTimeline({ statusHistory: [ev('saved', '2026-04-01')], appliedAt: undefined });
  assert.ok(savedOnly.notes.some(n => /not counted as an application/.test(n)));
  const stated = buildTimeline({ statusHistory: [ev('saved', '2026-04-01', { dateSource: 'user_stated' })], appliedAt: undefined });
  assert.equal(stated.timeline[0].dateSource, 'user_stated');
  assert.equal(savedOnly.timeline[0].dateSource, 'recorded_at_change', 'older entries without a source are change-time dates');

  for (const bad of ['not a date', '1999-12-31', new Date(Date.now() + 86_400_000).toISOString()]) {
    assert.throws(() => parseEventDate(bad), (e: { statusCode?: number }) => e.statusCode === 400, `${bad} is refused`);
  }
  console.log('  ✓ Rules: chronological status, inferred events labelled and unstored, date sources, date validation');

  const h = await startHttpHarness();
  try {
    assert.equal((await h.api('GET', '/applications')).status, 401);
    const alice = await h.registerUser('history-alice');
    const bob = await h.registerUser('history-bob');
    const as = (token: string) => ({
      get: (path: string) => h.api('GET', path, { token }),
      post: (path: string, json: unknown) => h.api('POST', path, { token, json }),
      patch: (path: string, json: unknown) => h.api('PATCH', path, { token, json }),
      put: (path: string, json: unknown) => h.api('PUT', path, { token, json }),
      del: (path: string) => h.api('DELETE', path, { token }),
    });
    const A = as(alice.token);
    const B = as(bob.token);

    // === Saving a job, then applying, through the existing job-tracking endpoints ===============
    const saved = await A.post('/opportunities/save', {
      externalId: 'job-1',
      provider: 'Test board',
      title: 'Data Analyst',
      company: 'Example Ltd',
      applicationUrl: 'https://example.org/jobs/1',
    });
    assert.equal(saved.status, 201);
    const id = saved.body.data.savedOpportunity._id as string;

    let list = (await A.get('/applications')).body.data.applications;
    assert.equal(list.length, 1);
    assert.deepEqual([list[0].status, list[0].applied], ['saved', false], 'saving is not applying');

    assert.equal((await A.patch('/opportunities/saved/job-1/status', { status: 'applied' })).status, 200);
    let hist = (await A.get(`/applications/${id}/history`)).body.data;
    assert.deepEqual(hist.timeline.map((t: { status: string }) => t.status), ['saved', 'applied']);
    assert.equal(hist.timeline[1].dateSource, 'recorded_at_change');
    assert.ok(hist.timeline.every((t: { id: string | null }) => typeof t.id === 'string'));
    console.log('  ✓ Existing save and status endpoints feed the history; saving alone is not an application');

    // The status was changed today, but the application went in earlier: the user corrects it
    let r = await A.post(`/applications/${id}/events`, { status: 'interviewing', occurredAt: '2026-09-15T09:00:00.000Z' });
    assert.equal(r.body.data.application.status, 'applied', 'an interview dated before the recorded application does not become the current stage');
    assert.ok(r.body.data.notes.some((n: string) => /dated before the application/.test(n)), 'the inconsistency is pointed out');
    const early = r.body.data.timeline.find((t: { status: string }) => t.status === 'interviewing');
    await A.del(`/applications/${id}/events/${early.id}`);
    const appliedToday = hist.timeline[1].id;
    assert.equal((await A.patch(`/applications/${id}/events/${appliedToday}`, { occurredAt: '2026-09-01T09:00:00.000Z' })).status, 200);

    // === Adding dated events and refusing duplicates =============================================
    const interviewDay = '2026-09-15T09:00:00.000Z';
    r = await A.post(`/applications/${id}/events`, { status: 'interviewing', occurredAt: interviewDay, note: 'Panel interview' });
    assert.equal(r.status, 201);
    assert.equal(r.body.data.application.status, 'interviewing');
    const interview = r.body.data.timeline.find((t: { status: string }) => t.status === 'interviewing');
    assert.deepEqual([interview.dateSource, interview.note, interview.occurredAt], ['user_stated', 'Panel interview', interviewDay]);

    r = await A.post(`/applications/${id}/events`, { status: 'interviewing', occurredAt: '2026-09-15T17:00:00.000Z' });
    assert.deepEqual([r.status, r.body.error?.code], [409, 'DUPLICATE_EVENT'], 'same stage, same day is a duplicate');
    assert.equal((await A.post(`/applications/${id}/events`, { status: 'interviewing', occurredAt: '2026-09-22T09:00:00.000Z' })).status, 201, 'a second round on another day is kept');

    const offer = await A.post(`/applications/${id}/events`, { status: 'offer', occurredAt: '2026-09-30T09:00:00.000Z' });
    assert.equal(offer.body.data.application.status, 'offer');

    const invalid: Array<[string, unknown]> = [
      ['future date', { status: 'offer', occurredAt: new Date(Date.now() + 3 * 86_400_000).toISOString() }],
      ['saved cannot be added', { status: 'saved' }],
      ['unknown status', { status: 'hired' }],
      ['unknown field', { status: 'offer', employerConfirmed: true }],
      ['bad date', { status: 'rejected', occurredAt: 'yesterday-ish' }],
      ['note too long', { status: 'rejected', note: 'x'.repeat(501) }],
    ];
    for (const [label, body] of invalid) assert.equal((await A.post(`/applications/${id}/events`, body)).status, 400, label);
    console.log(`  ✓ Dated events added; same-day duplicates refused (409); ${invalid.length} invalid events refused`);

    // === Corrections flow into C6 =================================================================
    const outcomes = async () => (await A.get('/applications/outcomes')).body.data;
    let o = await outcomes();
    assert.deepEqual([o.funnel.applied, o.funnel.reachedInterview, o.funnel.reachedOffer], [1, 1, 1]);
    const appliedMonthBefore = o.monthly.find((m: { applications: number }) => m.applications > 0).month;

    hist = (await A.get(`/applications/${id}/history`)).body.data;
    const appliedEvent = hist.timeline.find((t: { status: string }) => t.status === 'applied');
    r = await A.patch(`/applications/${id}/events/${appliedEvent.id}`, { occurredAt: '2026-08-28T09:00:00.000Z' });
    assert.equal(r.status, 200);
    const corrected = r.body.data.timeline.find((t: { status: string }) => t.status === 'applied');
    assert.equal(corrected.dateSource, 'user_stated');
    assert.ok(corrected.editedAt, 'the correction is stamped');
    assert.equal(r.body.data.application.appliedAt, '2026-08-28T09:00:00.000Z');
    o = await outcomes();
    assert.equal(o.monthly.find((m: { applications: number }) => m.applications > 0).month, '2026-08', `C6 moved the application from ${appliedMonthBefore} to the corrected month`);

    const offerEvent = r.body.data.timeline.find((t: { status: string }) => t.status === 'offer');
    r = await A.del(`/applications/${id}/events/${offerEvent.id}`);
    assert.equal(r.status, 200);
    assert.equal(r.body.data.application.status, 'interviewing', 'status falls back to the latest remaining event');
    o = await outcomes();
    assert.equal(o.funnel.reachedOffer, 0, 'C6 no longer counts the removed offer');

    // Moving an event onto a day that already has the same stage is a duplicate too
    const rounds = r.body.data.timeline.filter((t: { status: string }) => t.status === 'interviewing');
    assert.equal((await A.patch(`/applications/${id}/events/${rounds[1].id}`, { occurredAt: interviewDay })).status, 409);
    assert.equal((await A.patch(`/applications/${id}/events/${rounds[1].id}`, {})).status, 400, 'an empty correction is refused');
    const savedEvent = r.body.data.timeline.find((t: { status: string }) => t.status === 'saved');
    assert.equal((await A.del(`/applications/${id}/events/${savedEvent.id}`)).status, 400, 'the saved event cannot be removed');
    const resaved = await A.patch(`/applications/${id}/events/${savedEvent.id}`, { occurredAt: '2026-10-01T00:00:00.000Z' });
    assert.equal(resaved.body.data.application.status, 'interviewing', 'when tracking began does not change the current stage');
    assert.equal((await A.del(`/applications/${id}/events/${new mongoose.Types.ObjectId()}`)).status, 404);
    console.log('  ✓ Corrections and removals recompute status and appliedAt; C6 follows; unsafe edits refused');

    // === Older records without event ids ==========================================================
    const legacy = await SavedOpportunity.collection.insertOne({
      userId: new mongoose.Types.ObjectId(alice.userId),
      provider: 'Test board',
      externalId: 'legacy-1',
      title: 'Backend Developer',
      company: 'Old Co',
      status: 'interviewing',
      statusHistory: [
        { status: 'saved', changedAt: new Date('2026-03-01T10:00:00Z'), note: '' },
        { status: 'interviewing', changedAt: new Date('2026-03-12T10:00:00Z'), note: '' },
      ],
      savedAt: new Date('2026-03-01T10:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const legacyId = String(legacy.insertedId);
    const first = (await A.get(`/applications/${legacyId}/history`)).body.data;
    const second = (await A.get(`/applications/${legacyId}/history`)).body.data;
    const recordedIds = (t: Array<{ id: string | null; origin: string }>) => t.filter(x => x.origin === 'recorded').map(x => x.id);
    assert.ok(recordedIds(first.timeline).every(Boolean));
    assert.deepEqual(recordedIds(second.timeline), recordedIds(first.timeline), 'ids assigned once and kept');
    assert.deepEqual(first.timeline.map((t: { status: string; origin: string }) => `${t.status}:${t.origin}`), ['saved:recorded', 'applied:inferred', 'interviewing:recorded']);
    const legacyInterview = first.timeline.find((t: { status: string }) => t.status === 'interviewing');
    r = await A.patch(`/applications/${legacyId}/events/${legacyInterview.id}`, { occurredAt: '2026-03-10T10:00:00.000Z' });
    assert.equal(r.body.data.timeline.find((t: { status: string }) => t.status === 'interviewing').recordedAt, '2026-03-12T10:00:00.000Z', 'the original entry time is kept as recordedAt');
    console.log('  ✓ Older records get stable event ids on first read; inferred application shown; original entry time kept');

    // === Manual entry of an application made elsewhere ===========================================
    r = await A.post('/applications/manual', { title: 'Product Analyst', company: 'Elsewhere Inc', applicationUrl: 'https://careers.example.com/42', appliedAt: '2026-09-02T00:00:00.000Z' });
    assert.equal(r.status, 201);
    assert.deepEqual([r.body.data.application.isManual, r.body.data.application.isSample, r.body.data.application.status], [true, false, 'applied']);
    const manualId = r.body.data.application.id;
    const unappliedManual = await A.post('/applications/manual', { title: 'QA Engineer', company: 'Maybe Ltd' });
    assert.equal(unappliedManual.body.data.application.applied, false);
    for (const [label, body] of [
      ['javascript link', { title: 'Role', company: 'X', applicationUrl: 'javascript:alert(1)' }],
      ['missing company', { title: 'Role' }],
      ['future application', { title: 'Role', company: 'X', appliedAt: new Date(Date.now() + 5 * 86_400_000).toISOString() }],
      ['status smuggled in', { title: 'Role', company: 'X', status: 'offer' }],
    ] as const) {
      assert.equal((await A.post('/applications/manual', body)).status, 400, label);
    }
    o = await outcomes();
    assert.equal(o.funnel.applied, 3, 'the manual application, the tracked job and the legacy record are counted');
    assert.ok(o.scope.savedNotApplied >= 1, 'the unapplied manual entry is not');
    console.log('  ✓ Manual applications are real user records, counted by C6; 4 invalid entries refused');

    // === Opt-in reminders =========================================================================
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
    r = await A.put(`/applications/${manualId}/reminder`, { at: tomorrow, note: 'Ask about timeline' });
    assert.equal(r.status, 200);
    assert.deepEqual([r.body.data.application.reminder.note, r.body.data.application.reminder.due], ['Ask about timeline', false]);
    assert.equal((await A.put(`/applications/${manualId}/reminder`, { at: '2020-01-01T00:00:00Z' })).status, 400, 'past reminders are refused');
    assert.equal((await A.put(`/applications/${manualId}/reminder`, { at: new Date(Date.now() + 400 * 86_400_000).toISOString() })).status, 400);
    list = (await A.get('/applications')).body.data.applications;
    assert.equal(list.filter((a: { reminder: unknown }) => a.reminder).length, 1, 'no reminder exists unless the user set one');
    r = await A.put(`/applications/${manualId}/reminder`, { at: null });
    assert.equal(r.body.data.application.reminder, null);
    console.log('  ✓ Reminders are set and cleared only by the user; past and far-future dates refused');

    // === Isolation ================================================================================
    const probes: Array<[string, () => Promise<{ status: number }>]> = [
      ['history', () => B.get(`/applications/${id}/history`)],
      ['add event', () => B.post(`/applications/${id}/events`, { status: 'rejected' })],
      ['correct event', () => B.patch(`/applications/${id}/events/${appliedEvent.id}`, { note: 'x' })],
      ['remove event', () => B.del(`/applications/${id}/events/${appliedEvent.id}`)],
      ['reminder', () => B.put(`/applications/${id}/reminder`, { at: null })],
      ['malformed id', () => B.get('/applications/not-an-id/history')],
    ];
    for (const [label, call] of probes) assert.equal((await call()).status, 404, `bob: ${label}`);
    assert.equal((await B.get('/applications')).body.data.applications.length, 0, "bob sees none of alice's applications");
    assert.equal((await B.get('/applications/outcomes')).body.data.funnel.applied, 0);
    const aliceAfter = (await A.get(`/applications/${id}/history`)).body.data;
    assert.ok(!aliceAfter.timeline.some((t: { status: string }) => t.status === 'rejected'), "bob's attempts changed nothing");
    console.log(`  ✓ Isolation: ${probes.length} cross-user operations answer 404 and change nothing`);
  } finally {
    await h.close();
  }

  console.log('✅ Application History (X8) Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runApplicationHistoryTests();
    } catch (err) {
      console.error('❌ Application History Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
