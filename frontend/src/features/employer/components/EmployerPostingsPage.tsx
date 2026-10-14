import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Building2, ExternalLink, Flag, ShieldAlert } from 'lucide-react';
import { messageOf } from '../../../lib/collections';
import { useAuthStore } from '../../../store/authStore';
import {
  createPosting,
  deleteDraft,
  fetchMyPostings,
  fetchOpenPostings,
  fetchOrganization,
  fetchOrganizationsForReview,
  fetchReported,
  fetchTerms,
  LABEL,
  moderatePosting,
  OwnPosting,
  postingAction,
  PostingInput,
  PublicPosting,
  publishPosting,
  reportPosting,
  reviewOrganization,
  salaryText,
  saveOrganization,
  Terms,
} from '../employerApi';

const inputClass =
  'w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)]';
const labelClass = 'flex flex-col gap-1 text-xs font-medium text-[var(--color-text-secondary)]';
const primaryButton = 'rounded-[var(--radius-md)] bg-[var(--color-interactive-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60';
const secondaryButton = 'inline-flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border-default)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)] disabled:opacity-60';
const card = 'rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface-raised)] p-4';
const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

const ErrorText: React.FC<{ error: unknown; fallback: string }> = ({ error, fallback }) => (
  <p role="alert" className="flex items-center gap-2 text-sm text-[var(--color-status-error,#dc2626)]">
    <AlertTriangle size={14} aria-hidden="true" /> {messageOf(error, fallback)}
  </p>
);

type Tab = 'openings' | 'post' | 'review';

/** First-party job postings: openings for job seekers, posting for organizations, review for administrators. */
export const EmployerPostingsPage: React.FC = () => {
  const isAdmin = useAuthStore(s => s.user?.role === 'admin');
  const [tab, setTab] = useState<Tab>('openings');
  const terms = useQuery({ queryKey: ['employer-terms'], queryFn: fetchTerms, retry: false });
  const tabs: Array<[Tab, string]> = [['openings', 'Openings'], ['post', 'Post a job'], ...(isAdmin ? ([['review', 'Review reports']] as Array<[Tab, string]>) : [])];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6" data-testid="employer-page">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold font-display text-[var(--color-text-primary)]">Employer Postings</h1>
        <p className="max-w-3xl text-sm text-[var(--color-text-secondary)]">
          Jobs posted directly on SkillBridge by organizations, under terms that let SkillBridge keep and analyse them. Organizations
          are <strong>self-declared</strong>: SkillBridge has not verified who they are.
        </p>
      </header>
      <div role="tablist" aria-label="Employer postings" className="flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`employer-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`employer-panel-${id}`}
            onClick={() => setTab(id)}
            className={`${secondaryButton} ${tab === id ? 'border-[var(--color-interactive-primary)] font-bold' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
      {terms.isError && <ErrorText error={terms.error} fallback="The posting terms could not be loaded." />}
      <section role="tabpanel" id={`employer-panel-${tab}`} aria-labelledby={`employer-tab-${tab}`}>
        {tab === 'openings' && <Openings terms={terms.data} />}
        {tab === 'post' && terms.data && <PostJobs terms={terms.data} />}
        {tab === 'post' && terms.isPending && <p role="status" className="text-sm text-[var(--color-text-secondary)]">Loading…</p>}
        {tab === 'review' && isAdmin && <Review />}
      </section>
    </div>
  );
};

// ---------------------------------------------------------------------------------------------- openings
const Openings: React.FC<{ terms?: Terms }> = ({ terms }) => {
  const [skill, setSkill] = useState('');
  const [state, setState] = useState('');
  const [filters, setFilters] = useState<{ skill?: string; state?: string }>({});
  const list = useQuery({ queryKey: ['employer-openings', filters], queryFn: () => fetchOpenPostings(filters), retry: false });

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={e => {
          e.preventDefault();
          setFilters({ skill, state });
        }}
      >
        <label className={labelClass}>
          Skill
          <input className={inputClass} value={skill} onChange={e => setSkill(e.target.value)} placeholder="e.g. SQL" />
        </label>
        <label className={labelClass}>
          State or union territory
          <select className={inputClass} value={state} onChange={e => setState(e.target.value)}>
            <option value="">All of India</option>
            {terms?.options.states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <button type="submit" className={primaryButton}>Filter</button>
      </form>
      <p className="text-xs text-[var(--color-text-secondary)]" data-testid="employer-disclosure">
        {list.data?.disclosure ?? terms?.disclosure} These openings are not a measure of the job market.
      </p>
      {list.isPending && <p role="status" className="text-sm text-[var(--color-text-secondary)]">Loading openings…</p>}
      {list.isError && <ErrorText error={list.error} fallback="Openings could not be loaded." />}
      {list.isSuccess && list.data.postings.length === 0 && (
        <p data-testid="openings-empty" className={`${card} text-sm text-[var(--color-text-secondary)]`}>
          No organization has an open posting{filters.skill || filters.state ? ' matching these filters' : ''} yet.
        </p>
      )}
      <ul className="flex flex-col gap-3" data-testid="openings-list">
        {list.data?.postings.map(p => (
          <li key={p.id}>
            <OpeningCard posting={p} reasons={terms?.options.reportReasons ?? []} />
          </li>
        ))}
      </ul>
    </div>
  );
};

const OpeningCard: React.FC<{ posting: PublicPosting; reasons: string[] }> = ({ posting: p, reasons }) => {
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState(reasons[0] ?? 'other');
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();
  const report = useMutation({
    mutationFn: () => reportPosting(p.id, reason, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employer-openings'] }),
  });
  return (
    <article className={card} data-testid="opening" aria-labelledby={`opening-${p.id}`}>
      <h2 id={`opening-${p.id}`} className="text-base font-bold text-[var(--color-text-primary)]">{p.title}</h2>
      <p className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <Building2 size={14} aria-hidden="true" /> {p.organizationName}
        <span className="rounded border border-amber-500 px-1.5 text-[11px] text-amber-700" data-testid="self-declared">self-declared, not verified</span>
        {p.organization.website && (
          <a href={p.organization.website} target="_blank" rel="noopener noreferrer nofollow" className="underline">
            website<span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
        {p.organization.website && <span className="text-[11px]">{p.organization.emailDomainMatchesWebsite ? "poster's e-mail domain matches the website" : "poster's e-mail domain does not match the website"}</span>}
        <span className="text-[11px]" data-testid="market-inclusion">{p.organization.includedInMarketFigures ? 'counted in market figures after an administrator review' : 'not counted in market figures'}</span>
      </p>
      <p className="text-sm text-[var(--color-text-secondary)]">
        {p.city}, {p.state} · {LABEL[p.workMode]} · {LABEL[p.employmentType]} · {salaryText(p.salary)} · posted {formatDate(p.publishedAt)}, open until {formatDate(p.expiresAt)}
      </p>
      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Skills: {p.skills.join(', ')}</p>
      <details className="mt-2 text-sm text-[var(--color-text-primary)]">
        <summary className="cursor-pointer text-xs font-semibold">Description</summary>
        <p className="mt-1 whitespace-pre-line">{p.description}</p>
      </details>
      <div className="mt-3 flex flex-wrap gap-2">
        {p.applyUrl && (
          <a href={p.applyUrl} target="_blank" rel="noopener noreferrer nofollow" className={secondaryButton}>
            <ExternalLink size={12} aria-hidden="true" /> Apply on the employer's site<span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
        {!report.isSuccess && (
          <button type="button" className={secondaryButton} onClick={() => setReporting(r => !r)} aria-expanded={reporting}>
            <Flag size={12} aria-hidden="true" /> Report
          </button>
        )}
      </div>
      {reporting && !report.isSuccess && (
        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={e => {
            e.preventDefault();
            report.mutate();
          }}
        >
          <label className={labelClass}>
            Reason
            <select className={inputClass} value={reason} onChange={e => setReason(e.target.value)}>
              {reasons.map(r => <option key={r} value={r}>{LABEL[r] ?? r}</option>)}
            </select>
          </label>
          <label className={labelClass}>
            Note (optional)
            <input className={inputClass} value={note} maxLength={500} onChange={e => setNote(e.target.value)} />
          </label>
          <button type="submit" className={primaryButton} disabled={report.isPending}>Send report</button>
        </form>
      )}
      {report.isSuccess && <p role="status" className="mt-2 text-xs text-[var(--color-text-secondary)]">Thank you. The report was recorded{report.data.hidden ? ' and the posting is hidden pending review' : ''}.</p>}
      {report.isError && <ErrorText error={report.error} fallback="The report could not be sent." />}
    </article>
  );
};

// ---------------------------------------------------------------------------------------------- posting
const emptyPosting = (terms: Terms): PostingInput & { salaryMin: string; salaryMax: string; period: 'YEAR' | 'MONTH'; skillsText: string } => ({
  title: '',
  description: '',
  city: '',
  state: terms.options.states[0],
  workMode: 'onsite',
  employmentType: 'full_time',
  salary: null,
  skills: [],
  applyUrl: null,
  salaryMin: '',
  salaryMax: '',
  period: 'YEAR',
  skillsText: '',
});

const PostJobs: React.FC<{ terms: Terms }> = ({ terms }) => {
  const queryClient = useQueryClient();
  const org = useQuery({ queryKey: ['employer-organization'], queryFn: fetchOrganization, retry: false });
  const mine = useQuery({ queryKey: ['employer-mine'], queryFn: fetchMyPostings, retry: false, enabled: Boolean(org.data) });
  const [orgForm, setOrgForm] = useState<{ organizationName: string; website: string } | null>(null);
  const saveOrg = useMutation({
    mutationFn: (v: { organizationName: string; website: string }) => saveOrganization({ organizationName: v.organizationName, website: v.website.trim() || null }),
    onSuccess: data => {
      queryClient.setQueryData(['employer-organization'], data);
      setOrgForm(null);
    },
  });
  const [form, setForm] = useState(() => emptyPosting(terms));
  const set = (patch: Partial<typeof form>) => setForm(f => ({ ...f, ...patch }));
  const create = useMutation({
    mutationFn: () =>
      createPosting({
        title: form.title,
        description: form.description,
        city: form.city,
        state: form.state,
        workMode: form.workMode,
        employmentType: form.employmentType,
        skills: form.skillsText.split(',').map(s => s.trim()).filter(Boolean),
        applyUrl: form.applyUrl?.trim() || null,
        salary:
          form.salaryMin || form.salaryMax
            ? { min: form.salaryMin ? Number(form.salaryMin) : null, max: form.salaryMax ? Number(form.salaryMax) : null, currency: 'INR', period: form.period }
            : null,
      }),
    onSuccess: () => {
      setForm(emptyPosting(terms));
      queryClient.invalidateQueries({ queryKey: ['employer-mine'] });
    },
  });
  const editingOrg = orgForm ?? (org.isSuccess && !org.data ? { organizationName: '', website: '' } : null);

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="org-heading" className={card} data-testid="organization">
        <h2 id="org-heading" className="mb-2 text-base font-bold text-[var(--color-text-primary)]">Your organization</h2>
        {org.isPending && <p role="status" className="text-sm">Loading…</p>}
        {org.isError && <ErrorText error={org.error} fallback="Your organization could not be loaded." />}
        {editingOrg ? (
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={e => {
              e.preventDefault();
              saveOrg.mutate(editingOrg);
            }}
          >
            <label className={labelClass}>
              Organization name
              <input className={inputClass} required minLength={2} maxLength={120} value={editingOrg.organizationName} onChange={e => setOrgForm({ ...editingOrg, organizationName: e.target.value })} />
            </label>
            <label className={labelClass}>
              Website (https, optional)
              <input className={inputClass} type="url" value={editingOrg.website} onChange={e => setOrgForm({ ...editingOrg, website: e.target.value })} placeholder="https://example.com" />
            </label>
            <button type="submit" className={primaryButton} disabled={saveOrg.isPending}>Save organization</button>
            {saveOrg.isError && <ErrorText error={saveOrg.error} fallback="The organization could not be saved." />}
          </form>
        ) : (
          org.data && (
            <p className="text-sm text-[var(--color-text-primary)]" data-testid="organization-summary">
              {org.data.organizationName}
              {org.data.website ? ` · ${org.data.website}` : ''} · self-declared ·{' '}
              {org.data.emailDomainMatchesWebsite ? 'your sign-in e-mail domain matches the website' : 'your sign-in e-mail domain does not match a website'} ·{' '}
              <span data-testid="organization-review">{LABEL[org.data.marketReview.status]}</span>
              {org.data.marketReview.note ? ` (${org.data.marketReview.note})` : ''}{' '}
              <button type="button" className="underline" onClick={() => setOrgForm({ organizationName: org.data!.organizationName, website: org.data!.website ?? '' })}>Change</button>
            </p>
          )
        )}
      </section>

      {org.data && (
        <section aria-labelledby="new-posting-heading" className={card} data-testid="new-posting">
          <h2 id="new-posting-heading" className="mb-2 text-base font-bold text-[var(--color-text-primary)]">New posting (saved as a draft)</h2>
          <form
            className="grid grid-cols-1 gap-3 md:grid-cols-2"
            onSubmit={e => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <label className={labelClass}>
              Job title
              <input className={inputClass} required minLength={3} maxLength={120} value={form.title} onChange={e => set({ title: e.target.value })} />
            </label>
            <label className={labelClass}>
              Skills (comma separated; at least one common skill name)
              <input className={inputClass} required value={form.skillsText} onChange={e => set({ skillsText: e.target.value })} placeholder="SQL, Excel, Power BI" />
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              Description (at least 80 characters; shown as plain text)
              <textarea className={inputClass} required minLength={80} maxLength={8000} rows={5} value={form.description} onChange={e => set({ description: e.target.value })} />
            </label>
            <label className={labelClass}>
              City
              <input className={inputClass} required minLength={2} maxLength={80} value={form.city} onChange={e => set({ city: e.target.value })} />
            </label>
            <label className={labelClass}>
              State or union territory
              <select className={inputClass} value={form.state} onChange={e => set({ state: e.target.value })}>
                {terms.options.states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className={labelClass}>
              Work mode
              <select className={inputClass} value={form.workMode} onChange={e => set({ workMode: e.target.value })}>
                {terms.options.workModes.map(m => <option key={m} value={m}>{LABEL[m]}</option>)}
              </select>
            </label>
            <label className={labelClass}>
              Employment type
              <select className={inputClass} value={form.employmentType} onChange={e => set({ employmentType: e.target.value })}>
                {terms.options.employmentTypes.map(m => <option key={m} value={m}>{LABEL[m]}</option>)}
              </select>
            </label>
            <fieldset className="flex flex-wrap items-end gap-2 md:col-span-2">
              <legend className="text-xs font-medium text-[var(--color-text-secondary)]">
                Advertised pay in rupees (optional; a year: ₹{terms.salaryBounds.YEAR.min.toLocaleString('en-IN')}–₹{terms.salaryBounds.YEAR.max.toLocaleString('en-IN')}; a month: ₹
                {terms.salaryBounds.MONTH.min.toLocaleString('en-IN')}–₹{terms.salaryBounds.MONTH.max.toLocaleString('en-IN')})
              </legend>
              <label className={labelClass}>
                Minimum
                <input className={inputClass} inputMode="numeric" pattern="[0-9]*" value={form.salaryMin} onChange={e => set({ salaryMin: e.target.value })} />
              </label>
              <label className={labelClass}>
                Maximum
                <input className={inputClass} inputMode="numeric" pattern="[0-9]*" value={form.salaryMax} onChange={e => set({ salaryMax: e.target.value })} />
              </label>
              <label className={labelClass}>
                Per
                <select className={inputClass} value={form.period} onChange={e => set({ period: e.target.value as 'YEAR' | 'MONTH' })}>
                  <option value="YEAR">year</option>
                  <option value="MONTH">month</option>
                </select>
              </label>
            </fieldset>
            <label className={`${labelClass} md:col-span-2`}>
              Where to apply (https link, optional)
              <input className={inputClass} type="url" value={form.applyUrl ?? ''} onChange={e => set({ applyUrl: e.target.value })} />
            </label>
            <div className="md:col-span-2">
              <button type="submit" className={primaryButton} disabled={create.isPending}>Save draft</button>
              {create.isError && <ErrorText error={create.error} fallback="The posting could not be saved." />}
            </div>
          </form>
        </section>
      )}

      {org.data && (
        <section aria-labelledby="mine-heading" className="flex flex-col gap-3">
          <h2 id="mine-heading" className="text-base font-bold text-[var(--color-text-primary)]">Your postings</h2>
          {mine.isPending && <p role="status" className="text-sm">Loading…</p>}
          {mine.isError && <ErrorText error={mine.error} fallback="Your postings could not be loaded." />}
          {mine.isSuccess && mine.data.length === 0 && <p className="text-sm text-[var(--color-text-secondary)]" data-testid="mine-empty">No postings yet.</p>}
          <ul className="flex flex-col gap-3" data-testid="mine-list">
            {mine.data?.map(p => (
              <li key={p.id}>
                <OwnPostingCard posting={p} terms={terms} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

const OwnPostingCard: React.FC<{ posting: OwnPosting; terms: Terms }> = ({ posting: p, terms }) => {
  const queryClient = useQueryClient();
  const [publishing, setPublishing] = useState(false);
  const [checks, setChecks] = useState({ authorized: false, real: false, uses: false });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['employer-mine'] });
    queryClient.invalidateQueries({ queryKey: ['employer-openings'] });
  };
  const publish = useMutation({ mutationFn: () => publishPosting(p.id, terms.terms.version), onSuccess: () => { setPublishing(false); refresh(); } });
  const act = useMutation({ mutationFn: (action: 'close' | 'withdraw') => postingAction(p.id, action), onSuccess: refresh });
  const remove = useMutation({ mutationFn: () => deleteDraft(p.id), onSuccess: refresh });
  const allChecked = checks.authorized && checks.real && checks.uses;

  return (
    <article className={card} data-testid="own-posting" data-status={p.status} aria-labelledby={`own-${p.id}`}>
      <h3 id={`own-${p.id}`} className="font-bold text-[var(--color-text-primary)]">
        {p.title} <span className="ml-1 rounded border px-1.5 text-[11px] font-normal">{LABEL[p.status]}</span>
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)]">
        {p.city}, {p.state} · {salaryText(p.salary)} · skills {p.skills.join(', ')}
        {p.unrecognisedSkills.length > 0 && ` · not recognised, so not analysed: ${p.unrecognisedSkills.join(', ')}`}
      </p>
      <p className="text-xs text-[var(--color-text-secondary)]">
        {p.publishedAt ? `Published ${formatDate(p.publishedAt)}` : 'Not published'}
        {p.closedAt ? ` · closed ${formatDate(p.closedAt)}` : ''}
        {p.status === 'open' ? ` · open until ${formatDate(p.expiresAt)}` : ''}
        {' · '}
        {p.inMarketData ? 'included in market data' : p.marketExclusion && p.marketExclusion !== 'not_published' ? LABEL[p.marketExclusion] : 'not in market data'}
        {p.reports > 0 ? ` · ${p.reports} report${p.reports === 1 ? '' : 's'}` : ''}
        {p.hiddenReason ? ` · ${p.hiddenReason}` : ''}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {p.status === 'draft' && (
          <>
            <button type="button" className={secondaryButton} onClick={() => setPublishing(v => !v)} aria-expanded={publishing}>Publish…</button>
            <button type="button" className={secondaryButton} disabled={remove.isPending} onClick={() => remove.mutate()}>Delete draft</button>
          </>
        )}
        {p.status === 'open' && <button type="button" className={secondaryButton} disabled={act.isPending} onClick={() => act.mutate('close')}>Close</button>}
        {['open', 'closed', 'hidden'].includes(p.status) && (
          <button
            type="button"
            className={secondaryButton}
            disabled={act.isPending}
            onClick={() => {
              if (window.confirm('Withdraw this posting? It disappears from listings and from every market figure.')) act.mutate('withdraw');
            }}
          >
            Withdraw
          </button>
        )}
      </div>
      {publishing && p.status === 'draft' && (
        <div role="group" aria-labelledby={`terms-${p.id}`} className="mt-3 rounded-[var(--radius-md)] border border-amber-500 p-3 text-sm" data-testid="publish-terms">
          <p id={`terms-${p.id}`} className="flex items-center gap-1.5 font-bold"><ShieldAlert size={14} aria-hidden="true" /> Contribution terms ({terms.terms.version})</p>
          <p className="mt-1">{terms.terms.summary}</p>
          <ul className="mt-1 list-disc pl-5">
            {Object.entries(terms.terms.uses).map(([k, v]) => <li key={k}>{v}</li>)}
          </ul>
          <p className="mt-1">{terms.terms.withdrawal}</p>
          <p className="mt-1">{terms.terms.verification}</p>
          <label className="mt-2 flex items-start gap-2"><input type="checkbox" checked={checks.authorized} onChange={e => setChecks({ ...checks, authorized: e.target.checked })} /> I am authorised to post jobs for this organization.</label>
          <label className="flex items-start gap-2"><input type="checkbox" checked={checks.real} onChange={e => setChecks({ ...checks, real: e.target.checked })} /> This is a real, open position.</label>
          <label className="flex items-start gap-2"><input type="checkbox" checked={checks.uses} onChange={e => setChecks({ ...checks, uses: e.target.checked })} /> I grant the uses listed above.</label>
          <button type="button" className={`${primaryButton} mt-2`} disabled={!allChecked || publish.isPending} onClick={() => publish.mutate()}>Publish</button>
        </div>
      )}
      {publish.isError && <ErrorText error={publish.error} fallback="The posting could not be published." />}
      {act.isError && <ErrorText error={act.error} fallback="The posting could not be changed." />}
      {remove.isError && <ErrorText error={remove.error} fallback="The draft could not be deleted." />}
    </article>
  );
};

// ---------------------------------------------------------------------------------------------- review
const Review: React.FC = () => {
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: ['employer-reported'], queryFn: fetchReported, retry: false });
  const moderate = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'hide' | 'restore' }) => moderatePosting(id, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employer-reported'] }),
  });
  return (
    <div className="flex flex-col gap-6">
      <OrganizationReview />
      <div className="flex flex-col gap-3" data-testid="review">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">Reported postings</h2>
      {list.isPending && <p role="status" className="text-sm">Loading…</p>}
      {list.isError && <ErrorText error={list.error} fallback="Reports could not be loaded." />}
      {list.isSuccess && list.data.length === 0 && <p className="text-sm text-[var(--color-text-secondary)]">No reported postings.</p>}
      {list.data?.map(p => (
        <article key={p.id} className={card} data-testid="reported-posting">
          <h2 className="font-bold">{p.title} · {p.organizationName}</h2>
          <p className="text-sm">{LABEL[p.status]} · {p.reports} report{p.reports === 1 ? '' : 's'}: {(p.reasons ?? []).map(r => LABEL[r] ?? r).join(', ')}</p>
          <div className="mt-2 flex gap-2">
            {['open', 'closed'].includes(p.status) && <button type="button" className={secondaryButton} onClick={() => moderate.mutate({ id: p.id, action: 'hide' })}>Hide</button>}
            {p.status === 'hidden' && <button type="button" className={secondaryButton} onClick={() => moderate.mutate({ id: p.id, action: 'restore' })}>Restore</button>}
          </div>
        </article>
      ))}
      {moderate.isError && <ErrorText error={moderate.error} fallback="The posting could not be changed." />}
      </div>
    </div>
  );
};

/** Organizations' claims, reviewed before their postings count in any market figure. */
const OrganizationReview: React.FC = () => {
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: ['employer-organizations'], queryFn: fetchOrganizationsForReview, retry: false });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const review = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'approve' | 'reject' }) => reviewOrganization(id, decision, notes[id] ?? ''),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employer-organizations'] }),
  });
  return (
    <section aria-labelledby="org-review-heading" className="flex flex-col gap-3" data-testid="organization-review-list">
      <h2 id="org-review-heading" className="text-base font-bold text-[var(--color-text-primary)]">Organizations for market review</h2>
      <p className="text-xs text-[var(--color-text-secondary)]">
        A posting counts in market figures only after its organization is reviewed here. Review is your check of the claim, not independent
        verification: listings keep saying the organization is self-declared.
      </p>
      {list.isPending && <p role="status" className="text-sm">Loading…</p>}
      {list.isError && <ErrorText error={list.error} fallback="Organizations could not be loaded." />}
      {list.isSuccess && list.data.length === 0 && <p className="text-sm text-[var(--color-text-secondary)]">No organizations yet.</p>}
      {list.data?.map(o => (
        <article key={o.organizationId} className={card} data-testid="organization-for-review" data-status={o.marketReview.status}>
          <h3 className="font-bold">{o.organizationName}</h3>
          <p className="text-sm">
            {o.website ?? 'no website'} · e-mail domain {o.emailDomainMatchesWebsite ? 'matches' : 'does not match'} · {o.publishedPostings} published · {LABEL[o.marketReview.status]}
            {o.otherAccountsWithSameName > 0 && <strong> · {o.otherAccountsWithSameName} other account{o.otherAccountsWithSameName === 1 ? '' : 's'} claim this name</strong>}
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <label className={labelClass}>
              Note
              <input className={inputClass} value={notes[o.organizationId] ?? ''} maxLength={500} onChange={e => setNotes({ ...notes, [o.organizationId]: e.target.value })} />
            </label>
            <button type="button" className={secondaryButton} onClick={() => review.mutate({ id: o.organizationId, decision: 'approve' })}>Accept for market figures</button>
            <button type="button" className={secondaryButton} onClick={() => review.mutate({ id: o.organizationId, decision: 'reject' })}>Reject</button>
          </div>
        </article>
      ))}
      {review.isError && <ErrorText error={review.error} fallback="The review could not be saved." />}
    </section>
  );
};

export default EmployerPostingsPage;
