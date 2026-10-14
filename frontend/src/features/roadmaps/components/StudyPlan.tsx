import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock } from 'lucide-react';
import apiClient from '../../../lib/axios';
import { rangeText, type Range } from './scheduleText';
import { ErrorNote, Loading, Note } from '../../careerLab/components/labUi';
import { errorText, fieldClass, formatDate, formatDateTime, labelClass, panelClass, primaryButton, quietButton } from '../../careerLab/components/labStyles';

/** Shapes mirror backend/src/services/RoadmapScheduler.ts. */
interface WeekWindow {
  earliestWeek: number;
  latestWeek: number;
}
export interface RoadmapSchedule {
  hoursPerWeek: number | null;
  needsAvailability: boolean;
  totalItems: number;
  remainingItems: number;
  remainingHours: Range;
  weeksRemaining: Range | null;
  finishBetween: { earliest: string; latest: string } | null;
  nextItem: { itemId: string; title: string; phaseOrder: number } | null;
  phases: Array<{ order: number; title: string; remainingItems: number; remainingHours: Range; finish: WeekWindow | null }>;
  items: Array<{ itemId: string; title: string; phaseOrder: number; status: string; effort: { lowHours: number; highHours: number; basis: string }; blockedBy: string[]; finish: WeekWindow | null }>;
  assumptions: string[];
}
interface ScheduleResponse {
  schedule: RoadmapSchedule;
  progressPercentage: number;
  lastUpdate: { at: string; action: string; details: string } | null;
}


const weekText = (window: WeekWindow): string =>
  window.earliestWeek === window.latestWeek ? `week ${window.earliestWeek}` : `between week ${window.earliestWeek} and week ${window.latestWeek}`;

const HOURS = { min: 1, max: 60 };

/** Weekly study hours and the schedule that follows from them, for one roadmap. */
export const StudyPlanPanel: React.FC<{ careerId: string }> = ({ careerId }) => {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<string | null>(null);

  const plan = useQuery<ScheduleResponse>({
    queryKey: ['roadmap', careerId, 'schedule'],
    queryFn: async () => (await apiClient.get(`/roadmap/${careerId}/schedule`)).data.data,
  });

  const save = useMutation<unknown, unknown, number | null>({
    mutationFn: (hoursPerWeek) => apiClient.put('/users/me/learning-preferences', { hoursPerWeek }),
    onSuccess: () => {
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: ['roadmap', careerId, 'schedule'] });
      queryClient.invalidateQueries({ queryKey: ['career-snapshot'] });
    },
  });

  if (plan.isLoading) {
    return <section className={panelClass}><Loading label="Loading your study plan..." /></section>;
  }
  if (plan.isError || !plan.data) {
    return (
      <section className={panelClass} aria-labelledby="study-plan-heading">
        <h2 id="study-plan-heading" className="text-base font-bold text-white">Study plan</h2>
        <ErrorNote message={errorText(plan.error, 'Your study plan could not be loaded.')} />
        <button type="button" className={quietButton} onClick={() => plan.refetch()}>Try again</button>
      </section>
    );
  }

  const { schedule, lastUpdate } = plan.data;
  const value = draft ?? (schedule.hoursPerWeek === null ? '' : String(schedule.hoursPerWeek));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const hours = Number(value);
    if (value.trim() === '' || !Number.isInteger(hours) || hours < HOURS.min || hours > HOURS.max) {
      setInvalid(`Enter a whole number of hours from ${HOURS.min} to ${HOURS.max}.`);
      return;
    }
    setInvalid(null);
    save.mutate(hours);
  };

  return (
    <section className={panelClass} aria-labelledby="study-plan-heading" data-testid="study-plan">
      <div className="flex items-start gap-3">
        <CalendarClock className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          <h2 id="study-plan-heading" className="text-base font-bold text-white">Study plan</h2>
          <p className="text-xs text-slate-400">Tell SkillBridge how many hours a week you can study and the roadmap is laid out in weeks. Nothing is assumed until you do.</p>
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-3" onSubmit={submit} noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="hours-per-week" className={labelClass}>Hours you can study each week</label>
          <input
            id="hours-per-week"
            type="number"
            inputMode="numeric"
            min={HOURS.min}
            max={HOURS.max}
            step={1}
            value={value}
            onChange={(e) => { setDraft(e.target.value); setInvalid(null); }}
            aria-invalid={invalid ? true : undefined}
            aria-describedby={invalid ? 'hours-per-week-error' : undefined}
            className={`${fieldClass} w-32`}
          />
        </div>
        <button type="submit" className={primaryButton} disabled={save.isPending}>Save hours</button>
        {schedule.hoursPerWeek !== null && (
          <button type="button" className={quietButton} disabled={save.isPending} onClick={() => { setInvalid(null); save.mutate(null); }}>Clear</button>
        )}
      </form>
      {invalid && <p id="hours-per-week-error" role="alert" className="text-xs text-rose-300">{invalid}</p>}
      <ErrorNote message={save.isError ? errorText(save.error, 'Your weekly hours could not be saved.') : null} />

      {schedule.remainingItems === 0 ? (
        <p className="text-sm text-slate-200" data-testid="study-plan-summary">
          {schedule.totalItems === 0 ? 'This roadmap has no items yet.' : 'Every item on this roadmap is done. There is nothing left to schedule.'}
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3" data-testid="study-plan-summary" data-weeks-low={schedule.weeksRemaining?.low ?? ''} data-weeks-high={schedule.weeksRemaining?.high ?? ''}>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10">
              <dt className={labelClass}>Work remaining</dt>
              <dd className="text-sm font-bold text-white">{schedule.remainingItems} of {schedule.totalItems} items, {rangeText(schedule.remainingHours, 'hour')}</dd>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10">
              <dt className={labelClass}>At your pace</dt>
              <dd className="text-sm font-bold text-white">
                {schedule.weeksRemaining ? `${rangeText(schedule.weeksRemaining, 'week')} at ${schedule.hoursPerWeek} hours a week` : 'Set your weekly hours to see weeks'}
              </dd>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10">
              <dt className={labelClass}>Would finish</dt>
              <dd className="text-sm font-bold text-white">
                {schedule.finishBetween ? `between ${formatDate(schedule.finishBetween.earliest)} and ${formatDate(schedule.finishBetween.latest)}` : 'Not scheduled'}
              </dd>
            </div>
          </dl>

          {schedule.nextItem && (
            <p className="text-xs text-slate-300" data-testid="study-plan-next">
              Next: <span className="font-semibold text-white">{schedule.nextItem.title}</span> (phase {schedule.nextItem.phaseOrder}).
            </p>
          )}

          <div className="space-y-2">
            <h3 className={labelClass}>Phases in order</h3>
            <ol className="space-y-2">
              {schedule.phases.map((phase) => {
                const items = schedule.items.filter((item) => item.phaseOrder === phase.order);
                return (
                  <li key={phase.order} className="p-3 rounded-2xl bg-slate-900/50 border border-white/10 space-y-2" data-testid="study-plan-phase">
                    <p className="text-sm font-bold text-white">{phase.title}</p>
                    <p className="text-xs text-slate-300">
                      {phase.remainingItems === 0
                        ? 'Done.'
                        : `${phase.remainingItems} item${phase.remainingItems === 1 ? '' : 's'} left, ${rangeText(phase.remainingHours, 'hour')}${phase.finish ? `; finished ${weekText(phase.finish)}` : ''}.`}
                    </p>
                    <ul className="space-y-1">
                      {items.map((item) => (
                        <li key={item.itemId || item.title} className="text-[11px] text-slate-400" data-testid="study-plan-item" data-status={item.status}>
                          <span className="text-slate-200">{item.title}</span>
                          {item.status === 'completed' || item.status === 'skipped'
                            ? ` (${item.status})`
                            : <>
                                {`: ${rangeText({ low: item.effort.lowHours, high: item.effort.highHours }, 'hour')} (${item.effort.basis === 'catalogue' ? 'stated by the resource' : 'assumed'})`}
                                {item.finish ? `, done ${weekText(item.finish)}` : ''}
                                {item.blockedBy.length > 0 ? `. Do first: ${item.blockedBy.join(', ')}` : ''}
                              </>}
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ol>
          </div>
        </>
      )}

      {lastUpdate && (
        <p className="text-[11px] text-slate-400" data-testid="study-plan-last-update">
          Last updated {formatDateTime(lastUpdate.at)}. {lastUpdate.details}
        </p>
      )}

      <details className="text-[11px] text-slate-400">
        <summary className="cursor-pointer text-slate-300 font-semibold">How this schedule is worked out</summary>
        <ul className="mt-2 space-y-1 list-disc pl-5" data-testid="study-plan-assumptions">
          {schedule.assumptions.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </details>
      <Note>This is a plan from your own figures, not a prediction. Weeks start from this week and move whenever you finish an item or change your hours.</Note>
    </section>
  );
};

/** The schedule as the career snapshot carries it to the dashboard (features/home/aurora/StudyPlanCard.tsx). */
export interface StudyPlanSchedule {
  hoursPerWeek: number | null;
  remainingItems: number;
  remainingHours: Range;
  weeksRemaining: Range | null;
  finishBetween: { earliest: string; latest: string } | null;
  nextItemTitle: string | null;
}

export default StudyPlanPanel;
