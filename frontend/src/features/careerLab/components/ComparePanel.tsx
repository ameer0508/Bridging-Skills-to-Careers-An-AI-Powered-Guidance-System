import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Ring } from '../../../design/aurora/ui';
import { careerLabApi, type CareerOption, type CompareResult } from '../careerLabApi';
import { EmptyState, ErrorNote, Note, SkillChips } from '../../../design/aurora/labUi';
import { errorText, formatDate, labelClass, panelClass, primaryButton } from '../../../design/aurora/labStyles';

interface ComparePanelProps {
  careers: CareerOption[];
}

const MAX = 4;

/** Side-by-side comparison of two to four careers against the user's current evidence. */
export const ComparePanel: React.FC<ComparePanelProps> = ({ careers }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const compare = useMutation<CompareResult, unknown, string[]>({ mutationFn: careerLabApi.compare });

  const toggle = (id: string) => {
    setSelected((current) => (current.includes(id) ? current.filter((c) => c !== id) : current.length < MAX ? [...current, id] : current));
  };

  const result = compare.data;

  return (
    <section className={panelClass} aria-labelledby="compare-heading">
      <div className="space-y-1">
        <h2 id="compare-heading" className="font-heading text-lg font-bold text-aurora-ink">Compare careers</h2>
        <p className="text-sm text-aurora-muted">Choose two to four careers to see how your current evidence measures up against each.</p>
      </div>

      <fieldset className="space-y-2">
        <legend className={labelClass}>Careers ({selected.length} of {MAX} chosen)</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {careers.map((career) => {
            const checked = selected.includes(career.id);
            return (
              <label
                key={career.id}
                className={`flex items-center gap-2 p-3 rounded-2xl border text-sm cursor-pointer transition-colors ${
                  checked ? 'border-aurora-violet/25 bg-aurora-violet/[0.06] text-aurora-ink' : 'border-aurora-line bg-aurora-canvas/60 text-aurora-ink'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!checked && selected.length >= MAX}
                  onChange={() => toggle(career.id)}
                  className="accent-[#5540f5]"
                />
                <span className="font-semibold">{career.title}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <button type="button" className={primaryButton} disabled={selected.length < 2 || compare.isPending} onClick={() => compare.mutate(selected)}>
        {compare.isPending ? 'Comparing...' : 'Compare'}
      </button>

      <ErrorNote message={compare.isError ? errorText(compare.error, 'The comparison could not be loaded.') : null} />

      {result && !result.hasProfile && (
        <EmptyState title="No resume evidence yet">
          Every score below is zero because there are no skills on your profile. Upload a resume to compare careers against your own evidence.
        </EmptyState>
      )}

      {result && (
        <div className="space-y-3" data-testid="compare-result">
          <ul className={`grid gap-3 ${result.careers.length > 2 ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-2'}`} aria-label="Match scores">
            {result.careers.map((c) => (
              <li key={c.careerId} className="flex items-center gap-3 rounded-3xl border border-aurora-line bg-aurora-canvas/50 p-3.5">
                <span className="relative inline-flex shrink-0 items-center justify-center">
                  <Ring value={c.matchScore} size={58} stroke={6} label={`${c.careerTitle} match`} />
                  <span aria-hidden="true" className="absolute text-xs font-extrabold text-aurora-ink">{c.matchScore}%</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-aurora-ink">{c.careerTitle}</span>
                  <span className="text-xs text-aurora-muted">{c.requirements.required.covered} of {c.requirements.required.total} required skills</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[640px]">
              <caption className="sr-only">Career comparison</caption>
              <thead>
                <tr className="text-aurora-muted">
                  <th scope="col" className="py-2 pr-3 font-semibold">Measure</th>
                  {result.careers.map((c) => (
                    <th key={c.careerId} scope="col" className="py-2 px-3 font-bold text-aurora-ink">{c.careerTitle}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-aurora-line text-aurora-ink">
                <tr>
                  <th scope="row" className="py-2 pr-3 font-semibold text-aurora-muted">Match score</th>
                  {result.careers.map((c) => (
                    <td key={c.careerId} className="py-2 px-3 font-bold text-aurora-ink" data-testid={`compare-score-${c.careerTitle}`}>{c.matchScore}%</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="py-2 pr-3 font-semibold text-aurora-muted">Required skills covered</th>
                  {result.careers.map((c) => (
                    <td key={c.careerId} className="py-2 px-3">{c.requirements.required.covered} of {c.requirements.required.total}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="py-2 pr-3 font-semibold text-aurora-muted">Preferred skills covered</th>
                  {result.careers.map((c) => (
                    <td key={c.careerId} className="py-2 px-3">{c.requirements.preferred.covered} of {c.requirements.preferred.total}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="py-2 pr-3 font-semibold text-aurora-muted">Evidence behind covered skills</th>
                  {result.careers.map((c) => (
                    <td key={c.careerId} className="py-2 px-3">
                      {c.evidence.applied} used in a role or project, {c.evidence.listedOnly} listed only, {c.evidence.inferred} inferred
                      <span className="block text-aurora-muted">
                        {c.evidence.averageEvidenceScore === null ? 'No covered skills' : `Average evidence score ${c.evidence.averageEvidenceScore}/100`}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="py-2 pr-3 font-semibold text-aurora-muted">Effort: skills to acquire</th>
                  {result.careers.map((c) => (
                    <td key={c.careerId} className="py-2 px-3 space-y-1.5">
                      <span className="block">{c.effort.skillsToAcquire.length} ({c.effort.requiredSkillsToAcquire.length} required)</span>
                      <SkillChips skills={c.effort.skillsToAcquire} tone="warn" emptyText="Nothing missing" />
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="py-2 pr-3 font-semibold text-aurora-muted">Effort: skills to strengthen</th>
                  {result.careers.map((c) => (
                    <td key={c.careerId} className="py-2 px-3"><SkillChips skills={c.effort.skillsToStrengthen} emptyText="None" /></td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="py-2 pr-3 font-semibold text-aurora-muted">Score points still open</th>
                  {result.careers.map((c) => (
                    <td key={c.careerId} className="py-2 px-3">{c.effort.pointsToClose} of {c.effort.pointsPossible}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="py-2 pr-3 font-semibold text-aurora-muted">Gaps shared with the other careers</th>
                  {result.careers.map((c) => (
                    <td key={c.careerId} className="py-2 px-3"><SkillChips skills={c.sharedWithOthers} tone="good" emptyText="None" /></td>
                  ))}
                </tr>
                <tr data-testid="compare-market-row" data-available={result.marketData.available}>
                  <th scope="row" className="py-2 pr-3 font-semibold text-aurora-muted">Opportunities</th>
                  {result.careers.map((c) => (
                    <td key={c.careerId} className="py-2 px-3 align-top" data-testid="compare-market-cell" data-state={c.market.state} data-usable={c.market.usable}>
                      {c.market.usable && c.market.evidence ? (
                        <div className="space-y-1">
                          <p className="font-bold text-aurora-ink">{c.market.evidence.distinctPostings} postings</p>
                          <p className="text-[11px] text-aurora-muted">
                            {c.market.evidence.location}, {c.market.evidence.period.from} to {c.market.evidence.period.to}, in {c.market.evidence.monthsWithPostings} months.
                            Source: {c.market.evidence.sources.map((s) => `${s.name} (${s.licence})`).join('; ')}.
                            {c.market.evidence.latestRetrievedAt ? ` Collected ${formatDate(c.market.evidence.latestRetrievedAt)}${c.market.evidence.ageDays !== null ? `, ${c.market.evidence.ageDays} days ago` : ''}.` : ''}
                          </p>
                          <p className="text-[11px] text-aurora-muted">{c.market.evidence.matchingRule}</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-aurora-muted">Market data unavailable</p>
                          <p className="text-[11px] text-aurora-muted">{c.market.detail}</p>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
                <tr data-testid="compare-live-row">
                  <th scope="row" className="py-2 pr-3 font-semibold text-aurora-muted">
                    Live listings
                    <span className="block text-[10px] font-normal text-aurora-muted">from OnJob.io</span>
                  </th>
                  {result.careers.map((c) => (
                    <td key={c.careerId} className="py-2 px-3 align-top" data-testid="compare-live-cell" data-state={c.liveListings.state}>
                      {c.liveListings.state === 'listings' ? (
                        <div className="space-y-2">
                          <ul className="space-y-1.5">
                            {c.liveListings.listings.map((l) => (
                              <li key={l.url} className="text-[11px]">
                                <a href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold text-aurora-violet underline" data-testid="live-listing-link">
                                  {l.title}
                                  <span className="sr-only"> (opens OnJob.io in a new tab)</span>
                                </a>
                                <span className="block text-aurora-muted">
                                  {l.employer} · {l.location}
                                  {l.postedAt ? ` · posted ${formatDate(l.postedAt)}${l.ageDays !== null ? ` (${l.ageDays} days ago)` : ''}` : ' · posting date not given'}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <p className="text-[10px] text-aurora-muted">
                            {c.liveListings.matchingRule}. Read from OnJob.io{c.liveListings.retrievedAt ? ` at ${formatDate(c.liveListings.retrievedAt)}` : ''}; apply on OnJob.io.
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-aurora-muted">{c.liveListings.detail}</p>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <Note testId="compare-effort-note">{result.effortNote}</Note>
          <Note testId="compare-market-note">{result.marketData.reason} {result.marketData.note}</Note>
          <Note testId="compare-live-note">
            {result.liveListings.scope} {result.liveListings.note} Source:{' '}
            <a href="https://onjob.io/for-job-boards/" target="_blank" rel="noopener noreferrer" className="underline">OnJob.io jobs feed licence</a>.
          </Note>
        </div>
      )}
    </section>
  );
};

export default ComparePanel;
