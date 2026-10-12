import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ListChecks } from 'lucide-react';
import apiClient from '../../lib/axios';
import { ErrorNote, Loading, Note } from '../careerLab/components/labUi';
import { errorText, labelClass, panelClass, quietButton } from '../careerLab/components/labStyles';

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
        <ListChecks className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          <h2 id="next-steps-heading" className="text-base font-bold text-white">Your next steps{next.data?.career ? ` towards ${next.data.career.title}` : ''}</h2>
          <p className="text-xs text-slate-400">Ranked by what each would add to your evidence. Every figure is hypothetical until you have done it.</p>
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
    return <section className={panelClass}><Loading label="Working out your next steps..." /></section>;
  }
  if (next.isError || !next.data) {
    return (
      <section className={panelClass} aria-labelledby="next-steps-heading">
        {heading}
        <ErrorNote message={errorText(next.error, 'Your next steps could not be loaded.')} />
        <button type="button" className={quietButton} onClick={() => next.refetch()}>Try again</button>
      </section>
    );
  }

  const data = next.data;
  return (
    <section className={panelClass} aria-labelledby="next-steps-heading" data-testid="next-steps">
      {heading}
      {!data.hasProfile ? (
        <p className="text-sm text-slate-300" data-testid="next-steps-empty">Upload a resume to get next steps based on your own evidence.</p>
      ) : data.actions.length === 0 ? (
        <p className="text-sm text-slate-300" data-testid="next-steps-empty">Nothing in the catalogue would raise this match further right now.</p>
      ) : (
        <ol className="space-y-3">
          {data.actions.map((action) => (
            <li key={action.id} className="p-4 rounded-2xl bg-slate-900/50 border border-white/10 space-y-2" data-testid="next-step" data-action={action.id} data-after={action.factors.scoreAfter}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-white">{action.rank}. {action.title}</span>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={quietButton} aria-expanded={open === action.id} aria-label={`${open === action.id ? 'Hide' : 'Show'} why: ${action.title}`} onClick={() => setOpen(open === action.id ? null : action.id)}>
                    {open === action.id ? 'Hide why' : 'Why this?'}
                  </button>
                  <Link to={action.link} className={quietButton}>{LINK_TEXT[action.kind]}</Link>
                </div>
              </div>
              <p className="text-xs text-slate-300">{action.reasons[0]}</p>
              {open === action.id && (
                <div className="space-y-2" data-testid="next-step-why">
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
                    {action.reasons.slice(1).map((reason) => <li key={reason}>{reason}</li>)}
                    <li>Evidence you already have for {action.skills.join(', ')}: {action.factors.existingEvidence} of 100.</li>
                    <li>{action.factors.market.note}</li>
                  </ul>
                  <p className="text-[11px] text-slate-400">
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
      {data.hasProfile && data.totalCandidates > data.actions.length && (
        <p className={labelClass}>{data.actions.length} of {data.totalCandidates} possible actions shown</p>
      )}
      <Note testId="next-steps-note">{data.note}</Note>
    </section>
  );
};

export default NextStepsPanel;
