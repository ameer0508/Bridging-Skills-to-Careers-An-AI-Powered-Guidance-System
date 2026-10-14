import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messageOf } from '../../../lib/collections';
import { fetchPlan, generatePlan, setPlanItem, StudyPlan } from '../examsApi';

const card = 'rounded-2xl border border-aurora-line p-4';
const primaryButton = 'rounded-2xl [background:var(--aurora-gradient-action)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60';
const KIND_LABEL = { learn: 'Study', practise: 'Practise', revise: 'Revise' } as const;

/** E4: a weekly study plan from the user's available hours and practice results. */
export const StudyPlanPanel: React.FC<{ examId: string }> = ({ examId }) => {
  const queryClient = useQueryClient();
  const plan = useQuery({ queryKey: ['exam-plan', examId], queryFn: () => fetchPlan(examId), retry: false });
  const [hours, setHours] = useState<number | ''>('');
  const [start, setStart] = useState('');
  const set = (p: StudyPlan) => queryClient.setQueryData(['exam-plan', examId], p);
  const generate = useMutation({
    mutationFn: () => generatePlan(examId, { hoursPerWeek: Number(hours || plan.data?.hoursPerWeek), startDate: start || undefined }),
    onSuccess: set,
  });
  // Ticks show at once; the saved plan replaces them when the server answers
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  const toggle = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => setPlanItem(examId, id, done ? 'done' : 'pending'),
    onMutate: ({ id, done }) => setTicks(prev => ({ ...prev, [id]: done })),
    onSettled: (_d, _e, { id }) => setTicks(({ [id]: _drop, ...rest }) => rest),
    onSuccess: set,
  });

  if (plan.isPending) return <p role="status" className="text-sm text-aurora-muted">Loading the study plan…</p>;
  if (plan.isError) return <p role="alert" className="text-sm">The study plan could not be loaded: {messageOf(plan.error, 'the server did not respond.')}</p>;
  const p = plan.data;
  const hoursValue = hours === '' ? p?.hoursPerWeek ?? '' : hours;
  const weeks = p ? [...new Set(p.items.map(i => i.week))].sort((a, b) => a - b) : [];

  return (
    <div className="flex flex-col gap-4" data-testid="study-plan">
      <form
        aria-label="Study plan settings"
        className={`${card} flex flex-wrap items-end gap-3`}
        onSubmit={e => {
          e.preventDefault();
          generate.mutate();
        }}
      >
        <label className="flex flex-col gap-1 text-sm font-semibold text-aurora-ink">
          Hours you can study per week
          <input type="number" min={1} max={60} required value={hoursValue} onChange={e => setHours(e.target.value === '' ? '' : Number(e.target.value))} className="w-28 rounded-2xl border border-aurora-line bg-white px-3 py-2 text-sm font-normal" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-aurora-ink">
          Start date (optional)
          <input type="date" value={start} onChange={e => setStart(e.target.value)} className="rounded-2xl border border-aurora-line bg-white px-3 py-2 text-sm font-normal" />
        </label>
        <button type="submit" className={primaryButton} disabled={generate.isPending || hoursValue === '' || Number(hoursValue) < 1 || Number(hoursValue) > 60}>
          {p ? 'Update plan' : 'Create plan'}
        </button>
        {generate.isError && <p role="alert" className="w-full text-sm text-rose-700">{messageOf(generate.error, 'The plan could not be made.')}</p>}
      </form>

      {!p && <p className={`${card} text-sm text-aurora-muted`} data-testid="plan-empty">No plan yet. Enter the hours you can study each week to create one. Practise first for a plan based on your results.</p>}

      {p && (
        <>
          <p className="text-sm text-aurora-muted" data-testid="plan-totals">
            {p.totals.pendingHours} hours to go and {p.totals.doneHours} done, over {p.totals.weeks} weeks at {p.hoursPerWeek} hours a week
            {p.totals.estimatedEndDate ? `, finishing around ${p.totals.estimatedEndDate}` : ''}.
          </p>
          {weeks.map(week => (
            <section key={week} className={card} aria-labelledby={`week-${week}`}>
              <h3 id={`week-${week}`} className="mb-2 text-sm font-bold text-aurora-ink">Week {week} · from {p.items.find(i => i.week === week)!.weekStarts}</h3>
              <ul className="flex flex-col gap-1">
                {p.items.filter(i => i.week === week).map(i => (
                  <li key={i.id} className="text-sm" data-testid="plan-item" data-status={i.status}>
                    <label className="flex items-start gap-2">
                      <input type="checkbox" className="mt-1" checked={ticks[i.id] ?? i.status === 'done'} onChange={e => toggle.mutate({ id: i.id, done: e.target.checked })} />
                      <span>
                        <strong>{KIND_LABEL[i.kind]} {i.topicName}</strong> · {i.hours} h
                        <span className="block text-xs text-aurora-muted">{i.reason}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <ul className="list-disc space-y-1 pl-5 text-xs text-aurora-muted">{p.caveats.map(c => <li key={c}>{c}</li>)}</ul>
        </>
      )}
    </div>
  );
};
