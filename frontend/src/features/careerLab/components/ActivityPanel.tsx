import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { careerLabApi, TRIGGER_LABEL, type RecalculationRun } from '../careerLabApi';
import { EmptyState, Loading, Note } from '../../../design/aurora/labUi';
import { formatDateTime, panelClass } from '../../../design/aurora/labStyles';

const MODULE_LABEL: Record<string, string> = {
  matches: 'career matches',
  readiness: 'readiness and gaps',
  recommendations: 'recommendations',
};

const list = (modules: string[]): string => modules.map((m) => MODULE_LABEL[m] || m).join(', ');

const change = (before: number | null, after: number | null, suffix = ''): string => {
  if (before === after) return after === null ? 'none' : `${after}${suffix} (unchanged)`;
  return `${before === null ? 'none' : `${before}${suffix}`} → ${after === null ? 'none' : `${after}${suffix}`}`;
};

/** What each event changed: the record of when the user's figures were recalculated and why. */
export const ActivityPanel: React.FC = () => {
  const history = useQuery<RecalculationRun[]>({ queryKey: ['career-lab', 'history'], queryFn: careerLabApi.history });

  return (
    <section className={panelClass} aria-labelledby="activity-heading">
      <div className="space-y-1">
        <h2 id="activity-heading" className="font-heading text-lg font-bold text-aurora-ink">What changed, and why</h2>
        <p className="text-sm text-aurora-muted">Each time something affects your career figures, SkillBridge records what it recalculated and the result.</p>
      </div>

      {history.isLoading && <Loading label="Loading activity..." />}

      {history.data && history.data.length === 0 && (
        <EmptyState title="Nothing recalculated yet">Upload a resume to start. Each later change that affects your figures will appear here.</EmptyState>
      )}

      {history.data && history.data.length > 0 && (
        <ol className="space-y-2">
          {history.data.map((run) => (
            <li key={run.id} className="p-3 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-1.5" data-testid="recalculation-run" data-trigger={run.trigger} data-status={run.status}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-aurora-ink">{TRIGGER_LABEL[run.trigger] || run.trigger}</span>
                <span className="text-[11px] text-aurora-muted">{formatDateTime(run.at)}</span>
              </div>
              <p className="text-sm text-aurora-muted">
                {run.status === 'completed' && run.modulesRecomputed.length > 0 && <>Recalculated {list(run.modulesRecomputed)}.</>}
                {run.status === 'completed' && run.modulesRecomputed.length === 0 && <>Recorded. Nothing needed recalculating.</>}
                {run.status === 'skipped_duplicate' && <>Nothing your figures depend on had changed, so nothing was recalculated.</>}
                {run.status === 'failed' && <span className="text-rose-700">The recalculation failed; your previous figures were kept.</span>}
                {run.status === 'completed' && run.modulesSkipped.length > 0 && run.modulesRecomputed.length > 0 && (
                  <span className="text-aurora-muted"> Left as they were: {list(run.modulesSkipped)}.</span>
                )}
              </p>
              {run.status === 'completed' && (
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-[11px] text-aurora-muted">
                  <div><dt className="text-aurora-muted">Skills</dt><dd>{change(run.before.skillCount, run.after.skillCount)}</dd></div>
                  <div><dt className="text-aurora-muted">Top match</dt><dd>{run.after.topCareerTitle || 'none'} {change(run.before.topMatchScore, run.after.topMatchScore, '%')}</dd></div>
                  <div><dt className="text-aurora-muted">Readiness</dt><dd>{change(run.before.readinessScore, run.after.readinessScore, '%')}</dd></div>
                  <div><dt className="text-aurora-muted">Open recommendations</dt><dd>{change(run.before.activeRecommendations, run.after.activeRecommendations)}</dd></div>
                </dl>
              )}
            </li>
          ))}
        </ol>
      )}
      <Note>The last 20 entries are shown. Scoring rules and career data carry a version, recorded with each entry, so results can be compared like for like.</Note>
    </section>
  );
};

export default ActivityPanel;
