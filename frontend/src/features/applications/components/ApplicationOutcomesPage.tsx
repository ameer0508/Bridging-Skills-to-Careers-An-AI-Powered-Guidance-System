import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, FlaskConical, RotateCw } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardBody, CardHeader } from '../../../design/aurora/cards';
import { messageOf } from '../../../lib/collections';
import { ApplicationOutcomes, ConversionRate, fetchApplicationOutcomes, OutcomeFilters } from '../outcomesApi';

const inputClass =
  'w-full rounded-2xl border border-aurora-line bg-white px-3 py-2 text-sm text-aurora-ink';

const formatMonth = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' });

const percent = (rate: number) => `${Math.round(rate * 100)}%`;

/** C6: how the user's own applications converted, with the counts behind every figure. */
export const ApplicationOutcomesPage: React.FC = () => {
  const [draft, setDraft] = useState<OutcomeFilters>({ from: '', to: '', includeDemoListings: false });
  const [filters, setFilters] = useState<OutcomeFilters>(draft);
  const query = useQuery({
    queryKey: ['application-outcomes', filters],
    queryFn: () => fetchApplicationOutcomes(filters),
    retry: false,
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6">
      <header className="relative flex flex-col gap-2 overflow-hidden rounded-[32px] border border-aurora-line bg-white p-5 shadow-aurora-md [background-image:var(--aurora-gradient-canvas)] sm:p-8">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-aurora-violet"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full [background:var(--aurora-gradient-action)]" />Practice & apply</p>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-aurora-ink sm:text-3xl lg:text-4xl">Application Outcomes</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-aurora-muted sm:text-base">
          How your tracked applications moved from applied to interview to offer. Only jobs you marked as applied count,
          each application counts once per stage, and every percentage shows the counts it comes from.
        </p>
      </header>

      <form
        aria-label="Filter application outcomes"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={e => {
          e.preventDefault();
          setFilters(draft);
        }}
      >
        <label className="flex flex-col gap-1 text-xs font-medium text-aurora-muted">
          Applied from
          <input type="month" className={inputClass} value={draft.from} onChange={e => setDraft({ ...draft, from: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-aurora-muted">
          Applied to
          <input type="month" className={inputClass} value={draft.to} onChange={e => setDraft({ ...draft, to: e.target.value })} />
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-aurora-ink">
          <input type="checkbox" checked={draft.includeDemoListings} onChange={e => setDraft({ ...draft, includeDemoListings: e.target.checked })} />
          Include demo listings
        </label>
        <div className="flex items-end">
          <button type="submit" className="w-full rounded-2xl [background:var(--aurora-gradient-action)] px-4 py-2 text-sm font-semibold text-aurora-ink">
            Show outcomes
          </button>
        </div>
      </form>

      <div aria-live="polite">
        {query.isPending && <p role="status" className="text-sm text-aurora-muted">Loading application outcomes…</p>}
        {query.isError && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-300 p-4 text-sm">
            <AlertTriangle size={18} aria-hidden="true" />
            <span>Application outcomes could not be loaded: {messageOf(query.error, 'the server did not respond.')}</span>
            <button type="button" onClick={() => query.refetch()} className="inline-flex items-center gap-1 font-semibold underline">
              <RotateCw size={14} aria-hidden="true" /> Try again
            </button>
          </div>
        )}
        {query.data && <OutcomesView outcomes={query.data} />}
      </div>
    </div>
  );
};

const OutcomesView: React.FC<{ outcomes: ApplicationOutcomes }> = ({ outcomes }) => {
  const { funnel, rates, scope, dataQuality } = outcomes;
  const periodLabel = `${formatMonth(outcomes.period.from)} – ${formatMonth(outcomes.period.to)}`;

  const qualityNotes = [
    [dataQuality.inferredApplicationDates, 'application date taken from the first interview, offer or rejection because "applied" was never recorded'],
    [dataQuality.offersWithoutRecordedInterview, 'offer with no interview recorded (counted in applied → offer only)'],
    [dataQuality.historiesOutOfOrder, 'history stored out of date order (read in date order)'],
    [dataQuality.repeatedTransitionsIgnored, 'repeated status change ignored (each stage counts once)'],
    [dataQuality.milestonesDatedBeforeApplication, 'interview, offer or rejection dated before the application'],
  ].filter(([count]) => (count as number) > 0) as Array<[number, string]>;

  return (
    <div className="flex flex-col gap-6">
      {scope.includesDemoListings && (
        <div role="note" data-testid="demo-included-banner" className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-amber-500 bg-amber-50 p-4 text-sm text-amber-900">
          <FlaskConical size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span><strong>Includes demo listings.</strong> Applications to built-in demo listings are counted here; they are not real vacancies.</span>
        </div>
      )}

      <p className="text-sm text-aurora-muted" data-testid="outcome-scope">
        {scope.applicationsInPeriod} application{scope.applicationsInPeriod === 1 ? '' : 's'} made {periodLabel}, followed up to today.
        {scope.savedNotApplied > 0 && ` ${scope.savedNotApplied} saved job${scope.savedNotApplied === 1 ? ' is' : 's are'} not marked as applied and not counted.`}
        {scope.demoListingApplicationsExcluded > 0 && ` ${scope.demoListingApplicationsExcluded} application${scope.demoListingApplicationsExcluded === 1 ? '' : 's'} to demo listings left out.`}
      </p>

      {funnel.applied === 0 ? (
        <section data-testid="outcomes-empty" className="rounded-2xl border border-aurora-line p-4">
          <h2 className="mb-1 text-sm font-bold text-aurora-ink">No applications in this period</h2>
          <p className="text-sm text-aurora-muted">
            Mark a saved job as applied in Job Search to start measuring outcomes. Nothing is estimated in the meantime.
          </p>
        </section>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3" data-testid="rate-cards">
            <RateCard title="Applied → interview" rate={rates.appliedToInterview} minimum={outcomes.minimumSample} unit="applications" />
            <RateCard title="Interview → offer" rate={rates.interviewToOffer} minimum={outcomes.minimumSample} unit="interviews" />
            <RateCard title="Applied → offer" rate={rates.appliedToOffer} minimum={outcomes.minimumSample} unit="applications" />
          </div>

          <Card variant="default">
            <CardHeader>
              <h2 className="text-base font-bold font-display text-aurora-ink">Stages reached</h2>
            </CardHeader>
            <CardBody>
              <div className="h-56 w-full" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart accessibilityLayer={false}
                    data={[
                      { stage: 'Applied', count: funnel.applied },
                      { stage: 'Interview', count: funnel.reachedInterview },
                      { stage: 'Offer', count: funnel.reachedOffer },
                      { stage: 'Rejected', count: funnel.rejected },
                      { stage: 'Withdrawn', count: funnel.withdrawn },
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e6eaf6" vertical={false} />
                    <XAxis dataKey="stage" stroke="#515b80" fontSize={11} tickLine={false} />
                    <YAxis stroke="#515b80" fontSize={11} allowDecimals={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Applications" fill="#5540f5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm" data-testid="funnel-table">
                  <caption className="sr-only">Applications reaching each stage</caption>
                  <thead><tr><th scope="col" className="py-1 pr-4">Stage</th><th scope="col" className="py-1">Applications</th></tr></thead>
                  <tbody>
                    <tr><td className="py-1 pr-4">Applied</td><td>{funnel.applied}</td></tr>
                    <tr><td className="py-1 pr-4">Reached interview</td><td>{funnel.reachedInterview}</td></tr>
                    <tr><td className="py-1 pr-4">Reached offer</td><td>{funnel.reachedOffer}</td></tr>
                    <tr><td className="py-1 pr-4">Rejected</td><td>{funnel.rejected}</td></tr>
                    <tr><td className="py-1 pr-4">Withdrawn</td><td>{funnel.withdrawn}</td></tr>
                    <tr><td className="py-1 pr-4">Still open</td><td>{funnel.stillOpen}</td></tr>
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          <Card variant="default">
            <CardHeader>
              <h2 className="text-base font-bold font-display text-aurora-ink">By month applied</h2>
            </CardHeader>
            <CardBody>
              <div className="h-64 w-full" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart accessibilityLayer={false} data={outcomes.monthly.map(m => ({ ...m, month: formatMonth(m.month) }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e6eaf6" vertical={false} />
                    <XAxis dataKey="month" stroke="#515b80" fontSize={11} tickLine={false} />
                    <YAxis stroke="#515b80" fontSize={11} allowDecimals={false} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="applications" name="Applications" fill="#5540f5" />
                    <Bar dataKey="reachedInterview" name="Reached interview" fill="#0ea5e9" />
                    <Bar dataKey="reachedOffer" name="Reached offer" fill="#16a34a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-medium text-aurora-muted">View as table</summary>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-left text-sm" data-testid="monthly-table">
                    <caption className="sr-only">Applications by month applied and the stages they reached</caption>
                    <thead>
                      <tr>
                        <th scope="col" className="py-1 pr-4">Month applied</th>
                        <th scope="col" className="py-1 pr-4">Applications</th>
                        <th scope="col" className="py-1 pr-4">Reached interview</th>
                        <th scope="col" className="py-1">Reached offer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outcomes.monthly.map(m => (
                        <tr key={m.month}>
                          <td className="py-1 pr-4">{formatMonth(m.month)}</td>
                          <td className="py-1 pr-4">{m.applications}</td>
                          <td className="py-1 pr-4">{m.reachedInterview}</td>
                          <td className="py-1">{m.reachedOffer}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </CardBody>
          </Card>
        </>
      )}

      {qualityNotes.length > 0 && (
        <section aria-labelledby="quality-heading" data-testid="data-quality">
          <h2 id="quality-heading" className="mb-2 text-sm font-bold text-aurora-ink">About your records</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-aurora-muted">
            {qualityNotes.map(([count, text]) => <li key={text}>{count} × {text}</li>)}
          </ul>
        </section>
      )}

      <section aria-labelledby="outcome-caveats">
        <h2 id="outcome-caveats" className="mb-2 text-sm font-bold text-aurora-ink">How to read this</h2>
        <ul className="list-disc space-y-1 pl-5 text-xs text-aurora-muted">
          {outcomes.caveats.map(c => <li key={c}>{c}</li>)}
        </ul>
      </section>
    </div>
  );
};

const RateCard: React.FC<{ title: string; rate: ConversionRate; minimum: number; unit: string }> = ({ title, rate, minimum, unit }) => (
  <div className="rounded-2xl border border-aurora-line p-4" data-testid="rate-card">
    <h3 className="text-xs font-semibold text-aurora-muted">{title}</h3>
    {rate.status === 'no_observations' ? (
      <>
        <p className="mt-1 text-lg font-bold text-aurora-ink">No observations</p>
        <p className="text-xs text-aurora-muted">0 {unit} to measure from.</p>
      </>
    ) : (
      <>
        <p className="mt-1 text-lg font-bold text-aurora-ink">
          {rate.numerator} of {rate.denominator}
          <span className="ml-2 text-sm font-medium text-aurora-muted">({percent(rate.rate as number)})</span>
        </p>
        {rate.status === 'insufficient_sample' && (
          <p className="text-xs text-amber-700">Too few {unit} to compare (fewer than {minimum}).</p>
        )}
      </>
    )}
  </div>
);

export default ApplicationOutcomesPage;
