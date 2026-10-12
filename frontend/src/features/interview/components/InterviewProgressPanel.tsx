import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import apiClient from '../../../lib/axios';
import { messageOf } from '../../../lib/collections';

/** Mirrors backend/src/services/interview/InterviewProgressService.ts (D6). */
type Dimension = 'relevance' | 'completeness' | 'specificity' | 'structure' | 'technicalAccuracy';
interface Trend {
  sessions: number;
  first: number | null;
  latest: number | null;
  change: number | null;
  direction: 'improved' | 'declined' | 'no_clear_change' | null;
  latestVsPrevious: number | null;
  reason: 'too_few_sessions' | null;
}
interface Series {
  evaluationSource: 'ai' | 'heuristic';
  sessions: Array<{ id: string; completedAt: string; mode: string; rubricId: string; overallScore: number }>;
  dimensions: Record<Dimension, { points: Array<{ sessionId: string; completedAt: string; value: number }>; trend: Trend }>;
}
interface Progress {
  sessionsConsidered: number;
  excluded: { mixedScoring: number; nothingAnswered: number };
  series: Series[];
  minimums: { sessionsForTrend: number; changeThreshold: number };
  caveats: string[];
}

const LABEL: Record<Dimension, string> = {
  relevance: 'Relevance',
  completeness: 'Completeness',
  specificity: 'Specificity',
  structure: 'Structure',
  technicalAccuracy: 'Technical accuracy',
};
const COLOURS: Record<Dimension, string> = {
  relevance: '#818cf8',
  completeness: '#22d3ee',
  specificity: '#f59e0b',
  structure: '#34d399',
  technicalAccuracy: '#f472b6',
};
const SOURCE_LABEL = { heuristic: 'Scored by the built-in rubric', ai: 'Scored by AI' } as const;

const trendText = (t: Trend, min: number) => {
  if (t.reason === 'too_few_sessions') return `Not stated: ${t.sessions} of ${min} sessions needed`;
  const sign = (t.change ?? 0) >= 0 ? '+' : '';
  if (t.direction === 'improved') return `Improved (${sign}${t.change} points)`;
  if (t.direction === 'declined') return `Declined (${sign}${t.change} points)`;
  return `No clear change (${sign}${t.change} points)`;
};

/** D6: each scoring dimension across the user's completed sessions, compared like with like. */
export const InterviewProgressPanel: React.FC = () => {
  const [mode, setMode] = useState('');
  const query = useQuery({
    queryKey: ['interview-progress', mode],
    queryFn: async () => (await apiClient.get('/interviews/progress', { params: mode ? { mode } : {} })).data.data as Progress,
    retry: false,
  });

  return (
    <section aria-labelledby="progress-heading" data-testid="interview-progress" className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 text-slate-200">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="progress-heading" className="text-base font-bold text-white">Progress across sessions</h2>
        <label className="flex flex-col gap-1 text-[11px] text-slate-400">
          Interview mode
          <select className="rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-slate-100" value={mode} onChange={e => setMode(e.target.value)}>
            <option value="">All modes</option>
            {['technical', 'behavioral', 'project', 'resume', 'career', 'mixed'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      </div>

      {query.isPending && <p role="status" className="mt-3 text-xs text-slate-400">Loading progress…</p>}
      {query.isError && <p role="alert" className="mt-3 text-xs text-rose-300">Progress could not be loaded: {messageOf(query.error, 'the server did not respond.')}</p>}
      {query.data && query.data.series.length === 0 && (
        <p className="mt-3 text-xs text-slate-400" data-testid="progress-empty">Complete a session with at least one answer to start tracking progress.</p>
      )}
      {query.data?.series.map(series => {
        const shown = (Object.keys(LABEL) as Dimension[]).filter(d => series.dimensions[d].points.length > 0);
        const rows = series.sessions.map((s, i) => ({
          label: `#${i + 1}`,
          ...Object.fromEntries(shown.map(d => [d, series.dimensions[d].points.find(p => p.sessionId === s.id)?.value])),
        }));
        return (
          <div key={series.evaluationSource} className="mt-4" data-testid="progress-series" data-source={series.evaluationSource}>
            <h3 className="text-sm font-semibold text-white">{SOURCE_LABEL[series.evaluationSource]} · {series.sessions.length} session{series.sessions.length === 1 ? '' : 's'}</h3>
            {series.sessions.length > 1 && (
              <div className="mt-2 h-48 w-full" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rows} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip />
                    {shown.map(d => <Line key={d} dataKey={d} name={LABEL[d]} stroke={COLOURS[d]} dot connectNulls />)}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <table className="mt-2 w-full text-left text-xs" data-testid="progress-table">
              <caption className="sr-only">Dimension scores across sessions, {SOURCE_LABEL[series.evaluationSource]}</caption>
              <thead className="text-slate-400">
                <tr><th scope="col" className="py-1 pr-3 font-medium">Dimension</th><th scope="col" className="py-1 pr-3 font-medium">First</th><th scope="col" className="py-1 pr-3 font-medium">Latest</th><th scope="col" className="py-1 font-medium">Change</th></tr>
              </thead>
              <tbody>
                {shown.map(d => {
                  const t = series.dimensions[d].trend;
                  return (
                    <tr key={d} data-dimension={d}>
                      <th scope="row" className="py-1 pr-3 font-normal">{LABEL[d]}</th>
                      <td className="py-1 pr-3">{t.first ?? '—'}</td>
                      <td className="py-1 pr-3">{t.latest ?? '—'}</td>
                      <td className="py-1">{trendText(t, query.data.minimums.sessionsForTrend)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
      {query.data && (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-[11px] text-slate-400">
          {query.data.excluded.mixedScoring > 0 && <li>{query.data.excluded.mixedScoring} session(s) scored partly by AI and partly by the built-in rubric are left out of these series.</li>}
          <li>A change is stated only with {query.data.minimums.sessionsForTrend} or more sessions and a difference of at least {query.data.minimums.changeThreshold} points between the earlier and the recent half.</li>
          {query.data.caveats.map(c => <li key={c}>{c}</li>)}
        </ul>
      )}
    </section>
  );
};
