import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, MinusCircle, XCircle } from 'lucide-react';
import { messageOf } from '../../../lib/collections';
import { AnswerResponse, AttemptQuestion, AttemptView, fetchAttempt, saveAnswer, startSection, submitAttempt } from '../examsApi';

const card = 'rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-4';
const primaryButton = 'rounded-[var(--radius-md)] bg-[var(--color-interactive-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60';
const secondaryButton = 'rounded-[var(--radius-md)] border border-[var(--color-border-default)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] disabled:opacity-60';

const formatClock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Runs one attempt: answers saved as given, server-enforced timers, and results after submission. */
export const AttemptRunner: React.FC<{ attemptId: string; onClose: () => void }> = ({ attemptId, onClose }) => {
  const queryClient = useQueryClient();
  const attempt = useQuery({ queryKey: ['exam-attempt', attemptId], queryFn: () => fetchAttempt(attemptId), retry: false });
  const [offset, setOffset] = useState(0);
  const [tick, setTick] = useState(() => Date.now());
  const [saveError, setSaveError] = useState<string | null>(null);

  const update = (view: AttemptView) => {
    queryClient.setQueryData(['exam-attempt', attemptId], view);
    setOffset(Date.parse(view.serverTime) - Date.now());
  };
  const serverTime = attempt.data?.serverTime;
  useEffect(() => {
    if (serverTime) setOffset(Date.parse(serverTime) - Date.now());
  }, [serverTime]);

  const view = attempt.data;
  const active = view?.status === 'active';
  // The section currently open under sectional timing
  const openSection = view?.sections.find(s => s.startedAt && !s.closedAt) ?? null;
  const sectional = Boolean(view && view.mode === 'timed' && view.sections.some(s => s.timeLimitSec));
  const deadline = sectional ? openSection?.deadline ?? null : view?.deadline ?? null;
  const remaining = deadline ? Date.parse(deadline) - (tick + offset) : null;

  useEffect(() => {
    if (!active || !deadline) return;
    const timer = setInterval(() => setTick(Date.now()), 500);
    return () => clearInterval(timer);
  }, [active, deadline]);
  // When time runs out the server completes the attempt or section; re-read it
  const timeUp = remaining !== null && remaining < -6000;
  const refetch = attempt.refetch;
  useEffect(() => {
    if (timeUp && active) refetch();
  }, [timeUp, active, refetch]);

  const save = useMutation({
    mutationFn: ({ questionId, response }: { questionId: string; response: AnswerResponse }) => saveAnswer(attemptId, questionId, response),
    onSuccess: v => {
      setSaveError(null);
      update(v);
    },
    onError: e => {
      setSaveError(messageOf(e, 'The answer was not saved.'));
      attempt.refetch();
    },
  });
  const next = useMutation({ mutationFn: (sectionId: string) => startSection(attemptId, sectionId), onSuccess: update });
  const submit = useMutation({
    mutationFn: () => submitAttempt(attemptId),
    onSuccess: v => {
      update(v);
      queryClient.invalidateQueries({ queryKey: ['exam-attempts', v.examId] });
      queryClient.invalidateQueries({ queryKey: ['exam-performance', v.examId] });
    },
  });

  const visible = useMemo(() => {
    if (!view) return [];
    if (!active || !sectional) return view.questions;
    return openSection ? view.questions.filter(q => q.sectionId === openSection.sectionId) : [];
  }, [view, active, sectional, openSection]);

  if (attempt.isPending) return <p role="status" className="text-sm text-[var(--color-text-secondary)]">Loading the practice set…</p>;
  if (attempt.isError || !view) return <p role="alert" className="text-sm">The practice set could not be loaded: {messageOf(attempt.error, 'the server did not respond.')}</p>;

  const nextSection = sectional ? view.sections.find(s => !s.startedAt) ?? null : null;
  const answered = view.questions.filter(q => q.response !== null).length;

  return (
    <div className="flex flex-col gap-4" data-testid="attempt" data-status={view.status}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
          {active ? `${view.mode === 'timed' ? 'Timed' : 'Untimed'} practice · ${answered} of ${view.questions.length} answered` : 'Result'}
          {active && sectional && openSection ? ` · ${openSection.name}` : ''}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {active && remaining !== null && (
            <span role="timer" aria-live="off" data-testid="attempt-timer" className={`inline-flex items-center gap-1 rounded-[var(--radius-md)] border px-3 py-1.5 text-sm font-semibold ${remaining < 60000 ? 'border-[var(--color-status-error,#dc2626)] text-[var(--color-status-error,#dc2626)]' : 'border-[var(--color-border-default)]'}`}>
              <Clock size={14} aria-hidden="true" /> {remaining > 0 ? formatClock(remaining) : "Time's up"}
            </span>
          )}
          {active && remaining !== null && remaining < 60000 && remaining > 0 && <span className="sr-only" aria-live="assertive">Less than one minute left.</span>}
          {active && nextSection && (
            <button type="button" className={secondaryButton} disabled={next.isPending} onClick={() => next.mutate(nextSection.sectionId)}>
              Finish section, start {nextSection.name}
            </button>
          )}
          {active && (
            <button
              type="button"
              className={primaryButton}
              disabled={submit.isPending}
              onClick={() => {
                if (window.confirm(`Submit now? ${view.questions.length - answered} unanswered question(s) will score 0.`)) submit.mutate();
              }}
            >
              Submit
            </button>
          )}
          <button type="button" className={secondaryButton} onClick={onClose}>Back</button>
        </div>
      </div>

      {saveError && <p role="alert" className="text-sm text-[var(--color-status-error,#dc2626)]">{saveError}</p>}
      {active && sectional && !openSection && <p className="text-sm text-[var(--color-text-secondary)]">This section is over. Start the next section or submit.</p>}

      {view.score && (
        <section className={card} data-testid="attempt-score" aria-labelledby="score-heading">
          <h3 id="score-heading" className="text-base font-bold text-[var(--color-text-primary)]">
            {view.score.marks} of {view.score.maxMarks} marks
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {view.score.correct} correct, {view.score.wrong} wrong, {view.score.unanswered} unanswered
            {view.score.accuracy !== null ? ` · ${Math.round(view.score.accuracy * 100)}% of answered questions correct` : ''}
            {view.timedOut ? ' · time ran out, so answers given in time were scored' : ''}.
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Marked with the official marking scheme. This is a practice score, not an exam score.</p>
        </section>
      )}

      <ol className="flex flex-col gap-3">
        {visible.map(q => (
          <li key={q.questionId}>
            <QuestionCard number={view.questions.indexOf(q) + 1} question={q} locked={!active} onAnswer={response => save.mutate({ questionId: q.questionId, response })} />
          </li>
        ))}
      </ol>
    </div>
  );
};

const QuestionCard: React.FC<{ number: number; question: AttemptQuestion; locked: boolean; onAnswer: (r: AnswerResponse) => void }> = ({ number, question: q, locked, onAnswer: save }) => {
  // Shown at once; the server copy replaces it when the save returns (or fails)
  const [local, setLocal] = useState<AnswerResponse>(q.response);
  useEffect(() => setLocal(q.response), [q.response]);
  const onAnswer = (r: AnswerResponse) => {
    setLocal(r);
    save(r);
  };
  const [natDraft, setNatDraft] = useState(typeof q.response === 'number' && q.type === 'nat' ? String(q.response) : '');
  const name = `q-${q.questionId}`;
  const selected = Array.isArray(local) ? local : [];

  return (
    <article className={card} data-testid="exam-question" data-question={q.questionId} data-outcome={q.outcome ?? ''} aria-labelledby={`${name}-stem`}>
      <p className="mb-1 text-xs text-[var(--color-text-secondary)]">
        {q.topicName} · {q.type.toUpperCase()} · {q.marks} mark{q.marks === 1 ? '' : 's'}
        {q.negativeMarks > 0 ? ` · −${q.negativeMarks} if wrong` : ' · no negative marking'}
      </p>
      <h3 id={`${name}-stem`} className="text-sm font-semibold text-[var(--color-text-primary)]">{number}. {q.stem}</h3>
      {q.code && <pre className="mt-2 overflow-x-auto rounded-[var(--radius-md)] bg-[var(--color-bg-surface-raised)] p-3 text-xs"><code>{q.code}</code></pre>}

      {q.type === 'mcq' && (
        <fieldset className="mt-2 flex flex-col gap-1 text-sm" disabled={locked}>
          <legend className="sr-only">Choose one option</legend>
          {q.options!.map((o, i) => (
            <label key={o} className="flex items-center gap-2"><input type="radio" name={name} checked={local === i} onChange={() => onAnswer(i)} /> {o}</label>
          ))}
        </fieldset>
      )}
      {q.type === 'msq' && (
        <fieldset className="mt-2 flex flex-col gap-1 text-sm" disabled={locked}>
          <legend className="sr-only">Choose all that apply</legend>
          {q.options!.map((o, i) => (
            <label key={o} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(i)}
                onChange={() => {
                  const nextSel = selected.includes(i) ? selected.filter(x => x !== i) : [...selected, i].sort((a, b) => a - b);
                  onAnswer(nextSel.length ? nextSel : null);
                }}
              />
              {o}
            </label>
          ))}
        </fieldset>
      )}
      {q.type === 'nat' && (
        <form
          className="mt-2 flex flex-wrap items-end gap-2"
          onSubmit={e => {
            e.preventDefault();
            const value = Number(natDraft);
            onAnswer(natDraft.trim() === '' ? null : value);
          }}
        >
          <label className="flex flex-col gap-1 text-sm">
            Numerical answer
            <input
              inputMode="decimal"
              disabled={locked}
              value={natDraft}
              onChange={e => setNatDraft(e.target.value)}
              className="w-40 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-1.5"
              aria-invalid={natDraft.trim() !== '' && !Number.isFinite(Number(natDraft))}
            />
          </label>
          {!locked && <button type="submit" className={secondaryButton} disabled={natDraft.trim() !== '' && !Number.isFinite(Number(natDraft))}>Save answer</button>}
          {typeof q.response === 'number' && <span className="text-xs text-[var(--color-text-secondary)]">Saved: {q.response}</span>}
        </form>
      )}
      {!locked && local !== null && q.type !== 'nat' && (
        <button type="button" className="mt-1 text-xs text-[var(--color-text-secondary)] underline" onClick={() => onAnswer(null)}>Clear answer</button>
      )}

      {q.outcome && (
        <div className="mt-3 text-sm" data-testid="question-result">
          <p className={`flex items-center gap-1.5 font-semibold ${q.outcome === 'correct' ? 'text-emerald-700' : q.outcome === 'wrong' ? 'text-[var(--color-status-error,#dc2626)]' : 'text-[var(--color-text-secondary)]'}`}>
            {q.outcome === 'correct' ? <CheckCircle2 size={16} aria-hidden="true" /> : q.outcome === 'wrong' ? <XCircle size={16} aria-hidden="true" /> : <MinusCircle size={16} aria-hidden="true" />}
            {q.outcome === 'correct' ? 'Correct' : q.outcome === 'wrong' ? 'Wrong' : 'Not answered'} ({q.marksAwarded} marks)
          </p>
          <p className="text-[var(--color-text-secondary)]">Answer: {q.correctAnswer}</p>
          <p className="text-[var(--color-text-secondary)]">{q.explanation}</p>
        </div>
      )}
    </article>
  );
};
