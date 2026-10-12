import type { IRoadmapItem, IRoadmapPhase } from '../models/LearningRoadmap.js';

/**
 * Turns a roadmap and the hours a user says they have each week into a schedule.
 *
 * SkillBridge holds no measurements of how long anything takes to learn. Effort is therefore a
 * range per item, taken from the catalogue when it states hours and otherwise from the planning
 * assumptions below. A schedule is the arithmetic that follows from those ranges and the user's
 * own weekly hours: it is a plan, not a forecast, and it is always shown as a range.
 */

/** Hours assumed per kind of roadmap item when the catalogue states none. Not measured. */
export const EFFORT_ASSUMPTIONS: Record<string, { low: number; high: number }> = {
  'Learning Resources': { low: 8, high: 20 },
  Projects: { low: 15, high: 40 },
  Certifications: { low: 30, high: 80 }
};
export const DEFAULT_EFFORT = { low: 5, high: 15 } as const;

export const HOURS_PER_WEEK_LIMITS = { min: 1, max: 60 } as const;

export interface ItemEffort {
  lowHours: number;
  highHours: number;
  /** "catalogue": hours stated for the resource. "assumption": the planning range for its kind. */
  basis: 'catalogue' | 'assumption';
}

export interface WeekWindow {
  /** Week number counted from the current week (1 = this week). */
  earliestWeek: number;
  latestWeek: number;
}

export interface ScheduledItem {
  itemId: string;
  title: string;
  phaseOrder: number;
  status: IRoadmapItem['status'];
  targetSkill: string;
  effort: ItemEffort;
  /** Prerequisite items in this roadmap that are not done yet. */
  blockedBy: string[];
  /** When the item would be finished; null when it is done or no weekly hours are set. */
  finish: WeekWindow | null;
}

export interface ScheduledPhase {
  order: number;
  title: string;
  remainingItems: number;
  remainingHours: { low: number; high: number };
  finish: WeekWindow | null;
}

export interface RoadmapSchedule {
  hoursPerWeek: number | null;
  /** True when a schedule in weeks cannot be given because no weekly hours are set. */
  needsAvailability: boolean;
  totalItems: number;
  remainingItems: number;
  remainingHours: { low: number; high: number };
  weeksRemaining: { low: number; high: number } | null;
  finishBetween: { earliest: string; latest: string } | null;
  /** The first unfinished item whose prerequisites are done. */
  nextItem: { itemId: string; title: string; phaseOrder: number } | null;
  phases: ScheduledPhase[];
  items: ScheduledItem[];
  assumptions: string[];
}

const isDone = (item: IRoadmapItem): boolean => item.status === 'completed' || item.status === 'skipped';

/** Effort for one item: the catalogue's hours when it states them, otherwise the range for its kind. */
export function effortFor(item: Pick<IRoadmapItem, 'category' | 'estimatedDuration'>): ItemEffort {
  const stated = (item.estimatedDuration || '').trim();
  const hours = stated.match(/^(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)$/i);
  if (hours) {
    const value = Number(hours[1]);
    if (value > 0) return { lowHours: value, highHours: value, basis: 'catalogue' };
  }
  const range = stated.match(/^(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)$/i);
  if (range && Number(range[1]) > 0 && Number(range[2]) >= Number(range[1])) {
    return { lowHours: Number(range[1]), highHours: Number(range[2]), basis: 'catalogue' };
  }
  if (/^under an hour$/i.test(stated)) return { lowHours: 1, highHours: 1, basis: 'catalogue' };
  // "Self-paced", "2 months" and the like say nothing about hours of work
  const assumed = EFFORT_ASSUMPTIONS[item.category || ''] || DEFAULT_EFFORT;
  return { lowHours: assumed.low, highHours: assumed.high, basis: 'assumption' };
}

const addDays = (from: Date, days: number): string => new Date(from.getTime() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export function buildSchedule(phases: IRoadmapPhase[], hoursPerWeek: number | null, now: Date = new Date()): RoadmapSchedule {
  const ordered = [...phases].sort((a, b) => a.order - b.order);
  const all = ordered.flatMap(phase => phase.items.map(item => ({ phase, item })));
  // A prerequisite names another item of the roadmap; one that is not in the roadmap is not a gap
  const doneTitles = new Set(all.filter(({ item }) => isDone(item)).map(({ item }) => item.title));
  const titles = new Set(all.map(({ item }) => item.title));

  let low = 0;
  let high = 0;
  const window = (): WeekWindow | null =>
    hoursPerWeek ? { earliestWeek: Math.max(1, Math.ceil(low / hoursPerWeek)), latestWeek: Math.max(1, Math.ceil(high / hoursPerWeek)) } : null;

  const items: ScheduledItem[] = [];
  const scheduledPhases: ScheduledPhase[] = [];
  for (const phase of ordered) {
    const phaseHours = { low: 0, high: 0 };
    let remaining = 0;
    let finish: WeekWindow | null = null;
    for (const item of phase.items) {
      const effort = effortFor(item);
      const done = isDone(item);
      if (!done) {
        // How much of a started item is finished is not recorded, so it is planned in full
        low += effort.lowHours;
        high += effort.highHours;
        phaseHours.low += effort.lowHours;
        phaseHours.high += effort.highHours;
        remaining++;
        finish = window();
      }
      items.push({
        itemId: item._id ? item._id.toString() : '',
        title: item.title,
        phaseOrder: phase.order,
        status: item.status,
        targetSkill: item.targetSkill || '',
        effort,
        blockedBy: done ? [] : (item.prerequisites || []).filter(p => titles.has(p) && !doneTitles.has(p)),
        finish: done ? null : window()
      });
    }
    scheduledPhases.push({ order: phase.order, title: phase.title, remainingItems: remaining, remainingHours: phaseHours, finish: remaining > 0 ? finish : null });
  }

  const remainingItems = items.filter(i => i.status !== 'completed' && i.status !== 'skipped');
  const next = remainingItems.find(i => i.blockedBy.length === 0) || remainingItems[0] || null;
  const weeks = hoursPerWeek && remainingItems.length > 0 ? { low: Math.ceil(low / hoursPerWeek), high: Math.ceil(high / hoursPerWeek) } : null;

  return {
    hoursPerWeek,
    needsAvailability: !hoursPerWeek,
    totalItems: items.length,
    remainingItems: remainingItems.length,
    remainingHours: { low, high },
    weeksRemaining: weeks,
    finishBetween: weeks ? { earliest: addDays(now, weeks.low * 7), latest: addDays(now, weeks.high * 7) } : null,
    nextItem: next ? { itemId: next.itemId, title: next.title, phaseOrder: next.phaseOrder } : null,
    phases: scheduledPhases,
    items,
    assumptions: [
      'Effort per item is a range. Where the catalogue states hours they are used; otherwise a planning range for that kind of item is assumed: ' +
        Object.entries(EFFORT_ASSUMPTIONS)
          .map(([kind, r]) => `${kind} ${r.low} to ${r.high} hours`)
          .join(', ') +
        `, anything else ${DEFAULT_EFFORT.low} to ${DEFAULT_EFFORT.high} hours.`,
      'These ranges are assumptions chosen for planning. SkillBridge has not measured how long any skill takes to learn, and your pace may fall outside them.',
      'Weeks are the remaining hours divided by the weekly hours you entered, rounded up, with items taken in roadmap order. Nothing is known about weeks you cannot study.',
      'An item you have started is planned in full, because how much of it is done is not recorded.'
    ]
  };
}
