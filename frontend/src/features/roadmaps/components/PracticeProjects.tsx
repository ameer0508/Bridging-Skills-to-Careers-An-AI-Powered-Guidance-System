import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Hammer } from 'lucide-react';
import apiClient from '../../../lib/axios';
import { EmptyState, ErrorNote, Loading, Note, SkillChips } from '../../careerLab/components/labUi';
import { errorText, formatDate, labelClass, panelClass, primaryButton, quietButton } from '../../careerLab/components/labStyles';

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

const STATUS_TEXT: Record<Project['status'], string> = {
  planned: 'Planned',
  in_progress: 'In progress',
  completed: 'Marked complete by you',
};

/** Practice projects suggested from the user's gaps for one career, and the ones they took on. */
export const PracticeProjectsPanel: React.FC<{ careerId: string }> = ({ careerId }) => {
  const queryClient = useQueryClient();
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
      <Hammer className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="space-y-1">
        <h2 id="practice-projects-heading" className="text-base font-bold text-white">Practice projects</h2>
        <p className="text-xs text-slate-400">Projects chosen because they put skills you have not yet shown in use to work. Taking one on, or marking it complete, is your own record and changes no score.</p>
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
        <div className="space-y-2">
          <h3 className={labelClass}>Projects you have taken on</h3>
          <ul className="space-y-3">
            {mine.map((project) => (
              <li key={project.id} className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3" data-testid="my-project" data-status={project.status}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-white">{project.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-slate-900 text-slate-300 border-white/10">{STATUS_TEXT[project.status]}</span>
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
                <fieldset className="space-y-1">
                  <legend className="text-[11px] text-slate-400">{project.tasksDone} of {project.tasks.length} tasks done</legend>
                  {project.tasks.map((task, index) => (
                    <label key={task.text} className="flex items-start gap-2 text-xs text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-0.5 accent-indigo-500"
                        checked={task.done}
                        disabled={update.isPending}
                        onChange={(e) => update.mutate({ id: project.id, body: { task: { index, done: e.target.checked } } })}
                      />
                      <span>{task.text}</span>
                    </label>
                  ))}
                </fieldset>
                <p className="text-[11px] text-slate-400">
                  {project.completedAt ? `Marked complete ${formatDate(project.completedAt)}. ` : project.startedAt ? `Started ${formatDate(project.startedAt)}. ` : ''}
                  {project.evidence}
                  {project.status === 'completed' && <> <a href="/portfolio" className="text-cyan-300 underline">Add it to your portfolio</a> with a link to make it count.</>}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <h3 className={labelClass}>Suggested{data.career ? ` for ${data.career.title}` : ''}</h3>
        {!data.hasProfile ? (
          <EmptyState title="No suggestions yet">Projects are suggested from the gaps between your evidence and a career. Upload a resume first.</EmptyState>
        ) : data.suggestions.length === 0 ? (
          <EmptyState title="No project fits a gap">None of the projects in the catalogue addresses a skill you have not already shown in use for this career.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {data.suggestions.map((s) => (
              <li key={s.briefId} className="p-4 rounded-2xl bg-slate-900/50 border border-white/10 space-y-3" data-testid="project-suggestion" data-brief={s.briefId}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">{s.title}</span>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={quietButton} aria-expanded={open === s.briefId} onClick={() => setOpen(open === s.briefId ? null : s.briefId)}>
                      {open === s.briefId ? 'Hide details' : 'Tasks and deliverables'}
                    </button>
                    {s.started ? (
                      <span className="px-2 py-2 text-[11px] font-bold text-emerald-300">Taken on</span>
                    ) : (
                      <button type="button" className={primaryButton} disabled={start.isPending} aria-label={`Take on ${s.title}`} onClick={() => start.mutate(s.briefId)}>
                        Take on
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-300">{s.summary}</p>
                <p className="text-xs text-slate-300" data-testid="project-why">{s.why}</p>
                <SkillChips skills={s.practises.map((p) => p.skill)} tone="warn" />
                {s.alternatives.map((group) => (
                  <p key={group.join()} className="text-[11px] text-slate-400">Uses one of {group.join(', ')}; the one counted is the one that matters most for this career.</p>
                ))}
                <p className="text-[11px] text-slate-400" data-testid="project-effect">
                  Assumed effort {s.effortHours.low} to {s.effortHours.high} hours
                  {s.weeks ? ` (${s.weeks.low === s.weeks.high ? `about ${s.weeks.low}` : `${s.weeks.low} to ${s.weeks.high}`} weeks at ${data.hoursPerWeek} hours a week)` : ''}.
                  {' '}If these skills had project evidence on your profile, the match would be {s.hypotheticalScore.after}% instead of {s.hypotheticalScore.before}% (hypothetical).
                </p>
                {open === s.briefId && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <h4 className={labelClass}>Tasks</h4>
                      <ol className="mt-1 list-decimal pl-5 space-y-1 text-xs text-slate-200">{s.tasks.map((task) => <li key={task}>{task}</li>)}</ol>
                    </div>
                    <div>
                      <h4 className={labelClass}>What should exist at the end</h4>
                      <ul className="mt-1 list-disc pl-5 space-y-1 text-xs text-slate-200">{s.deliverables.map((d) => <li key={d}>{d}</li>)}</ul>
                    </div>
                  </div>
                )}
              </li>
            ))}
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
