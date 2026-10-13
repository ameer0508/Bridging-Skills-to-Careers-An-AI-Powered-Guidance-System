import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Info } from 'lucide-react';
import { messageOf } from '../../../lib/collections';
import { CatalogueCareer, fetchCatalogue, fetchDomainMatches, RequirementBasis } from '../careerDomainsApi';

const card = 'rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-4';

const basisText = (b: RequirementBasis) =>
  b.type === 'onet_software'
    ? `O*NET software: ${b.examples.join(', ')}${b.inDemand ? ' (In Demand)' : ''}${b.hotTechnology ? ' (Hot Technology)' : ''}`
    : b.type === 'onet_knowledge'
      ? `O*NET knowledge: ${b.element}, importance ${b.importance.toFixed(2)} of 5`
      : `SkillBridge editorial: ${b.note}`;

/** E1: the careers added from O*NET, where each requirement comes from, and the user's own matches for them. */
export const CareerDomainsPage: React.FC = () => {
  const catalogue = useQuery({ queryKey: ['career-domains'], queryFn: fetchCatalogue, retry: false });
  const matches = useQuery({ queryKey: ['career-domain-matches'], queryFn: fetchDomainMatches, retry: false });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold font-display text-[var(--color-text-primary)]">More career domains</h1>
        {catalogue.data && (
          <>
            <p className="text-sm text-[var(--color-text-secondary)]">{catalogue.data.statusText}</p>
            <p role="note" data-testid="source-scope" className="flex items-start gap-2 rounded-[var(--radius-md)] border border-amber-500 bg-amber-50 p-3 text-sm text-amber-900">
              <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0" /> {catalogue.data.scopeNote}
            </p>
          </>
        )}
      </header>

      {(catalogue.isPending || matches.isPending) && <p role="status" className="text-sm text-[var(--color-text-secondary)]">Loading…</p>}
      {(catalogue.isError || matches.isError) && (
        <div role="alert" className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-status-error,#dc2626)] p-3 text-sm">
          <AlertTriangle size={16} aria-hidden="true" /> This page could not be loaded: {messageOf(catalogue.error ?? matches.error, 'the server did not respond.')}
        </div>
      )}

      {matches.data && (
        <section className={card} aria-labelledby="matches-heading" data-testid="domain-matches">
          <h2 id="matches-heading" className="mb-2 text-base font-bold text-[var(--color-text-primary)]">Your matches for these careers</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <caption className="sr-only">Your stored career matches for the careers on this page</caption>
              <thead><tr><th scope="col" className="py-1 pr-3">Career</th><th scope="col" className="py-1 pr-3">Match</th><th scope="col" className="py-1">Skills you have</th></tr></thead>
              <tbody>
                {matches.data.careers.map(c => (
                  <tr key={c.careerId} data-role={c.title}>
                    <th scope="row" className="py-1 pr-3 font-normal">{c.title} <span className="text-xs text-[var(--color-text-secondary)]">· {c.domain}</span></th>
                    <td className="py-1 pr-3 font-semibold">{c.matchScore === null ? 'No match yet' : `${c.matchScore}/100`}</td>
                    <td className="py-1">{c.matchingSkills.length ? c.matchingSkills.join(', ') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--color-text-secondary)]">{matches.data.notes.map(n => <li key={n}>{n}</li>)}</ul>
          <p className="mt-2 text-sm">
            <Link to="/careers" className="underline">See all your career matches in Career Intelligence</Link>
          </p>
        </section>
      )}

      {catalogue.data?.careers.map(c => <RoleCard key={c.title} career={c} />)}

      {catalogue.data && (
        <footer className="text-xs text-[var(--color-text-secondary)]" data-testid="onet-attribution">
          <p>{catalogue.data.source.attribution}</p>
          <p className="mt-1">
            <a href={catalogue.data.source.licenseUrl} target="_blank" rel="noreferrer noopener" className="underline">CC BY 4.0 licence</a> ·{' '}
            <a href={catalogue.data.source.databaseUrl} target="_blank" rel="noreferrer noopener" className="underline">O*NET database</a> · read {catalogue.data.source.accessedOn}
          </p>
        </footer>
      )}
    </div>
  );
};

const RoleCard: React.FC<{ career: CatalogueCareer }> = ({ career: c }) => (
  <section className={card} aria-labelledby={`role-${c.onet.code}`} data-testid="domain-role">
    <h2 id={`role-${c.onet.code}`} className="text-base font-bold text-[var(--color-text-primary)]">
      {c.title} <span className="text-sm font-normal text-[var(--color-text-secondary)]">· {c.domain}{c.newDomain ? ' (new domain)' : ''}</span>
    </h2>
    <p className="text-sm text-[var(--color-text-secondary)]">{c.description}</p>
    <p className="text-xs text-[var(--color-text-secondary)]">Based on O*NET-SOC {c.onet.code}, {c.onet.title}.{c.onet.note ? ` ${c.onet.note}` : ''}</p>
    <div className="mt-2 overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <caption className="sr-only">Requirements for {c.title}</caption>
        <thead><tr><th scope="col" className="py-1 pr-3">Skill</th><th scope="col" className="py-1 pr-3">Importance</th><th scope="col" className="py-1">Basis</th></tr></thead>
        <tbody>
          {c.requirements.map(r => (
            <tr key={r.skill}>
              <th scope="row" className="py-1 pr-3 font-normal">{r.skill}</th>
              <td className="py-1 pr-3">{r.importance} · weight {r.weight}</td>
              <td className="py-1 text-xs text-[var(--color-text-secondary)]">{basisText(r.basis)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default CareerDomainsPage;
