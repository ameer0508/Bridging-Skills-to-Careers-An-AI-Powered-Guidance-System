import React from 'react';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';

/** Small presentational pieces shared by the Career Lab panels. */

export const Note: React.FC<{ children: React.ReactNode; testId?: string }> = ({ children, testId }) => (
  <p className="flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed" data-testid={testId}>
    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-500" aria-hidden="true" />
    <span>{children}</span>
  </p>
);

export const ErrorNote: React.FC<{ message: string | null }> = ({ message }) =>
  message ? (
    <div role="alert" className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-2 text-xs text-rose-100">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
      <span>{message}</span>
    </div>
  ) : null;

export const Loading: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-2 text-xs text-slate-300" role="status">
    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" aria-hidden="true" />
    <span>{label}</span>
  </div>
);

export const EmptyState: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center space-y-2">
    <p className="text-sm font-bold text-white">{title}</p>
    <p className="text-xs text-slate-400 max-w-md mx-auto">{children}</p>
  </div>
);

/** A score change such as "+12" or "-3", coloured by direction; "no change" for zero. */
export const Delta: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = '' }) => (
  <span className={`font-bold ${value > 0 ? 'text-emerald-400' : value < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
    {value > 0 ? `+${value}${suffix}` : value < 0 ? `${value}${suffix}` : 'no change'}
  </span>
);

export const SkillChips: React.FC<{ skills: string[]; tone?: 'neutral' | 'warn' | 'good'; emptyText?: string }> = ({
  skills,
  tone = 'neutral',
  emptyText = 'None',
}) => {
  const toneClass =
    tone === 'warn'
      ? 'bg-amber-500/10 text-amber-200 border-amber-500/30'
      : tone === 'good'
        ? 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30'
        : 'bg-slate-900 text-slate-200 border-white/10';
  if (skills.length === 0) return <span className="text-xs text-slate-500">{emptyText}</span>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <li key={skill} className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${toneClass}`}>
          {skill}
        </li>
      ))}
    </ul>
  );
};
