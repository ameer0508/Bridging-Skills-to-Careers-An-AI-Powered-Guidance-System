import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { messageOf } from '../../../lib/collections';
import { useAuthStore } from '../../../store/authStore';
import { fetchEvents, fetchProviders, fetchSummary } from '../aiObservabilityApi';

const card = 'rounded-2xl border border-aurora-line p-4';
const th = 'py-1 pr-3 font-semibold';
const td = 'py-1 pr-3';
const WINDOWS = [1, 24, 24 * 7, 24 * 14];

const counts = (m: Record<string, number>) => {
  const entries = Object.entries(m);
  return entries.length ? entries.map(([k, v]) => `${k} ×${v}`).join(', ') : '—';
};
const ms = (v: number | null) => (v === null ? '—' : `${Math.round(v)} ms`);

/** X11 (administrators): AI provider selection, fallbacks, failure categories, latency and policy status. */
export const AiObservabilityPage: React.FC = () => {
  const [windowHours, setWindowHours] = useState(24);
  // Only administrators may read this data, and the server refuses everyone else. A signed-in
  // non-administrator who opens the address directly is told so without sending requests that
  // can only fail: a refused request would also raise the page-wide "could not be loaded, try
  // again" notice, and trying again cannot help. The role shown here arrives with sign-in.
  const isAdmin = useAuthStore(state => state.user?.role === 'admin');
  const summary = useQuery({ queryKey: ['ai-obs-summary', windowHours], queryFn: () => fetchSummary(windowHours), retry: false, enabled: isAdmin });
  const events = useQuery({ queryKey: ['ai-obs-events', windowHours], queryFn: () => fetchEvents(windowHours), retry: false, enabled: isAdmin });
  const providers = useQuery({ queryKey: ['ai-obs-providers'], queryFn: fetchProviders, retry: false, enabled: isAdmin });
  const error = summary.error ?? events.error ?? providers.error;

  if (!isAdmin) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        <h1 className="text-2xl font-bold font-display text-aurora-ink">AI observability</h1>
        <div role="alert" data-testid="observability-error" className="flex items-start gap-2 rounded-2xl border border-rose-300 p-3 text-sm">
          <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>Administrator access is required. This page is for SkillBridge administrators; your account does not have that role.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold font-display text-aurora-ink">AI observability</h1>
        <p className="flex items-start gap-2 text-sm text-aurora-muted">
          <ShieldCheck size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          Decisions, failure categories and timings from the AI gateway. Prompts, resume text, error messages and keys are never recorded.
          {summary.data && ` Events are kept for ${summary.data.retentionDays} days${summary.data.persisted ? ' in private daily files' : ' in memory only'}.`}
        </p>
        {summary.data?.scope && (
          <p
            data-testid="observability-scope"
            data-source={summary.data.scope.source}
            className={`rounded-2xl border p-3 text-sm ${summary.data.scope.source === 'memory' ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-aurora-line text-aurora-muted'}`}
          >
            <strong>What these figures cover:</strong> {summary.data.scope.coverage}
            {summary.data.scope.source === 'memory' && ` This process started ${summary.data.scope.processStartedAt.slice(0, 16).replace('T', ' ')} UTC. Set AI_AUDIT_DIR for a record that survives restarts and covers every process.`}
            {summary.data.scope.writeFailures > 0 && ` ${summary.data.scope.writeFailures} event(s) could not be written to the files and are missing from these figures.`}
          </p>
        )}
        <label className="flex items-center gap-2 text-sm">
          Time window
          <select aria-label="Time window" value={windowHours} onChange={e => setWindowHours(Number(e.target.value))} className="rounded border border-aurora-line bg-transparent px-2 py-1">
            {WINDOWS.map(w => <option key={w} value={w}>{w < 24 ? `${w} hour` : `${w / 24} day${w > 24 ? 's' : ''}`}</option>)}
          </select>
        </label>
      </header>

      {(summary.isPending || providers.isPending) && <p role="status" className="text-sm text-aurora-muted">Loading…</p>}
      {error && (
        <div role="alert" data-testid="observability-error" className="flex items-center gap-2 rounded-2xl border border-rose-300 p-3 text-sm">
          <AlertTriangle size={16} aria-hidden="true" /> {messageOf(error, 'The AI observability data could not be loaded.')}
        </div>
      )}

      {providers.data && (
        <section className={card} aria-labelledby="policy-heading" data-testid="provider-policy">
          <h2 id="policy-heading" className="mb-2 text-base font-bold">Provider policy (zero-cost)</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead><tr><th scope="col" className={th}>Provider</th><th scope="col" className={th}>Status</th><th scope="col" className={th}>Personal data</th><th scope="col" className={th}>Other data</th><th scope="col" className={th}>Free quota left</th></tr></thead>
              <tbody>
                {providers.data.providers.map(p => (
                  <tr key={p.provider} data-provider={p.provider}>
                    <th scope="row" className={`${td} font-normal`}>{p.provider}</th>
                    <td className={td}>{p.status}</td>
                    <td className={td}>{p.personalData.allowed ? 'allowed' : `refused: ${p.personalData.reason}`}</td>
                    <td className={td}>{p.nonPersonalData.allowed ? 'allowed' : `refused: ${p.nonPersonalData.reason}`}</td>
                    <td className={td}>{p.quotaRemaining ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {summary.data && (
        <section className={card} aria-labelledby="providers-heading" data-testid="provider-stats">
          <h2 id="providers-heading" className="mb-2 text-base font-bold">Providers in this window ({summary.data.events} events)</h2>
          {Object.keys(summary.data.providers).length === 0 ? (
            <p className="text-sm text-aurora-muted">No provider calls recorded in this window.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead><tr><th scope="col" className={th}>Provider</th><th scope="col" className={th}>Calls</th><th scope="col" className={th}>Failure rate</th><th scope="col" className={th}>Latency p50 / p95</th><th scope="col" className={th}>Failures</th><th scope="col" className={th}>Refusals and limits</th></tr></thead>
                <tbody>
                  {Object.entries(summary.data.providers).map(([name, p]) => (
                    <tr key={name}>
                      <th scope="row" className={`${td} font-normal`}>{name}</th>
                      <td className={td}>{p.attempts}</td>
                      <td className={td}>{p.failureRate === null ? '—' : `${Math.round(p.failureRate * 100)}%`}</td>
                      <td className={td}>{ms(p.latencyMs.p50)} / {ms(p.latencyMs.p95)} <span className="text-xs text-aurora-muted">(n={p.latencyMs.samples})</span></td>
                      <td className={td}>{counts(p.failures)}</td>
                      <td className={td}>{[counts(p.policyRefusals), p.rateLimited ? `rate limited ×${p.rateLimited}` : '', p.quotaPauses ? `quota paused ×${p.quotaPauses}` : ''].filter(s => s && s !== '—').join('; ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {Object.keys(summary.data.services).length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <caption className="mb-1 text-left font-semibold">By AI feature</caption>
                <thead><tr><th scope="col" className={th}>Feature</th><th scope="col" className={th}>Requests</th><th scope="col" className={th}>Answered</th><th scope="col" className={th}>After fallback</th><th scope="col" className={th}>Cache hits</th><th scope="col" className={th}>All failed</th><th scope="col" className={th}>No provider</th></tr></thead>
                <tbody>
                  {Object.entries(summary.data.services).map(([name, s]) => (
                    <tr key={name}>
                      <th scope="row" className={`${td} font-normal`}>{name}</th>
                      <td className={td}>{s.requests}</td><td className={td}>{s.successes}</td><td className={td}>{s.fallbacks}</td>
                      <td className={td}>{s.cacheHits}</td><td className={td}>{s.allFailed}</td><td className={td}>{s.noProvider}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-xs text-aurora-muted">Latency percentiles are shown only from recorded samples; with few samples they are not representative.</p>
        </section>
      )}

      {events.data && (
        <section className={card} aria-labelledby="events-heading" data-testid="audit-events">
          <h2 id="events-heading" className="mb-2 text-base font-bold">Recent events</h2>
          {events.data.events.length === 0 ? (
            <p className="text-sm text-aurora-muted">No events in this window.</p>
          ) : (
            <div className="max-h-96 overflow-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead><tr><th scope="col" className={th}>Time (UTC)</th><th scope="col" className={th}>Event</th><th scope="col" className={th}>Feature</th><th scope="col" className={th}>Provider</th><th scope="col" className={th}>Reason</th><th scope="col" className={th}>Latency</th></tr></thead>
                <tbody>
                  {events.data.events.map((e, i) => (
                    <tr key={`${e.at}-${i}`}>
                      <td className={td}>{e.at.slice(0, 19).replace('T', ' ')}</td>
                      <td className={td}>{e.kind}</td>
                      <td className={td}>{e.service}</td>
                      <td className={td}>{e.provider ?? '—'}{e.attempt && e.attempt > 1 ? ` (attempt ${e.attempt})` : ''}</td>
                      <td className={td}>{e.reason ?? (Object.keys(e.skipped).length ? `skipped: ${Object.entries(e.skipped).map(([k, v]) => `${k} (${v})`).join(', ')}` : '—')}</td>
                      <td className={td}>{ms(e.latency_ms)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default AiObservabilityPage;
