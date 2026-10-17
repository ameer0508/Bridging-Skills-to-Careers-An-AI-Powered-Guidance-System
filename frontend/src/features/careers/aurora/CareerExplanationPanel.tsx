import React, { useEffect, useId, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Cpu, RefreshCw, Sparkles } from 'lucide-react';
import apiClient from '../../../lib/axios';
import { Disclosure, Notice, Pill } from '../../../design/aurora/kit';
import { auroraButtonClass } from '../../../design/aurora/buttonStyles';
import { AIPendingIndicator } from '../../ai/components/AIPendingIndicator';

/**
 * Optional plain-language explanation of a career match, written by the local AI model from the
 * verified facts of the match. Nothing is generated unless the user presses the button; opening the
 * dialog only reads a saved explanation. The verified score above stays the authority.
 */

type Status = 'applied' | 'listed' | 'inferred' | 'missing';
interface StatusCounts { total: number; applied: number; listed: number; inferred: number; missing: number }
interface ExplanationFacts {
  career_title: string;
  match_score: number;
  evidence_share_percent: number;
  requirements: Array<{ skill: string; importance: 'required' | 'preferred' | 'supporting'; status: Status }>;
  required: StatusCounts;
  preferred: StatusCounts;
  supporting: StatusCounts;
  top_missing: string[];
}
export interface CareerExplanation {
  text: string;
  provider: string;
  model: string;
  generatedAt: string;
  stale: boolean;
  facts: ExplanationFacts;
}

/** Longer than the server's own wait for the local model: model 120s < server 130s < nginx 150s < this. */
const EXPLANATION_REQUEST_TIMEOUT_MS = 160_000;

const STATUS_TEXT: Record<Status, string> = {
  applied: 'used in a role or project',
  listed: 'listed only',
  inferred: 'inferred from a related skill',
  missing: 'not found',
};

const FAILURE: Record<string, { tone: 'warning' | 'error' | 'info'; title: string; body: string; retry: boolean }> = {
  AI_BUSY: { tone: 'warning', title: 'The local AI is busy.', body: 'It is answering other requests right now. Try again in a minute.', retry: true },
  REPLY_IN_PROGRESS: { tone: 'warning', title: 'Another AI response is still being written for you.', body: 'Wait for it to finish (for example a chat reply), then try again.', retry: true },
  AI_TIMEOUT: { tone: 'warning', title: 'The local AI took too long to answer.', body: 'Nothing was saved. You can try again; the verified results above are unaffected.', retry: true },
  AI_UNAVAILABLE: { tone: 'error', title: 'The local AI is not available right now.', body: 'The verified results above are unaffected.', retry: true },
  EXPLANATION_REJECTED: {
    tone: 'error',
    title: 'The explanation was not shown.',
    body: "The local AI's text did not agree with your verified results (for example a wrong count or a skill you do not have), so it was discarded. You can try again.",
    retry: true,
  },
  NO_EVIDENCE: { tone: 'info', title: 'Nothing to explain yet.', body: 'This match has no requirement-by-requirement evidence to explain.', retry: false },
};
const GENERIC_FAILURE = { tone: 'error' as const, title: 'The explanation could not be written.', body: 'Try again later. The verified results above are unaffected.', retry: true };

/** The API client rejects with { message, status, code } (lib/axios.ts); a browser-side timeout has no code. */
function failureCode(error: unknown): string {
  const err = error as { code?: string; message?: string } | null;
  if (err?.code && err.code !== 'UNKNOWN_ERROR') return err.code;
  if (/timeout/i.test(err?.message || '')) return 'AI_TIMEOUT';
  return 'UNKNOWN';
}

const countsLine = (label: string, c: StatusCounts) =>
  `${label}: ${c.total - c.missing} of ${c.total} matched (${c.applied} used in a role or project, ${c.listed} listed only, ${c.inferred} inferred), ${c.missing} not found`;

const FactsList: React.FC<{ facts: ExplanationFacts }> = ({ facts }) => (
  <div className="space-y-3 px-4 pb-4 text-sm text-aurora-ink">
    <ul className="space-y-1" data-testid="explanation-facts">
      <li>Match score: {facts.match_score}/100 (calculated by SkillBridge rules)</li>
      <li>{facts.evidence_share_percent}% of matched requirements are used in a role or project</li>
      {facts.required.total > 0 && <li>{countsLine('Required', facts.required)}</li>}
      {facts.preferred.total > 0 && <li>{countsLine('Preferred', facts.preferred)}</li>}
      {facts.supporting.total > 0 && <li>{countsLine('Supporting', facts.supporting)}</li>}
      {facts.top_missing.length > 0 && <li>Missing requirements with the most points at stake: {facts.top_missing.join(', ')}</li>}
    </ul>
    <ul className="grid gap-1 sm:grid-cols-2" aria-label="Requirements given to the model">
      {facts.requirements.map(r => (
        <li key={r.skill} className="text-aurora-muted">
          <span className="font-medium text-aurora-ink">{r.skill}</span> ({r.importance}): {STATUS_TEXT[r.status]}
        </li>
      ))}
    </ul>
    <p className="text-xs text-aurora-muted">No resume text is sent to the model, and nothing leaves this server.</p>
  </div>
);

export const CareerExplanationPanel: React.FC<{ careerId: string }> = ({ careerId }) => {
  const queryClient = useQueryClient();
  const headingId = useId();
  const resultRef = useRef<HTMLHeadingElement>(null);
  const queryKey = ['career-explanation', careerId];

  // Reads the saved explanation only; the server never runs the model for this request
  const saved = useQuery({
    queryKey,
    queryFn: async () => (await apiClient.get(`/careers/${careerId}/explanation`)).data.data.explanation as CareerExplanation | null,
    enabled: !!careerId,
    retry: false,
  });

  const generate = useMutation({
    mutationFn: async () =>
      (await apiClient.post(`/careers/${careerId}/explanation`, undefined, { timeout: EXPLANATION_REQUEST_TIMEOUT_MS })).data.data
        .explanation as CareerExplanation,
    onSuccess: explanation => queryClient.setQueryData(queryKey, explanation),
  });

  const explanation = saved.data ?? null;
  const justGenerated = generate.isSuccess;

  // Move focus to the new explanation so keyboard and screen-reader users land on it
  useEffect(() => {
    if (justGenerated) resultRef.current?.focus();
  }, [justGenerated, generate.data]);

  const failure = generate.isError ? FAILURE[failureCode(generate.error)] ?? GENERIC_FAILURE : null;
  const pending = generate.isPending;
  const button = (label: string, testId: string) => (
    <button
      type="button"
      className={auroraButtonClass(explanation ? 'secondary' : 'primary', 'md')}
      onClick={() => generate.mutate()}
      disabled={pending}
      aria-describedby={`${headingId}-note`}
      data-testid={testId}
    >
      {explanation ? <RefreshCw className="h-4 w-4" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />} {label}
    </button>
  );

  return (
    <section
      aria-labelledby={headingId}
      aria-busy={pending}
      className="space-y-3 rounded-2xl border border-aurora-violet/20 bg-aurora-violet/[0.03] p-4"
      data-testid="career-explanation"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h3 id={headingId} className="flex items-center gap-2 font-heading text-base font-bold text-aurora-ink">
            <Cpu className="h-4 w-4 text-aurora-violet" aria-hidden="true" /> Explanation in plain words
          </h3>
          <p id={`${headingId}-note`} className="text-xs leading-relaxed text-aurora-muted">
            Optional. Written by the AI model running on this SkillBridge server, from the verified facts above. It can
            take a minute or more. The score itself is never changed by AI.
          </p>
        </div>
        {!explanation && !saved.isLoading && button('Explain with local AI', 'explain-button')}
      </div>

      {pending && <AIPendingIndicator testId="explanation-pending" />}

      {failure && (
        <Notice
          tone={failure.tone}
          title={failure.title}
          testId="explanation-error"
          action={failure.retry && !pending ? (
            <button type="button" className={auroraButtonClass('secondary', 'md')} onClick={() => generate.mutate()}>
              Try again
            </button>
          ) : undefined}
        >
          {failure.body}
        </Notice>
      )}

      {saved.isError && <p className="text-xs text-aurora-muted">A saved explanation could not be loaded.</p>}

      {explanation && (
        <article className="space-y-3" data-testid="explanation-result" aria-labelledby={`${headingId}-result`}>
          <div className="flex flex-wrap items-center gap-2">
            <h4 id={`${headingId}-result`} ref={resultRef} tabIndex={-1} className="text-sm font-bold text-aurora-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet">
              Local AI explanation
            </h4>
            <Pill tone="violet">
              <span data-testid="explanation-attribution">Written by local AI · {explanation.model}</span>
            </Pill>
            <span className="text-xs text-aurora-muted">{new Date(explanation.generatedAt).toLocaleString()}</span>
          </div>

          {explanation.stale && (
            <Notice
              tone="info"
              title="Your match has changed since this was written."
              testId="explanation-stale"
              action={button('Refresh explanation', 'explanation-refresh')}
            >
              It describes the earlier facts listed below, not your current result.
            </Notice>
          )}

          <div className="space-y-2 text-sm leading-relaxed text-aurora-ink" data-testid="explanation-text">
            {explanation.text.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
          </div>

          <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900" data-testid="explanation-warning">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            AI-generated text can contain mistakes. The verified score and requirement statuses above are authoritative.
          </p>

          <Disclosure summary="Facts given to the model" testId="explanation-facts-disclosure">
            <FactsList facts={explanation.facts} />
          </Disclosure>
        </article>
      )}

      {/* Announces the outcome once; the pending indicator announces the start */}
      <p className="sr-only" role="status" aria-live="polite">
        {justGenerated ? 'The local AI explanation is ready.' : ''}
      </p>
    </section>
  );
};

export default CareerExplanationPanel;
