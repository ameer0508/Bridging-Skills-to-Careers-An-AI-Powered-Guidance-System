import React from 'react';
import { Link } from 'react-router-dom';
import { Note } from '../../../design/aurora/labUi';
import { labelClass, panelClass, quietButton } from '../../../design/aurora/labStyles';

/** Shape mirrors IEvidenceBasis in backend/src/models/CareerReadiness.ts. */
export interface EvidenceBasis {
  assessed: number | null;
  selfReported: number | null;
  stated: number | null;
  inferred: number | null;
  requirementsTotal: number;
  requirementsCovered: number;
  requirementsAssessed: number;
  requiredMissing: number;
}

const KINDS: Array<{ key: 'assessed' | 'selfReported' | 'stated' | 'inferred'; label: string; detail: string; tone: string }> = [
  { key: 'assessed', label: 'Verified by skill check', detail: 'Shown in a SkillBridge skill check', tone: 'bg-emerald-500' },
  { key: 'selfReported', label: 'Portfolio, your own record', detail: 'Work you recorded with a link; not checked', tone: 'bg-sky-500' },
  { key: 'stated', label: 'Stated in your resume', detail: 'Written in the resume; not checked', tone: 'bg-aurora-violet' },
  { key: 'inferred', label: 'Inferred', detail: 'Credited from a related skill', tone: 'bg-aurora-lavender' },
];

/** What a readiness score rests on: how much of the credited evidence was checked, and how. */
export const EvidenceBasisPanel: React.FC<{ basis?: EvidenceBasis; careerTitle: string }> = ({ basis, careerTitle }) => {
  if (!basis) return null;
  const hasEvidence = basis.stated !== null;
  return (
    <section className={panelClass} aria-labelledby="evidence-basis-heading" data-testid="evidence-basis" data-assessed={basis.assessed ?? ''}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 id="evidence-basis-heading" className="font-heading text-lg font-bold text-aurora-ink">What this readiness rests on</h2>
          <p className="text-xs text-aurora-muted">
            For {careerTitle}: {basis.requirementsCovered} of {basis.requirementsTotal} requirements have evidence, {basis.requirementsAssessed} of them also verified by a skill check
            {basis.requiredMissing > 0 ? `; ${basis.requiredMissing} required skill${basis.requiredMissing === 1 ? ' is' : 's are'} missing` : ''}.
          </p>
        </div>
        <Link to="/career-lab" className={quietButton}>Verify a skill</Link>
      </div>

      {!hasEvidence ? (
        <p className="text-sm text-aurora-muted">No evidence is credited for this career yet.</p>
      ) : (
        <>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-aurora-line" role="img" aria-label={KINDS.map((k) => `${k.label} ${basis[k.key]}%`).join(', ')}>
            {KINDS.map((kind) => (basis[kind.key] ? <div key={kind.key} className={kind.tone} style={{ width: `${basis[kind.key]}%` }} /> : null))}
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {KINDS.map((kind) => (
              <div key={kind.key} className="p-3 rounded-2xl bg-aurora-canvas/60 border border-aurora-line" data-testid="evidence-share" data-kind={kind.key} data-share={basis[kind.key] ?? 0}>
                <dt className={labelClass}>{kind.label}</dt>
                <dd className="text-xl font-extrabold text-aurora-ink">{basis[kind.key]}%</dd>
                <dd className="text-[11px] text-aurora-muted">{kind.detail}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
      <Note testId="evidence-basis-note">
        The shares divide the skill evidence credited towards this career by how far it was checked. They describe the evidence and do not change the score.
        Readiness has not been calibrated against interview or hiring outcomes: SkillBridge holds no such data, so a higher score is not a measured chance of success.
      </Note>
    </section>
  );
};

export default EvidenceBasisPanel;
