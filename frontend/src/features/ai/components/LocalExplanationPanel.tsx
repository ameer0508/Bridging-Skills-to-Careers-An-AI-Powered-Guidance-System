import React, { useEffect, useId, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Cpu, RefreshCw, Sparkles } from 'lucide-react';
import apiClient from '../../../lib/axios';
import { Disclosure, Notice, Pill } from '../../../design/aurora/kit';
import { auroraButtonClass } from '../../../design/aurora/buttonStyles';
import { AIPendingIndicator } from './AIPendingIndicator';

/**
 * The explanation of one deterministic result (a career match, readiness, skill gaps or the
 * next-best action), in two clearly separate parts (docs/AI_EXPLANATIONS.md):
 *  - a verified summary written by SkillBridge's fixed rules from the facts: always shown when the
 *    subject has one, no model involved, the authoritative wording;
 *  - optional local-AI wording, shown only when the server has it turned on (it is off by default),
 *    generated only when the user asks, and labelled experimental.
 */

export interface LocalExplanation<F = Record<string, unknown>> {
  text: string;
  provider: string;
  model: string;
  generatedAt: string;
  stale: boolean;
  facts: F;
}

export interface VerifiedSummary<F = Record<string, unknown>> {
  source: 'skillbridge_rules';
  sentences: string[];
  items: string[];
  facts: F;
}

interface ExplanationState<F> {
  explanation: LocalExplanation<F> | null;
  aiEnabled: boolean;
  summary: VerifiedSummary<F> | null;
}

export interface LocalExplanationPanelProps<F> {
  /** GET reads the summary and any saved AI wording; POST asks for AI wording (e.g. /careers/:id/explanations/readiness) */
  apiPath: string;
  queryKey: readonly unknown[];
  /** data-testid of the section; the parts inside keep the shared explanation-* ids */
  testId: string;
  title?: string;
  /** Under the AI heading: what the wording is written from and what AI never changes */
  note: string;
  staleTitle: string;
  warning: string;
  noEvidence: string;
  renderFacts: (facts: F) => React.ReactNode;
}

/** Longer than the server's own wait for the local model: model 120s < server 130s < nginx 150s < this. */
const EXPLANATION_REQUEST_TIMEOUT_MS = 160_000;

type Failure = { tone: 'warning' | 'error' | 'info'; title: string; body: string; retry: boolean };
const FAILURE: Record<string, Failure> = {
  AI_BUSY: { tone: 'warning', title: 'The local AI is busy.', body: 'It is answering other requests right now. Try again in a minute.', retry: true },
  REPLY_IN_PROGRESS: { tone: 'warning', title: 'Another AI response is still being written for you.', body: 'Wait for it to finish (for example a chat reply), then try again.', retry: true },
  AI_TIMEOUT: { tone: 'warning', title: 'The local AI took too long to answer.', body: 'Nothing was saved. You can try again; the verified results are unaffected.', retry: true },
  AI_UNAVAILABLE: { tone: 'error', title: 'The local AI is not available right now.', body: 'The verified results are unaffected.', retry: true },
  AI_EXPLANATIONS_DISABLED: { tone: 'info', title: 'AI wording is turned off.', body: 'This server shows the verified summary only.', retry: false },
  EXPLANATION_REJECTED: {
    tone: 'error',
    title: 'The AI wording was not shown.',
    body: "The local AI's text did not agree with your verified results (for example a wrong figure or a skill you do not have), so it was discarded. You can try again.",
    retry: true,
  },
};
const GENERIC_FAILURE: Failure = { tone: 'error', title: 'The AI wording could not be written.', body: 'Try again later. The verified results are unaffected.', retry: true };

/** The API client rejects with { message, status, code } (lib/axios.ts); a browser-side timeout has no code. */
function failureCode(error: unknown): string {
  const err = error as { code?: string; message?: string } | null;
  if (err?.code && err.code !== 'UNKNOWN_ERROR') return err.code;
  if (/timeout/i.test(err?.message || '')) return 'AI_TIMEOUT';
  return 'UNKNOWN';
}

export function LocalExplanationPanel<F>({
  apiPath, queryKey, testId, title = 'Explanation in plain words', note, staleTitle, warning, noEvidence, renderFacts,
}: LocalExplanationPanelProps<F>): React.ReactElement | null {
  const queryClient = useQueryClient();
  const headingId = useId();
  const resultRef = useRef<HTMLHeadingElement>(null);

  // Reads the summary and any saved AI wording; the server never runs the model for this request
  const saved = useQuery({
    queryKey,
    queryFn: async () => (await apiClient.get(apiPath)).data.data as ExplanationState<F>,
    retry: false,
  });

  const generate = useMutation({
    mutationFn: async () =>
      (await apiClient.post(apiPath, undefined, { timeout: EXPLANATION_REQUEST_TIMEOUT_MS })).data.data.explanation as LocalExplanation<F>,
    onSuccess: explanation => queryClient.setQueryData<ExplanationState<F>>(queryKey, old => (old ? { ...old, explanation } : old)),
  });

  const justGenerated = generate.isSuccess;
  // Move focus to the new wording so keyboard and screen-reader users land on it
  useEffect(() => {
    if (justGenerated) resultRef.current?.focus();
  }, [justGenerated, generate.data]);

  const state = saved.data;
  const summary = state?.summary ?? null;
  const aiEnabled = state?.aiEnabled === true;
  // Nothing to show: no verified summary for this subject and AI wording is off
  if (!saved.isLoading && !saved.isError && !summary && !aiEnabled) return null;

  const explanation = aiEnabled ? state?.explanation ?? null : null;
  const code = generate.isError ? failureCode(generate.error) : null;
  const failure = code === null ? null
    : code === 'NO_EVIDENCE' ? { tone: 'info' as const, title: 'Nothing to explain yet.', body: noEvidence, retry: false }
      : FAILURE[code] ?? GENERIC_FAILURE;
  const pending = generate.isPending;
  const button = (label: string, buttonTestId: string) => (
    <button
      type="button"
      className={auroraButtonClass(explanation ? 'secondary' : 'primary', 'md')}
      onClick={() => generate.mutate()}
      disabled={pending}
      aria-describedby={`${headingId}-note`}
      data-testid={buttonTestId}
    >
      {explanation ? <RefreshCw className="h-4 w-4" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />} {label}
    </button>
  );

  return (
    <section
      aria-labelledby={headingId}
      aria-busy={pending}
      className="space-y-4 rounded-2xl border border-aurora-violet/20 bg-aurora-violet/[0.03] p-4"
      data-testid={testId}
    >
      <h3 id={headingId} className="flex items-center gap-2 font-heading text-base font-bold text-aurora-ink">
        <CheckCircle2 className="h-4 w-4 text-aurora-violet" aria-hidden="true" /> {title}
      </h3>

      {saved.isError && <p className="text-xs text-aurora-muted">The explanation could not be loaded.</p>}

      {summary && (
        <div className="space-y-2" data-testid="explanation-summary">
          <Pill tone="mint">
            <span data-testid="explanation-summary-attribution">Verified summary · written by SkillBridge's rules from your results</span>
          </Pill>
          <div className="space-y-1.5 text-sm leading-relaxed text-aurora-ink" data-testid="explanation-summary-text">
            {summary.sentences.map((sentence, i) => <p key={i}>{sentence}</p>)}
          </div>
          {summary.items.length > 0 && (
            <ol className="list-decimal space-y-1 pl-5 text-sm text-aurora-ink" data-testid="explanation-summary-items">
              {summary.items.map(item => <li key={item}>{item}</li>)}
            </ol>
          )}
          <Disclosure summary="Facts behind this summary" testId="explanation-summary-facts">
            <div className="space-y-3 px-4 pb-4 text-sm text-aurora-ink">{renderFacts(summary.facts)}</div>
          </Disclosure>
        </div>
      )}

      {aiEnabled && (
        <div className="space-y-3 border-t border-aurora-violet/15 pt-3" data-testid="explanation-ai">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h4 className="flex items-center gap-2 text-sm font-bold text-aurora-ink">
                <Cpu className="h-4 w-4 text-aurora-violet" aria-hidden="true" /> Experimental local AI wording
              </h4>
              <p id={`${headingId}-note`} className="text-xs leading-relaxed text-aurora-muted">{note}</p>
            </div>
            {!explanation && button('Explain with local AI', 'explain-button')}
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

          {explanation && (
            <article className="space-y-3" data-testid="explanation-result" aria-labelledby={`${headingId}-result`}>
              <div className="flex flex-wrap items-center gap-2">
                <h5 id={`${headingId}-result`} ref={resultRef} tabIndex={-1} className="text-sm font-bold text-aurora-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet">
                  Local AI explanation
                </h5>
                <Pill tone="violet">
                  <span data-testid="explanation-attribution">Written by local AI · {explanation.model}</span>
                </Pill>
                <span className="text-xs text-aurora-muted">{new Date(explanation.generatedAt).toLocaleString()}</span>
              </div>

              {explanation.stale && (
                <Notice tone="info" title={staleTitle} testId="explanation-stale" action={button('Refresh explanation', 'explanation-refresh')}>
                  It describes the earlier facts listed below, not your current result.
                </Notice>
              )}

              <div className="space-y-2 text-sm leading-relaxed text-aurora-ink" data-testid="explanation-text">
                {explanation.text.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
              </div>

              <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900" data-testid="explanation-warning">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {warning}
              </p>

              <Disclosure summary="Facts given to the model" testId="explanation-facts-disclosure">
                <div className="space-y-3 px-4 pb-4 text-sm text-aurora-ink">
                  {renderFacts(explanation.facts)}
                  <p className="text-xs text-aurora-muted">No resume text is sent to the model, and nothing leaves this server.</p>
                </div>
              </Disclosure>
            </article>
          )}
        </div>
      )}

      {/* Announces the outcome once; the pending indicator announces the start */}
      <p className="sr-only" role="status" aria-live="polite">
        {justGenerated ? 'The local AI explanation is ready.' : ''}
      </p>
    </section>
  );
}

export default LocalExplanationPanel;
