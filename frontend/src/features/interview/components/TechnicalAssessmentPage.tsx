import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import { messageOf } from '../../../lib/collections';
import {
  answerTask,
  AssessmentTaskView,
  AssessmentView,
  fetchAssessments,
  fetchCatalog,
  finishAssessment,
  KIND_LABEL,
  startAssessment,
  TaskKind,
} from '../assessmentsApi';

const card = 'rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-4';
const primaryButton = 'rounded-[var(--radius-md)] bg-[var(--color-interactive-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60';
const secondaryButton = 'rounded-[var(--radius-md)] border border-[var(--color-border-default)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] disabled:opacity-60';

/** D4: read-and-answer technical tasks. Nothing typed here is executed anywhere. */
export const TechnicalAssessmentPage: React.FC = () => {
  const queryClient = useQueryClient();
  const catalog = useQuery({ queryKey: ['assessment-catalog'], queryFn: fetchCatalog, retry: false });
  const history = useQuery({ queryKey: ['assessments'], queryFn: fetchAssessments, retry: false });
  const [active, setActive] = useState<AssessmentView | null>(null);

  const update = (view: AssessmentView) => {
    setActive(view);
    queryClient.invalidateQueries({ queryKey: ['assessments'] });
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-2" data-testid="assessment-intro">
        <Link to="/interview-agent" className="text-xs text-[var(--color-interactive-primary)] underline">← Interview studio</Link>
        <h1 className="text-2xl font-bold font-display text-[var(--color-text-primary)]">Technical assessment</h1>
        <p className="flex items-start gap-2 max-w-3xl text-sm text-[var(--color-text-secondary)]">
          <ShieldCheck size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          Read short pieces of code and answer: what it prints, where the bug is, how it scales, what a query returns. Answers are
          checked against fixed keys. Nothing you type is run as code.
        </p>
      </header>

      {catalog.isError && (
        <div role="alert" className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-status-error,#dc2626)] p-3 text-sm">
          <AlertTriangle size={16} aria-hidden="true" /> The task list could not be loaded: {messageOf(catalog.error, 'the server did not respond.')}
        </div>
      )}

      {active ? (
        <ActiveAssessment view={active} onChange={update} onClose={() => setActive(null)} />
      ) : (
        catalog.data && <StartForm skills={Object.keys(catalog.data.skills)} kinds={Object.keys(catalog.data.kinds) as TaskKind[]} max={catalog.data.maxTasks} onStarted={update} />
      )}

      {!active && history.data && history.data.length > 0 && (
        <section aria-labelledby="assessment-history-heading">
          <h2 id="assessment-history-heading" className="mb-2 text-base font-bold text-[var(--color-text-primary)]">Earlier attempts</h2>
          <ul className="flex flex-col gap-2" data-testid="assessment-history">
            {history.data.map(a => (
              <li key={a.id}>
                <button type="button" className={`${card} w-full text-left text-sm`} onClick={() => setActive(a)}>
                  {new Date(a.startedAt).toLocaleDateString()} · {a.tasks.length} tasks ·{' '}
                  {a.score ? `${a.score.correct} of ${a.score.total} correct (${a.score.percent}%)` : `in progress, ${a.progress.answered} of ${a.progress.total} answered`}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

const StartForm: React.FC<{ skills: string[]; kinds: TaskKind[]; max: number; onStarted: (v: AssessmentView) => void }> = ({ skills, kinds, max, onStarted }) => {
  const [chosenSkills, setChosenSkills] = useState<string[]>([]);
  const [chosenKinds, setChosenKinds] = useState<TaskKind[]>([]);
  const [count, setCount] = useState(5);
  const start = useMutation({
    mutationFn: () => startAssessment({ skills: chosenSkills.length ? chosenSkills : undefined, kinds: chosenKinds.length ? chosenKinds : undefined, count }),
    onSuccess: onStarted,
  });
  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter(v => v !== value) : [...list, value]);

  return (
    <form
      aria-label="Start a technical assessment"
      className={`${card} flex flex-col gap-4`}
      onSubmit={e => {
        e.preventDefault();
        start.mutate();
      }}
    >
      <fieldset>
        <legend className="mb-1 text-sm font-semibold text-[var(--color-text-primary)]">Skills (none selected = all)</legend>
        <div className="flex flex-wrap gap-3 text-sm">
          {skills.map(s => (
            <label key={s} className="flex items-center gap-1.5"><input type="checkbox" checked={chosenSkills.includes(s)} onChange={() => setChosenSkills(toggle(chosenSkills, s))} /> {s}</label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-1 text-sm font-semibold text-[var(--color-text-primary)]">Task types (none selected = all)</legend>
        <div className="flex flex-wrap gap-3 text-sm">
          {kinds.map(k => (
            <label key={k} className="flex items-center gap-1.5"><input type="checkbox" checked={chosenKinds.includes(k)} onChange={() => setChosenKinds(toggle(chosenKinds, k))} /> {KIND_LABEL[k]}</label>
          ))}
        </div>
      </fieldset>
      <label className="flex max-w-xs flex-col gap-1 text-sm font-semibold text-[var(--color-text-primary)]">
        Number of tasks
        <select className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm font-normal" value={count} onChange={e => setCount(Number(e.target.value))}>
          {[3, 5, 8, max].filter((v, i, a) => a.indexOf(v) === i).map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <div><button type="submit" className={primaryButton} disabled={start.isPending}>Start assessment</button></div>
      {start.isError && <p role="alert" className="text-sm text-[var(--color-status-error,#dc2626)]">{messageOf(start.error, 'The assessment could not be started.')}</p>}
    </form>
  );
};

const ActiveAssessment: React.FC<{ view: AssessmentView; onChange: (v: AssessmentView) => void; onClose: () => void }> = ({ view, onChange, onClose }) => {
  const finish = useMutation({ mutationFn: () => finishAssessment(view.id), onSuccess: onChange });
  return (
    <section aria-labelledby="active-assessment-heading" className="flex flex-col gap-4" data-testid="assessment">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="active-assessment-heading" className="text-lg font-bold text-[var(--color-text-primary)]">
          {view.status === 'completed' ? 'Result' : `Answered ${view.progress.answered} of ${view.progress.total}`}
        </h2>
        <div className="flex gap-2">
          {view.status === 'active' && (
            <button type="button" className={secondaryButton} disabled={finish.isPending} onClick={() => finish.mutate()}>Finish now</button>
          )}
          <button type="button" className={secondaryButton} onClick={onClose}>Back to start</button>
        </div>
      </div>

      {view.score && (
        <div className={card} data-testid="assessment-score">
          <p className="text-base font-bold text-[var(--color-text-primary)]">{view.score.correct} of {view.score.total} correct ({view.score.percent}%)</p>
          {view.score.answered < view.score.total && <p className="text-sm text-[var(--color-text-secondary)]">{view.score.total - view.score.answered} unanswered, counted as incorrect.</p>}
          <table className="mt-2 text-left text-sm">
            <caption className="sr-only">Correct answers by skill</caption>
            <thead><tr><th scope="col" className="pr-4">Skill</th><th scope="col">Correct</th></tr></thead>
            <tbody>{view.bySkill.map(s => <tr key={s.skill}><td className="pr-4">{s.skill}</td><td>{s.correct} of {s.total}</td></tr>)}</tbody>
          </table>
          <p className="mt-2 text-xs text-[var(--color-text-secondary)]">{view.method}</p>
        </div>
      )}

      <ol className="flex flex-col gap-4">
        {view.tasks.map((task, i) => (
          <li key={task.taskId}><TaskCard index={i + 1} assessmentId={view.id} task={task} locked={view.status !== 'active'} onChange={onChange} /></li>
        ))}
      </ol>
    </section>
  );
};

const TaskCard: React.FC<{ index: number; assessmentId: string; task: AssessmentTaskView; locked: boolean; onChange: (v: AssessmentView) => void }> = ({ index, assessmentId, task, locked, onChange }) => {
  const [value, setValue] = useState<string>('');
  const submit = useMutation({
    mutationFn: () => answerTask(assessmentId, task.taskId, task.answerType === 'text' ? value : Number(value)),
    onSuccess: onChange,
  });
  const lines = task.code.split('\n');
  const name = `task-${task.taskId}`;

  return (
    <article className={card} data-testid="assessment-task" data-task={task.taskId} aria-labelledby={`${name}-title`}>
      <p className="mb-1 flex flex-wrap gap-2 text-xs text-[var(--color-text-secondary)]">
        <span>{KIND_LABEL[task.kind]}</span>·<span>{task.skill}</span>·<span>{task.difficulty}</span>
      </p>
      <h3 id={`${name}-title`} className="text-sm font-semibold text-[var(--color-text-primary)]">{index}. {task.prompt}</h3>
      <pre className="mt-2 overflow-x-auto rounded-[var(--radius-md)] bg-[var(--color-bg-surface-raised)] p-3 text-xs" aria-label={`Code, ${task.language}`}>
        <code>{lines.map((line, i) => <span key={i} className="block"><span aria-hidden="true" className="mr-3 inline-block w-5 select-none text-right text-[var(--color-text-tertiary)]">{i + 1}</span>{line}</span>)}</code>
      </pre>
      {task.tables && (
        <details className="mt-2 text-xs" open>
          <summary className="cursor-pointer font-medium">Tables</summary>
          <pre className="mt-1 overflow-x-auto rounded-[var(--radius-md)] bg-[var(--color-bg-surface-raised)] p-3">{task.tables}</pre>
        </details>
      )}

      {task.answered ? (
        <div className="mt-3 text-sm" data-testid="task-result" data-correct={String(task.correct)}>
          <p className={`flex items-center gap-1.5 font-semibold ${task.correct ? 'text-emerald-600' : 'text-[var(--color-status-error,#dc2626)]'}`}>
            {task.correct ? <CheckCircle2 size={16} aria-hidden="true" /> : <XCircle size={16} aria-hidden="true" />}
            {task.correct ? 'Correct' : 'Incorrect'}
          </p>
          <p className="text-[var(--color-text-secondary)]">
            Your answer: {task.answerType === 'choice' && typeof task.response === 'number' ? task.options?.[task.response] : task.answerType === 'line' ? `Line ${task.response}` : String(task.response)}
            {task.correctAnswer ? ` · Correct answer: ${task.correctAnswer}` : ''}
          </p>
          {task.explanation && <p className="mt-1 text-[var(--color-text-secondary)]">{task.explanation}</p>}
        </div>
      ) : locked ? (
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Not answered.</p>
      ) : (
        <form
          className="mt-3 flex flex-col gap-2"
          aria-label={`Answer task ${index}`}
          onSubmit={e => {
            e.preventDefault();
            if (value !== '') submit.mutate();
          }}
        >
          {task.answerType === 'choice' && (
            <fieldset className="flex flex-col gap-1 text-sm">
              <legend className="sr-only">Options</legend>
              {task.options!.map((option, i) => (
                <label key={option} className="flex items-center gap-2"><input type="radio" name={name} value={i} checked={value === String(i)} onChange={() => setValue(String(i))} /> <code>{option}</code></label>
              ))}
            </fieldset>
          )}
          {task.answerType === 'line' && (
            <label className="flex max-w-xs flex-col gap-1 text-sm">
              Line with the defect
              <select className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2" value={value} onChange={e => setValue(e.target.value)}>
                <option value="">Choose a line</option>
                {Array.from({ length: task.lineCount ?? lines.length }, (_, i) => <option key={i} value={i + 1}>Line {i + 1}</option>)}
              </select>
            </label>
          )}
          {task.answerType === 'text' && (
            <label className="flex max-w-md flex-col gap-1 text-sm">
              Your answer
              <input className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2" maxLength={200} value={value} onChange={e => setValue(e.target.value)} />
            </label>
          )}
          <div><button type="submit" className={primaryButton} disabled={submit.isPending || value === ''}>Submit answer</button></div>
          {submit.isError && <p role="alert" className="text-sm text-[var(--color-status-error,#dc2626)]">{messageOf(submit.error, 'The answer was not saved.')}</p>}
        </form>
      )}
    </article>
  );
};

export default TechnicalAssessmentPage;
