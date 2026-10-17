import React from 'react';
import { LocalExplanationPanel, type LocalExplanation } from '../../ai/components/LocalExplanationPanel';

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
export type CareerExplanation = LocalExplanation<ExplanationFacts>;

const STATUS_TEXT: Record<Status, string> = {
  applied: 'used in a role or project',
  listed: 'listed only',
  inferred: 'inferred from a related skill',
  missing: 'not found',
};

const countsLine = (label: string, c: StatusCounts) =>
  `${label}: ${c.total - c.missing} of ${c.total} matched (${c.applied} used in a role or project, ${c.listed} listed only, ${c.inferred} inferred), ${c.missing} not found`;

const FactsList: React.FC<{ facts: ExplanationFacts }> = ({ facts }) => (
  <>
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
  </>
);

export const CareerExplanationPanel: React.FC<{ careerId: string }> = ({ careerId }) => (
  <LocalExplanationPanel<ExplanationFacts>
    apiPath={`/careers/${careerId}/explanation`}
    queryKey={['career-explanation', careerId]}
    testId="career-explanation"
    note="Optional. Written by the AI model running on this SkillBridge server, from the verified facts above. It can take a minute or more. The score itself is never changed by AI."
    staleTitle="Your match has changed since this was written."
    warning="AI-generated text can contain mistakes. The verified score and requirement statuses above are authoritative."
    noEvidence="This match has no requirement-by-requirement evidence to explain."
    renderFacts={facts => <FactsList facts={facts} />}
  />
);

export default CareerExplanationPanel;
