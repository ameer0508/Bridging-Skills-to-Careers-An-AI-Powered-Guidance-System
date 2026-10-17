import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, ListChecks } from 'lucide-react';
import apiClient from '../../lib/axios';
import { messageOf } from '../../lib/collections';
import { NextActionExplanationPanel } from '../careers/aurora/GuidanceExplanationPanels';

// Aurora Elite styling for the dashboard
const panelClass = 'rounded-[28px] border border-aurora-line bg-white p-5 shadow-aurora-md sm:p-6 space-y-4';
const quietButton =
  'inline-flex items-center gap-1.5 rounded-full border border-aurora-line bg-white px-3 py-1.5 text-xs font-semibold text-aurora-ink transition-colors hover:border-aurora-lavender hover:text-aurora-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet';
const labelClass = 'text-xs text-aurora-muted';

/** Shapes mirror backend/src/services/NextBestAction.ts. */
interface NextAction {
  id: string;
  kind: 'verify' | 'project' | 'portfolio';
  title: string;
  skills: string[];
  link: string;
  score: number;
  rank: number;
  baselineRank: number;
  factors: {
    impact: number;
    scoreBefore: number;
    scoreAfter: number;
    requiredGapsAddressed: number;
    existingEvidence: number;
    needsLearningFirst: string[];
    effortHours: { low: number; high: number; basis: string };
    capacity: { hoursPerWeek: number | null; weeks: { low: number; high: number } | null; fitsTwoWeeks: boolean | null };
    market: { note: string };
  };
  reasons: string[];
}
interface NextActions {
  hasProfile: boolean;
  career: { id: string; title: string } | null;
  scoreNow: number | null;
  totalCandidates: number;
  actions: NextAction[];
  weights: { requiredGap: number; fitsCapacity: number; needsLearningFirst: number; market: number };
  note: string;
}
interface ActivitySummary {
  streak: { current: number; activeToday: boolean; lastActiveOn: string | null };
}

const LINK_TEXT: Record<NextAction['kind'], string> = {
  verify: 'Open skill checks',
  project: 'Open practice projects',
  portfolio: 'Open portfolio',
};

/** The dashboard's ranked next steps, with the factors behind each, and the learning streak. */
export const NextStepsPanel: React.FC = () => {
  const [open, setOpen] = useState<string | null>(null);
  const next = useQuery<NextActions>({ queryKey: ['next-actions'], queryFn: async () => (await apiClient.get('/recommendations/next-actions')).data.data });
  const activity = useQuery<ActivitySummary>({ queryKey: ['activity'], queryFn: async () => (await apiClient.get('/activity')).data.data });

  const heading = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-aurora-violet/[0.08] text-aurora-violet">
          <ListChecks className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h2 id="next-steps-heading" className="font-heading text-lg font-bold text-aurora-ink">Your next steps{next.data?.career ? ` towards ${next.data.career.title}` : ''}</h2>
          <p className="text-sm text-aurora-muted">Ranked by what each would add to your evidence. Every figure is hypothetical until you have done it.</p>
        </div>
      </div>
      {activity.data && (
        <Link to="/activity" className={quietButton} data-testid="home-streak" data-current={activity.data.streak.current}>
          {activity.data.streak.current > 0 ? `${activity.data.streak.current}-day streak` : 'No streak yet'}
        </Link>
      )}
    </div>
  );

  if (next.isLoading) {
    return (
      <section className={panelClass} aria-busy="true">
        <p role="status" className="text-sm text-aurora-muted">Working out your next steps…</p>
        <div className="h-16 animate-pulse rounded-2xl bg-aurora-sidebar motion-reduce:animate-none" />
        <div className="h-16 animate-pulse rounded-2xl bg-aurora-sidebar motion-reduce:animate-none" />
      </section>
    );
  }
  if (next.isError || !next.data) {
    return (
      <section className={panelClass} aria-labelledby="next-steps-heading">
        {heading}
        <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{messageOf(next.error, 'Your next steps could not be loaded.')}</p>
        <button type="button" className={quietButton} onClick={() => next.refetch()}>Try again</button>
      </section>
    );
  }

  const data = next.data;
  return (
    <section className={panelClass} aria-labelledby="next-steps-heading" data-testid="next-steps">
      {heading}
      {!data.hasProfile ? (
        <p className="text-sm text-aurora-muted" data-testid="next-steps-empty">
          Upload a resume to get next steps based on your own evidence.{' '}
          <Link to="/resume" className="font-semibold text-aurora-violet underline-offset-2 hover:underline">Upload a resume</Link>
        </p>
      ) : data.actions.length === 0 ? (
        <p className="text-sm text-aurora-muted" data-testid="next-steps-empty">Nothing in the catalogue would raise this match further right now.</p>
      ) : (
        <ol className="space-y-3">
          {data.actions.map((action) => (
            <li
              key={action.id}
              className={`space-y-2 rounded-2xl border p-4 transition-shadow hover:shadow-aurora-sm ${action.rank === 1 ? 'border-aurora-violet/25 bg-aurora-violet/[0.04]' : 'border-aurora-line bg-aurora-canvas/60'}`}
              data-testid="next-step"
              data-action={action.id}
              data-after={action.factors.scoreAfter}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-aurora-ink">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-aurora-violet shadow-aurora-sm">{action.rank}</span>
                  <span className="sr-only">{action.rank}. </span>
                  {action.title}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={quietButton} aria-expanded={open === action.id} aria-label={`${open === action.id ? 'Hide' : 'Show'} why: ${action.title}`} onClick={() => setOpen(open === action.id ? null : action.id)}>
                    {open === action.id ? 'Hide why' : 'Why this?'}
                  </button>
                  <Link to={action.link} className={quietButton}>
                    {LINK_TEXT[action.kind]} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
              <p className="text-sm text-aurora-muted">{action.reasons[0]}</p>
              {open === action.id && (
                <div className="space-y-2" data-testid="next-step-why">
                  <ul className="list-disc space-y-1 pl-5 text-xs text-aurora-muted">
                    {action.reasons.slice(1).map((reason) => <li key={reason}>{reason}</li>)}
                    <li>Evidence you already have for {action.skills.join(', ')}: {action.factors.existingEvidence} of 100.</li>
                    <li>{action.factors.market.note}</li>
                  </ul>
                  <p className="text-[11px] text-aurora-muted">
                    Ranking score {action.score} = {action.factors.impact} for the score change
                    {action.factors.requiredGapsAddressed > 0 ? ` + ${data.weights.requiredGap * Math.min(2, action.factors.requiredGapsAddressed)} for required skills` : ''}
                    {action.factors.capacity.fitsTwoWeeks ? ` + ${data.weights.fitsCapacity} for fitting your hours` : ''}
                    {action.factors.needsLearningFirst.length > 0 ? ` - ${data.weights.needsLearningFirst} because a skill must be learnt first` : ''}.
                    {' '}Ordered by required-first alone, this would be number {action.baselineRank}.
                  </p>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
      {data.hasProfile && data.career && data.actions.length > 0 && (
        <NextActionExplanationPanel key={`next-${data.career.id}`} careerId={data.career.id} />
      )}
      {data.hasProfile && data.totalCandidates > data.actions.length && (
        <p className={labelClass}>{data.actions.length} of {data.totalCandidates} possible actions shown</p>
      )}
      <p className="text-xs leading-relaxed text-aurora-muted" data-testid="next-steps-note">{data.note}</p>
    </section>
  );
};

export default NextStepsPanel;
