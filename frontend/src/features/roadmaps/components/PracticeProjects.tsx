import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, ChevronDown, Hammer } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../../../lib/axios';
import { EmptyState, ErrorNote, Loading, Note, SkillChips } from '../../../design/aurora/labUi';
import { errorText, formatDate, labelClass, panelClass, primaryButton, quietButton } from '../../../design/aurora/labStyles';

/** Shapes mirror backend/src/services/ProjectSuggestionService.ts. */
interface Range {
  low: number;
  high: number;
}
interface Suggestion {
  briefId: string;
  title: string;
  summary: string;
  practises: Array<{ skill: string; importance: string; currentStatus: string }>;
  alternatives: string[][];
  tasks: string[];
  deliverables: string[];
  effortHours: Range;
  weeks: Range | null;
  hypotheticalScore: { before: number; after: number; delta: number };
  requiredGapsClosed: number;
  why: string;
  started: { projectId: string; status: string } | null;
}
interface SuggestionResult {
  hasProfile: boolean;
  career: { id: string; title: string; matchScore: number } | null;
  hoursPerWeek: number | null;
  suggestions: Suggestion[];
  note: string;
}
interface Project {
  id: string;
  briefId: string;
  title: string;
  summary: string;
  targetSkills: string[];
  tasks: Array<{ text: string; done: boolean }>;
  tasksDone: number;
  deliverables: string[];
  status: 'planned' | 'in_progress' | 'completed';
  startedAt: string | null;
  completedAt: string | null;
  evidence: string;
}

const STATUS_TONE: Record<Project['status'], string> = {
  planned: 'border-aurora-line bg-white text-aurora-muted',
  in_progress: 'border-aurora-violet/20 bg-aurora-violet/[0.07] text-aurora-indigo',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

const STATUS_TEXT: Record<Project['status'], string> = {
  planned: 'Planned',
  in_progress: 'In progress',
  completed: 'Marked complete by you',
};

/** Practice projects suggested from the user's gaps for one career, and the ones they took on. */
export const PracticeProjectsPanel: React.FC<{ careerId: string }> = ({ careerId }) => {
  const queryClient = useQueryClient();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<string | null>(null);

  const suggestions = useQuery<SuggestionResult>({
    queryKey: ['projects', 'suggestions', careerId],
    queryFn: async () => (await apiClient.get('/projects/suggestions', { params: { careerId } })).data.data,
  });
  const projects = useQuery<Project[]>({
    queryKey: ['projects', 'mine'],
    queryFn: async () => (await apiClient.get('/projects')).data.data.projects,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['projects'] });

  const start = useMutation<unknown, unknown, string>({
    mutationFn: (briefId) => apiClient.post('/projects', { briefId, careerId }),
    onSuccess: refresh,
  });
  const update = useMutation<unknown, unknown, { id: string; body: Record<string, unknown> }>({
    mutationFn: ({ id, body }) => apiClient.patch(`/projects/${id}`, body),
    onSuccess: refresh,
  });
  const remove = useMutation<unknown, unknown, string>({
    mutationFn: (id) => apiClient.delete(`/projects/${id}`),
    onSuccess: refresh,
  });

  const heading = (
    <div className="flex items-start gap-3">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-aurora-violet/[0.08] text-aurora-violet"><Hammer className="h-5 w-5" aria-hidden="true" /></span>
      <div className="space-y-1">
        <h2 id="practice-projects-heading" className="font-heading text-lg font-bold text-aurora-ink">Practice projects</h2>
        <p className="text-sm text-aurora-muted">Projects chosen because they put skills you have not yet shown in use to work. Taking one on, or marking it complete, is your own record and changes no score.</p>
      </div>
    </div>
  );

  if (suggestions.isLoading || projects.isLoading) {
    return <section className={panelClass}><Loading label="Loading practice projects..." /></section>;
  }
  if (suggestions.isError || projects.isError || !suggestions.data) {
    return (
      <section className={panelClass} aria-labelledby="practice-projects-heading">
        {heading}
        <ErrorNote message={errorText(suggestions.error || projects.error, 'Practice projects could not be loaded.')} />
        <button type="button" className={quietButton} onClick={() => { suggestions.refetch(); projects.refetch(); }}>Try again</button>
      </section>
    );
  }

  const data = suggestions.data;
  const mine = projects.data || [];
  const failed = start.error || update.error || remove.error;

  return (
    <section className={panelClass} aria-labelledby="practice-projects-heading" data-testid="practice-projects">
      {heading}
      <ErrorNote message={failed ? errorText(failed, 'That change could not be saved.') : null} />

      {mine.length > 0 && (
        <div className="space-y-3">
          <h3 className={labelClass}>Projects you have taken on</h3>
          <ul className="grid gap-3 lg:grid-cols-2">
            {mine.map((project) => {
              const share = project.tasks.length ? Math.round((project.tasksDone / project.tasks.length) * 100) : 0;
              return (
                <li
                  key={project.id}
                  className={`flex flex-col gap-3 rounded-3xl border p-4 shadow-aurora-sm ${project.status === 'completed' ? 'border-emerald-200 bg-emerald-50/40' : 'border-aurora-line bg-white'}`}
                  data-testid="my-project"
                  data-status={project.status}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1.5">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[project.status]}`}>
                        {project.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
                        {STATUS_TEXT[project.status]}
                      </span>
                      <p className="font-heading text-base font-bold text-aurora-ink">{project.title}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.status !== 'completed' ? (
                        <button type="button" className={primaryButton} disabled={update.isPending} onClick={() => update.mutate({ id: project.id, body: { status: 'completed' } })}>
                          Mark complete
                        </button>
                      ) : (
                        <button type="button" className={quietButton} disabled={update.isPending} onClick={() => update.mutate({ id: project.id, body: { status: 'in_progress' } })}>
                          Reopen
                        </button>
                      )}
                      <button type="button" className={quietButton} disabled={remove.isPending} aria-label={`Remove ${project.title}`} onClick={() => remove.mutate(project.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                  <SkillChips skills={project.targetSkills} tone="warn" />
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-aurora-muted">
                      <span>{project.tasksDone} of {project.tasks.length} tasks ticked by you</span>
                      <span>{share}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-aurora-line" aria-hidden="true">
                      <motion.div
                        className="h-full rounded-full [background:var(--aurora-gradient-action)]"
                        initial={reduce ? false : { width: 0 }}
                        animate={{ width: `${share}%` }}
                        transition={reduce ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                  <fieldset className="space-y-1">
                    <legend className="sr-only">{project.tasksDone} of {project.tasks.length} tasks done</legend>
                    {project.tasks.map((task, index) => (
                      <label key={task.text} className="flex min-h-[32px] cursor-pointer items-start gap-2.5 rounded-xl px-2 py-1 text-sm text-aurora-ink hover:bg-aurora-canvas">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 shrink-0 accent-[#5540f5]"
                          checked={task.done}
                          disabled={update.isPending}
                          onChange={(e) => update.mutate({ id: project.id, body: { task: { index, done: e.target.checked } } })}
                        />
                        <span className={task.done ? 'text-aurora-muted line-through decoration-aurora-lavender' : ''}>{task.text}</span>
                      </label>
                    ))}
                  </fieldset>
                  <p className="mt-auto text-xs leading-relaxed text-aurora-muted">
                    {project.completedAt ? `Marked complete ${formatDate(project.completedAt)}. ` : project.startedAt ? `Started ${formatDate(project.startedAt)}. ` : ''}
                    {project.evidence}
                    {project.status === 'completed' && <> <Link to="/portfolio" className="font-semibold text-aurora-violet underline-offset-2 hover:underline">Add it to your portfolio</Link> with a link to make it count.</>}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <h3 className={labelClass}>Suggested{data.career ? ` for ${data.career.title}` : ''}</h3>
        {!data.hasProfile ? (
          <EmptyState title="No suggestions yet">Projects are suggested from the gaps between your evidence and a career. Upload a resume first.</EmptyState>
        ) : data.suggestions.length === 0 ? (
          <EmptyState title="No project fits a gap">None of the projects in the catalogue addresses a skill you have not already shown in use for this career.</EmptyState>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {data.suggestions.map((s, i) => {
              const expanded = open === s.briefId;
              return (
                <motion.li
                  key={s.briefId}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : Math.min(i, 6) * 0.05 }}
                  className={`flex flex-col gap-3 rounded-3xl border bg-white p-4 shadow-aurora-sm transition-shadow hover:shadow-aurora-md ${expanded ? 'border-aurora-violet/30 lg:col-span-2' : 'border-aurora-line'}`}
                  data-testid="project-suggestion"
                  data-brief={s.briefId}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        {i === 0 && <span className="rounded-full border border-aurora-violet/20 bg-aurora-violet/[0.07] px-2.5 py-0.5 text-xs font-semibold text-aurora-indigo">Most useful for your gaps</span>}
                        {s.requiredGapsClosed > 0 && (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            {s.requiredGapsClosed} required skill{s.requiredGapsClosed === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                      <p className="font-heading text-base font-bold text-aurora-ink">{s.title}</p>
                    </div>
                    {s.started ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Taken on
                      </span>
                    ) : (
                      <button type="button" className={primaryButton} disabled={start.isPending} aria-label={`Take on ${s.title}`} onClick={() => start.mutate(s.briefId)}>
                        Take on
                      </button>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-aurora-muted">{s.summary}</p>
                  <p className="rounded-2xl bg-aurora-canvas/70 px-3 py-2 text-sm text-aurora-ink" data-testid="project-why">{s.why}</p>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-aurora-muted">Skills it puts to work</p>
                    <SkillChips skills={s.practises.map((p) => p.skill)} tone="warn" />
                  </div>
                  {s.alternatives.map((group) => (
                    <p key={group.join()} className="text-xs text-aurora-muted">Uses one of {group.join(', ')}; the one counted is the one that matters most for this career.</p>
                  ))}
                  <p className="text-xs leading-relaxed text-aurora-muted" data-testid="project-effect">
                    Assumed effort {s.effortHours.low} to {s.effortHours.high} hours
                    {s.weeks ? ` (${s.weeks.low === s.weeks.high ? `about ${s.weeks.low}` : `${s.weeks.low} to ${s.weeks.high}`} weeks at ${data.hoursPerWeek} hours a week)` : ''}.
                    {' '}If these skills had project evidence on your profile, the match would be {s.hypotheticalScore.after}% instead of {s.hypotheticalScore.before}% (hypothetical).
                  </p>
                  <button type="button" className={`${quietButton} self-start`} aria-expanded={expanded} onClick={() => setOpen(expanded ? null : s.briefId)}>
                    {expanded ? 'Hide details' : 'Tasks and deliverables'}
                    <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        initial={reduce ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={reduce ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="grid gap-4 rounded-2xl border border-aurora-line bg-aurora-canvas/50 p-4 sm:grid-cols-2">
                          <div>
                            <h4 className={labelClass}>Tasks</h4>
                            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-aurora-ink">
                              {s.tasks.map((task) => (
                                <li key={task}>{task}</li>
                              ))}
                            </ol>
                          </div>
                          <div>
                            <h4 className={labelClass}>What should exist at the end</h4>
                            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-aurora-ink">
                              {s.deliverables.map((d) => (
                                <li key={d}>{d}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>

      <Note testId="practice-projects-note">
        {data.note} Effort ranges are planning assumptions, not measurements. To have a finished project count, add it to your portfolio with a link, or to your resume.
      </Note>
    </section>
  );
};

export default PracticeProjectsPanel;
