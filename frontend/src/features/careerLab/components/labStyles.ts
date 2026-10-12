/** Class names and helpers shared by the Career Lab panels. */

export const panelClass = 'rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-5 sm:p-6 space-y-5';
export const fieldClass =
  'rounded-xl bg-slate-950/80 border border-white/10 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60';
export const labelClass = 'text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400';
export const primaryButton =
  'py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
export const quietButton =
  'py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-100 text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

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
