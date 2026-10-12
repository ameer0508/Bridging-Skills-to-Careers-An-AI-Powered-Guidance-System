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

  if (meta.source === 'unavailable') {
    return (
      <div role="alert" className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3" data-testid="job-source-notice" data-source="unavailable">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-white">The job provider could not be reached, so no listings are shown.</p>
            <p className="text-xs text-rose-100">{providerMessage || 'The provider did not respond.'}</p>
            <p className="text-xs text-slate-300">Demo listings are not shown in place of live results. Your saved jobs are unaffected.</p>
          </div>
        </div>
        <button type="button" onClick={onRetry} className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-100 text-xs font-bold cursor-pointer shrink-0">
          Try again
        </button>
      </div>
    );
  }

  const isSample = meta.source === 'sample';
  return (
    <div
      className={`p-4 rounded-2xl border flex items-start gap-3 ${isSample ? 'border-amber-500/30 bg-amber-500/10' : 'border-emerald-500/25 bg-emerald-500/5'}`}
      data-testid="job-source-notice"
      data-source={meta.source}
    >
      {isSample ? <FlaskConical className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" /> : <Radio className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />}
      <div className="space-y-1">
        <p className="text-xs font-bold text-white">
          {isSample
            ? 'Demo listings: no live job provider is configured.'
            : `Live listings${meta.fetchedAt ? `, fetched ${formatDateTime(meta.fetchedAt)}` : ''}${meta.fromCache ? ' (from the last 15 minutes)' : ''}.`}
        </p>
        <p className="text-xs text-slate-300">
          {isSample
            ? 'These are built-in examples for trying search, matching and tracking. They are not real vacancies and their links open a web search.'
            : 'Match scores are calculated from the skills each posting names and the skills on your resume.'}
        </p>
        <p className="text-xs text-slate-400">
          Showing {shown} of {meta.total} matching posting{meta.total === 1 ? '' : 's'}.{notes.length > 0 ? ` ${notes.join(' ')}` : ''}
        </p>
      </div>
    </div>
  );
};

export default SearchResultsNotice;
