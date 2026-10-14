import React from 'react';

/** The X9 fields of an evaluation, as returned by the API. */
export interface EvaluationQuality {
  method?: string;
  notScored?: boolean;
  notScoredReason?: string;
  factors?: Record<string, unknown>;
  uncertainty?: { level: 'low' | 'medium' | 'high'; reasons: string[] };
  limitations?: string[];
}

const LEVEL_TEXT = { low: 'Low uncertainty', medium: 'Medium uncertainty', high: 'High uncertainty' } as const;
const list = (v: unknown) => (Array.isArray(v) && v.length ? v.join(', ') : 'none');

/** One line per factor, in plain words, from whatever the evaluator measured. */
function factorLines(f: Record<string, unknown>): string[] {
  const lines: string[] = [];
  const rel = f.relevance as { questionTermsMatched?: string[]; conceptsCovered?: string[]; conceptsMissing?: string[] } | undefined;
  if (rel) lines.push(`Relevance: question words used: ${list(rel.questionTermsMatched)}; expected points covered: ${list(rel.conceptsCovered)}; not covered: ${list(rel.conceptsMissing)}.`);
  const comp = f.completeness as { words?: number; fullCreditAt?: number } | undefined;
  if (comp) lines.push(`Completeness: ${comp.words} words (full credit from about ${comp.fullCreditAt}).`);
  const spec = f.specificity as { technologies?: string[]; metrics?: string[] } | undefined;
  if (spec) lines.push(`Specificity: tools named: ${list(spec.technologies)}; measured results: ${list(spec.metrics)}.`);
  const struct = f.structure as { kind?: string; partsFound?: string[]; reasoningMarkers?: number } | undefined;
  if (struct) lines.push(struct.kind === 'STAR' ? `Structure (STAR): parts found: ${list(struct.partsFound)}.` : `Structure: ${struct.reasoningMarkers} reasoning phrase(s) such as "because" or "trade-off".`);
  const ai = f.rubricScoresOutOf5 as Record<string, number | null> | undefined;
  if (ai) lines.push(`AI rubric (0–5): ${Object.entries(ai).map(([k, v]) => `${k} ${v ?? 'not judged'}`).join(', ')}.`);
  const conflicts = f.contradictions as Array<{ first: string; second: string }> | undefined;
  for (const c of conflicts ?? []) lines.push(`Contradiction: "${c.first}" conflicts with "${c.second}".`);
  const caps = f.capsApplied as string[] | undefined;
  if (caps?.length) lines.push(`Limits applied: ${caps.join('; ')}.`);
  return lines;
}

/** How an answer was scored and how far to trust it (X9). Renders nothing for older evaluations. */
export const EvaluationDetails: React.FC<{ evaluation: EvaluationQuality; tone?: 'dark' | 'light' }> = ({ evaluation: e, tone = 'dark' }) => {
  if (!e.method && !e.notScored) return null;
  const muted = tone === 'dark' ? 'text-aurora-muted' : 'text-aurora-muted';
  return (
    <div className={`space-y-2 text-[11px] ${muted}`} data-testid="evaluation-details" data-uncertainty={e.uncertainty?.level ?? ''} data-not-scored={e.notScored ? 'true' : 'false'}>
      {e.notScored && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-700" data-testid="not-scored">
          Not scored: {e.notScoredReason} Practice scoring works in English only; this answer is saved but not counted in your overall score.
        </p>
      )}
      {e.uncertainty && (
        <p>
          <span className="font-semibold">{LEVEL_TEXT[e.uncertainty.level]}</span>: {e.uncertainty.reasons.join(' ')}
        </p>
      )}
      {e.factors && factorLines(e.factors).length > 0 && (
        <details>
          <summary className="cursor-pointer font-semibold">How this answer was scored{e.method ? ` (${e.method})` : ''}</summary>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">{factorLines(e.factors).map(l => <li key={l}>{l}</li>)}</ul>
        </details>
      )}
      {e.limitations && e.limitations.length > 0 && (
        <details>
          <summary className="cursor-pointer font-semibold">Limits of this score</summary>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">{e.limitations.map(l => <li key={l}>{l}</li>)}</ul>
        </details>
      )}
    </div>
  );
};
