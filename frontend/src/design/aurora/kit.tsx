import React, { useId, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ChevronDown, Info, X } from 'lucide-react';
import { Portal } from '../../components/primitives/Portal/Portal';
import { auroraEase } from './motion';
import { Eyebrow } from './primitives';
import { useDialogBehaviour } from './useDialogBehaviour';

/**
 * Aurora Elite building blocks for the app screens: page header, notices, pills, tabs, a dialog,
 * skeletons and disclosures. Light surfaces, navy ink, violet actions; motion stops when the user
 * prefers reduced motion.
 */

export const PageHeader: React.FC<{
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ eyebrow, title, lead, icon, actions, children }) => (
  <header className="relative overflow-hidden rounded-[32px] border border-aurora-line bg-white p-5 shadow-aurora-md sm:p-8">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 [background:var(--aurora-gradient-canvas)] opacity-80" />
    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        {icon && (
          <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-aurora-md [background:var(--aurora-gradient-action)] sm:inline-flex">
            {icon}
          </span>
        )}
        <div className="min-w-0 space-y-2">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="font-heading text-2xl font-extrabold leading-tight tracking-tight text-aurora-ink sm:text-3xl lg:text-4xl">{title}</h1>
          {lead && <div className="max-w-2xl text-sm leading-relaxed text-aurora-muted sm:text-base">{lead}</div>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
    {children && <div className="relative mt-6">{children}</div>}
  </header>
);

type Tone = 'info' | 'success' | 'warning' | 'error';
const toneClass: Record<Tone, string> = {
  info: 'border-aurora-violet/20 bg-aurora-violet/[0.05] text-aurora-ink',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
};
const toneIcon: Record<Tone, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-aurora-violet" aria-hidden="true" />,
  success: <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />,
  error: <AlertTriangle className="h-4 w-4 text-rose-600" aria-hidden="true" />,
};

/** A coloured message box. Errors and warnings are announced (role="alert"). */
export const Notice: React.FC<{ tone?: Tone; title?: React.ReactNode; children?: React.ReactNode; action?: React.ReactNode; testId?: string; className?: string }> = ({
  tone = 'info',
  title,
  children,
  action,
  testId,
  className = '',
}) => (
  <div
    role={tone === 'error' || tone === 'warning' ? 'alert' : undefined}
    data-testid={testId}
    className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${toneClass[tone]} ${className}`}
  >
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 shrink-0">{toneIcon[tone]}</span>
      <div className="min-w-0 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-relaxed opacity-90">{children}</div>}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

const pillTone = {
  neutral: 'border-aurora-line bg-white text-aurora-muted',
  violet: 'border-aurora-violet/20 bg-aurora-violet/[0.07] text-aurora-indigo',
  mint: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
  sky: 'border-sky-200 bg-sky-50 text-sky-800',
} as const;
export type PillTone = keyof typeof pillTone;

export const Pill: React.FC<{ tone?: PillTone; children: React.ReactNode; className?: string; title?: string }> = ({ tone = 'neutral', children, className = '', title }) => (
  <span title={title} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${pillTone[tone]} ${className}`}>
    {children}
  </span>
);

/** A tab list with a sliding indicator. Arrow keys move between tabs (WAI-ARIA tabs pattern). */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  idBase,
}: {
  tabs: Array<{ id: T; label: string; badge?: React.ReactNode }>;
  value: T;
  onChange: (id: T) => void;
  label: string;
  idBase: string;
}) {
  const reduce = useReducedMotion();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const move = (from: number, delta: number) => {
    const next = (from + delta + tabs.length) % tabs.length;
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="aurora-scroll flex gap-1 overflow-x-auto rounded-full border border-aurora-line bg-white p-1 shadow-aurora-sm">
      {tabs.map((tab, i) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={el => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`${idBase}-tab-${tab.id}`}
            aria-selected={active}
            aria-controls={`${idBase}-panel-${tab.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={e => {
              if (e.key === 'ArrowRight') move(i, 1);
              else if (e.key === 'ArrowLeft') move(i, -1);
              else if (e.key === 'Home') move(i, -i);
              else if (e.key === 'End') move(i, tabs.length - 1 - i);
            }}
            className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet ${
              active ? 'text-white' : 'text-aurora-muted hover:text-aurora-ink'
            }`}
          >
            {active && (
              <motion.span
                layoutId={`${idBase}-tab-indicator`}
                aria-hidden="true"
                className="absolute inset-0 rounded-full shadow-aurora-sm [background:var(--aurora-gradient-action)]"
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5 whitespace-nowrap">
              {tab.label}
              {tab.badge}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** The content of one tab, fading in when it is chosen. */
export const TabPanel: React.FC<{ idBase: string; id: string; children: React.ReactNode }> = ({ idBase, id, children }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={id}
      role="tabpanel"
      id={`${idBase}-panel-${id}`}
      aria-labelledby={`${idBase}-tab-${id}`}
      tabIndex={0}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: auroraEase }}
      className="focus-visible:outline-none"
    >
      {children}
    </motion.div>
  );
};

/** A modal dialog on the light theme: focus moves in, Escape and the backdrop close it, focus returns. */
export const AuroraDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  initialFocus?: React.RefObject<HTMLElement | null>;
  tone?: 'default' | 'danger';
}> = ({ open, onClose, title, children, footer, size = 'md', initialFocus, tone = 'default' }) => {
  const reduce = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogBehaviour(open, onClose, panelRef, initialFocus);
  const width = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];
  return (
    <Portal theme="aurora">
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6">
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 bg-aurora-ink/40 backdrop-blur-sm"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.28, ease: auroraEase }}
              className={`relative flex max-h-[92vh] w-full ${width} flex-col overflow-hidden rounded-t-[28px] border border-aurora-line bg-white text-aurora-ink shadow-aurora-lg focus-visible:outline-none sm:rounded-[28px]`}
            >
              <div className={`flex items-start justify-between gap-3 border-b border-aurora-line px-5 py-4 sm:px-6 ${tone === 'danger' ? 'bg-rose-50/60' : ''}`}>
                <h2 id={titleId} className="font-heading text-lg font-bold text-aurora-ink">
                  {title}
                </h2>
                <button type="button" onClick={onClose} aria-label="Close" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-aurora-muted hover:bg-aurora-canvas hover:text-aurora-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div tabIndex={0} aria-labelledby={titleId} role="region" className="aurora-scroll flex-1 overflow-y-auto px-5 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-aurora-violet/40 sm:px-6">{children}</div>
              {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-aurora-line bg-aurora-canvas/60 px-5 py-4 sm:px-6">{footer}</div>}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div aria-hidden="true" className={`animate-pulse rounded-[28px] border border-aurora-line bg-white/70 motion-reduce:animate-none ${className}`} />
);

/** A page-level loading state: a status line for screen readers and calm placeholders. */
export const PageSkeleton: React.FC<{ label: string }> = ({ label }) => (
  <div className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-6 sm:px-6" aria-busy="true">
    <p role="status" className="sr-only">
      {label}
    </p>
    <Skeleton className="h-48" />
    <div className="grid gap-6 lg:grid-cols-3">
      <Skeleton className="h-72 lg:col-span-2" />
      <Skeleton className="h-72" />
    </div>
  </div>
);

/** A labelled figure. `value` null means "not measured" and is shown as such, never as 0. */
export const StatTile: React.FC<{ label: string; value: React.ReactNode | null; hint?: React.ReactNode; unmeasured?: string; testId?: string; accent?: boolean }> = ({
  label,
  value,
  hint,
  unmeasured = 'Not measured yet',
  testId,
  accent = false,
}) => (
  <div data-testid={testId} className={`rounded-3xl border p-4 ${accent ? 'border-aurora-violet/20 bg-aurora-violet/[0.04]' : 'border-aurora-line bg-white'} shadow-aurora-sm`}>
    <p className="text-xs font-semibold text-aurora-muted">{label}</p>
    <p className="mt-1 font-heading text-2xl font-extrabold text-aurora-ink">{value === null || value === undefined ? <span className="text-base font-semibold text-aurora-muted">{unmeasured}</span> : value}</p>
    {hint && <p className="mt-1 text-xs text-aurora-muted">{hint}</p>}
  </div>
);

/** An expandable section; the content slides open (or just appears with reduced motion). */
export const Disclosure: React.FC<{ summary: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; testId?: string }> = ({ summary, children, defaultOpen = false, testId }) => {
  const reduce = useReducedMotion();
  const [open, setOpen] = React.useState(defaultOpen);
  const id = useId();
  return (
    <div data-testid={testId} className="rounded-2xl border border-aurora-line bg-white">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-aurora-ink hover:bg-aurora-canvas/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet"
      >
        <span className="min-w-0">{summary}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-aurora-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: auroraEase }}
            className="overflow-hidden"
          >
            <div className="border-t border-aurora-line px-4 py-3 text-sm text-aurora-muted">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/** Form control classes on the light theme. */
export const fieldClass =
  'w-full rounded-2xl border border-aurora-line bg-white px-4 py-2.5 text-sm text-aurora-ink placeholder:text-aurora-muted shadow-aurora-sm focus:border-aurora-violet focus:outline-none focus:ring-2 focus:ring-aurora-violet/30 disabled:opacity-60';
export const labelClass = 'block text-xs font-semibold text-aurora-muted';

/**
 * A porcelain panel with the same props as the dark GlassPanel, so a migrated screen swaps the
 * import. With onClick it behaves as a button (Enter and Space activate it).
 */
export const Panel: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; animateIn?: boolean; glowColor?: string }> = ({ children, className = '', onClick }) => {
  const interactive = onClick
    ? {
        role: 'button' as const,
        tabIndex: 0,
        onClick,
        onKeyDown: (event: React.KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
          }
        },
      }
    : {};
  return (
    <div
      {...interactive}
      className={`relative rounded-[28px] border border-aurora-line bg-white shadow-aurora-sm transition-shadow ${onClick ? 'cursor-pointer hover:shadow-aurora-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
