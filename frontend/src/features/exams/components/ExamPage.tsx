import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { messageOf } from '../../../lib/collections';
import { ExamSummary, fetchAttempts, fetchExam, fetchPerformance, startAttempt, STATUS_LABEL } from '../examsApi';
import { AttemptRunner } from './AttemptRunner';
import { StudyPlanPanel } from './StudyPlanPanel';

const TABS = [
  { id: 'syllabus', label: 'Syllabus and sources' },
  { id: 'practice', label: 'Practice' },
  { id: 'progress', label: 'Progress' },
  { id: 'plan', label: 'Study plan' },
] as const;
type Tab = (typeof TABS)[number]['id'];

const card = 'rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-4';
const primaryButton = 'rounded-[var(--radius-md)] bg-[var(--color-interactive-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60';

/** One exam pilot: official syllabus, practice attempts, topic progress and a study plan. */
export const ExamPage: React.FC = () => {
  const { examId = '' } = useParams();
  const [tab, setTab] = useState<Tab>('syllabus');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const exam = useQuery({ queryKey: ['exam', examId], queryFn: () => fetchExam(examId), retry: false });

  if (exam.isPending) return <p role="status" className="px-4 py-6 text-sm text-[var(--color-text-secondary)]">Loading the exam…</p>;
  if (exam.isError || !exam.data) {
    return (
      <div role="alert" className="mx-auto max-w-3xl px-4 py-6 text-sm">
        <AlertTriangle size={16} aria-hidden="true" className="mb-1" />
        This exam could not be loaded: {messageOf(exam.error, 'it does not exist.')} <Link to="/exams" className="underline">Back to Exam Practice</Link>
      </div>
    );
  }
  const e = exam.data;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6">
      <header className="flex flex-col gap-1">
        <Link to="/exams" className="text-xs text-[var(--color-interactive-primary)] underline">← Exam Practice</Link>
        <h1 className="text-2xl font-bold font-display text-[var(--color-text-primary)]">{e.name}</h1>
        <p className="text-xs text-[var(--color-text-secondary)]" data-testid="exam-disclaimer">{e.disclaimer}</p>
      </header>

      <div role="tablist" aria-label="Exam sections" className="flex flex-wrap gap-2">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              if (t.id !== 'practice') setAttemptId(null);
            }}
            className={`rounded-[var(--radius-md)] border px-3 py-1.5 text-sm font-medium ${
              tab === t.id ? 'border-[var(--color-interactive-primary)] bg-[var(--color-interactive-primary)] text-white' : 'border-[var(--color-border-default)] text-[var(--color-text-primary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'syllabus' && <SyllabusTab exam={e} />}
        {tab === 'practice' &&
          (attemptId ? (
            <AttemptRunner attemptId={attemptId} onClose={() => setAttemptId(null)} />
          ) : (
            <PracticeTab exam={e} onOpen={setAttemptId} />
          ))}
        {tab === 'progress' && <ProgressTab examId={e.id} />}
        {tab === 'plan' && <StudyPlanPanel examId={e.id} />}
      </div>
    </div>
  );
};

const SyllabusTab: React.FC<{ exam: ExamSummary }> = ({ exam }) => (
  <div className="flex flex-col gap-4">
    <section className={card} aria-labelledby="sources-heading" data-testid="exam-sources">
      <h2 id="sources-heading" className="mb-2 text-sm font-bold text-[var(--color-text-primary)]">Official sources</h2>
      <ul className="flex flex-col gap-2 text-sm">
        {exam.sources.map(s => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-medium text-[var(--color-interactive-primary)] underline">
              {s.title} <ExternalLink size={12} aria-hidden="true" />
            </a>
            <div className="text-xs text-[var(--color-text-secondary)]">Published: {s.published}. Read by SkillBridge on {s.accessedOn}.</div>
          </li>
        ))}
      </ul>
    </section>
    <section className={card} aria-labelledby="pattern-heading">
      <h2 id="pattern-heading" className="mb-2 text-sm font-bold text-[var(--color-text-primary)]">Official pattern</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-text-secondary)]">{exam.officialPattern.map(p => <li key={p}>{p}</li>)}</ul>
      <h3 className="mb-1 mt-3 text-sm font-semibold text-[var(--color-text-primary)]">How SkillBridge practice applies it</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-text-secondary)]">{exam.practiceRules.map(p => <li key={p}>{p}</li>)}</ul>
    </section>
    {exam.sections.map(s => (
      <section key={s.id} className={card} aria-labelledby={`sec-${s.id}`}>
        <h2 id={`sec-${s.id}`} className="text-sm font-bold text-[var(--color-text-primary)]">{s.name} <span className="font-normal text-[var(--color-text-secondary)]">· {s.questionCount} practice questions</span></h2>
        <ul className="mt-2 flex flex-col gap-2">
          {s.topics.map(t => (
            <li key={t.id} className="text-sm">
              <span className="font-medium text-[var(--color-text-primary)]">{t.name}</span>{' '}
              <span className="text-xs text-[var(--color-text-secondary)]">
                · {t.questionCount} question{t.questionCount === 1 ? '' : 's'} · about {t.estimatedHours} h (SkillBridge estimate)
              </span>
              {t.limitedContent && <span className="ml-2 rounded border border-dashed border-amber-500 px-1.5 text-xs text-amber-700" data-testid="limited-content">Limited practice content</span>}
              <p className="text-xs text-[var(--color-text-secondary)]">Official syllabus: {t.officialText}</p>
            </li>
          ))}
        </ul>
      </section>
    ))}
  </div>
);

const PracticeTab: React.FC<{ exam: ExamSummary; onOpen: (id: string) => void }> = ({ exam, onOpen }) => {
  const queryClient = useQueryClient();
  const [sections, setSections] = useState<string[]>([]);
  const [count, setCount] = useState(10);
  const [mode, setMode] = useState<'practice' | 'timed'>('practice');
  const attempts = useQuery({ queryKey: ['exam-attempts', exam.id], queryFn: () => fetchAttempts(exam.id), retry: false });
  const start = useMutation({
    mutationFn: () => startAttempt(exam.id, { sectionIds: sections.length ? sections : undefined, count, mode }),
    onSuccess: view => {
      queryClient.invalidateQueries({ queryKey: ['exam-attempts', exam.id] });
      onOpen(view.id);
    },
  });
  const available = exam.sections.filter(s => !sections.length || sections.includes(s.id)).reduce((n, s) => n + s.questionCount, 0);
  const timedText = exam.sectionalTiming
    ? `Timed: each section has its own timer (${exam.secondsPerQuestion} s per question), as in the official sectional timing.`
    : `Timed: one timer for the whole set (${exam.secondsPerQuestion} s per question, scaled from the official paper).`;

  return (
    <div className="flex flex-col gap-4">
      <form
        aria-label="Start a practice set"
        className={`${card} flex flex-col gap-3`}
        onSubmit={ev => {
          ev.preventDefault();
          start.mutate();
        }}
      >
        <fieldset>
          <legend className="mb-1 text-sm font-semibold text-[var(--color-text-primary)]">Sections (none selected = all)</legend>
          <div className="flex flex-wrap gap-3 text-sm">
            {exam.sections.map(s => (
              <label key={s.id} className="flex items-center gap-1.5">
                <input type="checkbox" checked={sections.includes(s.id)} onChange={() => setSections(sections.includes(s.id) ? sections.filter(x => x !== s.id) : [...sections, s.id])} />
                {s.name}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--color-text-primary)]">
            Questions
            <input type="number" min={1} max={40} value={count} onChange={ev => setCount(Number(ev.target.value))} className="w-24 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm font-normal" />
          </label>
          <fieldset className="flex flex-col gap-1 text-sm">
            <legend className="font-semibold text-[var(--color-text-primary)]">Mode</legend>
            <label className="flex items-center gap-1.5"><input type="radio" name="mode" checked={mode === 'practice'} onChange={() => setMode('practice')} /> Untimed practice</label>
            <label className="flex items-center gap-1.5"><input type="radio" name="mode" checked={mode === 'timed'} onChange={() => setMode('timed')} /> Timed</label>
          </fieldset>
        </div>
        <p className="text-xs text-[var(--color-text-secondary)]">
          {mode === 'timed' ? timedText : 'Untimed: answer at your own pace.'} Answers are shown after you submit.{' '}
          {count > available && <strong data-testid="content-shortfall">Only {available} questions exist for this choice; the set will have {available}.</strong>}
        </p>
        <div><button type="submit" className={primaryButton} disabled={start.isPending || count < 1 || count > 40}>Start</button></div>
        {start.isError && <p role="alert" className="text-sm text-[var(--color-status-error,#dc2626)]">{messageOf(start.error, 'The practice set could not be started.')}</p>}
      </form>

      <section aria-labelledby="attempts-heading">
        <h2 id="attempts-heading" className="mb-2 text-base font-bold text-[var(--color-text-primary)]">Your attempts</h2>
        {attempts.isPending && <p role="status" className="text-sm text-[var(--color-text-secondary)]">Loading…</p>}
        {attempts.data?.length === 0 && <p className="text-sm text-[var(--color-text-secondary)]" data-testid="attempts-empty">No attempts yet.</p>}
        <ul className="flex flex-col gap-2" data-testid="attempt-history">
          {attempts.data?.map(a => (
            <li key={a.id}>
              <button type="button" className={`${card} w-full text-left text-sm`} onClick={() => onOpen(a.id)}>
                {new Date(a.startedAt).toLocaleString()} · {a.mode === 'timed' ? 'Timed' : 'Untimed'} · {a.questionCount} questions ·{' '}
                {a.score ? `${a.score.marks} of ${a.score.maxMarks} marks (${a.score.correct} correct, ${a.score.wrong} wrong, ${a.score.unanswered} unanswered)${a.timedOut ? ' · time ran out' : ''}` : `in progress, ${a.answered} answered`}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

const STATUS_CLASS: Record<string, string> = {
  strength: 'text-emerald-700',
  weakness: 'text-[var(--color-status-error,#dc2626)]',
  developing: 'text-amber-700',
  insufficient: 'text-[var(--color-text-secondary)]',
  not_practised: 'text-[var(--color-text-tertiary)]',
};

const ProgressTab: React.FC<{ examId: string }> = ({ examId }) => {
  const perf = useQuery({ queryKey: ['exam-performance', examId], queryFn: () => fetchPerformance(examId), retry: false });
  if (perf.isPending) return <p role="status" className="text-sm text-[var(--color-text-secondary)]">Loading progress…</p>;
  if (perf.isError || !perf.data) return <p role="alert" className="text-sm">Progress could not be loaded: {messageOf(perf.error, 'the server did not respond.')}</p>;
  const p = perf.data;
  return (
    <div className="flex flex-col gap-4" data-testid="exam-progress">
      {p.completedAttempts === 0 && <p className={`${card} text-sm text-[var(--color-text-secondary)]`} data-testid="progress-empty">Submit a practice set to see topic strengths and weaknesses.</p>}
      {p.recommendations.length > 0 && (
        <section className={card} aria-labelledby="recs-heading" data-testid="exam-recommendations">
          <h2 id="recs-heading" className="mb-2 text-sm font-bold text-[var(--color-text-primary)]">What to work on next</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {p.recommendations.map(r => <li key={r.topicId}><strong>{r.topicName}</strong>: {r.reason}</li>)}
          </ol>
        </section>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm" data-testid="topic-table">
          <caption className="sr-only">Practice results by topic</caption>
          <thead><tr><th scope="col" className="py-1 pr-3">Topic</th><th scope="col" className="py-1 pr-3">Section</th><th scope="col" className="py-1 pr-3">Correct</th><th scope="col" className="py-1 pr-3">Accuracy</th><th scope="col" className="py-1">Status</th></tr></thead>
          <tbody>
            {p.topics.map(t => (
              <tr key={t.topicId} data-topic={t.topicId}>
                <th scope="row" className="py-1 pr-3 font-normal">{t.topicName}</th>
                <td className="py-1 pr-3">{t.sectionName}</td>
                <td className="py-1 pr-3">{t.correct} of {t.attempted}{t.unanswered ? ` (+${t.unanswered} unanswered)` : ''}</td>
                <td className="py-1 pr-3">{t.accuracy === null ? '—' : `${Math.round(t.accuracy * 100)}%`}</td>
                <td className={`py-1 ${STATUS_CLASS[t.status]}`}>{STATUS_LABEL[t.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="list-disc space-y-1 pl-5 text-xs text-[var(--color-text-secondary)]">
        <li>A topic is marked strong or weak only after {p.thresholds.minAnswered} answered questions (strong from {Math.round(p.thresholds.strengthAccuracy * 100)}% correct, weak below {Math.round(p.thresholds.weaknessAccuracy * 100)}%).</li>
        {p.caveats.map(c => <li key={c}>{c}</li>)}
      </ul>
    </div>
  );
};

export default ExamPage;
