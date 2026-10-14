import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Ban, FlaskConical } from 'lucide-react';
import { CartesianGrid, ComposedChart, Area, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { messageOf } from '../../../lib/collections';
import { fetchMarketForecast, FORECAST_REASON_TEXT, MarketForecast, MarketHistoryFilters, METHOD_LABEL } from '../marketApi';

const formatMonth = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' });

/** C2: a forecast of monthly postings, given only when every minimum is met. */
export const ForecastSection: React.FC<{ filters: MarketHistoryFilters }> = ({ filters }) => {
  const query = useQuery({
    queryKey: ['market-forecast', filters.dataset, filters.skill, filters.country],
    queryFn: () => fetchMarketForecast(filters),
    retry: false,
  });

  return (
    <section aria-labelledby="forecast-heading" data-testid="forecast" className="flex flex-col gap-4">
      <h2 id="forecast-heading" className="text-lg font-bold font-display text-aurora-ink">Postings forecast</h2>
      {query.isPending && <p role="status" className="text-sm text-aurora-muted">Checking whether a forecast can be made…</p>}
      {query.isError && (
        <div role="alert" className="flex items-center gap-2 rounded-2xl border border-rose-300 p-3 text-sm">
          <AlertTriangle size={16} aria-hidden="true" /> The forecast could not be loaded: {messageOf(query.error, 'the server did not respond.')}
        </div>
      )}
      {query.data && <ForecastView data={query.data} />}
    </section>
  );
};

const ForecastView: React.FC<{ data: MarketForecast }> = ({ data }) => {
  if (data.status !== 'available' || !data.forecast) {
    return (
      <div data-testid="forecast-unavailable" className="rounded-2xl border-2 border-aurora-line bg-white p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-aurora-ink">
          <Ban size={16} aria-hidden="true" /> FORECAST UNAVAILABLE
        </h3>
        {data.isSynthetic && <p className="mb-2 text-xs font-semibold text-amber-800">SYNTHETIC TEST DATA</p>}
        <ul className="list-disc space-y-1 pl-5 text-sm text-aurora-muted">
          {data.reasons.map(r => <li key={r}>{FORECAST_REASON_TEXT[r](data)}</li>)}
        </ul>
        <p className="mt-2 text-xs text-aurora-muted">
          No number is shown until the history is long, dense, recent and from one country. See the method below.
        </p>
        <MethodNotes data={data} />
      </div>
    );
  }

  const f = data.forecast;
  const chartData = [
    ...data.history.slice(-12).map(h => ({ month: formatMonth(h.month), actual: h.postings })),
    ...f.points.map(p => ({ month: formatMonth(p.month), forecast: p.point, range: [p.low80, p.high80] as [number, number] })),
  ];
  const other = (Object.keys(f.backtest) as Array<keyof typeof f.backtest>).find(m => m !== f.method)!;

  return (
    <div className="flex flex-col gap-4" data-testid="forecast-available">
      {data.isSynthetic && (
        <div role="note" className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-amber-500 bg-amber-50 p-4 text-sm text-amber-900">
          <FlaskConical size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span><strong>SYNTHETIC TEST DATA — demonstration of the method.</strong> This is not a prediction of real job postings or employment.</span>
        </div>
      )}
      <div className="h-64 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart accessibilityLayer={false} data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6eaf6" vertical={false} />
            <XAxis dataKey="month" stroke="#515b80" fontSize={10} tickLine={false} />
            <YAxis stroke="#515b80" fontSize={11} allowDecimals={false} tickLine={false} />
            <Tooltip />
            <Area dataKey="range" name="80% range" stroke="none" fill="#515b80" fillOpacity={0.2} />
            <Line dataKey="actual" name="Postings held" stroke="#5540f5" dot={false} />
            <Line dataKey="forecast" name="Forecast" stroke="#515b80" strokeDasharray="5 4" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <table className="w-full max-w-xl text-left text-sm" data-testid="forecast-table">
        <caption className="sr-only">Forecast of distinct postings per month with 80% ranges</caption>
        <thead><tr><th scope="col" className="py-1 pr-4">Month</th><th scope="col" className="py-1 pr-4">Forecast postings</th><th scope="col" className="py-1">80% range</th></tr></thead>
        <tbody>
          {f.points.map(p => (
            <tr key={p.month}><td className="py-1 pr-4">{formatMonth(p.month)}</td><td className="py-1 pr-4">{p.point}</td><td className="py-1">{p.low80}–{p.high80}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="text-sm text-aurora-muted">
        Method: <strong>{METHOD_LABEL[f.method]}</strong>, chosen because its average error one to {f.points.length} months ahead in{' '}
        {f.backtest[f.method].origins} backtests ({f.backtest[f.method].mae.map(v => v ?? '—').join(' / ')}) was no higher than that of the {METHOD_LABEL[other].toLowerCase()} (
        {f.backtest[other].mae.map(v => v ?? '—').join(' / ')}).
      </p>
      <MethodNotes data={data} />
    </div>
  );
};

const MethodNotes: React.FC<{ data: MarketForecast }> = ({ data }) => (
  <details className="mt-2 text-xs text-aurora-muted">
    <summary className="cursor-pointer font-medium">How forecasts are made and when they are withheld</summary>
    <ul className="mt-2 list-disc space-y-1 pl-5">
      {data.method.map(m => <li key={m}>{m}</li>)}
      {data.caveats.map(c => <li key={c}>{c}</li>)}
    </ul>
  </details>
);
