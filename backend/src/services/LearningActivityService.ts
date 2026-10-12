import mongoose from 'mongoose';
import { ProgressEvent, EventType } from '../models/ProgressEvent.js';
import Notification, { type INotification, type NotificationKind } from '../models/Notification.js';
import { LearningRoadmap } from '../models/LearningRoadmap.js';
import { User } from '../models/User.js';
import { AppError } from '../middlewares/errorHandler.js';
import logger from '../config/logger.js';

/**
 * Learning streaks and in-app notifications.
 *
 * A streak counts days on which SkillBridge recorded the user doing something: finishing a
 * roadmap item, submitting a skill check, working on a practice project, adding portfolio work
 * or completing a mock interview. Days are UTC calendar days, because no time zone is stored.
 * Opening the app, or anything the user merely says they did elsewhere, does not count.
 *
 * Notifications are off until the user switches a kind on. They exist only inside the app and
 * are created at most once per occasion. Reminders are worked out when the user opens the app;
 * nothing runs on a timer.
 */
export const LEARNING_EVENTS: EventType[] = [
  EventType.ROADMAP_ITEM_COMPLETED,
  EventType.SKILL_CHECK_SUBMITTED,
  EventType.PRACTICE_PROJECT_PROGRESS,
  EventType.PORTFOLIO_ENTRY_ADDED,
  EventType.INTERVIEW_COMPLETED
];

export const EVENT_LABEL: Record<string, string> = {
  [EventType.ROADMAP_ITEM_COMPLETED]: 'Finished a roadmap item',
  [EventType.SKILL_CHECK_SUBMITTED]: 'Took a skill check',
  [EventType.PRACTICE_PROJECT_PROGRESS]: 'Worked on a practice project',
  [EventType.PORTFOLIO_ENTRY_ADDED]: 'Added work to the portfolio',
  [EventType.INTERVIEW_COMPLETED]: 'Completed a mock interview'
};

export const STREAK_MILESTONES = [3, 7, 14, 30] as const;
export const REMINDER_POLICY = {
  /** Days without recorded activity before one reminder is created. */
  inactiveDays: 7,
  /** Days a roadmap item may sit "in progress" before one reminder is created. */
  stalledDays: 14
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const dayOf = (date: Date): string => date.toISOString().slice(0, 10);
const dayBefore = (day: string): string => dayOf(new Date(new Date(`${day}T00:00:00.000Z`).getTime() - DAY_MS));
const daysBetween = (from: string, to: string): number => Math.round((new Date(`${to}T00:00:00.000Z`).getTime() - new Date(`${from}T00:00:00.000Z`).getTime()) / DAY_MS);

export interface Streak {
  /** Consecutive active days ending today or yesterday; 0 otherwise. */
  current: number;
  /** First day of the current streak. */
  currentStartedOn: string | null;
  longest: number;
  activeToday: boolean;
  lastActiveOn: string | null;
  activeDaysLast30: number;
}

/** Streak figures from a list of active days (YYYY-MM-DD, any order, duplicates allowed). */
export function computeStreak(activeDays: string[], today: string): Streak {
  const days = [...new Set(activeDays)].filter(day => day <= today).sort();
  const set = new Set(days);
  const lastActiveOn = days.length > 0 ? days[days.length - 1] : null;

  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of days) {
    run = previous && dayBefore(day) === previous ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }

  // A streak is still alive on the day after the last active day, until that day ends
  let cursor = set.has(today) ? today : dayBefore(today);
  let current = 0;
  let currentStartedOn: string | null = null;
  while (set.has(cursor)) {
    current++;
    currentStartedOn = cursor;
    cursor = dayBefore(cursor);
  }

  const windowStart = dayOf(new Date(new Date(`${today}T00:00:00.000Z`).getTime() - 29 * DAY_MS));
  return {
    current,
    currentStartedOn,
    longest,
    activeToday: set.has(today),
    lastActiveOn,
    activeDaysLast30: days.filter(day => day >= windowStart).length
  };
}

class LearningActivityService {
  // ------------------------------------------------------------------------------------------
  // Activity and streaks
  // ------------------------------------------------------------------------------------------

  /** Records something the user did, then creates any streak milestone it completes. */
  public async recordActivity(userId: string, eventType: EventType, details: Record<string, unknown> = {}, entityId?: string): Promise<void> {
    try {
      await ProgressEvent.create({
        userId: new mongoose.Types.ObjectId(userId),
        eventType,
        details,
        entityId: entityId && mongoose.Types.ObjectId.isValid(entityId) ? new mongoose.Types.ObjectId(entityId) : undefined
      });
      await this.checkStreakMilestone(userId, new Date());
    } catch (error) {
      // Activity logging must never fail the action that caused it
      logger.error(`Failed to record learning activity ${eventType} for user ${userId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async streak(userId: string, now: Date = new Date()): Promise<Streak> {
    const events = await ProgressEvent.find({ userId: new mongoose.Types.ObjectId(userId), eventType: { $in: LEARNING_EVENTS } })
      .select('createdAt')
      .lean();
    return computeStreak(events.map(e => dayOf(new Date(e.createdAt))), dayOf(now));
  }

  private async checkStreakMilestone(userId: string, now: Date): Promise<void> {
    const streak = await this.streak(userId, now);
    const reached = [...STREAK_MILESTONES].reverse().find(n => streak.current >= n);
    if (!reached || !streak.currentStartedOn) return;
    await this.notify(userId, 'milestone', `streak:${reached}:${streak.currentStartedOn}`, `${reached}-day learning streak`, `You have recorded learning activity on ${streak.current} days in a row.`, '/activity');
  }

  // ------------------------------------------------------------------------------------------
  // Notifications
  // ------------------------------------------------------------------------------------------

  private async consent(userId: string): Promise<{ reminders: boolean; milestoneNotifications: boolean }> {
    const user = await User.findById(userId).select('learningPreferences').lean();
    return { reminders: Boolean(user?.learningPreferences?.reminders), milestoneNotifications: Boolean(user?.learningPreferences?.milestoneNotifications) };
  }

  /**
   * Creates a notification if the user has switched that kind on and none exists for the same
   * occasion. Returns true when one was created.
   */
  public async notify(userId: string, kind: NotificationKind, key: string, title: string, body: string, link: string): Promise<boolean> {
    try {
      const consent = await this.consent(userId);
      if (kind === 'milestone' ? !consent.milestoneNotifications : !consent.reminders) return false;
      const result = await Notification.updateOne(
        { userId: new mongoose.Types.ObjectId(userId), key },
        { $setOnInsert: { kind, title, body, link, readAt: null, dismissedAt: null } },
        { upsert: true }
      );
      return result.upsertedCount === 1;
    } catch (error) {
      // Two requests racing for the same occasion: the unique index keeps one
      if ((error as { code?: number }).code === 11000) return false;
      logger.error(`Failed to create notification ${key} for user ${userId}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /** Works out what is due now: streak milestones and, if switched on, reminders. */
  public async refresh(userId: string, now: Date = new Date()): Promise<void> {
    await this.checkStreakMilestone(userId, now);
    const consent = await this.consent(userId);
    if (!consent.reminders) return;

    const uid = new mongoose.Types.ObjectId(userId);
    const roadmaps = await LearningRoadmap.find({ userId: uid });
    const items = roadmaps.flatMap(r => r.phases.flatMap(p => p.items));
    const next = items.find(i => i.status === 'not_started' || i.status === 'in_progress');

    const streak = await this.streak(userId, now);
    if (next && streak.lastActiveOn) {
      const idle = daysBetween(streak.lastActiveOn, dayOf(now));
      if (idle >= REMINDER_POLICY.inactiveDays) {
        await this.notify(userId, 'reminder', `inactive:${streak.lastActiveOn}`, `No learning activity recorded for ${idle} days`, `Your next roadmap item is "${next.title}".`, '/roadmap');
      }
    }
    for (const item of items) {
      if (item.status !== 'in_progress' || !item.startedAt || !item._id) continue;
      const days = Math.floor((now.getTime() - new Date(item.startedAt).getTime()) / DAY_MS);
      if (days >= REMINDER_POLICY.stalledDays) {
        await this.notify(userId, 'reminder', `stalled:${item._id.toString()}`, `"${item.title}" has been in progress for ${days} days`, 'Finish it, or set it back to not started if your plans changed.', '/roadmap');
      }
    }
  }

  public async overview(userId: string, now: Date = new Date()) {
    await this.refresh(userId, now);
    const uid = new mongoose.Types.ObjectId(userId);
    const [notifications, unreadCount, recent, consent, streak] = await Promise.all([
      Notification.find({ userId: uid, dismissedAt: null }).sort({ createdAt: -1, _id: -1 }).limit(30),
      Notification.countDocuments({ userId: uid, readAt: null, dismissedAt: null }),
      ProgressEvent.find({ userId: uid, eventType: { $in: LEARNING_EVENTS } }).sort({ createdAt: -1, _id: -1 }).limit(10).lean(),
      this.consent(userId),
      this.streak(userId, now)
    ]);
    return {
      streak,
      recent: recent.map(e => ({ at: e.createdAt, type: e.eventType, label: EVENT_LABEL[e.eventType] || e.eventType })),
      notifications: notifications.map(n => this.present(n)),
      unreadCount,
      preferences: consent,
      policy: { streakMilestones: STREAK_MILESTONES, ...REMINDER_POLICY },
      note:
        'A day counts when SkillBridge recorded you finishing a roadmap item, taking a skill check, working on a practice project, adding portfolio work or completing a mock interview. Days are UTC calendar days. Notifications appear only here, only for the kinds you switched on, and reminders are worked out when you open the app.'
    };
  }

  public async unreadCount(userId: string): Promise<number> {
    await this.refresh(userId);
    return Notification.countDocuments({ userId: new mongoose.Types.ObjectId(userId), readAt: null, dismissedAt: null });
  }

  public async markRead(userId: string, notificationId: string): Promise<void> {
    const notification = await this.owned(userId, notificationId);
    if (!notification.readAt) {
      notification.readAt = new Date();
      await notification.save();
    }
  }

  public async markAllRead(userId: string): Promise<number> {
    const result = await Notification.updateMany({ userId: new mongoose.Types.ObjectId(userId), readAt: null, dismissedAt: null }, { $set: { readAt: new Date() } });
    return result.modifiedCount;
  }

  public async remove(userId: string, notificationId: string): Promise<void> {
    const notification = await this.owned(userId, notificationId);
    notification.dismissedAt = new Date();
    await notification.save();
  }

  public async removeAll(userId: string): Promise<number> {
    const result = await Notification.updateMany({ userId: new mongoose.Types.ObjectId(userId), dismissedAt: null }, { $set: { dismissedAt: new Date() } });
    return result.modifiedCount;
  }

  private async owned(userId: string, notificationId: string): Promise<INotification> {
    const notFound = new AppError('Notification not found.', 404, 'NOTIFICATION_NOT_FOUND');
    if (!mongoose.Types.ObjectId.isValid(notificationId)) throw notFound;
    const notification = await Notification.findOne({ _id: new mongoose.Types.ObjectId(notificationId), userId: new mongoose.Types.ObjectId(userId), dismissedAt: null });
    if (!notification) throw notFound;
    return notification;
  }

  private present(notification: INotification) {
    return {
      id: notification._id.toString(),
      kind: notification.kind,
      title: notification.title,
      body: notification.body,
      link: notification.link,
      read: Boolean(notification.readAt),
      at: notification.createdAt
    };
  }
}

export default new LearningActivityService();
