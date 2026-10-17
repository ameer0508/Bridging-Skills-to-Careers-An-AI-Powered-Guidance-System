import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BellRing, ClipboardCheck, Compass, Layers, RefreshCw, Target } from 'lucide-react';
import apiClient from '../../lib/axios';
import { messageOf } from '../../lib/collections';
import { StudyPlanPanel } from '../../features/roadmaps/components/StudyPlan';
import { PracticeProjectsPanel } from '../../features/roadmaps/components/PracticeProjects';
import { FreeResourcesPanel } from '../../features/roadmaps/components/FreeResources';
import { phaseName } from '../../features/roadmaps/aurora/phaseName';
import { RoadmapJourney, type ItemStatus, type JourneyItem, type JourneyPhase, type ScheduleItem } from '../../features/roadmaps/aurora/RoadmapJourney';
import { careerLabApi, type AssessmentOverview } from '../../features/careerLab/careerLabApi';
import type { CareerMatchData } from '../../features/careers/aurora/types';
import { Notice, PageHeader, PageSkeleton, Pill, fieldClass } from '../../design/aurora/kit';
import { CardHeader, EmptyNote, Ring, cardClass } from '../../design/aurora/ui';
import { auroraButtonClass } from '../../design/aurora/buttonStyles';
import { primaryButton, quietButton } from '../../design/aurora/labStyles';

interface RoadmapResponse {
  _id: string;
  phases: JourneyPhase[];
  progressPercentage: number;
  updatedAt?: string;
}
interface ScheduleResponse {
  schedule: { items: ScheduleItem[]; nextItem: { itemId: string; title: string; phaseOrder: number } | null; remainingHours: { low: number; high: number }; remainingItems: number };
}
interface ReadinessEntry {
  careerId: { _id: string };
  gaps: { criticalGaps: Array<{ skillName: string }>; weakAreas: Array<{ skillName: string }> };
}
interface ActivityPrefs {
  preferences: { reminders: boolean; milestoneNotifications: boolean };
  policy: { inactiveDays: number; stalledDays: number };
}

const done = (s: ItemStatus) => s === 'completed' || s === 'skipped';

/** The learning roadmap for one career: a path of phases built from the student's own gaps. */
export const LearningJourneyWorkspace: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCareerId, setSelectedCareerId] = useState<string | null>(null);
  const [focusSkill, setFocusSkill] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');

  const matches = useQuery<CareerMatchData[]>({
    queryKey: ['careers-for-roadmap'],
    queryFn: async () => (await apiClient.get('/careers/matches')).data.data.matches || [],
  });
  const careerId = selectedCareerId || matches.data?.[0]?.careerId._id || null;
  const career = matches.data?.find(m => m.careerId._id === careerId) ?? null;

  const roadmapQuery = useQuery<RoadmapResponse | null>({
    queryKey: ['roadmap', careerId],
    queryFn: async () => (careerId ? (await apiClient.get(`/roadmap/${careerId}`)).data.data.roadmap : null),
    enabled: !!careerId,
  });
  // The same query the study plan uses, so both stay in step
  const scheduleQuery = useQuery<ScheduleResponse>({
    queryKey: ['roadmap', careerId, 'schedule'],
    queryFn: async () => (await apiClient.get(`/roadmap/${careerId}/schedule`)).data.data,
    enabled: !!careerId && !!roadmapQuery.data,
  });
  const readiness = useQuery<ReadinessEntry[]>({ queryKey: ['readiness', 'list'], queryFn: async () => (await apiClient.get('/readiness')).data.data.readiness || [] });
  const activity = useQuery<ActivityPrefs>({ queryKey: ['activity'], queryFn: async () => (await apiClient.get('/activity')).data.data });
  const checks = useQuery<AssessmentOverview>({ queryKey: ['career-lab', 'assessments'], queryFn: careerLabApi.assessments });

  const updateItem = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: ItemStatus; title: string }) => {
      await apiClient.patch(`/roadmap/${careerId}/items/${itemId}/status`, { status });
    },
    onSuccess: (_d, vars) => {
      setAnnounce(vars.status === 'completed' ? `${vars.title} marked complete.` : vars.status === 'in_progress' ? `${vars.title} started.` : vars.status === 'skipped' ? `${vars.title} skipped.` : `${vars.title} reset.`);
      queryClient.invalidateQueries({ queryKey: ['roadmap', careerId] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
      queryClient.invalidateQueries({ queryKey: ['careers', 'matches'] });
      queryClient.invalidateQueries({ queryKey: ['careers-for-roadmap'] });
      queryClient.invalidateQueries({ queryKey: ['career-snapshot'] });
    },
  });
  const regenerate = useMutation({
    mutationFn: async () => (await apiClient.post(`/roadmap/${careerId}/regenerate`)).data.data.roadmap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', careerId] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
      queryClient.invalidateQueries({ queryKey: ['careers-for-roadmap'] });
    },
  });
  // The box follows the click at once; it shows the stored value again once the server answers
  const [remindersDraft, setRemindersDraft] = useState<boolean | null>(null);
  const setReminders = useMutation({
    mutationFn: (reminders: boolean) => apiClient.put('/users/me/learning-preferences', { reminders }),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['activity'] });
      setRemindersDraft(null);
    },
  });

  const phases = useMemo<JourneyPhase[]>(
    () =>
      [...(roadmapQuery.data?.phases ?? [])]
        .sort((a, b) => a.order - b.order)
        .map(p => ({ ...p, items: (p.items ?? []).map(i => ({ ...i, _id: String(i._id), status: (i.status || 'not_started') as ItemStatus })) })),
    [roadmapQuery.data]
  );
  const scheduleMap = useMemo(() => new Map((scheduleQuery.data?.schedule.items ?? []).map(i => [i.itemId, i])), [scheduleQuery.data]);
  const allItems = phases.flatMap(p => p.items);
  const doneCount = allItems.filter(i => done(i.status)).length;
  const progress = roadmapQuery.data?.progressPercentage ?? null;
  const currentPhase = phases.find(p => p.items.some(i => !done(i.status))) ?? null;
  const nextId = scheduleQuery.data?.schedule.nextItem?.itemId ?? allItems.find(i => i.status === 'in_progress')?._id ?? allItems.find(i => !done(i.status))?._id;
  const nextItem: JourneyItem | undefined = allItems.find(i => i._id === nextId);

  const gaps = useMemo(() => {
    const entry = readiness.data?.find(r => r.careerId._id === careerId);
    const list = [...(entry?.gaps.criticalGaps ?? []).map(g => ({ skill: g.skillName, kind: 'missing' as const })), ...(entry?.gaps.weakAreas ?? []).map(g => ({ skill: g.skillName, kind: 'weak' as const }))];
    return list.map(g => ({ ...g, items: allItems.filter(i => i.targetSkill === g.skill).length }));
  }, [readiness.data, careerId, allItems]);

  const status = (itemId: string, s: ItemStatus) => {
    const item = allItems.find(i => i._id === itemId);
    updateItem.mutate({ itemId, status: s, title: item?.title ?? 'Item' });
  };

  if (matches.isLoading || (careerId && roadmapQuery.isLoading)) return <PageSkeleton label="Loading your roadmap" />;

  if (!careerId) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
        <PageHeader eyebrow="Learning Roadmap" icon={<Layers className="h-7 w-7" aria-hidden="true" />} title="Your learning path starts with a career match" lead="A roadmap is built from the gaps between your evidence and a career. Upload a resume so SkillBridge can match you, then come back here." />
        <div className="flex flex-wrap gap-2">
          <Link to="/resume" className={auroraButtonClass('primary', 'md')}>Upload a resume</Link>
          <Link to="/careers" className={auroraButtonClass('secondary', 'md')}>See careers</Link>
        </div>
      </div>
    );
  }

  if (roadmapQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        <Notice tone="error" title="Your roadmap could not be loaded." action={<button type="button" className={quietButton} onClick={() => roadmapQuery.refetch()}>Try again</button>}>
          {messageOf(roadmapQuery.error, 'Please try again.')}
        </Notice>
      </div>
    );
  }

  const careerSelect = (matches.data?.length ?? 0) > 1 && (
    <label className="flex items-center gap-2 text-sm text-aurora-muted">
      <span className="shrink-0">Career</span>
      <select value={careerId} onChange={e => { setSelectedCareerId(e.target.value); setFocusSkill(null); }} className={`${fieldClass} w-auto max-w-[220px]`} aria-label="Roadmap for career">
        {matches.data!.map(m => (
          <option key={m.careerId._id} value={m.careerId._id}>{m.careerId.title}</option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
      <p className="sr-only" role="status" aria-live="polite">{announce}</p>
      <PageHeader
        eyebrow="Learning Roadmap"
        icon={<Layers className="h-7 w-7" aria-hidden="true" />}
        title={career ? `Your path to ${career.careerId.title}` : 'Your learning path'}
        lead="Phases are ordered from the skills you are missing most. Progress moves only when you mark items yourself; opening a resource never marks anything."
        actions={
          <>
            {careerSelect}
            <button type="button" className={quietButton} onClick={() => regenerate.mutate()} disabled={regenerate.isPending} title="Rebuild the roadmap from your current gaps">
              <RefreshCw className={`h-4 w-4 ${regenerate.isPending ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
              {regenerate.isPending ? 'Rebuilding…' : 'Rebuild'}
            </button>
          </>
        }
      >
        {phases.length > 0 && (
          <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
            <div className="flex items-center gap-4">
              <span className="relative inline-flex shrink-0 items-center justify-center">
                <Ring value={progress} size={96} stroke={9} label="Roadmap progress" tone="sky" />
                <span aria-hidden="true" className="absolute font-heading text-xl font-extrabold text-aurora-ink">{progress === null ? '–' : `${progress}%`}</span>
              </span>
              <div className="space-y-1">
                <p className="font-heading text-lg font-bold text-aurora-ink" data-testid="roadmap-progress">
                  {doneCount} of {allItems.length} tasks done
                </p>
                <p className="text-sm text-aurora-muted">{currentPhase ? `Now in phase ${currentPhase.order}: ${phaseName(currentPhase.title)}` : 'Every phase is done.'}</p>
                {scheduleQuery.data && scheduleQuery.data.schedule.remainingItems > 0 && (
                  <p className="text-xs text-aurora-muted">
                    {scheduleQuery.data.schedule.remainingHours.low} to {scheduleQuery.data.schedule.remainingHours.high} hours left, from the stated or assumed effort of each item.
                  </p>
                )}
              </div>
            </div>
            {nextItem && !done(nextItem.status) && (
              <div className="rounded-3xl border border-aurora-violet/20 bg-white/90 p-4 shadow-aurora-sm" data-testid="roadmap-next">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-aurora-violet">Suggested next</p>
                <p className="mt-1 font-heading text-base font-bold text-aurora-ink">{nextItem.title}</p>
                {nextItem.careerRelevance && <p className="mt-1 line-clamp-2 text-sm text-aurora-muted">{nextItem.careerRelevance}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {nextItem.status !== 'in_progress' && (
                    <button type="button" className={quietButton} disabled={updateItem.isPending} onClick={() => status(nextItem._id, 'in_progress')}>
                      Start it
                    </button>
                  )}
                  <button type="button" className={primaryButton} disabled={updateItem.isPending} onClick={() => status(nextItem._id, 'completed')}>
                    Mark Complete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </PageHeader>

      {updateItem.isError && <Notice tone="error">{messageOf(updateItem.error, 'That change could not be saved.')}</Notice>}
      {regenerate.isError && <Notice tone="error">{messageOf(regenerate.error, 'The roadmap could not be rebuilt.')}</Notice>}

      {phases.length === 0 ? (
        <section className={cardClass}>
          <CardHeader id="empty-roadmap" icon={<Compass className="h-5 w-5" aria-hidden="true" />} title="No roadmap items yet" />
          <EmptyNote to="/careers" cta="Check your career matches">
            No gap was found to build a roadmap from for this career, or it has not been generated yet. Try Rebuild, or
          </EmptyNote>
        </section>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            {gaps.length > 0 && (
              <section className={cardClass} aria-labelledby="gaps-heading" data-testid="roadmap-gaps">
                <CardHeader id="gaps-heading" icon={<Target className="h-5 w-5" aria-hidden="true" />} title="Skill gaps on this path" lead="Choose one to highlight the items that work on it." />
                <div className="flex flex-wrap gap-2" role="group" aria-label="Highlight items for a skill">
                  {gaps.map(g => (
                    <button
                      key={g.skill}
                      type="button"
                      aria-pressed={focusSkill === g.skill}
                      onClick={() => setFocusSkill(focusSkill === g.skill ? null : g.skill)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet ${
                        focusSkill === g.skill ? 'border-transparent text-white [background:var(--aurora-gradient-action)]' : g.kind === 'missing' ? 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100' : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      {g.skill}
                      {/* Full-strength text: faded, it fell below 4.5:1 contrast on the amber and rose chips */}
                      <span className={focusSkill === g.skill ? 'text-white/85' : 'font-medium'}>· {g.kind === 'missing' ? 'missing' : 'weak'} · {g.items} item{g.items === 1 ? '' : 's'}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
            <RoadmapJourney phases={phases} schedule={scheduleMap} focusSkill={focusSkill} busyItem={updateItem.isPending ? updateItem.variables?.itemId ?? null : null} onStatus={status} />
          </div>

          <aside className="space-y-4 lg:col-span-4">
            <section className={cardClass} aria-labelledby="reminders-heading" data-testid="roadmap-reminders">
              <CardHeader id="reminders-heading" icon={<BellRing className="h-5 w-5" aria-hidden="true" />} title="Study reminders" />
              {activity.data ? (
                <>
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-aurora-line p-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 accent-[#5540f5]"
                      checked={remindersDraft ?? activity.data.preferences.reminders}
                      onChange={e => {
                        setRemindersDraft(e.target.checked);
                        setReminders.mutate(e.target.checked);
                      }}
                    />
                    <span className="text-sm text-aurora-ink">
                      Remind me after {activity.data.policy.inactiveDays} days without activity, or when an item has been in progress for {activity.data.policy.stalledDays} days
                    </span>
                  </label>
                  {setReminders.isError && <p role="alert" className="mt-2 text-xs text-rose-700">The setting could not be saved. Please try again.</p>}
                  <p className="mt-2 text-xs text-aurora-muted">Off until you switch it on. Reminders appear on the bell and the Learning Activity page only; nothing is e-mailed.</p>
                </>
              ) : (
                <p className="text-sm text-aurora-muted">{activity.isError ? 'Reminder settings could not be loaded.' : 'Loading…'}</p>
              )}
            </section>
            <section className={cardClass} aria-labelledby="checks-heading" data-testid="roadmap-skill-checks">
              <CardHeader id="checks-heading" icon={<ClipboardCheck className="h-5 w-5" aria-hidden="true" />} title="Skill checks" lead="Short quizzes that turn a stated skill into one verified by SkillBridge." />
              {checks.data ? (
                <ul className="flex flex-wrap gap-1.5">
                  {checks.data.skills.map(s => (
                    <li key={s.skill}>
                      <Pill tone={s.verified ? 'mint' : 'neutral'}>{s.skill}{s.verified ? ' · verified' : ''}</Pill>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-aurora-muted">{checks.isError ? 'Skill checks could not be loaded.' : 'Loading…'}</p>
              )}
              <Link to="/career-lab?tab=verify" className={`${quietButton} mt-4`}>Open skill checks</Link>
            </section>
          </aside>
        </div>
      )}

      {phases.length > 0 && <StudyPlanPanel careerId={careerId} />}
      <PracticeProjectsPanel careerId={careerId} />
      <FreeResourcesPanel careerId={careerId} />
    </div>
  );
};

export default LearningJourneyWorkspace;
