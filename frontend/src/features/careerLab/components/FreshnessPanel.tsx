import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { careerLabApi, type FreshnessResult, type FreshnessStatus, type SkillFreshness } from '../careerLabApi';
import { EmptyState, ErrorNote, Loading, Note } from '../../../design/aurora/labUi';
import { errorText, fieldClass, formatDate, panelClass, primaryButton, quietButton } from '../../../design/aurora/labStyles';

const STATUS_TEXT: Record<FreshnessStatus, string> = {
  current: 'Current',
  aging: 'Ageing',
  stale: 'Stale',
  undated: 'No date on record',
};
const STATUS_TONE: Record<FreshnessStatus, string> = {
  current: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  aging: 'bg-amber-50 text-amber-700 border-amber-200',
  stale: 'bg-rose-50 text-rose-700 border-rose-200',
  undated: 'bg-aurora-canvas text-aurora-muted border-aurora-line',
};
const VERIFICATION_TEXT: Record<string, string> = {
  stated: 'Stated in your resume',
  self_attested: 'Your own record (not verified)',
  assessed: 'Verified by a SkillBridge skill check (not a certification)',
};

/** When each skill was last shown to be in use, with a way to confirm recent use. */
export const FreshnessPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const freshness = useQuery<FreshnessResult>({ queryKey: ['career-lab', 'freshness'], queryFn: careerLabApi.freshness });
  const revalidate = useMutation<SkillFreshness, unknown, { id: string; note: string }>({
    mutationFn: ({ id, note: text }) => careerLabApi.revalidate(id, text),
    onSuccess: () => {
      setConfirming(null);
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['career-lab', 'freshness'] });
    },
  });

  if (freshness.isLoading) {
    return <section className={panelClass}><Loading label="Loading your skills..." /></section>;
  }
  const data = freshness.data;

  return (
    <section className={panelClass} aria-labelledby="freshness-heading">
      <div className="space-y-1">
        <h2 id="freshness-heading" className="font-heading text-lg font-bold text-aurora-ink">Skill freshness</h2>
        <p className="text-sm text-aurora-muted">When each skill was last shown to be in use, based only on dated evidence.</p>
      </div>

      {!data || data.skills.length === 0 ? (
        <EmptyState title="No skills yet">Upload a resume to see when each of your skills was last used.</EmptyState>
      ) : (
        <>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="freshness-summary">
            {(['current', 'aging', 'stale', 'undated'] as FreshnessStatus[]).map((status) => (
              <div key={status} className="p-3 rounded-2xl bg-aurora-canvas/60 border border-aurora-line">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-aurora-muted">{STATUS_TEXT[status]}</dt>
                <dd className="text-xl font-extrabold text-aurora-ink">{data.summary[status]}</dd>
              </div>
            ))}
          </dl>

          <ErrorNote message={revalidate.isError ? errorText(revalidate.error, 'Your confirmation could not be saved.') : null} />

          <ul className="space-y-2">
            {data.skills.map((skill) => (
              <li key={skill.userSkillId} className="p-3 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-2" data-testid="freshness-skill" data-skill={skill.name} data-status={skill.status}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-aurora-ink">{skill.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_TONE[skill.status]}`}>{STATUS_TEXT[skill.status]}</span>
                  </div>
                  {confirming !== skill.userSkillId && (
                    <button type="button" className={quietButton} onClick={() => { setConfirming(skill.userSkillId); setNote(''); }}>
                      I have used this recently
                    </button>
                  )}
                </div>
                <p className="text-sm text-aurora-muted">
                  {skill.lastEvidencedAt
                    ? <>Last shown {formatDate(skill.lastEvidencedAt)}{skill.monthsSinceLastUse ? ` (${skill.monthsSinceLastUse} months ago)` : ''}. {skill.basis}.</>
                    : 'Your resume gives no date for when this skill was last used.'}
                  {skill.verification && <span className="text-aurora-muted"> {VERIFICATION_TEXT[skill.verification]}.</span>}
                </p>
                {confirming === skill.userSkillId && (
                  <form
                    className="flex flex-wrap items-end gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      revalidate.mutate({ id: skill.userSkillId, note });
                    }}
                  >
                    <div className="flex flex-col gap-1 grow max-w-md">
                      <label htmlFor={`confirm-${skill.userSkillId}`} className="text-[11px] text-aurora-muted">Where did you use {skill.name}? (optional)</label>
                      <input id={`confirm-${skill.userSkillId}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className={fieldClass} />
                    </div>
                    <button type="submit" className={primaryButton} disabled={revalidate.isPending}>Confirm</button>
                    <button type="button" className={quietButton} onClick={() => setConfirming(null)}>Cancel</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          <Note>
            {data.note} Current means used within {data.policy.currentWithinMonths} months; stale means more than {data.policy.agingWithinMonths} months ago.
            These limits are a rule of thumb chosen for this tool, not a measured rate of forgetting. Your own confirmation is recorded as unverified and adds no points to your scores.
          </Note>
        </>
      )}
    </section>
  );
};

export default FreshnessPanel;
