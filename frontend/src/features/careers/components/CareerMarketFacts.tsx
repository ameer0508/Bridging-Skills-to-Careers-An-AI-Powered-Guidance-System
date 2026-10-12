import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../../../lib/axios';
import type { CareerMarketEvidence } from '../../careerLab/careerLabApi';
import { fetchSalaryInsights, PERIOD_LABEL, SALARY_REASON_TEXT, type SalaryInsights } from '../../market/marketApi';
import { ErrorNote, Loading, Note } from '../../careerLab/components/labUi';
import { errorText, formatDate, labelClass, panelClass, quietButton } from '../../careerLab/components/labStyles';

/**
 * What SkillBridge actually knows about the job market for a career, on the Careers page.
 *
 * These sections replace panels that showed invented demand scores, growth rates, salaries and
 * job listings. Each one shows figures only when they come from the market service's sourced
 * records, and otherwise says that the data is unavailable. Nothing here is estimated.
 */

const fetchEvidence = async (careerId: string): Promise<CareerMarketEvidence> => (await apiClient.get(`/careers/${careerId}/market-evidence`)).data.data;

/** Posting counts for one career, or the reason there are none to show. */
export const CareerDemandPanel: React.FC<{ careerId: string; careerTitle: string }> = ({ careerId, careerTitle }) => {
  const evidence = useQuery<CareerMarketEvidence>({ queryKey: ['career-market-evidence', careerId], queryFn: () => fetchEvidence(careerId) });
  return (
    <section className={panelClass} aria-labelledby="career-demand-heading" data-testid="career-demand" data-state={evidence.data?.state ?? ''}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 id="career-demand-heading" className="text-base font-bold text-white">Job postings for {careerTitle}</h3>
          <p className="text-xs text-slate-400">From licensed job-market sources only. Postings describe the market; they say nothing about your own chances.</p>
        </div>
        <Link to="/market" className={quietButton}>Open Market Evidence</Link>
      </div>
      {evidence.isLoading ? (
        <Loading label="Looking up market evidence..." />
      ) : evidence.isError || !evidence.data ? (
        <>
          <ErrorNote message={errorText(evidence.error, 'Market evidence could not be loaded.')} />
          <button type="button" className={quietButton} onClick={() => evidence.refetch()}>Try again</button>
        </>
      ) : evidence.data.usable && evidence.data.evidence ? (
        <div className="space-y-1">
          <p className="text-xl font-extrabold text-white">{evidence.data.evidence.distinctPostings} postings</p>
          <p className="text-xs text-slate-300">
            {evidence.data.evidence.location}, {evidence.data.evidence.period.from} to {evidence.data.evidence.period.to}, in {evidence.data.evidence.monthsWithPostings} months.
            Source: {evidence.data.evidence.sources.map((s) => `${s.name} (${s.licence})`).join('; ')}.
            {evidence.data.evidence.latestRetrievedAt ? ` Collected ${formatDate(evidence.data.evidence.latestRetrievedAt)}.` : ''}
          </p>
          <p className="text-[11px] text-slate-400">{evidence.data.evidence.matchingRule}</p>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">Market data unavailable</p>
          <p className="text-xs text-slate-300">{evidence.data.detail}</p>
        </div>
      )}
      <Note>No demand score, growth rate or forecast is shown here, because none can be supported without sourced records.</Note>
    </section>
  );
};

/** Advertised salaries from sourced postings, or the reason there are none to show. */
export const CareerSalaryPanel: React.FC = () => {
  const salaries = useQuery<SalaryInsights>({ queryKey: ['career-salary-insights'], queryFn: () => fetchSalaryInsights({ dataset: 'sourced' }) });
  const data = salaries.data;
  const groups = data?.status === 'available' && !data.isSynthetic ? data.groups.filter((g) => g.sufficient && g.completeRanges.midpointQuartiles) : [];
  return (
    <section className={panelClass} aria-labelledby="career-salary-heading" data-testid="career-salary" data-status={data?.status ?? ''}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 id="career-salary-heading" className="text-base font-bold text-white">Advertised salaries</h3>
          <p className="text-xs text-slate-400">Only salaries stated in sourced postings, per country, currency and pay period. Amounts are never converted or estimated.</p>
        </div>
        <Link to="/market/salaries" className={quietButton}>Open Salary Insights</Link>
      </div>
      {salaries.isLoading ? (
        <Loading label="Looking up salary records..." />
      ) : salaries.isError || !data ? (
        <>
          <ErrorNote message={errorText(salaries.error, 'Salary records could not be loaded.')} />
          <button type="button" className={quietButton} onClick={() => salaries.refetch()}>Try again</button>
        </>
      ) : groups.length === 0 ? (
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">Salary data unavailable</p>
          <p className="text-xs text-slate-300">
            {data.reasons.length > 0 ? data.reasons.map((reason) => SALARY_REASON_TEXT[reason](data)).join(' ') : 'No group of sourced postings has enough stated salaries to report a figure.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {groups.slice(0, 5).map((group) => (
            <li key={group.key} className="p-3 rounded-2xl bg-slate-900/50 border border-white/10 space-y-1">
              <p className="text-sm font-bold text-white">
                {group.country}: median {group.completeRanges.midpointQuartiles!.median.toLocaleString()} {group.currency} {PERIOD_LABEL[group.period]}
              </p>
              <p className="text-[11px] text-slate-400">
                Middle half {group.completeRanges.midpointQuartiles!.p25.toLocaleString()} to {group.completeRanges.midpointQuartiles!.p75.toLocaleString()}, from {group.completeRanges.count} postings with a full range.
                Source: {group.sources.map((s) => `${s.name} (${s.licence})`).join('; ')}. Collected up to {formatDate(group.collection.latestRetrievedAt)}.
              </p>
            </li>
          ))}
        </ul>
      )}
      <Note>These are advertised figures for all sourced postings, not for one career, and not an estimate of what you would earn.</Note>
    </section>
  );
};

/** Where current listings are, instead of an invented feed. */
export const JobListingsPointer: React.FC = () => (
  <section className={panelClass} aria-labelledby="job-listings-heading" data-testid="job-listings-pointer">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <h3 id="job-listings-heading" className="text-base font-bold text-white">Job listings</h3>
        <p className="text-xs text-slate-400">
          Listings are on the job search page, where each one is scored against your skills and every built-in sample listing is labelled as a sample.
        </p>
      </div>
      <Link to="/job-agent" className={quietButton}>Open job search</Link>
    </div>
    <p className={labelClass}>No listings are shown on this page</p>
  </section>
);
