import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Database, FlaskConical, RotateCw } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardBody, CardHeader } from '../../../components/base/Card';
import { messageOf } from '../../../lib/collections';
import { fetchMarketHistory, MarketDataset, MarketHistory, MarketHistoryFilters, REASON_TEXT } from '../marketApi';
import { SkillTrendsSection } from './SkillTrendsSection';
import { ForecastSection } from './ForecastSection';

const COUNTRIES = [
  { value: '', label: 'All countries' },
  { value: 'IN', label: 'India' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
];

const formatMonth = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' });

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'unknown';

const inputClass =
  'w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)]';

/** C1: dated, sourced posting history, with its provenance and an honest insufficient-data state. */
export const MarketEvidencePage: React.FC = () => {
  const [draft, setDraft] = useState<MarketHistoryFilters>({ dataset: 'sourced', skill: '', country: '', from: '', to: '' });
  const [filters, setFilters] = useState<MarketHistoryFilters>(draft);

  const query = useQuery({
    queryKey: ['market-history', filters],
    queryFn: () => fetchMarketHistory(filters),
    retry: false,
  });

  const setDataset = (dataset: MarketDataset) => {
    const next = { ...draft, dataset };
    setDraft(next);
    setFilters(next);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold font-display text-[var(--color-text-primary)]">Market Evidence</h1>
        <p className="max-w-3xl text-sm text-[var(--color-text-secondary)]">
          Job postings SkillBridge holds from registered sources, counted by the month they were published. Every figure
          is a count of distinct postings with its source shown. Nothing is estimated or filled in.
        </p>
      </header>

      <div role="radiogroup" aria-label="Data set" className="flex flex-wrap gap-2">
        {([
          { value: 'sourced', label: 'Sourced market records', Icon: Database },
          { value: 'synthetic_fixture', label: 'Synthetic test data', Icon: FlaskConical },
        ] as const).map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={filters.dataset === value}
            onClick={() => setDataset(value)}
            className={`inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm font-medium ${
              filters.dataset === value
                ? 'border-[var(--color-interactive-primary)] bg-[var(--color-interactive-primary)] text-white'
                : 'border-[var(--color-border-default)] text-[var(--color-text-primary)]'
            }`}
          >
            <Icon size={16} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>

      <form
        aria-label="Filter market history"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={e => {
          e.preventDefault();
          setFilters(draft);
        }}
      >
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-text-secondary)]">
          Skill
          <input className={inputClass} value={draft.skill} placeholder="e.g. Python" maxLength={80}
            onChange={e => setDraft({ ...draft, skill: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-text-secondary)]">
          Country
          <select className={inputClass} value={draft.country} onChange={e => setDraft({ ...draft, country: e.target.value })}>
            {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-text-secondary)]">
          From
          <input type="month" className={inputClass} value={draft.from} onChange={e => setDraft({ ...draft, from: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-text-secondary)]">
          To
          <input type="month" className={inputClass} value={draft.to} onChange={e => setDraft({ ...draft, to: e.target.value })} />
        </label>
        <div className="flex items-end">
          <button type="submit" className="w-full rounded-[var(--radius-md)] bg-[var(--color-interactive-primary)] px-4 py-2 text-sm font-semibold text-white">
            Show history
          </button>
        </div>
      </form>

      <div aria-live="polite">
        {query.isPending && (
          <p role="status" className="text-sm text-[var(--color-text-secondary)]">Loading market history…</p>
        )}
        {query.isError && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-status-error,#dc2626)] p-4 text-sm">
            <AlertTriangle size={18} aria-hidden="true" />
            <span>Market history could not be loaded: {messageOf(query.error, 'the server did not respond.')}</span>
            <button type="button" onClick={() => query.refetch()} className="inline-flex items-center gap-1 font-semibold underline">
              <RotateCw size={14} aria-hidden="true" /> Try again
            </button>
          </div>
        )}
        {query.data && <HistoryView history={query.data} />}
      </div>

      <SkillTrendsSection filters={filters} />

      <ForecastSection filters={filters} />
    </div>
  );
};

const HistoryView: React.FC<{ history: MarketHistory }> = ({ history }) => {
  const { sufficiency, totals } = history;
  const hasRecords = totals.distinctPostings > 0;
  const chartData = history.buckets.map(b => ({ month: formatMonth(b.month), postings: b.postings }));

  return (
    <div className="flex flex-col gap-6">
      {history.isSynthetic && (
        <div role="note" data-testid="synthetic-banner" className="flex items-start gap-3 rounded-[var(--radius-md)] border-2 border-dashed border-amber-500 bg-amber-50 p-4 text-sm text-amber-900">
          <FlaskConical size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span><strong>Synthetic test data.</strong> These postings were generated to test this screen. They describe no real jobs and say nothing about the job market.</span>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Distinct postings" value={String(totals.distinctPostings)} />
        <Stat label="Months with postings" value={`${totals.monthsWithPostings} of ${history.buckets.length}`} />
        <Stat label="Undated (not counted)" value={String(totals.undatedExcluded)} />
        <Stat label="Latest retrieval" value={formatDate(history.freshness.latestRetrievedAt)} />
      </dl>

      {!sufficiency.sufficient && (
        <section aria-labelledby="insufficient-heading" data-testid="insufficient-data" className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface-raised)] p-4">
          <h2 id="insufficient-heading" className="mb-2 text-sm font-bold text-[var(--color-text-primary)]">
            {hasRecords ? 'Not enough data to read a trend' : 'No market history to show'}
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-text-secondary)]">
            {sufficiency.reasons.map(reason => <li key={reason}>{REASON_TEXT[reason](history)}</li>)}
          </ul>
        </section>
      )}

      {hasRecords && (
        <Card variant="default">
          <CardHeader>
            <h2 className="text-base font-bold font-display text-[var(--color-text-primary)]">
              {sufficiency.sufficient ? 'Postings published per month' : 'Raw monthly counts (too few to read as a trend)'}
              {history.query.skill ? ` mentioning ${history.query.skill}` : ''}
            </h2>
          </CardHeader>
          <CardBody>
            <div className="h-72 w-full" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--color-text-tertiary)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--color-text-tertiary)" fontSize={11} allowDecimals={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="postings" name="Distinct postings" fill={sufficiency.sufficient ? 'var(--color-interactive-primary)' : 'var(--color-text-tertiary)'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-medium text-[var(--color-text-secondary)]">View as table</summary>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-left text-sm" data-testid="history-table">
                  <caption className="sr-only">Distinct postings per month</caption>
                  <thead><tr><th scope="col" className="py-1 pr-4">Month</th><th scope="col" className="py-1">Distinct postings</th></tr></thead>
                  <tbody>
                    {history.buckets.map(b => (
                      <tr key={b.month}><td className="py-1 pr-4">{formatMonth(b.month)}</td><td className="py-1">{b.postings}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </CardBody>
        </Card>
      )}

      {history.sources.length > 0 && (
        <section aria-labelledby="sources-heading" data-testid="market-sources">
          <h2 id="sources-heading" className="mb-2 text-base font-bold text-[var(--color-text-primary)]">Sources</h2>
          <ul className="flex flex-col gap-2">
            {history.sources.map(s => (
              <li key={s.id} className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-3 text-sm">
                <div className="font-semibold text-[var(--color-text-primary)]">{s.name} · {s.postings} posting{s.postings === 1 ? '' : 's'}</div>
                <div className="text-[var(--color-text-secondary)]">Licence: {s.licence}</div>
                <div className="text-[var(--color-text-secondary)]">{s.attribution}</div>
                {s.url && <a className="break-all text-[var(--color-interactive-primary)] underline" href={s.url} target="_blank" rel="noreferrer noopener">{s.url}</a>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="caveats-heading">
        <h2 id="caveats-heading" className="mb-2 text-sm font-bold text-[var(--color-text-primary)]">How to read this</h2>
        <ul className="list-disc space-y-1 pl-5 text-xs text-[var(--color-text-secondary)]">
          {history.caveats.map(c => <li key={c}>{c}</li>)}
        </ul>
      </section>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-3">
    <dt className="text-xs text-[var(--color-text-secondary)]">{label}</dt>
    <dd className="text-lg font-bold text-[var(--color-text-primary)]">{value}</dd>
  </div>
);

export default MarketEvidencePage;
