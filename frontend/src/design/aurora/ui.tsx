import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { auroraEase } from './motion';

/** Shared pieces of the Command Center: cards, headers, rings and bars, all on the Aurora tokens. */

export const cardClass = 'rounded-[28px] border border-aurora-line bg-white p-5 shadow-aurora-md sm:p-6';

export const CardHeader: React.FC<{ id: string; icon: React.ReactNode; title: string; lead?: React.ReactNode; action?: { to: string; label: string } }> = ({
  id,
  icon,
  title,
  lead,
  action,
}) => (
  <div className="mb-4 flex items-start justify-between gap-3">
    <div className="flex min-w-0 items-start gap-3">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-aurora-violet/[0.08] text-aurora-violet">{icon}</span>
      <div className="min-w-0">
        <h2 id={id} className="font-heading text-base font-bold text-aurora-ink sm:text-lg">
          {title}
        </h2>
        {lead && <p className="mt-0.5 text-sm text-aurora-muted">{lead}</p>}
      </div>
    </div>
    {action && (
      <Link
        to={action.to}
        className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-aurora-violet hover:bg-aurora-violet/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet"
      >
        {action.label} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    )}
  </div>
);

/** A circular gauge that draws itself once; a dash when nothing has been measured. */
export const Ring: React.FC<{ value: number | null; size?: number; stroke?: number; label: string; tone?: 'violet' | 'mint' | 'sky' }> = ({
  value,
  size = 76,
  stroke = 8,
  label,
  tone = 'violet',
}) => {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const colour = tone === 'mint' ? '#12c9a7' : tone === 'sky' ? '#5d96ff' : '#5540f5';
  const fraction = value === null ? 0 : Math.max(0, Math.min(100, value)) / 100;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={value === null ? `${label}: not measured yet` : `${label}: ${value}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e6eaf6" strokeWidth={stroke} />
      {value !== null && fraction > 0 && (
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colour}
          strokeWidth={stroke}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: fraction }}
          transition={reduce ? { duration: 0 } : { duration: 1.2, ease: auroraEase, delay: 0.2 }}
        />
      )}
    </svg>
  );
};

/** A horizontal progress bar that fills once. */
export const Bar: React.FC<{ value: number; label: string; tone?: 'violet' | 'mint' }> = ({ value, label, tone = 'violet' }) => {
  const reduce = useReducedMotion();
  const width = `${Math.max(0, Math.min(100, value))}%`;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-aurora-line" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <motion.div
        className={`h-full rounded-full ${tone === 'mint' ? 'bg-aurora-mint' : '[background:var(--aurora-gradient-action)]'}`}
        initial={reduce ? false : { width: 0 }}
        animate={{ width }}
        transition={reduce ? { duration: 0 } : { duration: 1, ease: auroraEase, delay: 0.2 }}
      />
    </div>
  );
};

export const EmptyNote: React.FC<{ children: React.ReactNode; to?: string; cta?: string }> = ({ children, to, cta }) => (
  <p className="rounded-2xl border border-dashed border-aurora-line bg-aurora-canvas/60 px-4 py-3 text-sm text-aurora-muted">
    {children}
    {to && cta && (
      <>
        {' '}
        <Link to={to} className="font-semibold text-aurora-violet underline-offset-2 hover:underline">
          {cta}
        </Link>
      </>
    )}
  </p>
);
