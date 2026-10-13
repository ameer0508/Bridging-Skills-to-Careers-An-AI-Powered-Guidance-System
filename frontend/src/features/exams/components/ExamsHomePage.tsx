import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { messageOf } from '../../../lib/collections';
import { fetchExams } from '../examsApi';

/** E2/E3: the exam preparation pilots, each tied to its official syllabus. */
export const ExamsHomePage: React.FC = () => {
  const exams = useQuery({ queryKey: ['exams'], queryFn: fetchExams, retry: false });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold font-display text-[var(--color-text-primary)]">Exam Practice</h1>
        <p className="max-w-3xl text-sm text-[var(--color-text-secondary)]">
          Two preparation pilots built on the official syllabus of each exam. The practice questions are written by SkillBridge, not taken from
          the exams, and practice results stay separate from your career skills. SkillBridge is not affiliated with any exam body.
        </p>
      </header>

      {exams.isPending && <p role="status" className="text-sm text-[var(--color-text-secondary)]">Loading exams…</p>}
      {exams.isError && (
        <div role="alert" className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-status-error,#dc2626)] p-3 text-sm">
          <AlertTriangle size={16} aria-hidden="true" /> Exams could not be loaded: {messageOf(exams.error, 'the server did not respond.')}
          <button type="button" className="font-semibold underline" onClick={() => exams.refetch()}>Try again</button>
        </div>
      )}

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2" data-testid="exam-list">
        {exams.data?.map(exam => (
          <li key={exam.id} className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-4">
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">{exam.name}</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">{exam.conductingBody}</p>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {exam.sections.length} sections · {exam.questionCount} practice questions · syllabus: {exam.syllabusVersion}
            </p>
            <ul className="text-xs text-[var(--color-text-secondary)]">
              {exam.sources.map(s => (
                <li key={s.url} className="flex items-start gap-1">
                  <ExternalLink size={12} aria-hidden="true" className="mt-0.5 shrink-0" />
                  <a href={s.url} target="_blank" rel="noreferrer noopener" className="text-[var(--color-interactive-primary)] underline">{s.title}</a>
                </li>
              ))}
            </ul>
            <Link to={`/exams/${exam.id}`} className="self-start rounded-[var(--radius-md)] bg-[var(--color-interactive-primary)] px-4 py-2 text-sm font-semibold text-white">
              Open {exam.shortName}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ExamsHomePage;
