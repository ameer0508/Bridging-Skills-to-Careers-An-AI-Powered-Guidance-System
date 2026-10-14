import React from 'react';
import { AlertTriangle, FlaskConical, Radio } from 'lucide-react';
import { formatDateTime } from './jobFormat';

export interface OpportunitySearchMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  source: 'live' | 'sample' | 'unavailable';
  fetchedAt: string | null;
  fromCache: boolean;
  duplicatesRemoved: number;
  salaryDataAvailable: boolean;
  salaryFilter: { requestedMin: number; excludedWithoutSalary: number } | null;
  excludedWithoutDate: number;
  unavailableReason?: 'provider_error' | 'quota_exhausted' | null;
  resultAgeSeconds?: number | null;
  stale?: boolean;
  freshness?: Record<'new' | 'recent' | 'old' | 'undated' | 'sample', number>;
  providerQuota?: { limit: number; used: number; remaining: number; resetsAt: string } | null;
}

interface SearchResultsNoticeProps {
  meta?: OpportunitySearchMeta;
  providerMessage?: string;
  shown: number;
  sortBy: string;
  onRetry: () => void;
}

/**
 * Says where the listings came from (live provider, built-in demo set, or nothing because the
 * provider failed) and what the active filters removed, so an empty or short list is explained.
 */
export const SearchResultsNotice: React.FC<SearchResultsNoticeProps> = ({ meta, providerMessage, shown, sortBy, onRetry }) => {
  if (!meta) return null;

  const notes: string[] = [];
  if (meta.duplicatesRemoved > 0) {
    notes.push(`${meta.duplicatesRemoved} duplicate posting${meta.duplicatesRemoved === 1 ? '' : 's'} hidden.`);
  }
  if (meta.salaryFilter) {
    notes.push(
      `${meta.salaryFilter.excludedWithoutSalary} posting${meta.salaryFilter.excludedWithoutSalary === 1 ? '' : 's'} hidden by the salary filter because no yearly salary is stated.`
    );
  }
  if (!meta.salaryDataAvailable && (sortBy === 'salary' || meta.salaryFilter) && meta.source !== 'unavailable') {
    notes.push('None of these postings state a salary, so they cannot be ordered or filtered by it.');
  }
  if (meta.excludedWithoutDate > 0) {
    notes.push(`${meta.excludedWithoutDate} posting${meta.excludedWithoutDate === 1 ? '' : 's'} hidden by the date filter because no posting date is stated.`);
  }

  if (meta.source !== 'unavailable' && meta.freshness) {
    if (meta.freshness.old > 0) notes.push(`${meta.freshness.old} posted more than 30 days ago and may no longer be open.`);
    if (meta.freshness.undated > 0) notes.push(`${meta.freshness.undated} with no posting date from the source.`);
  }

  if (meta.source === 'unavailable' && meta.unavailableReason === 'quota_exhausted') {
    return (
      <div role="alert" className="p-4 rounded-2xl border border-amber-200 bg-amber-50 flex items-start gap-3" data-testid="job-source-notice" data-source="unavailable" data-reason="quota_exhausted">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-aurora-ink">Today's limit of job searches has been reached, so no new search was made.</p>
          <p className="text-xs text-amber-700">{providerMessage || 'New searches are possible tomorrow.'}</p>
          <p className="text-xs text-aurora-muted">Searches you already ran today are still shown from memory. Demo listings are not shown in their place. Your saved jobs are unaffected.</p>
        </div>
      </div>
    );
  }

  if (meta.source === 'unavailable') {
    return (
      <div role="alert" className="p-4 rounded-2xl border border-rose-200 bg-rose-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3" data-testid="job-source-notice" data-source="unavailable">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-aurora-ink">The job provider could not be reached, so no listings are shown.</p>
            <p className="text-xs text-rose-700">{providerMessage || 'The provider did not respond.'}</p>
            <p className="text-xs text-aurora-muted">Demo listings are not shown in place of live results. Your saved jobs are unaffected.</p>
          </div>
        </div>
        <button type="button" onClick={onRetry} className="py-2 px-4 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line text-aurora-ink text-xs font-bold cursor-pointer shrink-0">
          Try again
        </button>
      </div>
    );
  }

  const isSample = meta.source === 'sample';
  return (
    <div
      className={`p-4 rounded-2xl border flex items-start gap-3 ${isSample ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}
      data-testid="job-source-notice"
      data-source={meta.source}
    >
      {isSample ? <FlaskConical className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" /> : <Radio className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />}
      <div className="space-y-1">
        <p className="text-xs font-bold text-aurora-ink">
          {isSample
            ? 'Demo listings: no live job provider is configured.'
            : `Live listings${meta.fetchedAt ? `, fetched ${formatDateTime(meta.fetchedAt)}` : ''}${meta.stale ? ` (${Math.round((meta.resultAgeSeconds ?? 0) / 60)} minutes old: today's search limit is used up, so they could not be refreshed)` : meta.fromCache ? ' (from the last 15 minutes)' : ''}.`}
        </p>
        <p className="text-xs text-aurora-muted">
          {isSample
            ? 'These are built-in examples for trying search, matching and tracking. They are not real vacancies and their links open a web search.'
            : 'Match scores are calculated from the skills each posting names and the skills on your resume.'}
        </p>
        <p className="text-xs text-aurora-muted">
          Showing {shown} of {meta.total} matching posting{meta.total === 1 ? '' : 's'}.{notes.length > 0 ? ` ${notes.join(' ')}` : ''}
        </p>
      </div>
    </div>
  );
};

export default SearchResultsNotice;
