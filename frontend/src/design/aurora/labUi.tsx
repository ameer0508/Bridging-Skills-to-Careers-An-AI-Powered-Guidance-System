import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';

/** Aurora Elite versions of the Career Lab presentational pieces (features/careerLab/components/labUi.tsx). */

export const Note: React.FC<{ children: React.ReactNode; testId?: string }> = ({ children, testId }) => (
  <p className="flex items-start gap-2 text-xs leading-relaxed text-aurora-muted" data-testid={testId}>
    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-aurora-violet" aria-hidden="true" />
    <span>{children}</span>
  </p>
);

export const ErrorNote: React.FC<{ message: string | null }> = ({ message }) =>
  message ? (
    <div role="alert" className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  ) : null;

export const Loading: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-2 text-sm text-aurora-muted" role="status">
    <Loader2 className="h-4 w-4 animate-spin text-aurora-violet motion-reduce:animate-none" aria-hidden="true" />
    <span>{label}</span>
  </div>
);

export const EmptyState: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-2 rounded-3xl border border-dashed border-aurora-line bg-aurora-canvas/60 p-6 text-center">
    <p className="text-sm font-bold text-aurora-ink">{title}</p>
    <p className="mx-auto max-w-md text-sm text-aurora-muted">{children}</p>
  </div>
);

/** A score change such as "+12" or "-3", coloured by direction; "no change" for zero. */
export const Delta: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = '' }) => (
  <span className={`font-bold ${value > 0 ? 'text-emerald-700' : value < 0 ? 'text-rose-700' : 'text-aurora-muted'}`}>
    {value > 0 ? `+${value}${suffix}` : value < 0 ? `${value}${suffix}` : 'no change'}
  </span>
);

export const SkillChips: React.FC<{ skills: string[]; tone?: 'neutral' | 'warn' | 'good'; emptyText?: string }> = ({ skills, tone = 'neutral', emptyText = 'None' }) => {
  const toneClass =
    tone === 'warn' ? 'border-amber-200 bg-amber-50 text-amber-800' : tone === 'good' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-aurora-line bg-white text-aurora-ink';
  if (skills.length === 0) return <span className="text-sm text-aurora-muted">{emptyText}</span>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {skills.map(skill => (
        <li key={skill} className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${toneClass}`}>
          {skill}
        </li>
      ))}
    </ul>
  );
};

/**
 * A score that moves from one value to another: two bars, the "after" one sliding from the
 * "before" width, with the numbers beside them. Used for what-if and counterfactual results.
 */
export const BeforeAfter: React.FC<{ before: number; after: number; label: string }> = ({ before, after, label }) => {
  const reduce = useReducedMotion();
  const clamp = (n: number) => `${Math.max(0, Math.min(100, n))}%`;
  return (
    <div className="space-y-1.5" aria-label={`${label}: from ${before} to ${after}`} role="img">
      <div className="flex items-center gap-3">
        <span className="w-12 shrink-0 text-xs text-aurora-muted">Now</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-aurora-line">
          <div className="h-full rounded-full bg-aurora-lavender/70" style={{ width: clamp(before) }} />
        </div>
        <span className="w-10 shrink-0 text-right text-xs font-semibold text-aurora-muted">{before}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-12 shrink-0 text-xs font-semibold text-aurora-ink">After</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-aurora-line">
          <motion.div
            className={`h-full rounded-full ${after >= before ? '[background:var(--aurora-gradient-action)]' : 'bg-rose-500'}`}
            initial={reduce ? false : { width: clamp(before) }}
            animate={{ width: clamp(after) }}
            transition={reduce ? { duration: 0 } : { duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <span className="w-10 shrink-0 text-right text-xs font-bold text-aurora-ink">{after}</span>
      </div>
    </div>
  );
};
