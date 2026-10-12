import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import { buildSchedule, effortFor, EFFORT_ASSUMPTIONS, DEFAULT_EFFORT } from '../services/RoadmapScheduler.js';
import type { IRoadmapPhase } from '../models/LearningRoadmap.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness, resumeForm, type HttpHarness } from './helpers/httpHarness.js';

/**
 * Availability-aware roadmaps: effort ranges, the schedule that follows from the user's weekly
 * hours, what a regeneration keeps and drops, and the same figures on the dashboard.
 */

const resume = (project: string, skills: string) =>
  [
    'Sam Candidate',
    'Email: sam.candidate@example.com',
    '',
    'Experience:',
    'Frontend Developer at Example Co (2022-2023)',
    'Built dashboards with React, JavaScript, HTML and CSS.',
    '',
    'Projects:',
    'Shop API',
    project,
    '',
    'Skills:',
    skills
  ].join('\n');

async function waitForResume(h: HttpHarness, token: string) {
  await new Promise(r => setTimeout(r, 150));
  for (let i = 0; i < 100; i++) {
    const current = (await h.api('GET', '/resumes/me', { token })).body.data.resume;
    if (current?.parsingStatus === 'completed') return;
    assert.notEqual(current?.parsingStatus, 'failed', current?.parsingError);
    await new Promise(r => setTimeout(r, 100));
  }
  assert.fail('resume was not processed in time');
}

const phase = (order: number, items: Array<Partial<IRoadmapPhase['items'][number]> & { title: string }>): IRoadmapPhase => ({
  title: `Phase ${order}`,
  order,
  items: items.map(item => ({ status: 'not_started', category: 'Learning Resources', estimatedDuration: 'Self-paced', prerequisites: [], ...item }))
});

export async function runLearningPlanTests() {
  console.log('🧪 Running Learning Plan (Roadmap Schedule) Tests...');

  // === Effort: catalogue hours when stated, otherwise a labelled assumption ====================
  assert.deepEqual(effortFor({ category: 'Learning Resources', estimatedDuration: '12 hours' }), { lowHours: 12, highHours: 12, basis: 'catalogue' });
  assert.deepEqual(effortFor({ category: 'Projects', estimatedDuration: '8-10 hrs' }), { lowHours: 8, highHours: 10, basis: 'catalogue' });
  assert.deepEqual(effortFor({ category: 'Projects', estimatedDuration: 'Under an hour' }), { lowHours: 1, highHours: 1, basis: 'catalogue' });
  for (const vague of ['Self-paced', '2 months', '', 'A while', '0 hours']) {
    const effort = effortFor({ category: 'Certifications', estimatedDuration: vague });
    assert.deepEqual(effort, { lowHours: EFFORT_ASSUMPTIONS.Certifications.low, highHours: EFFORT_ASSUMPTIONS.Certifications.high, basis: 'assumption' }, `"${vague}" states no hours`);
  }
  assert.deepEqual(effortFor({ category: 'Something else', estimatedDuration: 'Self-paced' }), { lowHours: DEFAULT_EFFORT.low, highHours: DEFAULT_EFFORT.high, basis: 'assumption' });

  // === Schedule arithmetic ======================================================================
  const now = new Date(Date.UTC(2026, 9, 12));
  const phases = [
    phase(1, [
      { title: 'Learn SQL', targetSkill: 'SQL', estimatedDuration: '12 hours' },
      { title: 'Learn Docker', targetSkill: 'Docker', status: 'completed' }
    ]),
    phase(2, [
      { title: 'Build a project using SQL', targetSkill: 'SQL', category: 'Projects', prerequisites: ['Learn SQL'] },
      { title: 'Build a project using Docker', targetSkill: 'Docker', category: 'Projects', prerequisites: ['Learn Docker', 'Learn Kubernetes'] }
    ])
  ];
  const unset = buildSchedule(phases, null, now);
  assert.equal(unset.needsAvailability, true);
  assert.deepEqual([unset.weeksRemaining, unset.finishBetween], [null, null], 'no weekly hours, no weeks: none are assumed');
  assert.deepEqual(unset.remainingHours, { low: 12 + 15 + 15, high: 12 + 40 + 40 });
  assert.ok(unset.items.every(item => item.finish === null));

  const ten = buildSchedule(phases, 10, now);
  assert.deepEqual(ten.weeksRemaining, { low: Math.ceil(42 / 10), high: Math.ceil(92 / 10) });
  assert.deepEqual(ten.finishBetween, { earliest: '2026-11-16', latest: '2026-12-21' });
  assert.deepEqual([ten.totalItems, ten.remainingItems], [4, 3]);
  assert.deepEqual(ten.items.map(i => i.finish), [{ earliestWeek: 2, latestWeek: 2 }, null, { earliestWeek: 3, latestWeek: 6 }, { earliestWeek: 5, latestWeek: 10 }]);
  assert.deepEqual(ten.phases.map(p => [p.remainingItems, p.finish?.latestWeek]), [[1, 2], [2, 10]]);
  assert.deepEqual(ten.items[2].blockedBy, ['Learn SQL'], 'an unfinished prerequisite in the roadmap blocks the item');
  assert.deepEqual(ten.items[3].blockedBy, [], 'a finished prerequisite, or one that is not part of the roadmap, does not');
  assert.equal(ten.nextItem?.title, 'Learn SQL');
  const five = buildSchedule(phases, 5, now);
  assert.ok(five.weeksRemaining!.low > ten.weeksRemaining!.low && five.weeksRemaining!.high > ten.weeksRemaining!.high, 'fewer hours a week, more weeks');
  for (const item of ten.items.filter(i => i.finish)) assert.ok(item.finish!.earliestWeek <= item.finish!.latestWeek);

  const allDone = buildSchedule([phase(1, [{ title: 'Learn SQL', status: 'completed' }, { title: 'Learn Git', status: 'skipped' }])], 10, now);
  assert.deepEqual([allDone.remainingItems, allDone.weeksRemaining, allDone.nextItem, allDone.remainingHours], [0, null, null, { low: 0, high: 0 }]);
  assert.deepEqual(buildSchedule([], 10, now).totalItems, 0);
  assert.ok(ten.assumptions.some(a => /has not measured/.test(a)), 'the schedule says its effort figures are assumptions');
  console.log('  ✓ Scheduler: catalogue hours or labelled assumptions; weeks only from stated weekly hours; ranges, prerequisites and completed items handled');

  await ensureFakeAiService();
  await CareerService.seedInitialTaxonomy();
  const h = await startHttpHarness();

  try {
    const alice = await h.registerUser('alice');
    const bob = await h.registerUser('bob');
    assert.ok([200, 201].includes((await h.api('POST', '/resumes/upload', { token: alice.token, form: resumeForm(resume('REST service written in Node.js, tracked with Git.', 'React, JavaScript, HTML, CSS, Node.js, Git')) })).status));
    await waitForResume(h, alice.token);

    const matches = (await h.api('GET', '/careers/matches', { token: alice.token })).body.data.matches as any[];
    const careerId = matches[0].careerId._id as string;
    const roadmapOf = async () => (await h.api('GET', `/roadmap/${careerId}`, { token: alice.token })).body.data.roadmap;
    const scheduleOf = async (token = alice.token) => h.api('GET', `/roadmap/${careerId}/schedule`, { token });
    const itemsOf = (roadmap: any) => roadmap.phases.flatMap((p: any) => p.items) as any[];

    const prefs = (token: string, hoursPerWeek: unknown) => h.api('PUT', '/users/me/learning-preferences', { token, json: { hoursPerWeek } });
    const setStatus = (itemId: string, status: string) => h.api('PATCH', `/roadmap/${careerId}/items/${itemId}/status`, { token: alice.token, json: { status } });

    // === Before any weekly hours are set ========================================================
    assert.equal((await scheduleOf()).body.error.code, 'ROADMAP_NOT_FOUND', 'asking for a schedule does not create a roadmap');
    const roadmap = await roadmapOf();
    const items = itemsOf(roadmap);
    assert.ok(items.length >= 4);
    assert.deepEqual((await h.api('GET', '/users/me/learning-preferences', { token: alice.token })).body.data, { hoursPerWeek: null, reminders: false, milestoneNotifications: false, limits: { min: 1, max: 60 } }, 'no weekly hours are assumed for a new user, and notifications are off');

    let schedule = (await scheduleOf()).body.data.schedule;
    assert.equal(schedule.needsAvailability, true);
    assert.deepEqual([schedule.hoursPerWeek, schedule.weeksRemaining, schedule.finishBetween], [null, null, null]);
    assert.equal(schedule.totalItems, items.length);
    assert.equal(schedule.remainingItems, items.length);
    const expectedHours = items.reduce((sum, item) => ({ low: sum.low + effortFor(item).lowHours, high: sum.high + effortFor(item).highHours }), { low: 0, high: 0 });
    assert.deepEqual(schedule.remainingHours, expectedHours);
    assert.ok(schedule.items.every((i: any) => i.effort.basis === 'assumption'), 'the catalogue states no hours here, so every figure is labelled an assumption');
    const project = schedule.items.find((i: any) => i.title === 'Build a project that uses TypeScript');
    assert.deepEqual(project.blockedBy, ['Learn TypeScript']);
    assert.equal(schedule.nextItem.title, items[0].title);

    // === Weekly hours ============================================================================
    const saved = await prefs(alice.token, 10);
    assert.equal(saved.status, 200);
    assert.equal(saved.body.data.hoursPerWeek, 10);
    schedule = (await scheduleOf()).body.data.schedule;
    assert.deepEqual(schedule.weeksRemaining, { low: Math.ceil(expectedHours.low / 10), high: Math.ceil(expectedHours.high / 10) });
    assert.ok(schedule.finishBetween.earliest <= schedule.finishBetween.latest && schedule.finishBetween.earliest > new Date().toISOString().slice(0, 10));
    const weeksAtTen = schedule.weeksRemaining;
    assert.equal((await prefs(alice.token, 4)).status, 200);
    schedule = (await scheduleOf()).body.data.schedule;
    assert.deepEqual(schedule.weeksRemaining, { low: Math.ceil(expectedHours.low / 4), high: Math.ceil(expectedHours.high / 4) });
    assert.ok(schedule.weeksRemaining.high > weeksAtTen.high);
    assert.equal((await h.api('GET', '/users/me/learning-preferences', { token: alice.token })).body.data.hoursPerWeek, 4, 'the setting is stored');

    for (const bad of [0, 61, 2.5, -3, 'ten', undefined]) {
      const res = await prefs(alice.token, bad);
      assert.equal(res.status, 400, `hoursPerWeek ${JSON.stringify(bad)}`);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    }
    assert.equal((await h.api('PUT', '/users/me/learning-preferences', { token: alice.token, json: { hoursPerWeek: 5, userId: bob.userId } })).status, 400);
    assert.equal((await h.api('GET', '/users/me/learning-preferences', { token: alice.token })).body.data.hoursPerWeek, 4, 'rejected values change nothing');
    assert.equal((await h.api('GET', '/users/me/learning-preferences', { token: bob.token })).body.data.hoursPerWeek, null, "another user's setting is their own");
    assert.equal((await h.api('GET', '/users/me/learning-preferences')).status, 401);
    assert.equal((await h.api('PUT', '/users/me/learning-preferences', { json: { hoursPerWeek: 5 } })).status, 401);
    assert.equal((await h.api('GET', `/roadmap/${careerId}/schedule`)).status, 401);
    assert.equal((await scheduleOf(bob.token)).status, 404, "another user has no schedule for Alice's roadmap");
    assert.equal((await h.api('GET', '/roadmap/not-an-id/schedule', { token: alice.token })).status, 400);
    console.log(`  ✓ Weekly hours: none assumed; ${expectedHours.low}-${expectedHours.high} h is ${weeksAtTen.low}-${weeksAtTen.high} weeks at 10 h and ${schedule.weeksRemaining.low}-${schedule.weeksRemaining.high} at 4 h; invalid values rejected; private per user`);

    // === Progress moves the schedule, here and on the dashboard ====================================
    const learnTs = items.find(i => i.title === 'Learn TypeScript');
    const learnTesting = items.find(i => i.title === 'Learn Testing');
    assert.ok(learnTs && learnTesting, 'the roadmap covers the gaps of this resume');
    assert.equal((await setStatus(learnTs._id, 'completed')).status, 200);
    assert.equal((await setStatus(learnTesting._id, 'in_progress')).status, 200);
    const afterProgress = (await scheduleOf()).body.data;
    assert.equal(afterProgress.schedule.remainingItems, items.length - 1);
    assert.equal(afterProgress.schedule.remainingHours.high, expectedHours.high - effortFor(learnTs).highHours, 'a finished item leaves the plan; a started one is still planned in full');
    assert.deepEqual(afterProgress.schedule.items.find((i: any) => i.title === 'Build a project that uses TypeScript').blockedBy, [], 'finishing a prerequisite unblocks what depends on it');
    assert.equal(afterProgress.schedule.items.find((i: any) => i.title === 'Learn TypeScript').finish, null);
    assert.ok(afterProgress.progressPercentage > 0);

    const snapshot = (await h.api('GET', '/users/me/career-snapshot', { token: alice.token })).body.data;
    const onDashboard = (snapshot.snapshot ?? snapshot).roadmap.schedule;
    assert.deepEqual(
      onDashboard,
      {
        hoursPerWeek: 4,
        remainingItems: afterProgress.schedule.remainingItems,
        remainingHours: afterProgress.schedule.remainingHours,
        weeksRemaining: afterProgress.schedule.weeksRemaining,
        finishBetween: afterProgress.schedule.finishBetween,
        nextItemTitle: afterProgress.schedule.nextItem.title
      },
      'the dashboard shows the same plan'
    );
    console.log('  ✓ Progress: completing an item shortens the plan and unblocks its dependants; the dashboard carries the same figures');

    // === Regeneration keeps what was done ==========================================================
    assert.equal((await h.api('POST', `/roadmap/${careerId}/regenerate`, { token: alice.token })).status, 200);
    let after = itemsOf(await roadmapOf());
    assert.deepEqual(after.map(i => [i._id, i.title, i.status]).sort(), itemsOf(await roadmapOf()).map(i => [i._id, i.title, i.status]).sort());
    assert.equal(after.find(i => i.title === 'Learn TypeScript').status, 'completed');
    assert.equal(after.find(i => i.title === 'Learn TypeScript')._id, learnTs._id, 'an item keeps its id across regeneration');
    assert.ok(after.find(i => i.title === 'Learn TypeScript').completedAt, 'and the date it was completed');
    assert.equal(after.find(i => i.title === 'Learn Testing').status, 'in_progress');
    let update = (await scheduleOf()).body.data.lastUpdate;
    assert.deepEqual({ added: update.changes.added, removed: update.changes.removed, preserved: update.changes.preserved }, { added: [], removed: [], preserved: 2 });
    assert.match(update.details, /No items were added or removed\. 2 items you had started or finished were kept\./);

    // === New evidence adjusts the roadmap ============================================================
    // The replacement resume shows TypeScript used in a project
    const replaced = await h.api('PUT', '/resumes/replace', {
      token: alice.token,
      form: resumeForm(resume('REST service written in TypeScript and Node.js, tracked with Git.', 'React, JavaScript, HTML, CSS, Node.js, Git, TypeScript'))
    });
    assert.ok([200, 201].includes(replaced.status));
    await waitForResume(h, alice.token);
    after = itemsOf(await roadmapOf());
    const kept = after.find(i => i.title === 'Learn TypeScript');
    assert.ok(kept && kept.status === 'completed' && kept._id === learnTs._id, 'finished work stays although the gap it addressed is closed');
    assert.equal(after.find(i => i.title === 'Learn Testing')?.status, 'in_progress');
    assert.ok(!after.some(i => i.title === 'Build a project that uses TypeScript'), 'an untouched item for a skill that is now evidenced is dropped');
    assert.ok(after.some(i => i.title === 'Learn REST APIs' && i.status === 'not_started'), 'items for gaps that remain are untouched');
    update = (await scheduleOf()).body.data.lastUpdate;
    assert.deepEqual(
      update.changes.removed,
      [{ title: 'Build a project that uses TypeScript', targetSkill: 'TypeScript', reason: 'evidenced' }]
    );
    assert.match(update.details, /Build a project that uses TypeScript \(TypeScript is now on your profile\)/);
    assert.equal(update.changes.preserved, 2);
    const adjusted = (await scheduleOf()).body.data.schedule;
    assert.ok(adjusted.remainingHours.high < afterProgress.schedule.remainingHours.high, 'less is left to do once evidence closes gaps');
    assert.equal(adjusted.hoursPerWeek, 4, 'the weekly hours survive a new resume');
    assert.equal(adjusted.totalItems, after.length);
    console.log(`  ✓ Adjustment: regeneration keeps ids, completion dates and started work; new evidence removed ${update.changes.removed.length} item(s) and the history says why`);

    // Clearing the hours removes the dates again
    assert.equal((await prefs(alice.token, null)).status, 200);
    assert.equal((await scheduleOf()).body.data.schedule.weeksRemaining, null);

    console.log('✅ Learning Plan Tests Passed\n');
  } finally {
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runLearningPlanTests();
    } catch (err) {
      console.error('❌ Learning Plan Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
