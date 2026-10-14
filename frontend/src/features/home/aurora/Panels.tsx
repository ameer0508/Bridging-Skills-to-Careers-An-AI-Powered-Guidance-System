import React from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  CalendarClock,
  Check,
  Clock,
  Compass,
  FileText,
  GraduationCap,
  Hammer,
  History,
  MessageSquare,
  Route,
  Sparkles,
  Target,
} from 'lucide-react';
import type { StudyPlanSchedule } from '../../roadmaps/components/StudyPlan';
import { rangeText } from '../../roadmaps/components/scheduleText';
import { auroraButtonClass } from '../../../design/aurora/buttonStyles';
import type { ActivityOverview, SkillsSummary, UnifiedCareerSnapshot } from './types';
import { Bar, CardHeader, EmptyNote, Ring, cardClass } from './ui';

type Snap = { snapshot: UnifiedCareerSnapshot };
type StageState = 'done' | 'active' | 'todo';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** The five journey stages with what the stored data says about each. */
export const CareerPathway: React.FC<Snap> = ({ snapshot }) => {
  const { resumeInfo, roadmap, interviews, opportunities } = snapshot;
  const projects = resumeInfo?.projectsCount ?? 0;
  const stages: Array<{ name: string; icon: React.ReactNode; state: StageState; detail: string; to: string }> = [
    {
      name: 'Discover',
      icon: <Compass className="h-4 w-4" aria-hidden="true" />,
      state: resumeInfo?.hasResume && snapshot.totalSkills > 0 ? 'done' : 'active',
      detail: resumeInfo?.hasResume ? `${plural(snapshot.totalSkills, 'skill')} from your resume` : 'Upload a resume to begin',
      to: resumeInfo?.hasResume ? '/careers' : '/resume',
    },
    {
      name: 'Learn',
      icon: <GraduationCap className="h-4 w-4" aria-hidden="true" />,
      state: roadmap?.isInitialized ? (roadmap.progress >= 100 ? 'done' : 'active') : 'todo',
      detail: roadmap?.isInitialized ? `${roadmap.completedMilestones} of ${roadmap.totalMilestones} roadmap items done` : 'No roadmap yet',
      to: '/roadmap',
    },
    {
      name: 'Build',
      icon: <Hammer className="h-4 w-4" aria-hidden="true" />,
      state: projects > 0 ? 'done' : 'todo',
      detail: projects > 0 ? `${plural(projects, 'project')} on your resume` : 'No projects recorded yet',
      to: '/portfolio',
    },
    {
      name: 'Practice',
      icon: <MessageSquare className="h-4 w-4" aria-hidden="true" />,
      state: interviews.completed > 0 ? 'done' : interviews.total > 0 ? 'active' : 'todo',
      detail: interviews.total > 0 ? `${plural(interviews.completed, 'practice interview')} completed` : 'No practice interviews yet',
      to: '/interview-agent',
    },
    {
      name: 'Opportunities',
      icon: <Briefcase className="h-4 w-4" aria-hidden="true" />,
      state: opportunities.applied + opportunities.interviewing + opportunities.offer > 0 ? 'done' : opportunities.total > 0 ? 'active' : 'todo',
      detail: opportunities.total > 0 ? `${plural(opportunities.applied, 'application')} sent` : 'No jobs tracked yet',
      to: '/job-agent',
    },
  ];
  const dot: Record<StageState, string> = {
    done: 'bg-aurora-mint text-white',
    active: 'text-white [background:var(--aurora-gradient-action)]',
    todo: 'border border-aurora-line bg-white text-aurora-muted',
  };
  const stateText: Record<StageState, string> = { done: 'Started', active: 'In progress', todo: 'Not started' };
  return (
    <section className={cardClass} aria-labelledby="pathway-heading" data-testid="home-pathway">
      <CardHeader id="pathway-heading" icon={<Route className="h-5 w-5" aria-hidden="true" />} title="Career pathway" lead="Where your own records place you on the journey." />
      <ol className="grid gap-3 sm:grid-cols-5">
        {stages.map((stage, i) => (
          <li key={stage.name} className="relative">
            {i < stages.length - 1 && <span aria-hidden="true" className="absolute left-[18px] top-9 hidden h-px w-[calc(100%-12px)] bg-aurora-line sm:block" />}
            <Link
              to={stage.to}
              className="group relative flex items-start gap-3 rounded-2xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet sm:flex-col sm:gap-2"
            >
              <span className={`relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-aurora-sm transition-transform group-hover:scale-105 ${dot[stage.state]}`}>
                {stage.state === 'done' ? <Check className="h-4 w-4" aria-hidden="true" /> : stage.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-aurora-ink">{stage.name}</span>
                <span className="block text-xs text-aurora-muted">{stage.detail}</span>
                <span className="sr-only">: {stateText[stage.state]}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
};

/** The required skills not yet in the student's evidence, and the skills found so far by area. */
export const SkillGapCard: React.FC<Snap & { skills: SkillsSummary | undefined }> = ({ snapshot, skills }) => {
  const gaps = snapshot.criticalGaps.slice(0, 6);
  const areas = Object.entries(skills?.categories ?? {})
    .map(([name, list]) => ({ name, count: list.length }))
    .filter(a => a.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const most = Math.max(1, ...areas.map(a => a.count));
  return (
    <section className={cardClass} aria-labelledby="gaps-heading" data-testid="home-skill-gaps">
      <CardHeader id="gaps-heading" icon={<Target className="h-5 w-5" aria-hidden="true" />} title="Skill gap overview" action={{ to: '/skills', label: 'Skills' }} />
      {gaps.length > 0 ? (
        <>
          <p className="mb-2 text-xs font-semibold text-aurora-muted">Required for {snapshot.targetCareer}, not yet in your evidence</p>
          <ul className="flex flex-wrap gap-2">
            {gaps.map(gap => (
              <li key={gap} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                {gap}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyNote>{snapshot.totalSkills > 0 ? `No critical gap is recorded for ${snapshot.targetCareer}.` : 'Gaps appear once your skills are known.'}</EmptyNote>
      )}
      {areas.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-xs font-semibold text-aurora-muted">Skills you have, by area</p>
          {areas.map(area => (
            <div key={area.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium capitalize text-aurora-ink">{area.name.replace(/_/g, ' ')}</span>
                <span className="text-aurora-muted">{area.count}</span>
              </div>
              <Bar value={Math.round((area.count / most) * 100)} label={`${area.name}: ${area.count} skills`} tone="mint" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

const when = (iso: string) => {
  const date = new Date(iso);
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

export const RecentActivityCard: React.FC<{ activity: ActivityOverview | undefined; loading: boolean }> = ({ activity, loading }) => {
  const recent = (activity?.recent ?? []).slice(0, 5);
  return (
    <section className={cardClass} aria-labelledby="activity-heading" data-testid="home-recent-activity">
      <CardHeader id="activity-heading" icon={<History className="h-5 w-5" aria-hidden="true" />} title="Recent activity" action={{ to: '/activity', label: 'All activity' }} />
      {loading ? (
        <div className="space-y-2" aria-busy="true">
          <div className="h-10 animate-pulse rounded-2xl bg-aurora-sidebar motion-reduce:animate-none" />
          <div className="h-10 animate-pulse rounded-2xl bg-aurora-sidebar motion-reduce:animate-none" />
        </div>
      ) : recent.length > 0 ? (
        <ol className="space-y-1">
          {recent.map((entry, i) => (
            <li key={`${entry.at}-${i}`} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-aurora-canvas">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-aurora-lavender" />
              <span className="min-w-0 flex-1 truncate text-sm text-aurora-ink">{entry.label}</span>
              <span className="shrink-0 text-xs text-aurora-muted">{when(entry.at)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyNote>Nothing recorded yet. Finishing a roadmap item, a practice interview or an application shows up here.</EmptyNote>
      )}
    </section>
  );
};

export const ResumeCard: React.FC<Snap> = ({ snapshot }) => {
  const info = snapshot.resumeInfo;
  return (
    <section className={cardClass} aria-labelledby="resume-heading" data-testid="home-resume">
      <CardHeader id="resume-heading" icon={<FileText className="h-5 w-5" aria-hidden="true" />} title="Resume" action={info?.hasResume ? { to: '/resume', label: 'Open' } : undefined} />
      {info?.hasResume ? (
        <div className="space-y-3">
          <p className="truncate text-sm font-semibold text-aurora-ink" title={info.fileName ?? undefined}>
            {info.fileName || 'Your resume'}
          </p>
          {info.updatedAt && <p className="text-xs text-aurora-muted">Updated {new Date(info.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              ['Experience', info.experienceCount ?? 0],
              ['Projects', info.projectsCount ?? 0],
              ['Education', info.educationCount ?? 0],
            ].map(([label, n]) => (
              <div key={label as string} className="rounded-2xl bg-aurora-canvas px-2 py-2.5">
                <dt className="text-[11px] text-aurora-muted">{label}</dt>
                <dd className="font-heading text-lg font-extrabold text-aurora-ink">{n}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <EmptyNote to="/resume" cta="Upload a resume">
          No resume yet.
        </EmptyNote>
      )}
    </section>
  );
};

export const JobsCard: React.FC<Snap> = ({ snapshot }) => {
  const o = snapshot.opportunities;
  const stages = [
    ['Saved', o.saved],
    ['Applied', o.applied],
    ['Interviewing', o.interviewing],
    ['Offers', o.offer],
  ] as const;
  return (
    <section className={cardClass} aria-labelledby="jobs-heading" data-testid="home-jobs">
      <CardHeader id="jobs-heading" icon={<Briefcase className="h-5 w-5" aria-hidden="true" />} title="Job opportunities" lead={`${o.total} tracked job${o.total === 1 ? '' : 's'}`} action={{ to: '/job-agent', label: 'Job search' }} />
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stages.map(([label, n]) => (
          <div key={label} className="rounded-2xl border border-aurora-line bg-aurora-canvas/60 px-3 py-2.5">
            <dt className="text-[11px] font-semibold text-aurora-muted">{label}</dt>
            <dd className="font-heading text-xl font-extrabold text-aurora-ink">{n}</dd>
          </div>
        ))}
      </dl>
      {o.total === 0 && (
        <div className="mt-3">
          <EmptyNote to="/job-agent" cta="Search jobs">
            Save a posting to track it here.
          </EmptyNote>
        </div>
      )}
    </section>
  );
};

export const InterviewCard: React.FC<Snap> = ({ snapshot }) => {
  const iv = snapshot.interviews;
  const avg = iv.isEvaluated ? iv.averageScore : null;
  return (
    <section className={cardClass} aria-labelledby="interviews-heading" data-testid="home-interviews">
      <CardHeader id="interviews-heading" icon={<MessageSquare className="h-5 w-5" aria-hidden="true" />} title="Interview preparation" action={{ to: '/interview-agent', label: 'Practise' }} />
      <div className="flex items-center gap-4">
        <span className="shrink-0">
          <Ring value={avg} label="Average practice score" tone="sky" />
        </span>
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-aurora-ink">{plural(iv.completed, 'session')} completed</p>
          <p className="text-aurora-muted">{avg === null ? 'No scored session yet.' : `Average score ${avg} / 100${iv.latestScore !== null ? `, latest ${iv.latestScore}` : ''}.`}</p>
        </div>
      </div>
      {iv.latestWeaknesses && iv.latestWeaknesses.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold text-aurora-muted">To work on, from your latest session</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-aurora-ink">
            {iv.latestWeaknesses.slice(0, 2).map(w => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

/** Assistant access, stating plainly whether a language model is answering or the labelled fallback. */
export const AssistantCard: React.FC<Snap> = ({ snapshot }) => {
  const live = snapshot.telemetry?.aiStatus === 'LIVE';
  return (
    <section
      aria-labelledby="assistant-heading"
      data-testid="home-assistant"
      data-ai-status={live ? 'live' : 'fallback'}
      className="relative overflow-hidden rounded-[28px] p-5 text-white shadow-aurora-lg [background:var(--aurora-gradient-action)] sm:p-6"
    >
      <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="relative space-y-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 id="assistant-heading" className="font-heading text-lg font-bold">
          Ask the career assistant
        </h2>
        <p className="text-sm text-white/85">
          {live
            ? 'Questions about your goal, gaps or roadmap are answered with your profile as context.'
            : 'No language model is reachable right now. You can still ask; answers come from the built-in rules and are labelled as such.'}
        </p>
        <Link to="/ai" className={`${auroraButtonClass('secondary', 'md')} !text-aurora-indigo`}>
          Open the assistant
        </Link>
      </div>
    </section>
  );
};

/** The study schedule in one line: the same figures as the roadmap page, from the snapshot. */
export const StudyPlanCard: React.FC<{ schedule: StudyPlanSchedule }> = ({ schedule }) => (
  <section className={cardClass} aria-labelledby="home-study-plan-heading" data-testid="home-study-plan">
    <CardHeader id="home-study-plan-heading" icon={<CalendarClock className="h-5 w-5" aria-hidden="true" />} title="Study plan" action={{ to: '/roadmap', label: 'Open roadmap' }} />
    <p className="text-sm text-aurora-ink">
      {schedule.remainingItems === 0
        ? 'Every roadmap item is done.'
        : schedule.weeksRemaining
          ? `${schedule.remainingItems} items left: ${rangeText(schedule.weeksRemaining, 'week')} at ${schedule.hoursPerWeek} hours a week.`
          : `${schedule.remainingItems} items left (${rangeText(schedule.remainingHours, 'hour')}). Set your weekly hours on the roadmap page to see this in weeks.`}
      {schedule.remainingItems > 0 && schedule.nextItemTitle ? ` Next: ${schedule.nextItemTitle}.` : ''}
    </p>
    {schedule.finishBetween && schedule.remainingItems > 0 && (
      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-aurora-muted">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" /> A plan from your own figures, not a prediction.
      </p>
    )}
  </section>
);
