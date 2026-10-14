import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { Copy, ExternalLink, FolderGit2, Globe, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import apiClient from '../../lib/axios';
import { ErrorNote, Note } from '../../design/aurora/labUi';
import { errorText, fieldClass, formatDate, labelClass, primaryButton, quietButton } from '../../design/aurora/labStyles';
import { AuroraDialog, PageHeader, PageSkeleton, Pill, StatTile } from '../../design/aurora/kit';
import { auroraButtonClass } from '../../design/aurora/buttonStyles';

/** Shapes mirror backend/src/services/PortfolioService.ts. */
interface EntrySkill {
  skill: string;
  points: number;
  countedElsewhere: 'resume_project' | 'portfolio_entry' | null;
  countedElsewhereBecause?: 'same_title' | 'same_link' | null;
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
  const [copied, setCopied] = useState(false);
  const reduce = useReducedMotion();

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

  const header = (actions?: React.ReactNode, children?: React.ReactNode) => (
    <PageHeader
      eyebrow="Portfolio"
      icon={<FolderGit2 className="h-7 w-7" aria-hidden="true" />}
      title="Work you can point to"
      lead="Record finished work as evidence of your skills. Entries are your own statement: SkillBridge does not open the link or check the work. Everything is private unless you choose to share it."
      actions={actions}
    >
      {children}
    </PageHeader>
  );

  if (portfolio.isLoading) return <PageSkeleton label="Loading your portfolio" />;
  if (portfolio.isError || !portfolio.data) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
        {header()}
        <ErrorNote message={errorText(portfolio.error, 'Your portfolio could not be loaded.')} />
        <button type="button" className={quietButton} onClick={() => portfolio.refetch()}>Try again</button>
      </div>
    );
  }

  const data = portfolio.data;
  const usedProjects = new Set(data.entries.map((e) => e.sourceProjectId).filter(Boolean));
  const available = (projects.data || []).filter((p) => p.status === 'completed' && (!usedProjects.has(p.id) || p.id === draft?.sourceProjectId));
  const shareUrl = data.share.token ? `${window.location.origin}/p/${data.share.token}` : null;
  const counting = data.entries.filter((e) => e.countsTowardsScores).length;
  const skillsShown = new Set(data.entries.flatMap((e) => e.skills.map((s) => s.skill))).size;

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

  const openNew = () => {
    setInvalid(null);
    save.reset();
    setDraft(emptyDraft());
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
      {header(
        <button type="button" className={auroraButtonClass('primary', 'md')} disabled={data.entries.length >= data.limits.entries} onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Add work
        </button>,
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Pieces of work" value={`${data.entries.length}`} hint={`of ${data.limits.entries} allowed`} />
          <StatTile label="Adding to your scores" value={`${counting}`} hint="entries with a link" />
          <StatTile label="Skills shown" value={`${skillsShown}`} hint="named across entries" />
          <StatTile label="Public" value={data.share.enabled ? `${data.share.sharedEntries} shared` : 'Off'} hint={data.share.enabled ? 'visible through your link' : 'nothing is public'} accent={data.share.enabled} />
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <section className="space-y-4 lg:col-span-8" aria-labelledby="entries-heading">
          <h2 id="entries-heading" className="font-heading text-2xl font-extrabold tracking-tight text-aurora-ink">Your work</h2>
          <ErrorNote message={remove.isError ? errorText(remove.error, 'The entry could not be removed.') : null} />
          {data.entries.length === 0 ? (
            <div className="relative overflow-hidden rounded-[28px] border border-dashed border-aurora-line bg-white p-8 text-center shadow-aurora-sm">
              <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-aurora-md [background:var(--aurora-gradient-action)]">
                <FolderGit2 className="h-7 w-7" aria-hidden="true" />
              </span>
              <p className="mt-4 font-heading text-xl font-bold text-aurora-ink">Nothing recorded yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-aurora-muted">
                Add a project you have finished, with a link to it if you can. A completed practice project from your roadmap can be added here too.
              </p>
              <ol className="mx-auto mt-5 grid max-w-xl gap-2 text-left text-sm sm:grid-cols-3">
                {['Name the work and the skills it used', 'Add a link to the code or the result', 'Choose whether to share it'].map((step, i) => (
                  <li key={step} className="rounded-2xl border border-aurora-line bg-aurora-canvas/60 p-3 text-aurora-ink">
                    <span className="mb-1 block text-xs font-bold text-aurora-violet">Step {i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {data.entries.map((entry, i) => (
                <motion.li
                  key={entry.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: reduce ? 0 : Math.min(i, 6) * 0.05 }}
                  className="group relative flex flex-col overflow-hidden rounded-[28px] border border-aurora-line bg-white shadow-aurora-sm transition-shadow hover:shadow-aurora-md"
                  data-testid="portfolio-entry"
                  data-counts={entry.countsTowardsScores}
                  data-visibility={entry.visibility}
                >
                  <div aria-hidden="true" className={`h-1.5 ${entry.countsTowardsScores ? '[background:var(--aurora-gradient-action)]' : 'bg-aurora-line'}`} />
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Pill>Your own record, not checked</Pill>
                      {entry.visibility === 'shared' ? (
                        <Pill tone="amber"><Globe className="h-3 w-3" aria-hidden="true" /> Shared</Pill>
                      ) : (
                        <Pill><Lock className="h-3 w-3" aria-hidden="true" /> Private</Pill>
                      )}
                    </div>
                    <h3 className="font-heading text-lg font-bold leading-snug text-aurora-ink">{entry.title}</h3>
                    {entry.description && <p className="line-clamp-4 text-sm leading-relaxed text-aurora-muted">{entry.description}</p>}
                    <p className="text-sm text-aurora-muted">
                      Finished {formatDate(entry.completedOn)}.{' '}
                      {entry.evidenceUrl ? (
                        <a href={entry.evidenceUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 font-semibold text-aurora-indigo underline-offset-2 hover:underline">
                          View the work <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : (
                        'No link given, so it adds no points.'
                      )}
                    </p>
                    <ul className="flex flex-wrap gap-1.5" aria-label={`Skills in ${entry.title}`}>
                      {entry.skills.map((s) => (
                        <li
                          key={s.skill}
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.verifiedBySkillCheck ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-aurora-line bg-aurora-canvas text-aurora-ink'}`}
                          data-testid="portfolio-skill"
                          data-skill={s.skill}
                          data-points={s.points}
                          data-counted-elsewhere={s.countedElsewhere ?? ''}
                        >
                          {s.skill}{s.points > 0 ? ` +${s.points}` : ''}
                          {s.countedElsewhere === 'resume_project' ? ` (same project is on your resume${s.countedElsewhereBecause === 'same_link' ? ', same repository link' : ''}: counted once)` : s.countedElsewhere === 'portfolio_entry' ? ` (same project is in another entry${s.countedElsewhereBecause === 'same_link' ? ', same repository link' : ''}: counted once)` : ''}
                          {s.verifiedBySkillCheck ? ' (also verified by skill check)' : ''}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto flex flex-wrap gap-2 border-t border-aurora-line pt-3">
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
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                      </button>
                      <button type="button" className={quietButton} aria-label={`Remove ${entry.title}`} disabled={remove.isPending} onClick={() => remove.mutate(entry.id)}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Remove
                      </button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
          <Note testId="portfolio-note">
            {data.note} A skill is marked "verified by skill check" only when you passed that skill check; an entry never verifies a skill by itself.
            A project that is also on your resume, or in another entry with the same title or link, earns points once; the extra record is kept and simply adds none.
            Portfolio entries stay when you replace or delete your resume.
          </Note>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-4">
          <section
            className={`rounded-[28px] border p-5 shadow-aurora-md ${data.share.enabled ? 'border-amber-200 bg-amber-50/50' : 'border-aurora-line bg-white'}`}
            aria-labelledby="share-heading"
            data-testid="portfolio-share"
            data-enabled={data.share.enabled}
          >
            <div className="flex items-start gap-3">
              <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${data.share.enabled ? 'bg-amber-100 text-amber-800' : 'bg-aurora-violet/[0.08] text-aurora-violet'}`}>
                {data.share.enabled ? <Globe className="h-5 w-5" aria-hidden="true" /> : <Lock className="h-5 w-5" aria-hidden="true" />}
              </span>
              <div className="space-y-1">
                <h2 id="share-heading" className="font-heading text-lg font-bold text-aurora-ink">Public link</h2>
                <p className="text-sm font-semibold text-aurora-ink" role="status">
                  {data.share.enabled ? `Sharing is on: anyone with the link can see ${data.share.sharedEntries} shared entr${data.share.sharedEntries === 1 ? 'y' : 'ies'}.` : 'Sharing is off: nobody else can see your portfolio.'}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-aurora-muted">
              Off by default. When on, anyone with the link can see the entries you marked as shared ({data.share.sharedEntries} now) and nothing else: no scores, no resume, no contact details.
            </p>
            <ErrorNote message={share.isError ? errorText(share.error, 'The sharing setting could not be saved.') : null} />
            <div className="mt-4 space-y-3">
              <button type="button" className={`${data.share.enabled ? quietButton : primaryButton} w-full`} disabled={share.isPending} onClick={() => share.mutate({ enabled: !data.share.enabled })}>
                {data.share.enabled ? 'Switch sharing off' : 'Switch sharing on'}
              </button>
              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-aurora-ink">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#5540f5]" checked={data.share.showName} disabled={share.isPending} onChange={(e) => share.mutate({ showName: e.target.checked })} />
                <span>Show my name on the public page</span>
              </label>
            </div>
            {shareUrl && (
              <div className="mt-4 space-y-2 rounded-2xl border border-amber-200 bg-white p-3">
                <p className="text-xs font-semibold text-aurora-muted">Your link</p>
                <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="block break-all text-sm font-semibold text-aurora-indigo underline-offset-2 hover:underline" data-testid="portfolio-share-link">{shareUrl}</a>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={quietButton} onClick={copyLink}>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" /> {copied ? 'Copied' : 'Copy link'}
                  </button>
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer" className={quietButton}>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Preview<span className="sr-only"> the public page (opens in a new tab)</span>
                  </a>
                </div>
              </div>
            )}
            <div className="mt-3">
              <Note>Switching sharing off disables the link for good. Switching it on again creates a new link.</Note>
            </div>
          </section>
        </aside>
      </div>

      <AuroraDialog open={!!draft} onClose={() => setDraft(null)} size="lg" title={draft?.id ? 'Edit entry' : 'New entry'}>
        {draft && (
          <form className="space-y-4" onSubmit={submit} noValidate data-testid="portfolio-form">
            {!draft.id && available.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-project" className={labelClass}>From a practice project you completed (optional)</label>
                <select id="pf-project" className={fieldClass} value={draft.sourceProjectId} onChange={(e) => pickProject(e.target.value)}>
                  <option value="">Not from a practice project</option>
                  {available.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pf-title" className={labelClass}>Title</label>
              <input id="pf-title" className={fieldClass} maxLength={120} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pf-description" className={labelClass}>What you built (optional)</label>
              <textarea id="pf-description" className={`${fieldClass} min-h-24`} maxLength={1000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pf-skills" className={labelClass}>Skills it used, separated by commas</label>
              <input id="pf-skills" className={fieldClass} placeholder="Docker, Node.js" value={draft.skills} onChange={(e) => setDraft({ ...draft, skills: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-date" className={labelClass}>Finished on</label>
                <input id="pf-date" type="date" className={fieldClass} max={today()} value={draft.completedOn} onChange={(e) => setDraft({ ...draft, completedOn: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-url" className={labelClass}>Link to the work (https, optional)</label>
                <input id="pf-url" type="url" className={fieldClass} maxLength={300} placeholder="https://" value={draft.evidenceUrl} onChange={(e) => setDraft({ ...draft, evidenceUrl: e.target.value })} />
              </div>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-aurora-line bg-aurora-canvas/50 p-3 text-sm text-aurora-ink">
              <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#5540f5]" checked={draft.shared} onChange={(e) => setDraft({ ...draft, shared: e.target.checked })} />
              <span>Include this entry on my public portfolio page (only visible while sharing is switched on)</span>
            </label>
            <p className="text-xs text-aurora-muted">Without a link the entry is kept and dated but adds no points to your scores. Files cannot be uploaded here.</p>
            {invalid && <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">{invalid}</p>}
            <ErrorNote message={save.isError ? errorText(save.error, 'The entry could not be saved.') : null} />
            <div className="flex flex-wrap justify-end gap-2 border-t border-aurora-line pt-4">
              <button type="button" className={quietButton} onClick={() => setDraft(null)}>Cancel</button>
              <button type="submit" className={primaryButton} disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save entry'}</button>
            </div>
          </form>
        )}
      </AuroraDialog>
    </div>
  );
};

PortfolioWorkspace.displayName = 'PortfolioWorkspace';
export default PortfolioWorkspace;
