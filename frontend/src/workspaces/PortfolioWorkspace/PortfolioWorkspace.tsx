import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderGit2 } from 'lucide-react';
import apiClient from '../../lib/axios';
import { EmptyState, ErrorNote, Loading, Note } from '../../features/careerLab/components/labUi';
import { errorText, fieldClass, formatDate, labelClass, panelClass, primaryButton, quietButton } from '../../features/careerLab/components/labStyles';

/** Shapes mirror backend/src/services/PortfolioService.ts. */
interface EntrySkill {
  skill: string;
  points: number;
  verifiedBySkillCheck: boolean;
}
interface Entry {
  id: string;
  title: string;
  description: string;
  completedOn: string;
  evidenceUrl: string | null;
  sourceProjectId: string | null;
  visibility: 'private' | 'shared';
  verification: 'self_reported';
  countsTowardsScores: boolean;
  skills: EntrySkill[];
}
interface Share {
  enabled: boolean;
  token: string | null;
  showName: boolean;
  sharedEntries: number;
}
interface PortfolioData {
  entries: Entry[];
  limits: { entries: number; skillsPerEntry: number };
  note: string;
  share: Share;
}
interface PracticeProject {
  id: string;
  title: string;
  targetSkills: string[];
  status: string;
  completedAt: string | null;
}
interface Draft {
  id: string | null;
  title: string;
  description: string;
  skills: string;
  completedOn: string;
  evidenceUrl: string;
  shared: boolean;
  sourceProjectId: string;
}

const today = (): string => new Date().toISOString().slice(0, 10);
const emptyDraft = (): Draft => ({ id: null, title: '', description: '', skills: '', completedOn: today(), evidenceUrl: '', shared: false, sourceProjectId: '' });

/** Finished work recorded as evidence of skills, with an optional public link to the shared part. */
export const PortfolioWorkspace: React.FC = () => {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [invalid, setInvalid] = useState<string | null>(null);

  const portfolio = useQuery<PortfolioData>({ queryKey: ['portfolio'], queryFn: async () => (await apiClient.get('/portfolio')).data.data });
  const projects = useQuery<PracticeProject[]>({ queryKey: ['projects', 'mine'], queryFn: async () => (await apiClient.get('/projects')).data.data.projects });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    // Entries with a link change skill evidence, so what is computed from evidence is refetched
    queryClient.invalidateQueries({ queryKey: ['career-lab'] });
    queryClient.invalidateQueries({ queryKey: ['career-snapshot'] });
    queryClient.invalidateQueries({ queryKey: ['skills'] });
  };

  const save = useMutation<unknown, unknown, Draft>({
    mutationFn: (d) => {
      const body = {
        title: d.title.trim(),
        description: d.description,
        skills: d.skills.split(',').map((s) => s.trim()).filter(Boolean),
        completedOn: d.completedOn,
        evidenceUrl: d.evidenceUrl.trim() || null,
        visibility: d.shared ? 'shared' : 'private',
        sourceProjectId: d.sourceProjectId || null,
      };
      return d.id ? apiClient.put(`/portfolio/${d.id}`, body) : apiClient.post('/portfolio', body);
    },
    onSuccess: () => {
      setDraft(null);
      refresh();
    },
  });
  const remove = useMutation<unknown, unknown, string>({ mutationFn: (id) => apiClient.delete(`/portfolio/${id}`), onSuccess: refresh });
  const share = useMutation<unknown, unknown, { enabled?: boolean; showName?: boolean }>({
    mutationFn: (body) => apiClient.put('/portfolio/share', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
  });

  const header = (
    <header className="flex items-start gap-4 p-6 rounded-3xl border border-white/15 bg-slate-950/80">
      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-cyan-300 shrink-0">
        <FolderGit2 className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight">Portfolio</h1>
        <p className="text-xs text-slate-400 max-w-2xl">
          Record finished work as evidence of your skills. Entries are your own statement: SkillBridge does not open the link or check the work.
          Everything is private unless you choose to share it.
        </p>
      </div>
    </header>
  );

  if (portfolio.isLoading) {
    return <div className="max-w-5xl mx-auto space-y-6 pb-16 px-4">{header}<section className={panelClass}><Loading label="Loading your portfolio..." /></section></div>;
  }
  if (portfolio.isError || !portfolio.data) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-16 px-4">
        {header}
        <section className={panelClass}>
          <ErrorNote message={errorText(portfolio.error, 'Your portfolio could not be loaded.')} />
          <button type="button" className={quietButton} onClick={() => portfolio.refetch()}>Try again</button>
        </section>
      </div>
    );
  }

  const data = portfolio.data;
  const usedProjects = new Set(data.entries.map((e) => e.sourceProjectId).filter(Boolean));
  const available = (projects.data || []).filter((p) => p.status === 'completed' && (!usedProjects.has(p.id) || p.id === draft?.sourceProjectId));
  const shareUrl = data.share.token ? `${window.location.origin}/p/${data.share.token}` : null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const skills = draft.skills.split(',').map((s) => s.trim()).filter(Boolean);
    const problem =
      draft.title.trim().length < 3 ? 'Give the work a title of at least 3 characters.'
      : skills.length === 0 ? 'Name at least one skill the work used.'
      : skills.length > data.limits.skillsPerEntry ? `Name at most ${data.limits.skillsPerEntry} skills.`
      : !draft.completedOn || draft.completedOn > today() ? 'The completion date cannot be in the future.'
      : draft.evidenceUrl.trim() && !/^https:\/\//i.test(draft.evidenceUrl.trim()) ? 'The link must start with https://'
      : null;
    setInvalid(problem);
    if (!problem) save.mutate(draft);
  };

  const pickProject = (projectId: string) => {
    if (!draft) return;
    const project = available.find((p) => p.id === projectId);
    setDraft({
      ...draft,
      sourceProjectId: projectId,
      title: project && !draft.title ? project.title : draft.title,
      skills: project && !draft.skills ? project.targetSkills.join(', ') : draft.skills,
      completedOn: project?.completedAt ? project.completedAt.slice(0, 10) : draft.completedOn,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 px-4">
      {header}

      <section className={panelClass} aria-labelledby="entries-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="entries-heading" className="text-base font-bold text-white">Your work</h2>
          {!draft && (
            <button type="button" className={primaryButton} disabled={data.entries.length >= data.limits.entries} onClick={() => { setInvalid(null); save.reset(); setDraft(emptyDraft()); }}>
              Add work
            </button>
          )}
        </div>
        <ErrorNote message={remove.isError ? errorText(remove.error, 'The entry could not be removed.') : null} />

        {draft && (
          <form className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3" onSubmit={submit} noValidate data-testid="portfolio-form">
            <h3 className="text-sm font-bold text-white">{draft.id ? 'Edit entry' : 'New entry'}</h3>
            {!draft.id && available.length > 0 && (
              <div className="flex flex-col gap-1">
                <label htmlFor="pf-project" className={labelClass}>From a practice project you completed (optional)</label>
                <select id="pf-project" className={fieldClass} value={draft.sourceProjectId} onChange={(e) => pickProject(e.target.value)}>
                  <option value="">Not from a practice project</option>
                  {available.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label htmlFor="pf-title" className={labelClass}>Title</label>
              <input id="pf-title" className={fieldClass} maxLength={120} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="pf-description" className={labelClass}>What you built (optional)</label>
              <textarea id="pf-description" className={`${fieldClass} min-h-20`} maxLength={1000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="pf-skills" className={labelClass}>Skills it used, separated by commas</label>
              <input id="pf-skills" className={fieldClass} placeholder="Docker, Node.js" value={draft.skills} onChange={(e) => setDraft({ ...draft, skills: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="pf-date" className={labelClass}>Finished on</label>
                <input id="pf-date" type="date" className={fieldClass} max={today()} value={draft.completedOn} onChange={(e) => setDraft({ ...draft, completedOn: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="pf-url" className={labelClass}>Link to the work (https, optional)</label>
                <input id="pf-url" type="url" className={fieldClass} maxLength={300} placeholder="https://" value={draft.evidenceUrl} onChange={(e) => setDraft({ ...draft, evidenceUrl: e.target.value })} />
              </div>
            </div>
            <label className="flex items-start gap-2 text-xs text-slate-200 cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-indigo-500" checked={draft.shared} onChange={(e) => setDraft({ ...draft, shared: e.target.checked })} />
              <span>Include this entry on my public portfolio page (only visible while sharing is switched on)</span>
            </label>
            <p className="text-[11px] text-slate-400">Without a link the entry is kept and dated but adds no points to your scores. Files cannot be uploaded here.</p>
            {invalid && <p role="alert" className="text-xs text-rose-300">{invalid}</p>}
            <ErrorNote message={save.isError ? errorText(save.error, 'The entry could not be saved.') : null} />
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={primaryButton} disabled={save.isPending}>Save entry</button>
              <button type="button" className={quietButton} onClick={() => setDraft(null)}>Cancel</button>
            </div>
          </form>
        )}

        {data.entries.length === 0 ? (
          !draft && <EmptyState title="Nothing recorded yet">Add a project you have finished, with a link to it if you can. A completed practice project from your roadmap can be added here too.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {data.entries.map((entry) => (
              <li key={entry.id} className="p-4 rounded-2xl bg-slate-900/50 border border-white/10 space-y-2" data-testid="portfolio-entry" data-counts={entry.countsTowardsScores} data-visibility={entry.visibility}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-white">{entry.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-slate-900 text-slate-300 border-white/10">Your own record, not checked</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${entry.visibility === 'shared' ? 'bg-amber-500/10 text-amber-200 border-amber-500/30' : 'bg-slate-900 text-slate-300 border-white/10'}`}>
                      {entry.visibility === 'shared' ? 'Shared' : 'Private'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={quietButton}
                      aria-label={`Edit ${entry.title}`}
                      onClick={() => {
                        setInvalid(null);
                        save.reset();
                        setDraft({ id: entry.id, title: entry.title, description: entry.description, skills: entry.skills.map((s) => s.skill).join(', '), completedOn: entry.completedOn, evidenceUrl: entry.evidenceUrl || '', shared: entry.visibility === 'shared', sourceProjectId: entry.sourceProjectId || '' });
                      }}
                    >
                      Edit
                    </button>
                    <button type="button" className={quietButton} aria-label={`Remove ${entry.title}`} disabled={remove.isPending} onClick={() => remove.mutate(entry.id)}>Remove</button>
                  </div>
                </div>
                {entry.description && <p className="text-xs text-slate-300">{entry.description}</p>}
                <p className="text-xs text-slate-300">
                  Finished {formatDate(entry.completedOn)}.{' '}
                  {entry.evidenceUrl
                    ? <a href={entry.evidenceUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-cyan-300 underline">View the work</a>
                    : 'No link given, so it adds no points.'}
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {entry.skills.map((s) => (
                    <li key={s.skill} className="px-2 py-0.5 rounded text-[11px] font-semibold border bg-slate-900 text-slate-200 border-white/10" data-testid="portfolio-skill" data-skill={s.skill} data-points={s.points}>
                      {s.skill}{s.points > 0 ? ` +${s.points}` : ''}{s.verifiedBySkillCheck ? ' (also verified by skill check)' : ''}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
        <Note testId="portfolio-note">
          {data.note} A skill is marked "verified by skill check" only when you passed that skill check; an entry never verifies a skill by itself.
          Portfolio entries stay when you replace or delete your resume.
        </Note>
      </section>

      <section className={panelClass} aria-labelledby="share-heading" data-testid="portfolio-share" data-enabled={data.share.enabled}>
        <h2 id="share-heading" className="text-base font-bold text-white">Public link</h2>
        <p className="text-xs text-slate-400">
          Off by default. When on, anyone with the link can see the entries you marked as shared ({data.share.sharedEntries} now) and nothing else: no scores, no resume, no contact details.
        </p>
        <ErrorNote message={share.isError ? errorText(share.error, 'The sharing setting could not be saved.') : null} />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={data.share.enabled ? quietButton : primaryButton} disabled={share.isPending} onClick={() => share.mutate({ enabled: !data.share.enabled })}>
            {data.share.enabled ? 'Switch sharing off' : 'Switch sharing on'}
          </button>
          <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
            <input type="checkbox" className="accent-indigo-500" checked={data.share.showName} disabled={share.isPending} onChange={(e) => share.mutate({ showName: e.target.checked })} />
            <span>Show my name on the public page</span>
          </label>
        </div>
        {shareUrl && (
          <p className="text-xs text-slate-300 break-all">
            Your link: <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline" data-testid="portfolio-share-link">{shareUrl}</a>
          </p>
        )}
        <Note>Switching sharing off disables the link for good. Switching it on again creates a new link.</Note>
      </section>
    </div>
  );
};

PortfolioWorkspace.displayName = 'PortfolioWorkspace';
export default PortfolioWorkspace;
