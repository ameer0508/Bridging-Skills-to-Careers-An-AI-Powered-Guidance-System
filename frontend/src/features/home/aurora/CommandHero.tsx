import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Target } from 'lucide-react';
import { JourneyScene } from '../../../design/aurora/JourneyScene';
import { auroraButtonClass } from '../../../design/aurora/buttonStyles';
import { Eyebrow } from '../../../design/aurora/primitives';
import type { UnifiedCareerSnapshot } from './types';
import { bestActionFor } from './bestAction';
import { Ring } from './ui';

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
};

const Metric: React.FC<{ label: string; value: number | null; unmeasured: string; to: string; tone?: 'violet' | 'mint' | 'sky'; testId: string }> = ({ label, value, unmeasured, to, tone, testId }) => (
  <Link
    to={to}
    data-testid={testId}
    className="group flex items-center gap-3 rounded-3xl border border-aurora-line bg-white/85 p-3 shadow-aurora-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-aurora-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet motion-reduce:transform-none"
  >
    <span className="shrink-0">
      <Ring value={value} size={52} stroke={6} label={label} tone={tone} />
    </span>
    <span className="min-w-0">
      <span className="block text-xs font-semibold text-aurora-muted">{label}</span>
      <span className="block font-heading text-lg font-extrabold text-aurora-ink">{value === null ? <span className="text-sm font-semibold text-aurora-muted">{unmeasured}</span> : `${value}%`}</span>
    </span>
  </Link>
);

/** Greeting, goal, next best action and the four headline figures, over the journey landscape. */
export const CommandHero: React.FC<{ name: string; snapshot: UnifiedCareerSnapshot; skillsCount: number }> = ({ name, snapshot, skillsCount }) => {
  const best = bestActionFor(snapshot);
  const goal = snapshot.targetRole || snapshot.targetCareer;
  const roadmap = snapshot.roadmap;
  return (
    <section aria-labelledby="command-hero-heading" className="relative overflow-hidden rounded-[32px] border border-aurora-line bg-white shadow-aurora-lg">
      <JourneyScene compact className="absolute inset-0 opacity-90" title="Your journey" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/10" />
      <div className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.25fr_1fr] lg:p-10">
        <div className="space-y-5">
          <Eyebrow>Command Center</Eyebrow>
          <div className="space-y-2">
            <h1 id="command-hero-heading" className="font-heading text-3xl font-extrabold leading-tight tracking-tight text-aurora-ink sm:text-4xl">
              {greeting()}, {name}
            </h1>
            {goal ? (
              <p className="inline-flex flex-wrap items-center gap-2 text-sm text-aurora-muted sm:text-base">
                <Target className="h-4 w-4 text-aurora-violet" aria-hidden="true" /> Working towards <strong className="font-semibold text-aurora-ink">{goal}</strong>
              </p>
            ) : (
              <p className="text-sm text-aurora-muted sm:text-base">
                You have not set a goal yet.{' '}
                <Link to="/profile" className="font-semibold text-aurora-violet underline-offset-2 hover:underline">
                  Choose one
                </Link>
              </p>
            )}
          </div>
          <div className="max-w-xl rounded-3xl border border-aurora-violet/15 bg-white/90 p-4 shadow-aurora-sm backdrop-blur sm:p-5" data-testid="home-best-action">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-aurora-violet">Next best action</p>
            <p className="mt-1 font-heading text-lg font-bold text-aurora-ink">{best.title}</p>
            <p className="mt-1 text-sm text-aurora-muted">{best.why}</p>
            <Link to={best.route} className={`${auroraButtonClass('primary', 'md')} mt-4`}>
              {best.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 content-end gap-3 min-[420px]:grid-cols-2">
          <Metric label="Career match" value={snapshot.isMatchEvaluated ? snapshot.matchScore : null} unmeasured="Not measured yet" to="/careers" testId="home-match" />
          <Metric label="Readiness" value={snapshot.isReadinessEvaluated ? snapshot.readinessScore : null} unmeasured="Not measured yet" to="/readiness" tone="mint" testId="home-readiness" />
          <Link
            to="/skills"
            data-testid="home-skills"
            className="flex flex-col justify-center rounded-3xl border border-aurora-line bg-white/85 p-4 shadow-aurora-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-aurora-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet motion-reduce:transform-none"
          >
            <span className="text-xs font-semibold text-aurora-muted">From your resume and profile</span>
            <span className="font-heading text-lg font-extrabold text-aurora-ink">
              {skillsCount} skill{skillsCount === 1 ? '' : 's'} identified
            </span>
          </Link>
          <Metric
            label="Roadmap progress"
            value={roadmap?.isInitialized ? roadmap.progress : null}
            unmeasured="No roadmap yet"
            to="/roadmap"
            tone="sky"
            testId="home-roadmap"
          />
          {snapshot.isMatchEvaluated && goal && goal !== snapshot.targetCareer && (
            <p className="text-xs text-aurora-muted min-[420px]:col-span-2" data-testid="home-measured-against">
              Match and readiness are measured against your closest catalogue career, <strong className="font-semibold text-aurora-ink">{snapshot.targetCareer}</strong>.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
