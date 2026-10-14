import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, FlaskConical, Layers, Minus, Plus, Sparkles } from 'lucide-react';
import { AuroraDialog, Pill, type PillTone } from '../../../design/aurora/kit';
import { Ring } from '../../../design/aurora/ui';
import { auroraEase } from '../../../design/aurora/motion';
import { quietButton } from '../../../design/aurora/labStyles';
import type { CareerMatchData } from './types';

type Row = NonNullable<CareerMatchData['breakdown']>[number];

const STATUS_TEXT: Record<Row['status'], string> = {
  applied: 'Used in a role or project',
  listed: 'Listed only',
  inferred: 'Inferred from a related skill',
  missing: 'Not found',
};
const STATUS_TONE: Record<Row['status'], PillTone> = { applied: 'mint', listed: 'sky', inferred: 'violet', missing: 'rose' };
const IMPORTANCE_TONE: Record<Row['importance'], PillTone> = { required: 'amber', preferred: 'neutral', supporting: 'neutral' };

/** The O*NET caveat, shown wherever an O*NET-informed career appears. */
export const SourceNote: React.FC<{ career: CareerMatchData['careerId'] }> = ({ career }) =>
  career.source?.kind === 'onet' ? (
    <p className="text-[11px] leading-relaxed text-aurora-muted" data-testid="career-source-note">
      Requirements informed by O*NET-SOC {career.source.code} (United States occupational data, CC BY 4.0); a skills baseline, not a measure of hiring demand in India.
    </p>
  ) : null;

/**
 * Every requirement of a career with the evidence found for it and the points it earned.
 * The bars grow to points earned over points possible; the stored figures are shown beside them.
 */
export const ScoreBreakdown: React.FC<{ rows: Row[]; testId?: string }> = ({ rows, testId }) => {
  const reduce = useReducedMotion();
  const earned = rows.reduce((n, r) => n + r.pointsEarned, 0);
  const possible = rows.reduce((n, r) => n + r.pointsPossible, 0);
  return (
    <div data-testid={testId}>
      <div className="hidden grid-cols-[minmax(0,1.3fr)_auto_minmax(0,1.4fr)_minmax(0,1fr)] items-center gap-3 border-b border-aurora-line px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-aurora-muted md:grid">
        <span>Skill</span>
        <span>Importance</span>
        <span>Evidence on your resume</span>
        <span className="text-right">Points</span>
      </div>
      <ul className="divide-y divide-aurora-line">
        {rows.map((row, i) => {
          const share = row.pointsPossible > 0 ? (row.pointsEarned / row.pointsPossible) * 100 : 0;
          return (
            <li key={`${row.skillName}-${i}`} className={`grid gap-2 px-3 py-3 md:grid-cols-[minmax(0,1.3fr)_auto_minmax(0,1.4fr)_minmax(0,1fr)] md:items-center md:gap-3 ${row.status === 'missing' ? 'bg-rose-50/40' : ''}`}>
              <span className="flex items-center gap-2 text-sm font-semibold text-aurora-ink">
                {row.status === 'missing' ? <Minus className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" /> : <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />}
                {row.skillName}
              </span>
              <span>
                <Pill tone={IMPORTANCE_TONE[row.importance]} className="capitalize">
                  {row.importance}
                </Pill>
              </span>
              <span className="text-sm text-aurora-muted">
                <Pill tone={STATUS_TONE[row.status]}>{STATUS_TEXT[row.status]}</Pill>
                {row.status === 'inferred' && row.matchedVia ? <span className="ml-1.5 text-xs">via {row.matchedVia}</span> : null}
              </span>
              <span className="flex items-center gap-3 md:justify-end">
                <span aria-hidden="true" className="h-1.5 flex-1 overflow-hidden rounded-full bg-aurora-line md:max-w-[96px]">
                  <motion.span
                    className="block h-full rounded-full [background:var(--aurora-gradient-action)]"
                    initial={reduce ? false : { width: 0 }}
                    whileInView={{ width: `${share}%` }}
                    viewport={{ once: true }}
                    transition={reduce ? { duration: 0 } : { duration: 0.8, ease: auroraEase, delay: Math.min(i, 12) * 0.03 }}
                  />
                </span>
                <span className="w-[5.5rem] shrink-0 whitespace-nowrap text-right font-mono text-xs font-semibold text-aurora-ink">
                  {row.pointsEarned} / {row.pointsPossible}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 px-3 text-xs text-aurora-muted">
        {earned} of {possible} points. Required skills carry the most weight; a skill used in a role or project earns more than one that is only listed.
      </p>
    </div>
  );
};

/** One career in the explorer. */
export const CareerCard: React.FC<{
  match: CareerMatchData;
  rank: number;
  compared: boolean;
  compareDisabled: boolean;
  onToggleCompare: () => void;
  onOpen: () => void;
}> = ({ match, rank, compared, compareDisabled, onToggleCompare, onOpen }) => {
  const reduce = useReducedMotion();
  const { careerId: career } = match;
  return (
    <motion.article
      layout={!reduce}
      whileHover={reduce ? undefined : { y: -3 }}
      transition={{ duration: 0.25, ease: auroraEase }}
      className={`group relative flex flex-col gap-4 rounded-[28px] border bg-white p-5 shadow-aurora-sm transition-shadow hover:shadow-aurora-md ${compared ? 'border-aurora-violet/40 ring-2 ring-aurora-violet/20' : 'border-aurora-line'}`}
      data-testid="career-card"
      data-career={career.title}
      aria-labelledby={`career-${match.id}-title`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone="violet">{career.category}</Pill>
            {rank === 1 && <Pill tone="mint">Your closest match</Pill>}
          </div>
          <h3 id={`career-${match.id}-title`} className="font-heading text-lg font-bold leading-snug text-aurora-ink">
            {career.title}
          </h3>
        </div>
        <span className="relative inline-flex shrink-0 items-center justify-center">
          <Ring value={match.matchScore} size={64} stroke={7} label={`${career.title} match`} />
          <span aria-hidden="true" className="absolute font-heading text-sm font-extrabold text-aurora-ink">
            {match.matchScore}%
          </span>
        </span>
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-aurora-muted">{career.description}</p>
      <SourceNote career={career} />
      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-emerald-50 px-2 py-2">
          <dt className="text-[11px] text-emerald-800">Evidenced</dt>
          <dd className="font-heading text-base font-extrabold text-emerald-900">{match.matchingSkills.length}</dd>
        </div>
        <div className="rounded-2xl bg-rose-50 px-2 py-2">
          <dt className="text-[11px] text-rose-800">Missing</dt>
          <dd className="font-heading text-base font-extrabold text-rose-900">{match.missingSkills.length}</dd>
        </div>
        <div className="rounded-2xl bg-aurora-canvas px-2 py-2" title="Share of the matched skills shown in a role or project">
          <dt className="text-[11px] text-aurora-muted">In practice</dt>
          <dd className="font-heading text-base font-extrabold text-aurora-ink">{match.confidence}%</dd>
        </div>
      </dl>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-aurora-line pt-4">
        <label className={`inline-flex items-center gap-2 text-sm font-medium ${compareDisabled && !compared ? 'text-aurora-muted/70' : 'text-aurora-ink'}`}>
          <input
            type="checkbox"
            checked={compared}
            disabled={compareDisabled && !compared}
            onChange={onToggleCompare}
            className="h-4 w-4 rounded border-aurora-line accent-[#5540f5]"
            aria-label={`Compare ${career.title}`}
          />
          Compare
        </label>
        <button type="button" onClick={onOpen} className={quietButton} aria-label={`Explain ${career.title}`}>
          Explain this match <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </motion.article>
  );
};

/** A career in full: the stored summary, requirement by requirement, strengths, gaps and next places to go. */
export const CareerDetailDialog: React.FC<{ match: CareerMatchData | null; onClose: () => void }> = ({ match, onClose }) => (
  <AuroraDialog
    open={!!match}
    onClose={onClose}
    size="xl"
    title={match ? `${match.careerId.title}: ${match.matchScore}% match` : ''}
    footer={
      <>
        <Link to="/career-lab" className={quietButton} onClick={onClose}>
          <FlaskConical className="h-4 w-4" aria-hidden="true" /> Try a what-if in the Career Lab
        </Link>
        <Link to="/readiness" className={quietButton} onClick={onClose}>
          See readiness
        </Link>
        <Link to="/roadmap" className={quietButton} onClick={onClose}>
          <Layers className="h-4 w-4" aria-hidden="true" /> Open the roadmap
        </Link>
      </>
    }
  >
    {match && (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="relative inline-flex shrink-0 items-center justify-center self-start">
            <Ring value={match.matchScore} size={88} stroke={9} label={`${match.careerId.title} match`} />
            <span aria-hidden="true" className="absolute font-heading text-lg font-extrabold text-aurora-ink">
              {match.matchScore}%
            </span>
          </span>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <Pill tone="violet">{match.careerId.category}</Pill>
              <Pill>{match.confidence}% of matched skills shown in practice</Pill>
            </div>
            <p className="text-sm leading-relaxed text-aurora-ink">{match.summary || match.careerId.description}</p>
            <SourceNote career={match.careerId} />
          </div>
        </div>
        {match.breakdown && match.breakdown.length > 0 && (
          <section aria-labelledby="detail-breakdown">
            <h3 id="detail-breakdown" className="mb-2 font-heading text-base font-bold text-aurora-ink">
              Requirement by requirement
            </h3>
            <div className="rounded-2xl border border-aurora-line">
              <ScoreBreakdown rows={match.breakdown} />
            </div>
          </section>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4" aria-labelledby="detail-strengths">
            <h3 id="detail-strengths" className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-900">
              <Plus className="h-4 w-4" aria-hidden="true" /> Why you match
            </h3>
            <ul className="space-y-1.5 text-sm text-emerald-950">
              {match.strengths.length ? match.strengths.map((s, i) => <li key={i}>{s.replace('✓ ', '')}</li>) : <li>No strength recorded yet.</li>}
            </ul>
          </section>
          <section className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4" aria-labelledby="detail-gaps">
            <h3 id="detail-gaps" className="mb-2 flex items-center gap-2 text-sm font-bold text-rose-900">
              <Minus className="h-4 w-4" aria-hidden="true" /> What lowers the score
            </h3>
            <ul className="space-y-1.5 text-sm text-rose-950">
              {match.weaknesses.length ? match.weaknesses.map((w, i) => <li key={i}>{w.replace('! ', '').replace('- ', '')}</li>) : <li>No gap recorded for this career.</li>}
            </ul>
          </section>
        </div>
        {match.relatedCareers && match.relatedCareers.length > 0 && (
          <p className="flex flex-wrap items-center gap-2 text-sm text-aurora-muted">
            <Sparkles className="h-4 w-4 text-aurora-violet" aria-hidden="true" /> Similar careers:
            {match.relatedCareers.map(rc => (
              <Pill key={rc.career._id} title={`Similarity ${rc.score}%`}>
                {rc.career.title}
              </Pill>
            ))}
          </p>
        )}
      </div>
    )}
  </AuroraDialog>
);

/** Two or three careers side by side. */
export const CompareDialog: React.FC<{ open: boolean; onClose: () => void; matches: CareerMatchData[] }> = ({ open, onClose, matches }) => {
  const reduce = useReducedMotion();
  return (
    <AuroraDialog open={open} onClose={onClose} size="xl" title={matches.length ? `Comparing ${matches.length} careers` : 'Compare careers'}>
      {matches.length < 2 ? (
        <p className="text-sm text-aurora-muted">Tick “Compare” on two or three careers to see them side by side.</p>
      ) : (
        <div className={`grid gap-4 ${matches.length === 3 ? 'lg:grid-cols-3' : 'md:grid-cols-2'}`}>
          {matches.map((m, i) => (
            <motion.div
              key={m.id}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: auroraEase, delay: reduce ? 0 : i * 0.08 }}
              className="flex flex-col gap-4 rounded-3xl border border-aurora-line bg-aurora-canvas/50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Pill tone="violet">{m.careerId.category}</Pill>
                  <h3 className="mt-1.5 font-heading text-base font-bold text-aurora-ink">{m.careerId.title}</h3>
                </div>
                <span className="relative inline-flex shrink-0 items-center justify-center">
                  <Ring value={m.matchScore} size={60} stroke={6} label={`${m.careerId.title} match`} />
                  <span aria-hidden="true" className="absolute text-xs font-extrabold text-aurora-ink">
                    {m.matchScore}%
                  </span>
                </span>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-emerald-800">Evidenced ({m.matchingSkills.length})</p>
                <ul className="flex flex-wrap gap-1">
                  {m.matchingSkills.map(s => (
                    <li key={s}>
                      <Pill tone="mint">{s}</Pill>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-rose-800">Missing ({m.missingSkills.length})</p>
                <ul className="flex flex-wrap gap-1">
                  {m.missingSkills.length ? (
                    m.missingSkills.map(s => (
                      <li key={s}>
                        <Pill tone="rose">{s}</Pill>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-aurora-muted">None</li>
                  )}
                </ul>
              </div>
              <p className="mt-auto text-xs text-aurora-muted">{m.confidence}% of matched skills shown in a role or project.</p>
            </motion.div>
          ))}
        </div>
      )}
      <p className="mt-4 text-xs text-aurora-muted">Scores come from your resume evidence only; they do not predict hiring.</p>
    </AuroraDialog>
  );
};
