import React from 'react';
import { LocalExplanationPanel } from '../../ai/components/LocalExplanationPanel';

/**
 * Phase 2 explanations (docs/AI_EXPLANATIONS.md): readiness, skill gaps and the next-best action,
 * each written by the local AI model from the verified facts of the deterministic result shown
 * beside it. Nothing is generated unless the user asks; the engines' figures stay the authority.
 */

const NOTE = 'Optional. Written by the AI model running on this SkillBridge server, from the verified facts shown here. It can take a minute or more.';

interface ReadinessFacts {
  career_title: string;
  readiness_score: number;
  tier: string;
  dimensions: Array<{ name: string; score: number; weight_percent: number }>;
  required_total: number;
  required_missing_skills: string[];
  requirements_total: number;
  requirements_covered: number;
  requirements_assessed: number;
  evidence_shares: { assessed: number | null; self_reported: number | null; stated: number | null; inferred: number | null };
}

const ReadinessFactsList: React.FC<{ facts: ReadinessFacts }> = ({ facts }) => (
  <ul className="space-y-1" data-testid="explanation-facts">
    <li>Readiness: {facts.readiness_score}/100, tier “{facts.tier}” (calculated by SkillBridge rules)</li>
    {facts.dimensions.map(d => (
      <li key={d.name}>{d.name}: {d.score}/100, counting {d.weight_percent}% of readiness</li>
    ))}
    <li>Required skills evidenced: {facts.required_total - facts.required_missing_skills.length} of {facts.required_total}</li>
    {facts.required_missing_skills.length > 0 && <li>Required skills not found: {facts.required_missing_skills.join(', ')}</li>}
    <li>Requirements covered: {facts.requirements_covered} of {facts.requirements_total}; checked in a skill check: {facts.requirements_assessed}</li>
    {facts.evidence_shares.assessed !== null && (
      <li>
        Credited evidence: {facts.evidence_shares.assessed}% skill checks, {facts.evidence_shares.self_reported}% recorded projects,{' '}
        {facts.evidence_shares.stated}% resume, {facts.evidence_shares.inferred}% related skills
      </li>
    )}
  </ul>
);

export const ReadinessExplanationPanel: React.FC<{ careerId: string }> = ({ careerId }) => (
  <LocalExplanationPanel<ReadinessFacts>
    apiPath={`/careers/${careerId}/explanations/readiness`}
    queryKey={['explanation', 'readiness', careerId]}
    testId="readiness-explanation"
    title="Readiness in plain words"
    note={`${NOTE} The readiness score, tier and dimensions are never changed by AI.`}
    staleTitle="Your readiness has changed since this was written."
    warning="AI-generated text can contain mistakes. The verified readiness score, tier and dimensions on this page are authoritative."
    noEvidence="This readiness result has no requirement evidence to explain yet."
    renderFacts={facts => <ReadinessFactsList facts={facts} />}
  />
);

interface SkillGapFacts {
  career_title: string;
  gaps: Array<{ skill: string; importance: string; kind: 'missing' | 'limited_evidence'; impact: number }>;
  strengths: Array<{ skill: string; impact: number }>;
}

const KIND_TEXT = { missing: 'not found', limited_evidence: 'shown only weakly' } as const;

const SkillGapFactsList: React.FC<{ facts: SkillGapFacts }> = ({ facts }) => (
  <>
    <ol className="list-decimal space-y-1 pl-5" data-testid="explanation-facts" aria-label="Gaps given to the model, in priority order">
      {facts.gaps.map(g => (
        <li key={g.skill}>
          <span className="font-medium">{g.skill}</span> ({g.importance}): {KIND_TEXT[g.kind]}, priority {g.impact}/100
        </li>
      ))}
    </ol>
    {facts.strengths.length > 0 && (
      <p className="text-aurora-muted">Strengths: {facts.strengths.map(s => `${s.skill} (${s.impact}/100)`).join(', ')}</p>
    )}
  </>
);

export const SkillGapExplanationPanel: React.FC<{ careerId: string }> = ({ careerId }) => (
  <LocalExplanationPanel<SkillGapFacts>
    apiPath={`/careers/${careerId}/explanations/skill-gap`}
    queryKey={['explanation', 'skill-gap', careerId]}
    testId="skill-gap-explanation"
    title="Your gaps in plain words"
    note={`${NOTE} Which skills are gaps, their order and their priority are never changed by AI.`}
    staleTitle="Your gaps have changed since this was written."
    warning="AI-generated text can contain mistakes. The verified gaps, their order and priorities on this page are authoritative."
    noEvidence="No skill gap is recorded for this career, so there is nothing to explain."
    renderFacts={facts => <SkillGapFactsList facts={facts} />}
  />
);

interface NextActionFacts {
  career_title: string;
  action_title: string;
  kind: 'verify' | 'project' | 'portfolio';
  skills: string[];
  total_actions: number;
  score_before: number;
  score_after: number;
  impact: number;
  required_gaps_addressed: number;
  needs_learning_first: string[];
  effort: { low: number; high: number; unit: 'minutes' | 'hours'; basis: 'time limit' | 'assumption'; approximate?: boolean };
  hours_per_week: number | null;
  weeks_low: number | null;
  weeks_high: number | null;
  fits_two_weeks: boolean | null;
}

const ACTION_KIND = { verify: 'a skill check', project: 'a practice project', portfolio: 'a portfolio entry' } as const;

const NextActionFactsList: React.FC<{ facts: NextActionFacts }> = ({ facts }) => (
  <ul className="space-y-1" data-testid="explanation-facts">
    <li>Ranked first of {facts.total_actions} by SkillBridge: {facts.action_title} ({ACTION_KIND[facts.kind]})</li>
    <li>Skills it adds evidence for: {facts.skills.join(', ')}</li>
    <li>Hypothetical match score: {facts.score_before} → {facts.score_after} (+{facts.impact}); not a prediction</li>
    <li>Required skills it addresses that are not yet shown in use: {facts.required_gaps_addressed}</li>
    <li>Must learn first: {facts.needs_learning_first.length ? facts.needs_learning_first.join(', ') : 'nothing'}</li>
    <li>
      Effort: {facts.effort.approximate ? 'about ' : ''}{facts.effort.low === facts.effort.high ? facts.effort.low : `${facts.effort.low} to ${facts.effort.high}`} {facts.effort.unit}
      {facts.effort.basis === 'assumption' ? ' (an assumed planning range)' : ' (the time limit)'}
    </li>
    {facts.hours_per_week !== null && (
      <li>At {facts.hours_per_week} hours a week: {facts.weeks_low} to {facts.weeks_high} weeks; {facts.fits_two_weeks ? 'fits' : 'does not fit'} into two weeks</li>
    )}
  </ul>
);

export const NextActionExplanationPanel: React.FC<{ careerId: string }> = ({ careerId }) => (
  <LocalExplanationPanel<NextActionFacts>
    apiPath={`/careers/${careerId}/explanations/next-action`}
    queryKey={['explanation', 'next-action', careerId]}
    testId="next-action-explanation"
    title="Why this step comes first"
    note={`${NOTE} The ranking and its figures are never changed by AI, and every action stays available without it.`}
    staleTitle="Your next steps have changed since this was written."
    warning="AI-generated text can contain mistakes. The ranked steps and their figures above are authoritative."
    noEvidence="There is no next action to explain for this career right now."
    renderFacts={facts => <NextActionFactsList facts={facts} />}
  />
);
