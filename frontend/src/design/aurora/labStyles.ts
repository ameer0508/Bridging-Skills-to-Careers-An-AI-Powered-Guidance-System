/**
 * Class names and helpers shared by the Career Lab panels and the other lab-style screens
 * (Aurora Elite).
 */
export const errorText = (error: unknown, fallback: string): string => {
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === 'string' && message ? message : fallback;
};

export const formatDate = (value: string | null | undefined): string => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const panelClass = 'rounded-[28px] border border-aurora-line bg-white p-5 shadow-aurora-md sm:p-6 space-y-5';
export const insetClass = 'rounded-2xl border border-aurora-line bg-aurora-canvas/60 p-4';
export const fieldClass =
  'rounded-2xl border border-aurora-line bg-white px-3.5 py-2.5 text-sm text-aurora-ink placeholder:text-aurora-muted shadow-aurora-sm focus:border-aurora-violet focus:outline-none focus:ring-2 focus:ring-aurora-violet/30 disabled:opacity-60';
export const labelClass = 'text-xs font-semibold text-aurora-muted';
export const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-aurora-sm transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-aurora-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 motion-reduce:transform-none [background:var(--aurora-gradient-action)]';
export const quietButton =
  'inline-flex items-center justify-center gap-1.5 rounded-full border border-aurora-line bg-white px-3.5 py-2 text-sm font-semibold text-aurora-ink shadow-aurora-sm transition-colors hover:border-aurora-lavender hover:text-aurora-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet disabled:cursor-not-allowed disabled:opacity-50';
export const headingClass = 'font-heading text-lg font-bold text-aurora-ink';
export const leadClass = 'text-sm text-aurora-muted';
