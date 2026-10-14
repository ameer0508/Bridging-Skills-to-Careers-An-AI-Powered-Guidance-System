import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, BellRing, CalendarClock, FlaskConical, Pencil, Plus, RotateCw, Trash2 } from 'lucide-react';
import { messageOf } from '../../../lib/collections';
import {
  addApplicationEvent,
  ApplicationHistory,
  ApplicationSummary,
  correctApplicationEvent,
  createManualApplication,
  dayToIso,
  EVENT_STATUSES,
  EventStatus,
  fetchApplicationHistory,
  fetchApplications,
  localToday,
  removeApplicationEvent,
  setApplicationReminder,
  STATUS_LABEL,
  TimelineEvent,
} from '../historyApi';

const inputClass =
  'w-full rounded-2xl border border-aurora-line bg-white px-3 py-2 text-sm text-aurora-ink';
const labelClass = 'flex flex-col gap-1 text-xs font-medium text-aurora-muted';
const primaryButton = 'rounded-2xl [background:var(--aurora-gradient-action)] px-4 py-2 text-sm font-semibold text-aurora-ink disabled:opacity-60';
const secondaryButton = 'inline-flex items-center gap-1 rounded-2xl border border-aurora-line px-3 py-1.5 text-xs font-medium text-aurora-ink';

/** Event dates are stored by UTC day (as C6 groups them), so they are shown by UTC day too. */
const formatDay = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const formatDateTime = (iso: string) => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const SOURCE_TEXT: Record<TimelineEvent['dateSource'], string> = {
  user_stated: 'date you entered',
  recorded_at_change: 'date the status was changed in SkillBridge',
  inferred: 'inferred, not recorded',
};

/** X8: each application's dated history, with corrections, reminders and manual entry. */
export const ApplicationHistoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const list = useQuery({ queryKey: ['applications'], queryFn: fetchApplications, retry: false });

  const applications = list.data ?? [];
  const activeId = selectedId ?? applications[0]?.id ?? null;
  const due = applications.filter(a => a.reminder?.due);

  /** Every change re-reads the list and the outcome analytics, which are built from the same events. */
  const afterChange = (history: ApplicationHistory) => {
    queryClient.setQueryData(['application-history', history.application.id], history);
    queryClient.invalidateQueries({ queryKey: ['applications'] });
    queryClient.invalidateQueries({ queryKey: ['application-outcomes'] });
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6">
      <header className="relative flex flex-col gap-2 overflow-hidden rounded-[32px] border border-aurora-line bg-white p-5 shadow-aurora-md [background-image:var(--aurora-gradient-canvas)] sm:p-8">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-aurora-violet"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full [background:var(--aurora-gradient-action)]" />Practice & apply</p>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-aurora-ink sm:text-3xl lg:text-4xl">Applications</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-aurora-muted sm:text-base">
          The history of each job you track, as you recorded it. SkillBridge receives nothing from employers: every event
          here was entered by you, and anything inferred is marked. Your{' '}
          <Link to="/application-outcomes" className="text-aurora-violet underline">application outcomes</Link> are calculated from these events.
        </p>
      </header>

      {due.length > 0 && (
        <section aria-labelledby="due-heading" data-testid="reminders-due" className="rounded-2xl border border-amber-500 bg-amber-50 p-4 text-sm text-amber-900">
          <h2 id="due-heading" className="mb-2 flex items-center gap-2 font-bold"><BellRing size={16} aria-hidden="true" /> Follow-ups due</h2>
          <ul className="space-y-1">
            {due.map(a => (
              <li key={a.id}>
                <button type="button" className="underline" onClick={() => setSelectedId(a.id)}>{a.title} at {a.company}</button>
                {a.reminder?.note ? ` — ${a.reminder.note}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      <ManualEntry onCreated={history => { afterChange(history); setSelectedId(history.application.id); }} />

      {list.isPending && <p role="status" className="text-sm text-aurora-muted">Loading applications…</p>}
      {list.isError && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-300 p-4 text-sm">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>Applications could not be loaded: {messageOf(list.error, 'the server did not respond.')}</span>
          <button type="button" onClick={() => list.refetch()} className="inline-flex items-center gap-1 font-semibold underline">
            <RotateCw size={14} aria-hidden="true" /> Try again
          </button>
        </div>
      )}
      {list.isSuccess && applications.length === 0 && (
        <p data-testid="applications-empty" className="rounded-2xl border border-aurora-line p-4 text-sm text-aurora-muted">
          You are not tracking any jobs yet. Save one from <Link to="/opportunities" className="text-aurora-violet underline">job search</Link>, or add an application you made elsewhere above.
        </p>
      )}

      {applications.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <nav aria-label="Tracked applications">
            <ul className="flex flex-col gap-2" data-testid="application-list">
              {applications.map(a => (
                <li key={a.id}>
                  <ApplicationListItem application={a} active={a.id === activeId} onSelect={() => setSelectedId(a.id)} />
                </li>
              ))}
            </ul>
          </nav>
          {activeId && <HistoryPanel id={activeId} onChange={afterChange} />}
        </div>
      )}
    </div>
  );
};

const ApplicationListItem: React.FC<{ application: ApplicationSummary; active: boolean; onSelect: () => void }> = ({ application: a, active, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    aria-current={active ? 'true' : undefined}
    className={`w-full rounded-2xl border p-3 text-left text-sm ${
      active ? 'border-aurora-violet bg-white' : 'border-aurora-line'
    }`}
  >
    <span className="block font-semibold text-aurora-ink">{a.title}</span>
    <span className="block text-xs text-aurora-muted">{a.company}</span>
    <span className="mt-1 flex flex-wrap gap-1 text-xs">
      <span className="rounded bg-white px-1.5 py-0.5 font-medium">{a.applied ? STATUS_LABEL[a.status] : 'Saved — not applied'}</span>
      {a.isSample && <span className="rounded border border-dashed border-amber-500 px-1.5 py-0.5 text-amber-700">Demo listing</span>}
      {a.isManual && <span className="rounded border border-aurora-line px-1.5 py-0.5">Added by you</span>}
      {a.reminder && <span className="rounded border border-aurora-line px-1.5 py-0.5">{a.reminder.due ? 'Follow-up due' : 'Reminder set'}</span>}
    </span>
  </button>
);

const HistoryPanel: React.FC<{ id: string; onChange: (h: ApplicationHistory) => void }> = ({ id, onChange }) => {
  const query = useQuery({ queryKey: ['application-history', id], queryFn: () => fetchApplicationHistory(id), retry: false });

  if (query.isPending) return <p role="status" className="text-sm text-aurora-muted">Loading history…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="rounded-2xl border border-rose-300 p-4 text-sm">
        History could not be loaded: {messageOf(query.error, 'the server did not respond.')}
      </div>
    );
  }
  const { application: a, timeline, notes } = query.data;

  return (
    <section aria-labelledby="history-heading" data-testid="application-history" className="flex flex-col gap-5 rounded-2xl border border-aurora-line p-4">
      <div>
        <h2 id="history-heading" className="text-lg font-bold font-display text-aurora-ink">{a.title}</h2>
        <p className="text-sm text-aurora-muted">
          {a.company}{a.location ? ` · ${a.location}` : ''} · Current stage: <strong data-testid="current-stage">{a.applied ? STATUS_LABEL[a.status] : 'Saved — not applied'}</strong>
        </p>
        {a.isSample && (
          <p className="mt-2 flex items-center gap-2 text-xs text-amber-800"><FlaskConical size={14} aria-hidden="true" /> Demo listing: left out of outcome analytics unless you include demo listings there.</p>
        )}
        {a.applicationUrl && (
          <a href={a.applicationUrl} target="_blank" rel="noreferrer noopener" className="mt-1 inline-block break-all text-xs text-aurora-violet underline">Posting link</a>
        )}
      </div>

      <ol className="flex flex-col gap-2" data-testid="timeline" aria-label="Events, oldest first">
        {timeline.map((event, index) => (
          <TimelineRow key={event.id ?? `inferred-${index}`} applicationId={a.id} event={event} onChange={onChange} />
        ))}
      </ol>

      {notes.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-xs text-aurora-muted" data-testid="history-notes">
          {notes.map(n => <li key={n}>{n}</li>)}
        </ul>
      )}

      <AddEventForm applicationId={a.id} onChange={onChange} />
      <ReminderForm application={a} onChange={onChange} />
    </section>
  );
};

const TimelineRow: React.FC<{ applicationId: string; event: TimelineEvent; onChange: (h: ApplicationHistory) => void }> = ({ applicationId, event, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [day, setDay] = useState(event.occurredAt.slice(0, 10));
  const [note, setNote] = useState(event.note);
  const correct = useMutation({
    mutationFn: () => correctApplicationEvent(applicationId, event.id as string, { occurredAt: dayToIso(day), note }),
    onSuccess: h => {
      setEditing(false);
      onChange(h);
    },
  });
  const remove = useMutation({ mutationFn: () => removeApplicationEvent(applicationId, event.id as string), onSuccess: onChange });
  const inferred = event.origin === 'inferred';
  const label = STATUS_LABEL[event.status];

  return (
    <li
      data-testid="timeline-event"
      data-status={event.status}
      data-origin={event.origin}
      className={`rounded-2xl border p-3 text-sm ${inferred ? 'border-dashed border-aurora-lavender' : 'border-aurora-line'}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span>
          <strong className="text-aurora-ink">{label}</strong>{' '}
          <span className="text-aurora-muted">{formatDay(event.occurredAt)}</span>{' '}
          <span className="text-xs text-aurora-muted">({SOURCE_TEXT[event.dateSource]})</span>
        </span>
        {!inferred && !editing && (
          <span className="flex gap-2">
            <button type="button" className={secondaryButton} onClick={() => setEditing(true)} aria-label={`Correct ${label} on ${formatDay(event.occurredAt)}`}>
              <Pencil size={12} aria-hidden="true" /> Correct
            </button>
            {event.removable && (
              <button
                type="button"
                className={secondaryButton}
                disabled={remove.isPending}
                aria-label={`Remove ${label} on ${formatDay(event.occurredAt)}`}
                onClick={() => {
                  if (window.confirm(`Remove the ${label.toLowerCase()} event of ${formatDay(event.occurredAt)}? Your outcome analytics will change.`)) remove.mutate();
                }}
              >
                <Trash2 size={12} aria-hidden="true" /> Remove
              </button>
            )}
          </span>
        )}
      </div>
      {event.note && !editing && <p className="mt-1 text-aurora-muted">{event.note}</p>}
      {inferred && event.explanation && <p className="mt-1 text-xs text-aurora-muted">{event.explanation}</p>}
      {event.editedAt && <p className="mt-1 text-xs text-aurora-muted">Corrected {formatDateTime(event.editedAt)}{event.recordedAt ? ` · first entered ${formatDateTime(event.recordedAt)}` : ''}</p>}
      {editing && (
        <form
          className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr_auto]"
          aria-label={`Correct the ${label.toLowerCase()} event`}
          onSubmit={e => {
            e.preventDefault();
            correct.mutate();
          }}
        >
          <label className={labelClass}>Date it happened<input type="date" required className={inputClass} value={day} max={localToday()} onChange={e => setDay(e.target.value)} /></label>
          <label className={labelClass}>Note<input className={inputClass} value={note} maxLength={500} onChange={e => setNote(e.target.value)} /></label>
          <span className="flex items-end gap-2">
            <button type="submit" className={primaryButton} disabled={correct.isPending}>Save</button>
            <button type="button" className={secondaryButton} onClick={() => setEditing(false)}>Cancel</button>
          </span>
        </form>
      )}
      {(correct.isError || remove.isError) && (
        <p role="alert" className="mt-1 text-xs text-rose-700">{messageOf(correct.error ?? remove.error, 'The change was not saved.')}</p>
      )}
    </li>
  );
};

const AddEventForm: React.FC<{ applicationId: string; onChange: (h: ApplicationHistory) => void }> = ({ applicationId, onChange }) => {
  const [status, setStatus] = useState<EventStatus>('applied');
  const [day, setDay] = useState(localToday());
  const [note, setNote] = useState('');
  const add = useMutation({
    mutationFn: () => addApplicationEvent(applicationId, { status, occurredAt: dayToIso(day), note: note.trim() || undefined }),
    onSuccess: h => {
      setNote('');
      onChange(h);
    },
  });

  return (
    <form
      aria-label="Record an event"
      className="grid grid-cols-1 gap-2 border-t border-aurora-line pt-4 sm:grid-cols-4"
      onSubmit={e => {
        e.preventDefault();
        add.mutate();
      }}
    >
      <h3 className="text-sm font-semibold text-aurora-ink sm:col-span-4">Record an event</h3>
      <label className={labelClass}>
        Stage
        <select className={inputClass} value={status} onChange={e => setStatus(e.target.value as EventStatus)}>
          {EVENT_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </label>
      <label className={labelClass}>Date it happened<input type="date" required className={inputClass} value={day} max={localToday()} onChange={e => setDay(e.target.value)} /></label>
      <label className={labelClass}>Note (optional)<input className={inputClass} value={note} maxLength={500} onChange={e => setNote(e.target.value)} /></label>
      <span className="flex items-end">
        <button type="submit" className={`${primaryButton} inline-flex w-full items-center justify-center gap-1`} disabled={add.isPending}>
          <Plus size={14} aria-hidden="true" /> Add event
        </button>
      </span>
      {add.isError && <p role="alert" className="text-xs text-rose-700 sm:col-span-4">{messageOf(add.error, 'The event was not saved.')}</p>}
    </form>
  );
};

const ReminderForm: React.FC<{ application: ApplicationSummary; onChange: (h: ApplicationHistory) => void }> = ({ application: a, onChange }) => {
  const [when, setWhen] = useState('');
  const [note, setNote] = useState('');
  const save = useMutation({
    mutationFn: (body: { at: string | null; note?: string }) => setApplicationReminder(a.id, body),
    onSuccess: h => {
      setWhen('');
      setNote('');
      onChange(h);
    },
  });

  return (
    <div className="flex flex-col gap-2 border-t border-aurora-line pt-4" data-testid="reminder">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-aurora-ink"><CalendarClock size={14} aria-hidden="true" /> Follow-up reminder</h3>
      {a.reminder ? (
        <p className="text-sm text-aurora-muted">
          {a.reminder.due ? 'Due since' : 'Set for'} {formatDateTime(a.reminder.at)}{a.reminder.note ? ` — ${a.reminder.note}` : ''}{' '}
          <button type="button" className="font-semibold underline" onClick={() => save.mutate({ at: null })}>Clear reminder</button>
        </p>
      ) : (
        <p className="text-xs text-aurora-muted">Off. Reminders appear on this page only, and only when you set one.</p>
      )}
      <form
        aria-label="Set a follow-up reminder"
        className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto]"
        onSubmit={e => {
          e.preventDefault();
          if (when) save.mutate({ at: new Date(when).toISOString(), note: note.trim() || undefined });
        }}
      >
        <label className={labelClass}>Remind me on<input type="datetime-local" required className={inputClass} value={when} onChange={e => setWhen(e.target.value)} /></label>
        <label className={labelClass}>Note (optional)<input className={inputClass} value={note} maxLength={300} onChange={e => setNote(e.target.value)} /></label>
        <span className="flex items-end"><button type="submit" className={primaryButton} disabled={save.isPending}>Set reminder</button></span>
      </form>
      {save.isError && <p role="alert" className="text-xs text-rose-700">{messageOf(save.error, 'The reminder was not saved.')}</p>}
    </div>
  );
};

const ManualEntry: React.FC<{ onCreated: (h: ApplicationHistory) => void }> = ({ onCreated }) => {
  const blank = { title: '', company: '', location: '', applicationUrl: '', appliedDay: '', note: '' };
  const [form, setForm] = useState(blank);
  const [open, setOpen] = useState(false);
  const create = useMutation({
    mutationFn: () =>
      createManualApplication({
        title: form.title.trim(),
        company: form.company.trim(),
        location: form.location.trim() || undefined,
        applicationUrl: form.applicationUrl.trim() || undefined,
        appliedAt: form.appliedDay ? dayToIso(form.appliedDay) : undefined,
        note: form.note.trim() || undefined,
      }),
    onSuccess: h => {
      setForm(blank);
      setOpen(false);
      onCreated(h);
    },
  });
  const field = (key: keyof typeof blank) => ({ value: form[key], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value }) });

  return (
    <details open={open} onToggle={e => setOpen((e.target as HTMLDetailsElement).open)} className="rounded-2xl border border-aurora-line p-4">
      <summary className="cursor-pointer text-sm font-semibold text-aurora-ink">Add an application you made elsewhere</summary>
      <form
        aria-label="Add an application"
        className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
        onSubmit={e => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <label className={labelClass}>Job title<input required minLength={2} maxLength={200} className={inputClass} {...field('title')} /></label>
        <label className={labelClass}>Employer<input required maxLength={200} className={inputClass} {...field('company')} /></label>
        <label className={labelClass}>Location (optional)<input maxLength={200} className={inputClass} {...field('location')} /></label>
        <label className={labelClass}>Posting link (optional)<input type="url" maxLength={2000} placeholder="https://" className={inputClass} {...field('applicationUrl')} /></label>
        <label className={labelClass}>Date you applied (leave empty if not yet)<input type="date" max={localToday()} className={inputClass} {...field('appliedDay')} /></label>
        <label className={labelClass}>Note (optional)<input maxLength={500} className={inputClass} {...field('note')} /></label>
        <div className="sm:col-span-2">
          <button type="submit" className={primaryButton} disabled={create.isPending}>Add application</button>
        </div>
        {create.isError && <p role="alert" className="text-xs text-rose-700 sm:col-span-2">{messageOf(create.error, 'The application was not saved.')}</p>}
      </form>
    </details>
  );
};

export default ApplicationHistoryPage;
