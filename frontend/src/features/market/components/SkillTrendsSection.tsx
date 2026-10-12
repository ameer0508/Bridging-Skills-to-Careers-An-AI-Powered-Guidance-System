import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { messageOf } from '../../../lib/collections';
import { fetchSkillTrends, MarketHistoryFilters, SkillTrends, TREND_REASON_TEXT } from '../marketApi';

const pct = (share: number | null) => (share === null ? '—' : `${(share * 100).toFixed(1)}%`);

type Trend = SkillTrends['skills'][number];

function changeText(trend: Trend, data: SkillTrends): string {
  const { change } = trend;
  if (!change.described) {
    return `Not stated: ${change.reasons.map(r => TREND_REASON_TEXT[r](data)).join(' ')}`;
  }
  const points = change.changePoints === null ? '' : ` (${change.changePoints >= 0 ? '+' : ''}${change.changePoints.toFixed(1)} pts, z = ${change.z?.toFixed(2)})`;
  if (change.direction === 'higher_share') return `Higher share in the recent half${points}`;
  if (change.direction === 'lower_share') return `Lower share in the recent half${points}`;
  return `No clear change${points}`;
}

/** C4: which skills postings mention, how often, and whether that changed, with every denominator shown. */
export const SkillTrendsSection: React.FC<{ filters: MarketHistoryFilters }> = ({ filters }) => {
  const [granularity, setGranularity] = useState<'month' | 'quarter'>('quarter');
  const query = useQuery({
    queryKey: ['market-skill-trends', filters, granularity],
    queryFn: () => fetchSkillTrends({ ...filters, granularity }),
    retry: false,
  });

  return (
    <section aria-labelledby="skill-trends-heading" data-testid="skill-trends" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="skill-trends-heading" className="text-lg font-bold font-display text-[var(--color-text-primary)]">Skills mentioned in postings</h2>
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-text-secondary)]">
          Group by
          <select
            className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
            value={granularity}
            onChange={e => setGranularity(e.target.value as 'month' | 'quarter')}
          >
            <option value="quarter">Quarter</option>
            <option value="month">Month</option>
          </select>
        </label>
      </div>

      {query.isPending && <p role="status" className="text-sm text-[var(--color-text-secondary)]">Loading skill trends…</p>}
      {query.isError && (
        <div role="alert" className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-status-error,#dc2626)] p-3 text-sm">
          <AlertTriangle size={16} aria-hidden="true" /> Skill trends could not be loaded: {messageOf(query.error, 'the server did not respond.')}
        </div>
      )}
      {query.data && <TrendsView data={query.data} />}
    </section>
  );
};

const TrendsView: React.FC<{ data: SkillTrends }> = ({ data }) => {
  if (data.totals.distinctPostings === 0) {
    return (
      <div data-testid="skill-trends-empty" className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-4 text-sm text-[var(--color-text-secondary)]">
        {data.sufficiency.reasons.map(r => <p key={r}>{TREND_REASON_TEXT[r](data)}</p>)}
      </div>
    );
  }

  const chart = data.skills.slice(0, 10).map(s => ({ skill: s.skill, share: s.share === null ? 0 : Math.round(s.share * 1000) / 10 }));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[var(--color-text-secondary)]" data-testid="skill-trends-scope">
        Shares are out of {data.totals.distinctPostings} dated posting{data.totals.distinctPostings === 1 ? '' : 's'}
        {' '}({data.totals.postingsWithoutRecognisedSkills} with no recognised skill; {data.totals.undatedExcluded} undated not counted).
        {' '}Periods: {data.periods.map(p => `${p.period} (${p.postings})`).join(', ')}.
      </p>

      {!data.sufficiency.sufficient && (
        <div data-testid="skill-trends-insufficient" className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface-raised)] p-3 text-sm">
          <strong className="text-[var(--color-text-primary)]">Counts only, no change over time is stated:</strong>
          <ul className="mt-1 list-disc pl-5 text-[var(--color-text-secondary)]">
            {data.sufficiency.reasons.map(r => <li key={r}>{TREND_REASON_TEXT[r](data)}</li>)}
          </ul>
        </div>
      )}

      {chart.length > 0 && (
        <div className="h-64 w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} layout="vertical" margin={{ top: 0, right: 16, left: 24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" horizontal={false} />
              <XAxis type="number" unit="%" stroke="var(--color-text-tertiary)" fontSize={11} />
              <YAxis type="category" dataKey="skill" width={110} stroke="var(--color-text-tertiary)" fontSize={11} />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="share" name="Share of postings" fill="var(--color-interactive-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm" data-testid="skill-trends-table">
          <caption className="sr-only">Postings mentioning each skill, its share and the change between the halves of the period</caption>
          <thead>
            <tr className="text-xs text-[var(--color-text-secondary)]">
              <th scope="col" className="py-2 pr-3">Skill</th>
              <th scope="col" className="py-2 pr-3">Postings mentioning</th>
              <th scope="col" className="py-2 pr-3">Earlier half</th>
              <th scope="col" className="py-2 pr-3">Recent half</th>
              <th scope="col" className="py-2">Change</th>
            </tr>
          </thead>
          <tbody>
            {data.skills.map(s => (
              <tr key={s.skill} className="border-t border-[var(--color-border-subtle)] align-top">
                <th scope="row" className="py-2 pr-3 font-semibold text-[var(--color-text-primary)]">{s.skill}</th>
                <td className="py-2 pr-3">{s.mentions} of {data.totals.distinctPostings} ({pct(s.share)})</td>
                <td className="py-2 pr-3">{s.change.earlier.mentions} of {s.change.earlier.postings} ({pct(s.change.earlier.share)})</td>
                <td className="py-2 pr-3">{s.change.recent.mentions} of {s.change.recent.postings} ({pct(s.change.recent.share)})</td>
                <td className="py-2 text-[var(--color-text-secondary)]">{changeText(s, data)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="list-disc space-y-1 pl-5 text-xs text-[var(--color-text-secondary)]">
        {data.caveats.map(c => <li key={c}>{c}</li>)}
      </ul>
    </div>
  );
};

export default SkillTrendsSection;
