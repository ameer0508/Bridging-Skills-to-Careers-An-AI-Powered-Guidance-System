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
        <h1 className="text-2xl font-bold font-display text-aurora-ink">Exam Practice</h1>
        <p className="max-w-3xl text-sm text-aurora-muted">
          Two preparation pilots built on the official syllabus of each exam. The practice questions are written by SkillBridge, not taken from
          the exams, and practice results stay separate from your career skills. SkillBridge is not affiliated with any exam body.
        </p>
      </header>

      {exams.isPending && <p role="status" className="text-sm text-aurora-muted">Loading exams…</p>}
      {exams.isError && (
        <div role="alert" className="flex items-center gap-2 rounded-2xl border border-rose-300 p-3 text-sm">
          <AlertTriangle size={16} aria-hidden="true" /> Exams could not be loaded: {messageOf(exams.error, 'the server did not respond.')}
          <button type="button" className="font-semibold underline" onClick={() => exams.refetch()}>Try again</button>
        </div>
      )}

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2" data-testid="exam-list">
        {exams.data?.map(exam => (
          <li key={exam.id} className="flex flex-col gap-3 rounded-2xl border border-aurora-line p-4">
            <div>
              <h2 className="text-base font-bold text-aurora-ink">{exam.name}</h2>
              <p className="text-xs text-aurora-muted">{exam.conductingBody}</p>
            </div>
            <p className="text-sm text-aurora-muted">
              {exam.sections.length} sections · {exam.questionCount} practice questions · syllabus: {exam.syllabusVersion}
            </p>
            <ul className="text-xs text-aurora-muted">
              {exam.sources.map(s => (
                <li key={s.url} className="flex items-start gap-1">
                  <ExternalLink size={12} aria-hidden="true" className="mt-0.5 shrink-0" />
                  <a href={s.url} target="_blank" rel="noreferrer noopener" className="text-aurora-violet underline">{s.title}</a>
                </li>
              ))}
            </ul>
            <Link to={`/exams/${exam.id}`} className="self-start rounded-2xl [background:var(--aurora-gradient-action)] px-4 py-2 text-sm font-semibold text-white">
              Open {exam.shortName}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ExamsHomePage;
