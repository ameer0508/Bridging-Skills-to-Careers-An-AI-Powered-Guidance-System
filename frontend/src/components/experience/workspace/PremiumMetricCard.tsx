import React from 'react';

export interface PremiumMetricCardProps {
  title: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  /** A short description under the value (where it comes from), not a trend. */
  trend?: string;
  /** Accepted for compatibility; the note is always shown in the neutral colour. */
  isPositive?: boolean;
  /** Accepted for compatibility but never displayed: no confidence value is measured. */
  confidence?: number;
  icon?: React.ElementType;
  /** Accepted for compatibility but never drawn: no history is recorded for these figures. */
  sparklineData?: number[];
  className?: string;
}

/** One figure from the user's own records, shown as it is (no count-up, no invented trend). */
export const PremiumMetricCard: React.FC<PremiumMetricCardProps> = ({ title, value, prefix = '', suffix = '', trend, icon: Icon, className = '' }) => (
  <div className={`rounded-2xl border border-aurora-line bg-white p-5 shadow-aurora-sm ${className}`}>
    <div className="mb-3 flex items-center justify-between gap-3">
      <span className="text-xs font-semibold text-aurora-muted">{title}</span>
      {Icon && (
        <div className="rounded-xl border border-aurora-line bg-aurora-canvas p-2 text-aurora-indigo" aria-hidden="true">
          <Icon className="h-4 w-4" />
        </div>
      )}
    </div>
    <p className="font-display text-2xl font-extrabold tracking-tight text-aurora-ink sm:text-3xl">
      {prefix}
      {value}
      {suffix}
    </p>
    {trend && <p className="mt-3 border-t border-aurora-line pt-3 text-[11px] font-semibold text-aurora-muted">{trend}</p>}
  </div>
);
