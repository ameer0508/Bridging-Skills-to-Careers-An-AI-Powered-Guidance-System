import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';
import {
  careerLabApi,
  type AssessableSkill,
  type AssessmentAttempt,
  type AssessmentOverview,
  type AssessmentResult,
} from '../careerLabApi';
import { EmptyState, ErrorNote, Loading, Note } from '../../../design/aurora/labUi';
import { errorText, formatDate, formatDateTime, labelClass, panelClass, primaryButton, quietButton } from '../../../design/aurora/labStyles';

const HISTORY_STATUS: Record<string, string> = {
  in_progress: 'In progress',
  expired: 'Ran out of time',
};

/** Short quizzes that turn a stated skill into one verified by a SkillBridge skill check. */
export const VerifyPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [answers, setAnswers] = useState<Array<number | null>>([]);
  const [result, setResult] = useState<AssessmentResult | null>(null);

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
    return <section className={panelClass}><Loading label="Loading skill checks..." /></section>;
  }
  const data = overview.data;

  const heading = (
    <div className="space-y-1">
      <h2 id="verify-heading" className="font-heading text-lg font-bold text-aurora-ink">Verify skills</h2>
      <p className="text-sm text-aurora-muted">
        Answer a short quiz to show a skill instead of only stating it. A pass is recorded as verified by a SkillBridge skill check. It is not a professional certification.
      </p>
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
    const unanswered = answers.filter((a) => a === null).length;
    return (
      <section className={panelClass} aria-labelledby="verify-heading" data-testid="assessment-attempt" data-skill={attempt.skill}>
        <div className="space-y-1">
          <h2 id="verify-heading" className="font-heading text-lg font-bold text-aurora-ink">{attempt.skill} skill check</h2>
          <p className="text-sm text-aurora-muted">
            {attempt.questions.length} questions. {attempt.passMark} correct answers are needed to pass. Submit before {formatDateTime(attempt.expiresAt)}.
            {attempt.resumed ? ' You started this attempt earlier; it continues with the same questions.' : ''}
          </p>
        </div>
        <ErrorNote message={submit.isError ? errorText(submit.error, 'Your answers could not be submitted.') : null} />
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate({ attemptId: attempt.attemptId, answers });
          }}
        >
          {attempt.questions.map((question, index) => (
            <fieldset key={question.prompt} className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-3" data-testid="assessment-question">
              <legend className="text-sm font-semibold text-aurora-ink px-1">{index + 1}. {question.prompt}</legend>
              <div className="space-y-2">
                {question.options.map((option, position) => (
                  <label key={option} className="flex items-start gap-2 text-xs text-aurora-ink cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      className="mt-0.5 accent-[#5540f5]"
                      checked={answers[index] === position}
                      onChange={() => setAnswers((current) => current.map((a, i) => (i === index ? position : a)))}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className={primaryButton} disabled={submit.isPending}>Submit answers</button>
            <button type="button" className={quietButton} onClick={() => { setAttempt(null); submit.reset(); }}>Leave for now</button>
            {unanswered > 0 && <span className="text-[11px] text-amber-700" role="status">{unanswered} unanswered. Unanswered questions count as wrong.</span>}
          </div>
        </form>
        <Note>Leaving does not cancel the attempt: it still counts towards today's attempts and can be continued until its time runs out.</Note>
      </section>
    );
  }

  // ---- Result of the attempt just submitted -------------------------------------------------
  const resultView = result && (
    <div className="p-4 rounded-2xl border border-aurora-line bg-aurora-canvas/60 space-y-4" data-testid="assessment-result" data-passed={result.passed}>
      <div className="flex items-start gap-3" role="status">
        {result.passed
          ? <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
          : <XCircle className="w-5 h-5 text-rose-700 shrink-0" aria-hidden="true" />}
        <div className="space-y-1">
          <p className="text-sm font-bold text-aurora-ink">
            {result.skill}: {result.correct} of {result.of} correct. {result.passed ? 'Passed.' : `Not passed (${result.passMark} needed).`}
          </p>
          <p className="text-xs text-aurora-muted">{result.note}</p>
          {result.evidence && result.evidence.added && (
            <p className="text-xs text-aurora-muted" data-testid="assessment-evidence">
              Evidence score for {result.skill}: {result.evidence.evidenceScoreBefore ?? 0} to {result.evidence.evidenceScoreAfter}.
              {result.recalculation?.status === 'completed' ? ' Your matches, readiness and recommendations were recalculated.' : ''}
            </p>
          )}
        </div>
      </div>
      <ol className="space-y-3">
        {result.review.map((item, index) => (
          <li key={item.prompt} className="space-y-1" data-testid="assessment-review" data-correct={item.correct}>
            <p className="text-xs font-semibold text-aurora-ink">{index + 1}. {item.prompt}</p>
            <p className={`text-xs ${item.correct ? 'text-emerald-700' : 'text-rose-700'}`}>
              {item.chosen === null ? 'Not answered.' : `Your answer: ${item.options[item.chosen]}.`} {item.correct ? 'Correct.' : `Correct answer: ${item.options[item.correctOption]}.`}
            </p>
            <p className="text-[11px] text-aurora-muted">{item.explanation}</p>
          </li>
        ))}
      </ol>
      <button type="button" className={quietButton} onClick={() => setResult(null)}>Close review</button>
    </div>
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
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.skills.map((skill) => (
            <li key={skill.skill} className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-2" data-testid="assessable-skill" data-skill={skill.skill} data-verified={skill.verified}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-aurora-ink">{skill.skill}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${skill.verified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-aurora-canvas text-aurora-muted border-aurora-line'}`}>
                    {skill.verified ? 'Verified by skill check' : skill.onProfile ? 'Stated, not verified' : 'Not on your profile'}
                  </span>
                </div>
                <button
                  type="button"
                  className={skill.verified ? quietButton : primaryButton}
                  disabled={start.isPending || (skill.attemptsRemaining === 0 && !skill.inProgressAttemptId)}
                  aria-label={`${action(skill)} the ${skill.skill} skill check`}
                  onClick={() => start.mutate(skill.skill)}
                >
                  {action(skill)}
                </button>
              </div>
              <p className="text-xs text-aurora-muted">
                {skill.questionCount} questions, {skill.passMark} to pass.
                {skill.verified && skill.verifiedAt ? ` Passed ${formatDate(skill.verifiedAt)}.` : ''}
                {skill.lastResult && !skill.lastResult.passed ? ` Last attempt: ${skill.lastResult.correct} of ${skill.lastResult.of}.` : ''}
              </p>
              <p className="text-[11px] text-aurora-muted">
                {skill.attemptsRemaining > 0
                  ? `${skill.attemptsRemaining} of ${data.policy.attemptsPerDay} attempts left today.`
                  : `No attempts left today. Available again ${formatDateTime(skill.nextAttemptAt)}.`}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <h3 className={labelClass}>Your attempts</h3>
        {data.history.length === 0 ? (
          <p className="text-xs text-aurora-muted" data-testid="assessment-history-empty">You have not taken a skill check yet.</p>
        ) : (
          <ul className="space-y-1" data-testid="assessment-history">
            {data.history.map((item) => (
              <li key={item.attemptId} className="text-xs text-aurora-muted flex flex-wrap gap-x-3">
                <span className="font-semibold text-aurora-ink">{item.skill}</span>
                <span>{formatDateTime(item.submittedAt || item.startedAt)}</span>
                <span>
                  {item.status === 'submitted'
                    ? `${item.correct} of ${item.of}, ${item.passed ? 'passed' : 'not passed'}`
                    : HISTORY_STATUS[item.status]}
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
