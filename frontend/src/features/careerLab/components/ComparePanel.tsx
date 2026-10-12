import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { careerLabApi, type CareerOption, type CompareResult } from '../careerLabApi';
import { EmptyState, ErrorNote, Note, SkillChips } from './labUi';
import { errorText, formatDate, labelClass, panelClass, primaryButton } from './labStyles';

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
        <h2 id="compare-heading" className="text-base font-bold text-white">Compare careers</h2>
        <p className="text-xs text-slate-400">Choose two to four careers to see how your current evidence measures up against each.</p>
      </div>

      <fieldset className="space-y-2">
        <legend className={labelClass}>Careers ({selected.length} of {MAX} chosen)</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {careers.map((career) => {
            const checked = selected.includes(career.id);
            return (
              <label
                key={career.id}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer ${
                  checked ? 'border-indigo-500/60 bg-indigo-500/10 text-white' : 'border-white/10 bg-slate-900/60 text-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!checked && selected.length >= MAX}
                  onChange={() => toggle(career.id)}
                  className="accent-indigo-500"
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
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[640px]">
              <caption className="sr-only">Career comparison</caption>
              <thead>
                <tr className="text-slate-400">
                  <th scope="col" className="py-2 pr-3 font-semibold">Measure</th>
                  {result.careers.map((c) => (
                    <th key={c.careerId} scope="col" className="py-2 px-3 font-bold text-white">{c.careerTitle}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                <tr>
                  <th scope="row" className="py-2 pr-3 font-semibold text-slate-300">Match score</th>
                  {result.careers.map((c) => (
                    <td key={c.careerId} className="py-2 px-3 font-bold text-white" data-testid={`compare-score-${c.careerTitle}`}>{c.matchScore}%</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="py-2 pr-3 font-semibold text-slate-300">Required skills covered</th>
                  {result.careers.map((c) => (
                    <td key={c.careerId} className="py-2 px-3">{c.requirements.required.covered} of {c.requirements.required.total}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="py-2 pr-3 font-semibold text-slate-300">Preferred skills covered</th>
                  {result.careers.map((c) => (
                    <td key={c.careerId} className="py-2 px-3">{c.requirements.preferred.covered} of {c.requirements.preferred.total}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="py-2 pr-3 font-semibold text-slate-300">Evidence behind covered skills</th>
                  {result.careers.map((c) => (
                    <td key={c.careerId} className="py-2 px-3">
                      {c.evidence.applied} used in a role or project, {c.evidence.listedOnly} listed only, {c.evidence.inferred} inferred
                      <span className="block text-slate-400">
                        {c.evidence.averageEvidenceScore === null ? 'No covered skills' : `Average evidence score ${c.evidence.averageEvidenceScore}/100`}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="py-2 pr-3 font-semibold text-slate-300">Effort: skills to acquire</th>
                  {result.careers.map((c) => (
                    <td key={c.careerId} className="py-2 px-3 space-y-1.5">
                      <span className="block">{c.effort.skillsToAcquire.length} ({c.effort.requiredSkillsToAcquire.length} required)</span>
                      <SkillChips skills={c.effort.skillsToAcquire} tone="warn" emptyText="Nothing missing" />
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="py-2 pr-3 font-semibold text-slate-300">Effort: skills to strengthen</th>
                  {result.careers.map((c) => (
                    <td key={c.careerId} className="py-2 px-3"><SkillChips skills={c.effort.skillsToStrengthen} emptyText="None" /></td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="py-2 pr-3 font-semibold text-slate-300">Score points still open</th>
                  {result.careers.map((c) => (
                    <td key={c.careerId} className="py-2 px-3">{c.effort.pointsToClose} of {c.effort.pointsPossible}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="py-2 pr-3 font-semibold text-slate-300">Gaps shared with the other careers</th>
                  {result.careers.map((c) => (
                    <td key={c.careerId} className="py-2 px-3"><SkillChips skills={c.sharedWithOthers} tone="good" emptyText="None" /></td>
                  ))}
                </tr>
                <tr data-testid="compare-market-row" data-available={result.marketData.available}>
                  <th scope="row" className="py-2 pr-3 font-semibold text-slate-300">Opportunities</th>
                  {result.careers.map((c) => (
                    <td key={c.careerId} className="py-2 px-3 align-top" data-testid="compare-market-cell" data-state={c.market.state} data-usable={c.market.usable}>
                      {c.market.usable && c.market.evidence ? (
                        <div className="space-y-1">
                          <p className="font-bold text-white">{c.market.evidence.distinctPostings} postings</p>
                          <p className="text-[11px] text-slate-400">
                            {c.market.evidence.location}, {c.market.evidence.period.from} to {c.market.evidence.period.to}, in {c.market.evidence.monthsWithPostings} months.
                            Source: {c.market.evidence.sources.map((s) => `${s.name} (${s.licence})`).join('; ')}.
                            {c.market.evidence.latestRetrievedAt ? ` Collected ${formatDate(c.market.evidence.latestRetrievedAt)}${c.market.evidence.ageDays !== null ? `, ${c.market.evidence.ageDays} days ago` : ''}.` : ''}
                          </p>
                          <p className="text-[11px] text-slate-500">{c.market.evidence.matchingRule}</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-slate-300">Market data unavailable</p>
                          <p className="text-[11px] text-slate-400">{c.market.detail}</p>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <Note testId="compare-effort-note">{result.effortNote}</Note>
          <Note testId="compare-market-note">{result.marketData.reason} {result.marketData.note}</Note>
        </div>
      )}
    </section>
  );
};

export default ComparePanel;
