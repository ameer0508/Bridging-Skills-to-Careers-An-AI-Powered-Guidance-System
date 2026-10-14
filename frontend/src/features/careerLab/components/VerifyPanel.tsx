import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, ClipboardCheck, Clock, ShieldCheck, XCircle } from 'lucide-react';
import {
  careerLabApi,
  type AssessableSkill,
  type AssessmentAttempt,
  type AssessmentOverview,
  type AssessmentResult,
} from '../careerLabApi';
import { EmptyState, ErrorNote, Loading, Note } from '../../../design/aurora/labUi';
import { errorText, formatDate, formatDateTime, labelClass, panelClass, primaryButton, quietButton } from '../../../design/aurora/labStyles';
import { AuroraDialog, Pill } from '../../../design/aurora/kit';
import { Ring } from '../../../design/aurora/ui';

const HISTORY_STATUS: Record<string, string> = {
  in_progress: 'In progress',
  expired: 'Ran out of time',
};

/** Minutes left on an attempt, refreshed every 30 seconds: calm enough for focused work. */
const useMinutesLeft = (expiresAt: string | null) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, [expiresAt]);
  return expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 60_000)) : null;
};

/** Short quizzes that turn a stated skill into one verified by a SkillBridge skill check. */
export const VerifyPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const reduce = useReducedMotion();
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [answers, setAnswers] = useState<Array<number | null>>([]);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const submitRef = useRef<HTMLButtonElement>(null);
  const minutesLeft = useMinutesLeft(attempt?.expiresAt ?? null);

  const overview = useQuery<AssessmentOverview>({ queryKey: ['career-lab', 'assessments'], queryFn: careerLabApi.assessments });

  const refresh = () => {
    // A pass changes evidence, so everything computed from evidence is refetched
    queryClient.invalidateQueries({ queryKey: ['career-lab'] });
  };

  const start = useMutation<AssessmentAttempt, unknown, string>({
    mutationFn: (skill) => careerLabApi.startAssessment(skill),
    onSuccess: (started) => {
      setResult(null);
      setAttempt(started);
      setAnswers(started.questions.map(() => null));
      queryClient.invalidateQueries({ queryKey: ['career-lab', 'assessments'] });
    },
  });

  const submit = useMutation<AssessmentResult, unknown, { attemptId: string; answers: Array<number | null> }>({
    mutationFn: (input) => careerLabApi.submitAssessment(input.attemptId, input.answers),
    onSuccess: (scored) => {
      setAttempt(null);
      setResult(scored);
      refresh();
    },
    // An attempt that expired or was already scored cannot be continued
    onError: () => queryClient.invalidateQueries({ queryKey: ['career-lab', 'assessments'] }),
  });

  if (overview.isLoading) {
    return (
      <section className={panelClass}>
        <Loading label="Loading skill checks..." />
      </section>
    );
  }
  const data = overview.data;

  const heading = (
    <div className="flex items-start gap-3">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-aurora-violet/[0.08] text-aurora-violet">
        <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h2 id="verify-heading" className="font-heading text-lg font-bold text-aurora-ink">Verify skills</h2>
        <p className="text-sm text-aurora-muted">
          Answer a short quiz to show a skill instead of only stating it. A pass is recorded as verified by a SkillBridge skill check. It is not a professional certification.
        </p>
      </div>
    </div>
  );

  if (overview.isError || !data) {
    return (
      <section className={panelClass} aria-labelledby="verify-heading">
        {heading}
        <ErrorNote message={errorText(overview.error, 'Skill checks could not be loaded.')} />
        <button type="button" className={quietButton} onClick={() => overview.refetch()}>Try again</button>
      </section>
    );
  }

  // ---- Taking an attempt -----------------------------------------------------------------
  if (attempt) {
    const answered = answers.filter((a) => a !== null).length;
    const unanswered = answers.length - answered;
    const share = answers.length ? Math.round((answered / answers.length) * 100) : 0;
    return (
      <section className={panelClass} aria-labelledby="verify-heading" data-testid="assessment-attempt" data-skill={attempt.skill}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <Pill tone="violet">Skill check</Pill>
            <h2 id="verify-heading" className="font-heading text-2xl font-extrabold text-aurora-ink">{attempt.skill} skill check</h2>
            <p className="text-sm text-aurora-muted">
              {attempt.questions.length} questions. {attempt.passMark} correct answers are needed to pass. Submit before {formatDateTime(attempt.expiresAt)}.
              {attempt.resumed ? ' You started this attempt earlier; it continues with the same questions.' : ''}
            </p>
          </div>
          {minutesLeft !== null && (
            <p className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-aurora-line bg-aurora-canvas px-3 py-1.5 text-sm font-semibold text-aurora-ink">
              <Clock className="h-4 w-4 text-aurora-violet" aria-hidden="true" /> About {minutesLeft} minute{minutesLeft === 1 ? '' : 's'} left
            </p>
          )}
        </div>

        <div className="sticky top-0 z-10 -mx-1 rounded-2xl border border-aurora-line bg-white/95 px-3 py-2.5" data-testid="assessment-progress">
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-aurora-muted">
            <span role="status">{answered} of {answers.length} answered</span>
            <nav aria-label="Jump to a question" className="flex gap-1">
              {answers.map((a, i) => (
                <a
                  key={i}
                  href={`#assessment-q-${i}`}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet ${a === null ? 'border border-aurora-line bg-white text-aurora-muted' : 'text-white [background:var(--aurora-gradient-action)]'}`}
                  aria-label={`Question ${i + 1}${a === null ? ', not answered' : ', answered'}`}
                >
                  {i + 1}
                </a>
              ))}
            </nav>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-aurora-line" aria-hidden="true">
            <motion.div className="h-full rounded-full [background:var(--aurora-gradient-action)]" animate={{ width: `${share}%` }} transition={reduce ? { duration: 0 } : { duration: 0.3 }} />
          </div>
        </div>

        <ErrorNote message={submit.isError ? errorText(submit.error, 'Your answers could not be submitted.') : null} />
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit.reset();
            setConfirming(true);
          }}
        >
          {attempt.questions.map((question, index) => (
            <fieldset key={question.prompt} id={`assessment-q-${index}`} className="scroll-mt-28 space-y-3 rounded-3xl border border-aurora-line bg-white p-4 sm:p-5" data-testid="assessment-question">
              <legend className="float-left mb-1 w-full text-base font-semibold leading-relaxed text-aurora-ink">{index + 1}. {question.prompt}</legend>
              <div className="clear-both grid gap-2">
                {question.options.map((option, position) => {
                  const chosen = answers[index] === position;
                  return (
                    <label
                      key={option}
                      className={`flex min-h-[44px] cursor-pointer items-start gap-3 rounded-2xl border px-3.5 py-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-aurora-violet ${
                        chosen ? 'border-aurora-violet/50 bg-aurora-violet/[0.06] text-aurora-ink' : 'border-aurora-line bg-aurora-canvas/40 text-aurora-ink hover:border-aurora-lavender'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${index}`}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#5540f5]"
                        checked={chosen}
                        onChange={() => setAnswers((current) => current.map((a, i) => (i === index ? position : a)))}
                      />
                      <span className="whitespace-pre-wrap break-words">{option}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-aurora-line bg-aurora-canvas/60 p-3">
            <button ref={submitRef} type="submit" className={primaryButton} disabled={submit.isPending}>
              {submit.isPending ? 'Submitting…' : 'Submit answers'}
            </button>
            <button type="button" className={quietButton} onClick={() => { setAttempt(null); submit.reset(); }}>Leave for now</button>
            {unanswered > 0 && <span className="text-xs font-semibold text-amber-800" role="status">{unanswered} unanswered. Unanswered questions count as wrong.</span>}
          </div>
        </form>
        <Note>Leaving does not cancel the attempt: it still counts towards today's attempts and can be continued until its time runs out.</Note>

        <AuroraDialog
          open={confirming}
          onClose={() => setConfirming(false)}
          size="sm"
          title="Submit your answers?"
          footer={
            <>
              <button type="button" className={quietButton} onClick={() => setConfirming(false)}>Keep answering</button>
              <button
                type="button"
                className={primaryButton}
                onClick={() => {
                  setConfirming(false);
                  submit.mutate({ attemptId: attempt.attemptId, answers });
                }}
              >
                Submit now
              </button>
            </>
          }
        >
          <p className="text-sm text-aurora-ink">
            You have answered {answered} of {answers.length}. Once submitted, this attempt is scored and cannot be changed.
          </p>
          {unanswered > 0 && <p className="mt-2 text-sm font-semibold text-amber-800">{unanswered} unanswered question{unanswered === 1 ? '' : 's'} will count as wrong.</p>}
        </AuroraDialog>
      </section>
    );
  }

  // ---- Result of the attempt just submitted -------------------------------------------------
  const resultView = result && (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-4 rounded-3xl border p-4 sm:p-5 ${result.passed ? 'border-emerald-200 bg-emerald-50/40' : 'border-aurora-line bg-aurora-canvas/60'}`}
      data-testid="assessment-result"
      data-passed={result.passed}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center" role="status">
        <span className="relative inline-flex shrink-0 items-center justify-center self-start">
          <Ring value={Math.round((result.correct / Math.max(1, result.of)) * 100)} size={80} stroke={8} label={`${result.correct} of ${result.of} correct`} tone={result.passed ? 'mint' : 'violet'} />
          <span aria-hidden="true" className="absolute font-heading text-lg font-extrabold text-aurora-ink">{result.correct}/{result.of}</span>
        </span>
        <div className="space-y-1">
          <p className="flex items-center gap-2 font-heading text-lg font-bold text-aurora-ink">
            {result.passed ? <CheckCircle2 className="h-5 w-5 text-emerald-700" aria-hidden="true" /> : <XCircle className="h-5 w-5 text-rose-700" aria-hidden="true" />}
            {result.skill}: {result.correct} of {result.of} correct. {result.passed ? 'Passed.' : `Not passed (${result.passMark} needed).`}
          </p>
          <p className="text-sm text-aurora-muted">{result.note}</p>
          {result.evidence && result.evidence.added && (
            <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800" data-testid="assessment-evidence">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Evidence score for {result.skill}: {result.evidence.evidenceScoreBefore ?? 0} to {result.evidence.evidenceScoreAfter}.
              {result.recalculation?.status === 'completed' ? ' Your matches, readiness and recommendations were recalculated.' : ''}
            </p>
          )}
        </div>
      </div>
      <ol className="space-y-2.5">
        {result.review.map((item, index) => (
          <li key={item.prompt} className={`space-y-1 rounded-2xl border bg-white p-3.5 ${item.correct ? 'border-emerald-200' : 'border-rose-200'}`} data-testid="assessment-review" data-correct={item.correct}>
            <p className="text-sm font-semibold text-aurora-ink">{index + 1}. {item.prompt}</p>
            <p className={`text-sm ${item.correct ? 'text-emerald-800' : 'text-rose-800'}`}>
              {item.chosen === null ? 'Not answered.' : `Your answer: ${item.options[item.chosen]}.`} {item.correct ? 'Correct.' : `Correct answer: ${item.options[item.correctOption]}.`}
            </p>
            <p className="text-xs leading-relaxed text-aurora-muted">{item.explanation}</p>
          </li>
        ))}
      </ol>
      <button type="button" className={quietButton} onClick={() => setResult(null)}>Close review</button>
    </motion.div>
  );

  const action = (skill: AssessableSkill) => {
    if (skill.inProgressAttemptId) return 'Continue';
    if (skill.verified) return 'Take again';
    return 'Start';
  };

  return (
    <section className={panelClass} aria-labelledby="verify-heading">
      {heading}
      <ErrorNote message={start.isError ? errorText(start.error, 'The skill check could not be started.') : null} />
      {resultView}

      {data.skills.length === 0 ? (
        <EmptyState title="No skill checks available">There are no skill checks to take yet.</EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.skills.map((skill, i) => (
            <motion.li
              key={skill.skill}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: reduce ? 0 : Math.min(i, 8) * 0.04 }}
              className={`flex flex-col gap-3 rounded-3xl border p-4 shadow-aurora-sm ${skill.verified ? 'border-emerald-200 bg-emerald-50/40' : 'border-aurora-line bg-white'}`}
              data-testid="assessable-skill"
              data-skill={skill.skill}
              data-verified={skill.verified}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-aurora-violet/[0.08] font-heading text-sm font-extrabold text-aurora-violet" aria-hidden="true">
                  {skill.skill.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()}
                </span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${skill.verified ? 'border-emerald-200 bg-white text-emerald-800' : 'border-aurora-line bg-aurora-canvas text-aurora-muted'}`}>
                  {skill.verified ? 'Verified by skill check' : skill.onProfile ? 'Stated, not verified' : 'Not on your profile'}
                </span>
              </div>
              <div>
                <p className="font-heading text-base font-bold text-aurora-ink">{skill.skill}</p>
                <p className="text-xs text-aurora-muted">
                  {skill.questionCount} questions, {skill.passMark} to pass.
                  {skill.verified && skill.verifiedAt ? ` Passed ${formatDate(skill.verifiedAt)}.` : ''}
                  {skill.lastResult && !skill.lastResult.passed ? ` Last attempt: ${skill.lastResult.correct} of ${skill.lastResult.of}.` : ''}
                </p>
              </div>
              <p className="text-[11px] text-aurora-muted">
                {skill.attemptsRemaining > 0
                  ? `${skill.attemptsRemaining} of ${data.policy.attemptsPerDay} attempts left today.`
                  : `No attempts left today. Available again ${formatDateTime(skill.nextAttemptAt)}.`}
              </p>
              <button
                type="button"
                className={`${skill.verified ? quietButton : primaryButton} mt-auto`}
                disabled={start.isPending || (skill.attemptsRemaining === 0 && !skill.inProgressAttemptId)}
                aria-label={`${action(skill)} the ${skill.skill} skill check`}
                onClick={() => start.mutate(skill.skill)}
              >
                {action(skill)}
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <h3 className={labelClass}>Your attempts</h3>
        {data.history.length === 0 ? (
          <p className="text-sm text-aurora-muted" data-testid="assessment-history-empty">You have not taken a skill check yet.</p>
        ) : (
          <ul className="divide-y divide-aurora-line rounded-2xl border border-aurora-line bg-white" data-testid="assessment-history">
            {data.history.map((item) => (
              <li key={item.attemptId} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3.5 py-2.5 text-sm text-aurora-muted">
                <span className="font-semibold text-aurora-ink">{item.skill}</span>
                <span>{formatDateTime(item.submittedAt || item.startedAt)}</span>
                <span className={item.passed ? 'font-semibold text-emerald-800' : ''}>
                  {item.status === 'submitted' ? `${item.correct} of ${item.of}, ${item.passed ? 'passed' : 'not passed'}` : HISTORY_STATUS[item.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Note testId="assessment-note">
        {data.note} Skill checks exist for {data.skills.length} skills only: {data.skills.map((s) => s.skill).join(', ')}. Other skills cannot be verified here yet.
        A pass adds {data.policy.points} points to that skill's evidence score once, however often you pass. A failed attempt changes no score.
        Each skill allows {data.policy.attemptsPerDay} attempts a day and {data.policy.minutesToComplete} minutes per attempt.
      </Note>
    </section>
  );
};

export default VerifyPanel;
