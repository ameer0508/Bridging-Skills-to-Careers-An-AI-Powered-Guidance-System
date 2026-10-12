import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import { ProgressEvent, EventType } from '../models/ProgressEvent.js';
import Notification from '../models/Notification.js';
import { LearningRoadmap } from '../models/LearningRoadmap.js';
import LearningActivityService, { computeStreak, LEARNING_EVENTS, REMINDER_POLICY } from '../services/LearningActivityService.js';
import { SKILL_ASSESSMENTS } from '../seed/skillAssessments.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness, resumeForm, type HttpHarness } from './helpers/httpHarness.js';

/**
 * Learning streaks from recorded activity, and opt-in in-app notifications: consent, one per
 * occasion, reminders worked out on read, ownership.
 */

const RESUME = [
  'Sam Candidate',
  'Email: sam.candidate@example.com',
  '',
  'Experience:',
  'Frontend Developer at Example Co (2022-2023)',
  'Built dashboards with React, JavaScript, HTML and CSS.',
  '',
  'Projects:',
  'Shop API',
  'REST service written in Node.js, tracked with Git.',
  '',
  'Skills:',
  'React, JavaScript, HTML, CSS, Node.js, Git'
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

const DAY = 24 * 60 * 60 * 1000;

export async function runLearningActivityTests() {
  console.log('🧪 Running Learning Activity & Notification Tests...');

  // === Streak arithmetic ========================================================================
  const today = '2026-10-12';
  assert.deepEqual(computeStreak([], today), { current: 0, currentStartedOn: null, longest: 0, activeToday: false, lastActiveOn: null, activeDaysLast30: 0 });
  assert.deepEqual(computeStreak(['2026-10-12', '2026-10-11', '2026-10-10', '2026-10-10'], today), {
    current: 3,
    currentStartedOn: '2026-10-10',
    longest: 3,
    activeToday: true,
    lastActiveOn: '2026-10-12',
    activeDaysLast30: 3
  });
  const yesterday = computeStreak(['2026-10-11', '2026-10-10'], today);
  assert.deepEqual([yesterday.current, yesterday.activeToday], [2, false], 'a streak is still alive on the day after the last active day');
  const broken = computeStreak(['2026-10-10', '2026-10-09', '2026-10-08', '2026-10-01'], today);
  assert.deepEqual([broken.current, broken.longest, broken.lastActiveOn], [0, 3, '2026-10-10'], 'a missed day ends the streak; the longest run is kept');
  assert.equal(computeStreak(['2026-09-30', '2026-10-01'], '2026-10-01').current, 2, 'runs cross month ends');
  assert.equal(computeStreak(['2026-10-13'], today).current, 0, 'a day in the future is ignored');
  assert.equal(computeStreak(['2026-09-12', '2026-09-13', '2026-10-12'], today).activeDaysLast30, 2, 'the 30-day window includes today and the 29 days before it');
  assert.ok(!LEARNING_EVENTS.includes(EventType.RESUME_UPLOADED) && !LEARNING_EVENTS.includes(EventType.OPPORTUNITY_SAVED), 'uploading a resume or saving a job is not learning activity');
  console.log('  ✓ Streak: consecutive UTC days, alive until the end of the next day, longest run kept, future days ignored');

  await ensureFakeAiService();
  await CareerService.seedInitialTaxonomy();
  const h = await startHttpHarness();

  try {
    const alice = await h.registerUser('alice');
    const bob = await h.registerUser('bob');
    assert.ok([200, 201].includes((await h.api('POST', '/resumes/upload', { token: alice.token, form: resumeForm(RESUME) })).status));
    await waitForResume(h, alice.token);

    const activity = async (token = alice.token) => (await h.api('GET', '/activity', { token })).body.data;
    const prefs = (token: string, json: unknown) => h.api('PUT', '/users/me/learning-preferences', { token, json });
    const passSkillCheck = async (skill: string, token = alice.token) => {
      const attempt = (await h.api('POST', '/skills/assessments', { token, json: { skill } })).body.data.attempt;
      const answers = attempt.questions.map((q: any) => {
        const question = SKILL_ASSESSMENTS[skill].find(b => b.prompt === q.prompt)!;
        return q.options.indexOf(question.options[question.answer]);
      });
      return (await h.api('POST', `/skills/assessments/${attempt.attemptId}/submit`, { token, json: { answers } })).body.data;
    };

    // === Nothing is assumed and nothing is sent before the user opts in ===========================
    let view = await activity();
    assert.deepEqual(view.streak, { current: 0, currentStartedOn: null, longest: 0, activeToday: false, lastActiveOn: null, activeDaysLast30: 0 }, 'uploading a resume does not start a streak');
    assert.deepEqual([view.notifications, view.unreadCount, view.recent], [[], 0, []]);
    assert.deepEqual(view.preferences, { reminders: false, milestoneNotifications: false }, 'both kinds are off by default');

    assert.equal((await passSkillCheck('JavaScript')).passed, true);
    view = await activity();
    assert.deepEqual([view.streak.current, view.streak.activeToday, view.recent.length], [1, true, 1], 'a submitted skill check is recorded activity');
    assert.equal(view.recent[0].label, 'Took a skill check');
    assert.deepEqual(view.notifications, [], 'a milestone reached before opting in is not announced');
    assert.equal(await Notification.countDocuments({ userId: alice.userId }), 0, 'and nothing is stored for later');

    // === Milestones, once each =======================================================================
    assert.deepEqual((await prefs(alice.token, { milestoneNotifications: true })).body.data, { hoursPerWeek: null, reminders: false, milestoneNotifications: true, limits: { min: 1, max: 60 } });
    assert.equal((await passSkillCheck('Git')).passed, true);
    view = await activity();
    assert.equal(view.notifications.length, 1);
    assert.deepEqual(
      { kind: view.notifications[0].kind, title: view.notifications[0].title, read: view.notifications[0].read, link: view.notifications[0].link },
      { kind: 'milestone', title: 'Git verified by skill check', read: false, link: '/career-lab' }
    );
    assert.match(view.notifications[0].body, /not as a certification/);
    assert.equal(view.unreadCount, 1);
    assert.equal((await passSkillCheck('Git')).evidence.added, false);
    assert.equal((await activity()).notifications.length, 1, 'passing the same skill check again is not announced twice');

    // A roadmap phase and a practice project
    const careerId = ((await h.api('GET', '/careers/matches', { token: alice.token })).body.data.matches as any[])[0].careerId._id;
    const roadmap = (await h.api('GET', `/roadmap/${careerId}`, { token: alice.token })).body.data.roadmap;
    for (const item of roadmap.phases[0].items) {
      assert.equal((await h.api('PATCH', `/roadmap/${careerId}/items/${item._id}/status`, { token: alice.token, json: { status: 'completed' } })).status, 200);
    }
    const suggestion = (await h.api('GET', '/projects/suggestions', { token: alice.token })).body.data.suggestions[0];
    const project = (await h.api('POST', '/projects', { token: alice.token, json: { briefId: suggestion.briefId } })).body.data.project;
    assert.equal((await h.api('PATCH', `/projects/${project.id}`, { token: alice.token, json: { status: 'completed' } })).status, 200);
    assert.equal((await h.api('PATCH', `/projects/${project.id}`, { token: alice.token, json: { status: 'in_progress' } })).status, 200);
    assert.equal((await h.api('PATCH', `/projects/${project.id}`, { token: alice.token, json: { status: 'completed' } })).status, 200);
    view = await activity();
    const titles = view.notifications.map((n: any) => n.title);
    assert.equal(titles.filter((t: string) => t.startsWith('Roadmap phase finished:')).length, 1, 'one notice for the finished phase, however many items it had');
    assert.equal(titles.filter((t: string) => t.startsWith('Practice project marked complete:')).length, 1, 'completing, reopening and completing again announces once');
    assert.equal(view.notifications.length, 3);
    assert.equal(view.streak.current, 1, 'several activities on one day are one day');
    const types = new Set(view.recent.map((e: any) => e.type));
    assert.ok(types.has('roadmap_item_completed') && types.has('practice_project_progress') && types.has('skill_check_submitted'));
    console.log('  ✓ Milestones: none before opting in; afterwards one per occasion (skill check, roadmap phase, practice project)');

    // === A streak milestone from real days ==========================================================
    // Activity on the two previous days, recorded as it would have been
    await ProgressEvent.collection.insertMany([1, 2].map(daysAgo => ({ userId: new mongoose.Types.ObjectId(alice.userId), eventType: EventType.ROADMAP_ITEM_COMPLETED, details: {}, createdAt: new Date(Date.now() - daysAgo * DAY), updatedAt: new Date() })));
    view = await activity();
    assert.equal(view.streak.current, 3);
    const streakNotice = view.notifications.filter((n: any) => n.title === '3-day learning streak');
    assert.equal(streakNotice.length, 1);
    assert.equal((await activity()).notifications.filter((n: any) => n.title === '3-day learning streak').length, 1, 'reading again does not repeat it');

    // === Read, dismiss, and no reappearance ==========================================================
    const first = view.notifications[0];
    assert.equal((await h.api('POST', `/activity/notifications/${first.id}/read`, { token: alice.token })).status, 200);
    assert.equal((await h.api('GET', '/activity/unread-count', { token: alice.token })).body.data.unreadCount, view.unreadCount - 1);
    assert.equal((await h.api('DELETE', `/activity/notifications/${streakNotice[0].id}`, { token: alice.token })).status, 200);
    view = await activity();
    assert.ok(!view.notifications.some((n: any) => n.title === '3-day learning streak'), 'a dismissed notification does not come back while its occasion still holds');
    assert.equal((await h.api('POST', '/activity/notifications/read-all', { token: alice.token })).status, 200);
    assert.equal((await activity()).unreadCount, 0);

    // === Reminders: opt-in, worked out on read, once per lapse ======================================
    const later = new Date(Date.now() + (REMINDER_POLICY.inactiveDays + 1) * DAY);
    await LearningActivityService.refresh(alice.userId, later);
    assert.equal(await Notification.countDocuments({ userId: alice.userId, kind: 'reminder' }), 0, 'no reminder without consent, however long the gap');
    assert.equal((await prefs(alice.token, { reminders: true })).body.data.reminders, true);
    await LearningActivityService.refresh(alice.userId, later);
    await LearningActivityService.refresh(alice.userId, new Date(later.getTime() + DAY));
    let reminders = await Notification.find({ userId: alice.userId, kind: 'reminder' });
    assert.equal(reminders.length, 1, 'one reminder per lapse, not one per day');
    assert.match(reminders[0].title, /^No learning activity recorded for \d+ days$/);
    assert.match(reminders[0].body, /^Your next roadmap item is "/);
    await LearningActivityService.refresh(alice.userId, new Date());
    assert.equal(await Notification.countDocuments({ userId: alice.userId, kind: 'reminder' }), 1, 'no reminder while activity is recent');

    // An item left in progress
    const pending = roadmap.phases.flatMap((p: any) => p.items).find((i: any) => !roadmap.phases[0].items.some((d: any) => d._id === i._id));
    assert.equal((await h.api('PATCH', `/roadmap/${careerId}/items/${pending._id}/status`, { token: alice.token, json: { status: 'in_progress' } })).status, 200);
    await LearningRoadmap.updateOne({ userId: alice.userId, careerId }, { $set: { 'phases.$[].items.$[item].startedAt': new Date(Date.now() - (REMINDER_POLICY.stalledDays + 1) * DAY) } }, { arrayFilters: [{ 'item._id': new mongoose.Types.ObjectId(pending._id) }] });
    view = await activity();
    view = await activity();
    const stalled = view.notifications.filter((n: any) => n.kind === 'reminder' && n.title.includes('has been in progress for'));
    assert.equal(stalled.length, 1);
    assert.ok(stalled[0].title.includes(pending.title));

    // Switching a kind off stops new ones; what was shown stays until dismissed
    assert.equal((await prefs(alice.token, { reminders: false, milestoneNotifications: false })).status, 200);
    const count = await Notification.countDocuments({ userId: alice.userId });
    assert.equal((await passSkillCheck('Docker')).passed, true);
    await LearningActivityService.refresh(alice.userId, new Date(Date.now() + 60 * DAY));
    assert.equal(await Notification.countDocuments({ userId: alice.userId }), count, 'nothing new after opting out');
    assert.ok((await h.api('DELETE', '/activity/notifications', { token: alice.token })).body.data.dismissed >= 1);
    assert.deepEqual((await activity()).notifications, []);
    reminders = [];
    console.log(`  ✓ Reminders: only with consent, after ${REMINDER_POLICY.inactiveDays} idle days or ${REMINDER_POLICY.stalledDays} days in progress, once per occasion; opting out stops new ones`);

    // === Ownership and validation ====================================================================
    await prefs(bob.token, { milestoneNotifications: true });
    assert.equal((await passSkillCheck('Git', bob.token)).passed, true);
    const bobNotice = (await activity(bob.token)).notifications[0];
    assert.equal((await h.api('POST', `/activity/notifications/${bobNotice.id}/read`, { token: alice.token })).status, 404);
    assert.equal((await h.api('DELETE', `/activity/notifications/${bobNotice.id}`, { token: alice.token })).status, 404);
    assert.equal((await activity(bob.token)).notifications.length, 1, "another user's notification is untouched");
    assert.equal((await h.api('POST', '/activity/notifications/not-an-id/read', { token: alice.token })).status, 404);
    for (const bad of [{ reminders: 'yes' }, { milestoneNotifications: 1 }, {}, { reminders: true, sms: true }]) {
      assert.equal((await prefs(alice.token, bad)).status, 400, JSON.stringify(bad));
    }
    for (const [method, path] of [['GET', '/activity'], ['GET', '/activity/unread-count'], ['POST', '/activity/notifications/read-all'], ['DELETE', '/activity/notifications'], ['POST', `/activity/notifications/${bobNotice.id}/read`]] as const) {
      assert.equal((await h.api(method, path)).status, 401, `${method} ${path} requires sign-in`);
    }
    console.log('  ✓ Notifications are private to their owner; invalid settings rejected; every endpoint requires sign-in');

    console.log('✅ Learning Activity & Notification Tests Passed\n');
  } finally {
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runLearningActivityTests();
    } catch (err) {
      console.error('❌ Learning Activity Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
