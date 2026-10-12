/** Formatting shared by the job search components. Nothing here invents a value that is missing. */

export interface JobSalary {
  min?: number;
  max?: number;
  currency?: string;
  period?: string;
}

/** A stated salary as text, or "Salary not disclosed". Currency and period appear only when stated. */
export function formatJobSalary(salary?: JobSalary | string | null): string {
  if (typeof salary === 'string') return salary || 'Salary not disclosed';
  if (!salary || (!salary.min && !salary.max)) return 'Salary not disclosed';
  const amount = (n: number) => n.toLocaleString('en-US');
  const range =
    salary.min && salary.max && salary.min !== salary.max
      ? `${amount(salary.min)} - ${amount(salary.max)}`
      : amount((salary.max || salary.min) as number);
  const period = salary.period ? ` per ${salary.period.toLowerCase().replace(/ly$/, '')}` : '';
  return `${salary.currency ? `${salary.currency} ` : ''}${range}${period}`;
}

/** "3d ago" style age of a posting, or "Date not stated" when the provider gave none. */
export function formatPostedDate(raw?: string | Date | null): string {
  if (!raw) return 'Date not stated';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return 'Date not stated';
  const hours = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (hours < 1) return 'Just posted';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(raw?: string | Date | null): string {
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const APPLICATION_STATUS_LABEL: Record<string, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};
