import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import SavedOpportunity, {
  ApplicationStatus,
  IStatusHistoryEntry,
  ISavedOpportunity,
} from '../../models/SavedOpportunity.js';
import { AppError } from '../../middlewares/errorHandler.js';

/**
 * Per-application history (X8), over the same SavedOpportunity records C6 analyses.
 *
 * - Every event is something the user recorded. Nothing is received from or invented for an
 *   employer. Where C6 infers an application (an interview recorded without one), the timeline
 *   shows it as `origin: 'inferred'` and it is never stored.
 * - An event's date (`changedAt`) is what analytics read. When the user states or corrects a date,
 *   `dateSource` becomes 'user_stated' and `editedAt` records the correction.
 * - After any change the current status is the latest event's, and `appliedAt` is the earliest
 *   application event, so C6 reflects corrections immediately.
 * - The same stage on the same UTC day is a duplicate and is refused.
 */

export const EVENT_STATUSES: ApplicationStatus[] = ['applied', 'interviewing', 'offer', 'rejected', 'withdrawn'];
const EARLIEST_EVENT = Date.UTC(2000, 0, 1);
const CLOCK_SKEW_MS = 5 * 60 * 1000;
const MAX_EVENTS = 200;

export interface TimelineEvent {
  id: string | null;
  status: ApplicationStatus;
  occurredAt: string;
  origin: 'recorded' | 'inferred';
  /** recorded_at_change: the time the status was changed in SkillBridge; user_stated: a date the user entered. */
  dateSource: 'recorded_at_change' | 'user_stated' | 'inferred';
  recordedAt: string | null;
  editedAt: string | null;
  note: string;
  /** Saved events cannot be removed: they mark when tracking began. */
  removable: boolean;
  explanation?: string;
}

export interface ApplicationSummary {
  id: string;
  title: string;
  company: string;
  location: string;
  applicationUrl: string;
  provider: string;
  isSample: boolean;
  isManual: boolean;
  status: ApplicationStatus;
  /** True once an application event exists, recorded or inferred. Saving is not applying. */
  applied: boolean;
  appliedAt: string | null;
  lastEventAt: string | null;
  savedAt: string;
  reminder: { at: string; note: string; due: boolean } | null;
}

export interface ApplicationHistory {
  application: ApplicationSummary;
  timeline: TimelineEvent[];
  notes: string[];
}

const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString() : null);
const dayOf = (d: Date) => new Date(d).toISOString().slice(0, 10);

/** Events in date order; ties keep the order in which they were recorded. */
function chronological(entries: IStatusHistoryEntry[]): IStatusHistoryEntry[] {
  return entries
    .map((e, i) => ({ e, i }))
    .sort((a, b) => new Date(a.e.changedAt).getTime() - new Date(b.e.changedAt).getTime() || a.i - b.i)
    .map(x => x.e);
}

/** Current status and application date implied by the events. */
export function deriveState(entries: IStatusHistoryEntry[]): { status: ApplicationStatus; appliedAt: Date | null } {
  const ordered = chronological(entries);
  // 'saved' marks when tracking began, which can be after an application made elsewhere; it is
  // not a stage, so the current status is the latest real stage
  const stages = ordered.filter(e => e.status !== 'saved');
  const status = stages.length ? stages[stages.length - 1].status : 'saved';
  const applied = ordered.find(e => e.status === 'applied');
  return { status, appliedAt: applied ? new Date(applied.changedAt) : null };
}

/** Validates a user-stated event date: a real date between 2000-01-01 and now. */
export function parseEventDate(value: string): Date {
  const when = new Date(value);
  if (Number.isNaN(when.getTime())) throw new AppError('Invalid request: occurredAt is not a valid date', 400, 'VALIDATION_ERROR');
  if (when.getTime() > Date.now() + CLOCK_SKEW_MS) {
    throw new AppError('Invalid request: occurredAt cannot be in the future. Record events once they have happened.', 400, 'VALIDATION_ERROR');
  }
  if (when.getTime() < EARLIEST_EVENT) throw new AppError('Invalid request: occurredAt must be after 2000-01-01', 400, 'VALIDATION_ERROR');
  return when;
}

export function buildTimeline(doc: Pick<ISavedOpportunity, 'statusHistory' | 'appliedAt'>): { timeline: TimelineEvent[]; notes: string[] } {
  const ordered = chronological(doc.statusHistory || []);
  const timeline: TimelineEvent[] = ordered.map(e => ({
    id: e._id ? String(e._id) : null,
    status: e.status,
    occurredAt: new Date(e.changedAt).toISOString(),
    origin: 'recorded',
    dateSource: e.dateSource ?? 'recorded_at_change',
    recordedAt: iso(e.recordedAt) ?? new Date(e.changedAt).toISOString(),
    editedAt: iso(e.editedAt),
    note: e.note ?? '',
    removable: e.status !== 'saved',
  }));
  const notes: string[] = [];

  // Same rules as C6: a stored application date, or else an interview, offer or rejection,
  // means an application was made
  const storedAppliedAt = doc.appliedAt && !Number.isNaN(new Date(doc.appliedAt).getTime()) ? new Date(doc.appliedAt) : null;
  if (!ordered.some(e => e.status === 'applied') && storedAppliedAt) {
    const at = storedAppliedAt.toISOString();
    const position = timeline.findIndex(t => t.occurredAt > at);
    timeline.splice(position === -1 ? timeline.length : position, 0, {
      id: null,
      status: 'applied',
      occurredAt: at,
      origin: 'inferred',
      dateSource: 'inferred',
      recordedAt: null,
      editedAt: null,
      note: '',
      removable: false,
      explanation: 'An application date was stored without a matching event (older record). Add the application event to replace this.',
    });
  } else if (!ordered.some(e => e.status === 'applied')) {
    const firstOutcome = ordered.find(e => ['interviewing', 'offer', 'rejected'].includes(e.status));
    if (firstOutcome) {
      const at = new Date(firstOutcome.changedAt).toISOString();
      const position = timeline.findIndex(t => t.occurredAt === at && t.status === firstOutcome.status);
      timeline.splice(position, 0, {
        id: null,
        status: 'applied',
        occurredAt: at,
        origin: 'inferred',
        dateSource: 'inferred',
        recordedAt: null,
        editedAt: null,
        note: '',
        removable: false,
        explanation: `Not recorded. A ${firstOutcome.status === 'interviewing' ? 'interview' : firstOutcome.status} was recorded, so an application must have been made by this date. Add the real application date to replace this.`,
      });
      notes.push('The application date is inferred from a later event; analytics use the same inference.');
    }
  }
  const appliedEvent = ordered.find(e => e.status === 'applied');
  if (appliedEvent && ordered.some(e => ['interviewing', 'offer', 'rejected'].includes(e.status) && new Date(e.changedAt) < new Date(appliedEvent.changedAt))) {
    notes.push('An interview, offer or rejection is dated before the application. One of the dates is probably wrong; correct it so the history and analytics agree.');
  }
  if (timeline.some(t => t.dateSource === 'recorded_at_change')) {
    notes.push('Dates marked "recorded in SkillBridge" are when the status was changed here, which may be later than the real event. Correct them if you know the actual date.');
  }
  if (!timeline.some(t => t.status !== 'saved')) {
    notes.push('Saved only: this job is not counted as an application until you record that you applied.');
  }
  return { timeline, notes };
}

export function summarise(doc: ISavedOpportunity, now = Date.now()): ApplicationSummary {
  const { timeline } = buildTimeline(doc);
  const applied = timeline.find(t => t.status === 'applied');
  return {
    id: String(doc._id),
    title: doc.title,
    company: doc.company,
    location: doc.location,
    applicationUrl: doc.applicationUrl,
    provider: doc.provider,
    isSample: Boolean(doc.isSample),
    isManual: doc.provider === 'manual',
    status: doc.status,
    applied: Boolean(applied),
    appliedAt: applied?.occurredAt ?? null,
    lastEventAt: timeline.length ? timeline[timeline.length - 1].occurredAt : null,
    savedAt: new Date(doc.savedAt).toISOString(),
    reminder: doc.reminderAt
      ? { at: doc.reminderAt.toISOString(), note: doc.reminderNote ?? '', due: doc.reminderAt.getTime() <= now }
      : null,
  };
}

export interface ManualApplicationInput {
  title: string;
  company: string;
  location?: string;
  applicationUrl?: string;
  /** When given, an 'applied' event with this user-stated date is recorded. */
  appliedAt?: string;
  note?: string;
}

class ApplicationHistoryService {
  private async owned(userId: string, id: string): Promise<ISavedOpportunity> {
    // Unknown, malformed and other users' ids all answer 404, so ids cannot be probed
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Application not found.', 404, 'APPLICATION_NOT_FOUND');
    const doc = await SavedOpportunity.findOne({ _id: id, userId });
    if (!doc) throw new AppError('Application not found.', 404, 'APPLICATION_NOT_FOUND');
    await this.ensureEventIds(doc);
    return doc;
  }

  /**
   * Entries saved before events had ids receive one, written once. The update only applies when
   * the stored history is still the one read, so a concurrent change is never overwritten.
   */
  private async ensureEventIds(doc: ISavedOpportunity): Promise<void> {
    const raw = await SavedOpportunity.collection.findOne({ _id: doc._id }, { projection: { statusHistory: 1 } });
    const stored = (raw?.statusHistory ?? []) as Array<Record<string, unknown>>;
    if (stored.every(e => e._id)) return;
    const withIds = stored.map(e => (e._id ? e : { ...e, _id: new Types.ObjectId() }));
    await SavedOpportunity.collection.updateOne({ _id: doc._id, statusHistory: stored }, { $set: { statusHistory: withIds } });
    const fresh = await SavedOpportunity.findById(doc._id);
    if (fresh) doc.statusHistory = fresh.statusHistory;
  }

  private assertNoDuplicate(doc: ISavedOpportunity, status: ApplicationStatus, when: Date, ignoreId?: string) {
    const clash = doc.statusHistory.find(
      e => e.status === status && dayOf(e.changedAt) === dayOf(when) && String(e._id) !== ignoreId
    );
    if (clash) {
      throw new AppError(
        `This application already has an event for the '${status}' stage on ${dayOf(when)}. Edit that event instead of adding another.`,
        409,
        'DUPLICATE_EVENT'
      );
    }
  }

  private async applyState(doc: ISavedOpportunity): Promise<void> {
    const { status, appliedAt } = deriveState(doc.statusHistory);
    doc.status = status;
    doc.set('appliedAt', appliedAt ?? undefined);
    await doc.save();
  }

  async list(userId: string): Promise<ApplicationSummary[]> {
    const docs = await SavedOpportunity.find({ userId }).sort({ updatedAt: -1 }).limit(500);
    return docs.map(d => summarise(d));
  }

  async history(userId: string, id: string): Promise<ApplicationHistory> {
    const doc = await this.owned(userId, id);
    return { application: summarise(doc), ...buildTimeline(doc) };
  }

  async addEvent(userId: string, id: string, input: { status: ApplicationStatus; occurredAt?: string; note?: string }): Promise<ApplicationHistory> {
    if (!EVENT_STATUSES.includes(input.status)) {
      throw new AppError(`Invalid request: status must be one of ${EVENT_STATUSES.join(', ')}`, 400, 'VALIDATION_ERROR');
    }
    const doc = await this.owned(userId, id);
    if (doc.statusHistory.length >= MAX_EVENTS) throw new AppError('This application has reached the event limit.', 400, 'VALIDATION_ERROR');
    const now = new Date();
    const when = input.occurredAt ? parseEventDate(input.occurredAt) : now;
    this.assertNoDuplicate(doc, input.status, when);
    doc.statusHistory.push({
      status: input.status,
      changedAt: when,
      recordedAt: now,
      dateSource: input.occurredAt ? 'user_stated' : 'recorded_at_change',
      editedAt: null,
      note: (input.note ?? '').trim(),
    });
    await this.applyState(doc);
    return this.history(userId, id);
  }

  async correctEvent(userId: string, id: string, eventId: string, input: { occurredAt?: string; note?: string }): Promise<ApplicationHistory> {
    const doc = await this.owned(userId, id);
    const event = doc.statusHistory.find(e => String(e._id) === eventId);
    if (!event) throw new AppError('Event not found.', 404, 'EVENT_NOT_FOUND');
    if (input.occurredAt !== undefined) {
      const when = parseEventDate(input.occurredAt);
      this.assertNoDuplicate(doc, event.status, when, eventId);
      // Older entries have no entry time of their own: their original date was it
      if (!event.recordedAt) event.recordedAt = event.changedAt;
      event.changedAt = when;
      event.dateSource = 'user_stated';
    }
    if (input.note !== undefined) event.note = input.note.trim();
    event.editedAt = new Date();
    doc.markModified('statusHistory');
    await this.applyState(doc);
    return this.history(userId, id);
  }

  async removeEvent(userId: string, id: string, eventId: string): Promise<ApplicationHistory> {
    const doc = await this.owned(userId, id);
    const event = doc.statusHistory.find(e => String(e._id) === eventId);
    if (!event) throw new AppError('Event not found.', 404, 'EVENT_NOT_FOUND');
    if (event.status === 'saved') {
      throw new AppError('The saved event marks when tracking began and cannot be removed. Delete the job instead.', 400, 'EVENT_NOT_REMOVABLE');
    }
    doc.statusHistory = doc.statusHistory.filter(e => String(e._id) !== eventId) as typeof doc.statusHistory;
    await this.applyState(doc);
    return this.history(userId, id);
  }

  /** Opt-in follow-up reminder: set by the user only, cleared with null. Shown in-app when due. */
  async setReminder(userId: string, id: string, input: { at: string | null; note?: string }): Promise<ApplicationHistory> {
    const doc = await this.owned(userId, id);
    if (input.at === null) {
      doc.reminderAt = null;
      doc.reminderNote = '';
    } else {
      const when = new Date(input.at);
      if (Number.isNaN(when.getTime())) throw new AppError('Invalid request: reminder date is not a valid date', 400, 'VALIDATION_ERROR');
      if (when.getTime() < Date.now() - 60 * 1000) throw new AppError('Invalid request: reminder date must be in the future', 400, 'VALIDATION_ERROR');
      if (when.getTime() > Date.now() + 366 * 24 * 60 * 60 * 1000) throw new AppError('Invalid request: reminder date must be within a year', 400, 'VALIDATION_ERROR');
      doc.reminderAt = when;
      doc.reminderNote = (input.note ?? '').trim();
    }
    await doc.save();
    return this.history(userId, id);
  }

  /** A job applied to outside SkillBridge's search, entered by the user. */
  async createManual(userId: string, input: ManualApplicationInput): Promise<ApplicationHistory> {
    const now = new Date();
    const history: IStatusHistoryEntry[] = [
      { status: 'saved', changedAt: now, recordedAt: now, dateSource: 'recorded_at_change', editedAt: null, note: '' },
    ];
    if (input.appliedAt) {
      const when = parseEventDate(input.appliedAt);
      history.push({ status: 'applied', changedAt: when, recordedAt: now, dateSource: 'user_stated', editedAt: null, note: (input.note ?? '').trim() });
    }
    const state = deriveState(history);
    const doc = await SavedOpportunity.create({
      userId,
      provider: 'manual',
      externalId: `manual-${crypto.randomUUID()}`,
      title: input.title.trim(),
      company: input.company.trim(),
      location: (input.location ?? '').trim(),
      applicationUrl: input.applicationUrl ?? '',
      status: state.status,
      appliedAt: state.appliedAt ?? undefined,
      statusHistory: history,
      isSample: false,
      savedAt: now,
    });
    return this.history(userId, String(doc._id));
  }
}

export default new ApplicationHistoryService();
