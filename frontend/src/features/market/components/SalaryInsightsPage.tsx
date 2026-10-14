import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Ban, Database, FlaskConical, RotateCw } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardBody, CardHeader } from '../../../design/aurora/cards';
import { messageOf } from '../../../lib/collections';
import {
  EXCLUSION_TEXT,
  fetchSalaryInsights,
  MarketDataset,
  PERIOD_LABEL,
  SALARY_REASON_TEXT,
  SalaryExclusion,
  SalaryFilters,
  SalaryGroup,
  SalaryInsights,
  SalaryPeriod,
} from '../marketApi';

const COUNTRY_NAMES: Record<string, string> = { IN: 'India', GB: 'United Kingdom', US: 'United States' };
const countryName = (code: string) => COUNTRY_NAMES[code] ?? code;

const PERIODS: SalaryPeriod[] = ['YEAR', 'MONTH', 'WEEK', 'DAY', 'HOUR'];

const inputClass =
  'w-full rounded-2xl border border-aurora-line bg-white px-3 py-2 text-sm text-aurora-ink';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Formats an amount in its own currency. Never converts. */
function money(amount: number | null, currency: string, period: SalaryPeriod): string {
  if (amount === null) return '—';
  const digits = period === 'HOUR' ? 2 : 0;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount.toLocaleString(undefined, { maximumFractionDigits: digits })} ${currency}`;
  }
}

const groupTitle = (g: SalaryGroup) => `${countryName(g.country)} · ${g.currency} · ${PERIOD_LABEL[g.period]}`;

/** C3: salaries stated in stored postings, one market (country, currency, period) at a time. */
export const SalaryInsightsPage: React.FC = () => {
  const blank: SalaryFilters = { dataset: 'sourced', country: '', currency: '', period: '', skill: '', from: '', to: '' };
  const [draft, setDraft] = useState<SalaryFilters>(blank);
  const [filters, setFilters] = useState<SalaryFilters>(blank);

  const query = useQuery({
    queryKey: ['market-salaries', filters],
    queryFn: () => fetchSalaryInsights(filters),
    retry: false,
  });

  const setDataset = (dataset: MarketDataset) => {
    const next = { ...draft, dataset };
    setDraft(next);
    setFilters(next);
  };

  const available = query.data?.available;
  const countryOptions = [...new Set(['IN', 'GB', 'US', ...(available?.countries ?? [])])].sort();
  const currencyOptions = [...new Set([...(available?.currencies ?? []), ...(draft.currency ? [draft.currency] : [])])].sort();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6">
      <header className="relative flex flex-col gap-2 overflow-hidden rounded-[32px] border border-aurora-line bg-white p-5 shadow-aurora-md [background-image:var(--aurora-gradient-canvas)] sm:p-8">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-aurora-violet"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full [background:var(--aurora-gradient-action)]" />Market</p>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-aurora-ink sm:text-3xl lg:text-4xl">Salary Insights</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-aurora-muted sm:text-base">
          Salaries stated in job postings SkillBridge holds from registered sources. Each country, currency and pay period
          is summarised on its own. Amounts are never converted, and nothing is estimated where postings give no figure.
        </p>
      </header>

      <div role="radiogroup" aria-label="Data set" className="flex flex-wrap gap-2">
        {([
          { value: 'sourced', label: 'Sourced market records', Icon: Database },
          { value: 'synthetic_fixture', label: 'Synthetic demonstration', Icon: FlaskConical },
        ] as const).map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={filters.dataset === value}
            onClick={() => setDataset(value)}
            className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium ${
              filters.dataset === value
                ? 'border-aurora-violet [background:var(--aurora-gradient-action)] text-aurora-ink'
                : 'border-aurora-line text-aurora-ink'
            }`}
          >
            <Icon size={16} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>

      <form
        aria-label="Filter salary insights"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={e => {
          e.preventDefault();
          setFilters(draft);
        }}
      >
        <label className="flex flex-col gap-1 text-xs font-medium text-aurora-muted">
          Country
          <select className={inputClass} value={draft.country} onChange={e => setDraft({ ...draft, country: e.target.value })}>
            <option value="">All countries (shown separately)</option>
            {countryOptions.map(c => <option key={c} value={c}>{countryName(c)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-aurora-muted">
          Currency
          <select className={inputClass} value={draft.currency} onChange={e => setDraft({ ...draft, currency: e.target.value })}>
            <option value="">All currencies (shown separately)</option>
            {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-aurora-muted">
          Pay period
          <select className={inputClass} value={draft.period} onChange={e => setDraft({ ...draft, period: e.target.value as SalaryPeriod | '' })}>
            <option value="">All periods (shown separately)</option>
            {PERIODS.map(p => <option key={p} value={p}>{PERIOD_LABEL[p]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-aurora-muted">
          Skill
          <input className={inputClass} value={draft.skill} placeholder="e.g. Python" maxLength={80} onChange={e => setDraft({ ...draft, skill: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-aurora-muted">
          From
          <input type="month" className={inputClass} value={draft.from} onChange={e => setDraft({ ...draft, from: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-aurora-muted">
          To
          <input type="month" className={inputClass} value={draft.to} onChange={e => setDraft({ ...draft, to: e.target.value })} />
        </label>
        <div className="flex items-end gap-2 lg:col-span-2">
          <button type="submit" className="flex-1 rounded-2xl [background:var(--aurora-gradient-action)] px-4 py-2 text-sm font-semibold text-aurora-ink">
            Show salaries
          </button>
          <button
            type="button"
            className="rounded-2xl border border-aurora-line px-4 py-2 text-sm font-medium text-aurora-ink"
            onClick={() => {
              const reset = { ...blank, dataset: draft.dataset };
              setDraft(reset);
              setFilters(reset);
            }}
          >
            Clear
          </button>
        </div>
      </form>

      <div aria-live="polite">
        {query.isPending && <p role="status" className="text-sm text-aurora-muted">Loading salary insights…</p>}
        {query.isError && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-300 p-4 text-sm">
            <AlertTriangle size={18} aria-hidden="true" />
            <span>Salary insights could not be loaded: {messageOf(query.error, 'the server did not respond.')}</span>
            <button type="button" onClick={() => query.refetch()} className="inline-flex items-center gap-1 font-semibold underline">
              <RotateCw size={14} aria-hidden="true" /> Try again
            </button>
          </div>
        )}
        {query.data && <InsightsView data={query.data} />}
      </div>
    </div>
  );
};

const InsightsView: React.FC<{ data: SalaryInsights }> = ({ data }) => {
  if (data.status === 'data_unavailable') {
    return (
      <section aria-labelledby="salary-unavailable-heading" data-testid="salary-unavailable" className="rounded-2xl border-2 border-aurora-line bg-white p-5">
        <h2 id="salary-unavailable-heading" className="mb-2 flex items-center gap-2 text-base font-bold text-aurora-ink">
          <Ban size={18} aria-hidden="true" /> DATA UNAVAILABLE
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-aurora-muted">
          {data.reasons.map(r => <li key={r}>{SALARY_REASON_TEXT[r](data)}</li>)}
        </ul>
        <p className="mt-3 text-sm text-aurora-muted">
          The synthetic demonstration shows how this screen works with generated postings. It says nothing about real pay.
        </p>
      </section>
    );
  }

  const excluded = Object.entries(data.totals.excluded) as Array<[SalaryExclusion, number]>;
  return (
    <div className="flex flex-col gap-6">
      {data.isSynthetic && (
        <div role="note" data-testid="synthetic-banner" className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-amber-500 bg-amber-50 p-4 text-sm text-amber-900">
          <FlaskConical size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span><strong>SYNTHETIC TEST DATA — demonstration mode.</strong> These salaries were generated to test this screen. They describe no real jobs and no real pay.</span>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Postings in period" value={String(data.totals.postingsConsidered)} />
        <Stat label="With a usable salary" value={String(data.totals.postingsWithUsableSalary)} />
        <Stat label="Other currency or period" value={String(data.totals.outsideCurrencyOrPeriodFilter)} />
        <Stat label="Undated (not counted)" value={String(data.totals.undatedExcluded)} />
      </dl>

      {data.reasons.length > 0 && (
        <section aria-labelledby="salary-insufficient-heading" data-testid="salary-insufficient" className="rounded-2xl border border-aurora-line bg-white p-4">
          <h2 id="salary-insufficient-heading" className="mb-2 text-sm font-bold text-aurora-ink">Not enough salary data</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-aurora-muted">
            {data.reasons.map(r => <li key={r}>{SALARY_REASON_TEXT[r](data)}</li>)}
          </ul>
        </section>
      )}

      {data.groups.map(g => <GroupCard key={g.key} group={g} minimums={data.minimums} />)}

      <section aria-labelledby="exclusions-heading" data-testid="salary-exclusions">
        <h2 id="exclusions-heading" className="mb-2 text-sm font-bold text-aurora-ink">Left out of the figures</h2>
        <table className="w-full max-w-lg text-left text-sm">
          <caption className="sr-only">Postings excluded from salary statistics, by reason</caption>
          <thead><tr><th scope="col" className="py-1 pr-4">Reason</th><th scope="col" className="py-1">Postings</th></tr></thead>
          <tbody>
            {excluded.map(([reason, count]) => (
              <tr key={reason}><td className="py-1 pr-4">{EXCLUSION_TEXT[reason]}</td><td className="py-1">{count}</td></tr>
            ))}
            <tr><td className="py-1 pr-4">No publication date</td><td className="py-1">{data.totals.undatedExcluded}</td></tr>
          </tbody>
        </table>
        {data.totals.scanLimitReached && (
          <p className="mt-2 text-xs text-aurora-muted">Only the earliest 50,000 postings in the period were read. Narrow the filters to include the rest.</p>
        )}
      </section>

      <section aria-labelledby="salary-method-heading">
        <h2 id="salary-method-heading" className="mb-2 text-sm font-bold text-aurora-ink">How these figures are made</h2>
        <ul className="list-disc space-y-1 pl-5 text-xs text-aurora-muted">
          {data.method.map(m => <li key={m}>{m}</li>)}
          {data.caveats.map(c => <li key={c}>{c}</li>)}
        </ul>
      </section>
    </div>
  );
};

const GroupCard: React.FC<{ group: SalaryGroup; minimums: SalaryInsights['minimums'] }> = ({ group: g, minimums }) => {
  const m = (amount: number | null) => money(amount, g.currency, g.period);
  const cr = g.completeRanges;
  const notEnough = `Not given: ${cr.count} of ${minimums.forMedian} complete ranges needed`;
  const chartData = cr.distribution.map(b => ({ label: `${m(b.from)}–${m(b.to)}`, postings: b.postings }));

  return (
    <Card variant="default">
      <CardHeader>
        <h2 className="text-base font-bold font-display text-aurora-ink" data-testid="salary-group-title">{groupTitle(g)}</h2>
        <p className="text-xs text-aurora-muted">
          {g.postings} posting{g.postings === 1 ? '' : 's'} with a salary from {g.employers.distinct} employer{g.employers.distinct === 1 ? '' : 's'}
          {!g.employers.sufficient && <span data-testid="salary-employer-limit"> (too few employers, or one dominates: no figure given)</span>} · {g.remotePostings} remote · published {formatDate(g.postedBetween.earliest)} to {formatDate(g.postedBetween.latest)}
        </p>
      </CardHeader>
      <CardBody>
        <table className="w-full text-left text-sm" data-testid="salary-summary-table">
          <caption className="sr-only">Salary summary for {groupTitle(g)}</caption>
          <thead>
            <tr><th scope="col" className="py-1 pr-4">Measure</th><th scope="col" className="py-1 pr-4">Value</th><th scope="col" className="py-1">Based on</th></tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="py-1 pr-4 font-normal">Median stated minimum</th>
              <td className="py-1 pr-4 font-semibold">{cr.lower === null ? notEnough : m(cr.lower)}</td>
              <td className="py-1">{cr.count} complete ranges</td>
            </tr>
            <tr>
              <th scope="row" className="py-1 pr-4 font-normal">Median range midpoint</th>
              <td className="py-1 pr-4 font-semibold">{cr.midpoint === null ? notEnough : m(cr.midpoint)}</td>
              <td className="py-1">{cr.count} complete ranges</td>
            </tr>
            <tr>
              <th scope="row" className="py-1 pr-4 font-normal">Median stated maximum</th>
              <td className="py-1 pr-4 font-semibold">{cr.upper === null ? notEnough : m(cr.upper)}</td>
              <td className="py-1">{cr.count} complete ranges</td>
            </tr>
            <tr>
              <th scope="row" className="py-1 pr-4 font-normal">Middle half of midpoints (25th–75th percentile)</th>
              <td className="py-1 pr-4 font-semibold">
                {cr.midpointQuartiles ? `${m(cr.midpointQuartiles.p25)} – ${m(cr.midpointQuartiles.p75)}` : `Not given: ${minimums.forDistribution} complete ranges needed`}
              </td>
              <td className="py-1">{cr.count} complete ranges</td>
            </tr>
            <tr>
              <th scope="row" className="py-1 pr-4 font-normal">&ldquo;From&rdquo; figures (minimum only)</th>
              <td className="py-1 pr-4 font-semibold">{g.minimumOnly.medianMinimum === null ? 'Counted, not summarised' : `median ${m(g.minimumOnly.medianMinimum)}`}</td>
              <td className="py-1">{g.minimumOnly.count} postings</td>
            </tr>
            <tr>
              <th scope="row" className="py-1 pr-4 font-normal">&ldquo;Up to&rdquo; figures (maximum only)</th>
              <td className="py-1 pr-4 font-semibold">{g.maximumOnly.medianMaximum === null ? 'Counted, not summarised' : `median ${m(g.maximumOnly.medianMaximum)}`}</td>
              <td className="py-1">{g.maximumOnly.count} postings</td>
            </tr>
          </tbody>
        </table>

        {chartData.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-semibold text-aurora-ink">Range midpoints, by band</h3>
            <div className="h-64 w-full" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart accessibilityLayer={false} data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6eaf6" vertical={false} />
                  <XAxis dataKey="label" stroke="#515b80" fontSize={10} tickLine={false} interval={0} />
                  <YAxis stroke="#515b80" fontSize={11} allowDecimals={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="postings" name="Postings" fill="#5540f5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer font-medium text-aurora-muted">View bands as a table</summary>
              <table className="mt-2 w-full text-left text-sm" data-testid="salary-distribution-table">
                <caption className="sr-only">Postings per midpoint band for {groupTitle(g)}</caption>
                <thead><tr><th scope="col" className="py-1 pr-4">Midpoint band</th><th scope="col" className="py-1">Postings</th></tr></thead>
                <tbody>
                  {chartData.map(b => <tr key={b.label}><td className="py-1 pr-4">{b.label}</td><td className="py-1">{b.postings}</td></tr>)}
                </tbody>
              </table>
            </details>
          </div>
        )}

        <div className="mt-4 text-xs text-aurora-muted" data-testid="salary-provenance">
          <p>Collected {formatDate(g.collection.firstRetrievedAt)} to {formatDate(g.collection.latestRetrievedAt)}.</p>
          <ul className="mt-1 space-y-1">
            {g.sources.map(s => (
              <li key={s.id}>
                <span className="font-semibold text-aurora-ink">{s.name}</span> · {s.postings} posting{s.postings === 1 ? '' : 's'} · Licence: {s.licence}
                {s.url && <> · <a className="break-all text-aurora-violet underline" href={s.url} target="_blank" rel="noreferrer noopener">source</a></>}
              </li>
            ))}
          </ul>
        </div>
      </CardBody>
    </Card>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl border border-aurora-line p-3">
    <dt className="text-xs text-aurora-muted">{label}</dt>
    <dd className="text-lg font-bold text-aurora-ink">{value}</dd>
  </div>
);

export default SalaryInsightsPage;
