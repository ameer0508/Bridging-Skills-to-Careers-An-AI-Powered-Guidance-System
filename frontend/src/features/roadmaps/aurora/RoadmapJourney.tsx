import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronDown, CircleDashed, ExternalLink, Lock, Play, RotateCcw, SkipForward, Sparkles } from 'lucide-react';
import { Pill } from '../../../design/aurora/kit';
import { auroraEase } from '../../../design/aurora/motion';
import { primaryButton, quietButton } from '../../../design/aurora/labStyles';
import { rangeText } from '../components/scheduleText';
import { phaseName } from './phaseName';

export type ItemStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

/** A roadmap item as GET /roadmap/:careerId returns it (backend LearningRoadmap model). */
export interface JourneyItem {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  prerequisites?: string[];
  careerRelevance?: string;
  expectedOutcome?: string;
  completionCriteria?: string;
  status: ItemStatus;
  targetSkill?: string;
  actionLink?: string;
}
export interface JourneyPhase {
  _id?: string;
  order: number;
  title: string;
  objective?: string;
  skillsGained?: string[];
  items: JourneyItem[];
}
/** Per-item figures from GET /roadmap/:careerId/schedule (RoadmapScheduler). */
export interface ScheduleItem {
  itemId: string;
  effort: { lowHours: number; highHours: number; basis: string };
  blockedBy: string[];
}

const done = (s: ItemStatus) => s === 'completed' || s === 'skipped';

type PhaseState = 'done' | 'current' | 'upcoming';

const STATUS_PILL: Record<ItemStatus, { text: string; tone: 'mint' | 'violet' | 'neutral' | 'amber' }> = {
  completed: { text: 'Completed', tone: 'mint' },
  in_progress: { text: 'In progress', tone: 'violet' },
  not_started: { text: 'Not started', tone: 'neutral' },
  skipped: { text: 'Skipped', tone: 'amber' },
};

/** One roadmap item: status, real effort and prerequisites, the actions, and its explanation. */
const ItemRow: React.FC<{
  item: JourneyItem;
  schedule?: ScheduleItem;
  highlighted: boolean;
  busy: boolean;
  onStatus: (id: string, status: ItemStatus) => void;
}> = ({ item, schedule, highlighted, busy, onStatus }) => {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const blocked = !done(item.status) && (schedule?.blockedBy.length ?? 0) > 0;
  // A short celebration when this item turns complete in this session, never on first render
  const previous = useRef(item.status);
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (previous.current !== 'completed' && item.status === 'completed') {
      setCelebrate(true);
      const t = window.setTimeout(() => setCelebrate(false), 1600);
      previous.current = item.status;
      return () => window.clearTimeout(t);
    }
    previous.current = item.status;
  }, [item.status]);

  const icon =
    item.status === 'completed' ? (
      <motion.span
        key="done"
        initial={reduce || !celebrate ? false : { scale: 0.4 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 18 }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-aurora-mint text-white shadow-aurora-sm"
      >
        <Check className="h-4 w-4" aria-hidden="true" />
      </motion.span>
    ) : item.status === 'in_progress' ? (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white shadow-aurora-sm [background:var(--aurora-gradient-action)]">
        <Play className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    ) : item.status === 'skipped' ? (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700">
        <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    ) : blocked ? (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-aurora-line bg-aurora-canvas text-aurora-muted">
        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    ) : (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-aurora-line bg-white text-aurora-muted">
        <CircleDashed className="h-4 w-4" aria-hidden="true" />
      </span>
    );

  const details = [
    item.description && { label: 'What to do', text: item.description },
    item.careerRelevance && { label: 'Why it is on your path', text: item.careerRelevance },
    item.expectedOutcome && { label: 'What you should be able to do after', text: item.expectedOutcome },
    item.completionCriteria && { label: 'When to call it done', text: item.completionCriteria },
  ].filter(Boolean) as Array<{ label: string; text: string }>;

  return (
    <li
      data-testid="roadmap-item"
      data-status={item.status}
      data-skill={item.targetSkill || ''}
      className={`relative rounded-2xl border transition-[box-shadow,border-color] ${highlighted ? 'border-aurora-violet/40 shadow-aurora-md' : 'border-aurora-line'} ${done(item.status) ? 'bg-aurora-canvas/50' : 'bg-white'}`}
    >
      <AnimatePresence>
        {celebrate && !reduce && (
          <motion.span
            aria-hidden="true"
            initial={{ opacity: 0.6, scale: 0.9 }}
            animate={{ opacity: 0, scale: 1.04 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: auroraEase }}
            className="pointer-events-none absolute inset-0 rounded-2xl ring-4 ring-aurora-mint/40"
          />
        )}
      </AnimatePresence>
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-3.5">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="shrink-0">{icon}</span>
          <div className="min-w-0 space-y-1">
            <p className={`text-sm font-semibold ${done(item.status) ? 'text-aurora-muted' : 'text-aurora-ink'}`}>{item.title}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Pill tone={STATUS_PILL[item.status].tone}>{STATUS_PILL[item.status].text}</Pill>
              {item.targetSkill && <Pill tone="sky">{item.targetSkill}</Pill>}
              {schedule && !done(item.status) && (
                <span className="text-xs text-aurora-muted">
                  {rangeText({ low: schedule.effort.lowHours, high: schedule.effort.highHours }, 'hour')} ({schedule.effort.basis === 'catalogue' ? 'stated by the resource' : 'assumed'})
                </span>
              )}
            </div>
            {blocked && <p className="text-xs text-aurora-muted">Do first: {schedule!.blockedBy.join(', ')}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pl-11 sm:justify-end sm:gap-2 sm:pl-0">
          {!done(item.status) && item.status !== 'in_progress' && (
            <button type="button" className={quietButton} disabled={busy} onClick={() => onStatus(item._id, 'in_progress')} aria-label={`Start ${item.title}`}>
              Start
            </button>
          )}
          {!done(item.status) && (
            <button type="button" className={primaryButton} disabled={busy} onClick={() => onStatus(item._id, 'completed')} aria-label={`Mark Complete: ${item.title}`}>
              Mark Complete
            </button>
          )}
          {!done(item.status) && (
            <button type="button" className={quietButton} disabled={busy} onClick={() => onStatus(item._id, 'skipped')} aria-label={`Skip ${item.title}`}>
              Skip
            </button>
          )}
          {done(item.status) && (
            <button type="button" className={quietButton} disabled={busy} onClick={() => onStatus(item._id, 'not_started')} aria-label={`Undo: ${item.title}`}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Undo
            </button>
          )}
          {details.length > 0 && (
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen(o => !o)}
              aria-label={`${open ? 'Hide' : 'Show'} details: ${item.title}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-aurora-muted hover:bg-aurora-canvas hover:text-aurora-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: auroraEase }}
            className="overflow-hidden"
          >
            <dl className="grid gap-3 border-t border-aurora-line px-3.5 py-3 sm:grid-cols-2">
              {details.map(d => (
                <div key={d.label}>
                  <dt className="text-xs font-semibold text-aurora-muted">{d.label}</dt>
                  <dd className="mt-0.5 text-sm leading-relaxed text-aurora-ink">{d.text}</dd>
                </div>
              ))}
              {item.prerequisites && item.prerequisites.length > 0 && (
                <div>
                  <dt className="text-xs font-semibold text-aurora-muted">Builds on</dt>
                  <dd className="mt-0.5 text-sm text-aurora-ink">{item.prerequisites.join(', ')}</dd>
                </div>
              )}
              {item.actionLink && /^https:\/\//.test(item.actionLink) && (
                <div>
                  <dt className="text-xs font-semibold text-aurora-muted">Resource</dt>
                  <dd className="mt-0.5">
                    <a href={item.actionLink} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-sm font-semibold text-aurora-indigo underline-offset-2 hover:underline">
                      Open the resource <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

/**
 * The roadmap as a path: one node per phase on a line that draws itself, each phase opening to
 * its items. Completed, current and upcoming phases look different; nothing is estimated here.
 */
export const RoadmapJourney: React.FC<{
  phases: JourneyPhase[];
  schedule: Map<string, ScheduleItem>;
  focusSkill: string | null;
  busyItem: string | null;
  onStatus: (id: string, status: ItemStatus) => void;
}> = ({ phases, schedule, focusSkill, busyItem, onStatus }) => {
  const reduce = useReducedMotion();
  const states: PhaseState[] = [];
  let currentFound = false;
  for (const phase of phases) {
    const finished = phase.items.length > 0 && phase.items.every(i => done(i.status));
    if (finished) states.push('done');
    else if (!currentFound) {
      states.push('current');
      currentFound = true;
    } else states.push('upcoming');
  }
  const [openPhases, setOpenPhases] = useState<Set<number>>(() => new Set(phases.filter((_, i) => states[i] === 'current').map(p => p.order)));
  // A skill focus opens every phase holding an item for it
  useEffect(() => {
    if (!focusSkill) return;
    setOpenPhases(prev => {
      const next = new Set(prev);
      for (const p of phases) if (p.items.some(i => i.targetSkill === focusSkill)) next.add(p.order);
      return next;
    });
  }, [focusSkill, phases]);

  const toggle = (order: number) =>
    setOpenPhases(prev => {
      const next = new Set(prev);
      if (next.has(order)) next.delete(order);
      else next.add(order);
      return next;
    });

  return (
    <ol className="relative space-y-4" aria-label="Roadmap phases" data-testid="roadmap-journey">
      {phases.map((phase, i) => {
        const state = states[i];
        const count = phase.items.filter(it => done(it.status)).length;
        const isOpen = openPhases.has(phase.order);
        const last = i === phases.length - 1;
        return (
          <li key={phase._id ?? phase.order} className="relative pl-11 sm:pl-16" data-testid="roadmap-phase" data-state={state}>
            {!last && (
              <motion.span
                aria-hidden="true"
                className={`absolute left-[17px] top-11 bottom-[-1rem] w-0.5 origin-top sm:left-[27px] ${state === 'done' ? 'bg-aurora-mint' : 'bg-aurora-line'}`}
                initial={reduce ? false : { scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: auroraEase, delay: reduce ? 0 : 0.1 }}
              />
            )}
            <span
              aria-hidden="true"
              className={`absolute left-0 top-1 inline-flex h-9 w-9 items-center justify-center rounded-full font-heading text-sm font-extrabold shadow-aurora-sm sm:left-1.5 sm:h-11 sm:w-11 ${
                state === 'done' ? 'bg-aurora-mint text-white' : state === 'current' ? 'text-white ring-4 ring-aurora-violet/15 [background:var(--aurora-gradient-action)]' : 'border border-aurora-line bg-white text-aurora-muted'
              }`}
            >
              {state === 'done' ? <Check className="h-5 w-5" /> : phase.order}
            </span>
            <section className={`rounded-[28px] border bg-white shadow-aurora-sm ${state === 'current' ? 'border-aurora-violet/25 shadow-aurora-md' : 'border-aurora-line'}`} aria-labelledby={`phase-${phase.order}-title`}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggle(phase.order)}
                className="flex w-full flex-col gap-2 rounded-[28px] p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <span className="min-w-0 space-y-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-aurora-violet">Phase {phase.order}</span>
                    {state === 'current' && <Pill tone="violet">You are here</Pill>}
                    {state === 'done' && <Pill tone="mint">Done</Pill>}
                  </span>
                  <span id={`phase-${phase.order}-title`} className="block font-heading text-lg font-bold text-aurora-ink">
                    {phaseName(phase.title)}
                  </span>
                  {phase.objective && <span className="block text-sm text-aurora-muted">{phase.objective}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold text-aurora-ink">
                    {count} of {phase.items.length} done
                  </span>
                  <ChevronDown className={`h-5 w-5 text-aurora-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={reduce ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={reduce ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: auroraEase }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 border-t border-aurora-line px-2.5 pb-3 pt-3 sm:px-5 sm:pb-5">
                      {phase.skillsGained && phase.skillsGained.length > 0 && (
                        <p className="flex flex-wrap items-center gap-1.5 text-xs text-aurora-muted">
                          <Sparkles className="h-3.5 w-3.5 text-aurora-violet" aria-hidden="true" /> Skills this phase works on:
                          {phase.skillsGained.map(s => (
                            <Pill key={s}>{s}</Pill>
                          ))}
                        </p>
                      )}
                      <ul className="space-y-2">
                        {phase.items.map(item => (
                          <ItemRow
                            key={item._id}
                            item={item}
                            schedule={schedule.get(item._id)}
                            highlighted={!!focusSkill && item.targetSkill === focusSkill}
                            busy={busyItem === item._id}
                            onStatus={onStatus}
                          />
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </li>
        );
      })}
    </ol>
  );
};
