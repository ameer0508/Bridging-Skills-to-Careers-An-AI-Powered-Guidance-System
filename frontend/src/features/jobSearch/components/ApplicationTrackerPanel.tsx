import React, { useState } from 'react';
import { BellRing, History, StickyNote, Trash2 } from 'lucide-react';
import { APPLICATION_STATUS_LABEL, formatDateTime } from './jobFormat';
import type { OpportunityItem } from './OpportunityStreamFeed';

interface ApplicationTrackerPanelProps {
  opportunity: OpportunityItem;
  isSaving: boolean;
  onSaveNotes: (notes: string) => void;
  /** ISO date to set a reminder, or null to clear it. */
  onSetReminder: (reminderAt: string | null, reminderNote: string) => void;
  onRemove: () => void;
}

/** yyyy-mm-dd for a date input, in local time. */
const toDateInput = (raw?: string | null): string => {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const tomorrow = (): string => toDateInput(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());

/**
 * Tracking details of a saved job: the user's notes, a follow-up reminder, and the recorded
 * history of status changes. The parent gives it a `key` built from the stored values, so the
 * form starts from what is saved whenever another job is selected or the record is refreshed.
 */
export const ApplicationTrackerPanel: React.FC<ApplicationTrackerPanelProps> = ({
  opportunity,
  isSaving,
  onSaveNotes,
  onSetReminder,
  onRemove,
}) => {
  const [notes, setNotes] = useState(opportunity.notes || '');
  const [reminderDate, setReminderDate] = useState(toDateInput(opportunity.reminderAt));
  const [reminderNote, setReminderNote] = useState(opportunity.reminderNote || '');
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const history = opportunity.statusHistory || [];
  const notesChanged = notes !== (opportunity.notes || '');
  const fieldClass =
    'w-full rounded-xl bg-slate-950/80 border border-white/10 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60';
  const labelClass = 'text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5';

  return (
    <section
      aria-label="Application tracking"
      className="rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-5 space-y-5"
      data-testid="application-tracker"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-white">Application tracking</h3>
        {opportunity.isSample && (
          <span className="px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] font-bold">
            Demo listing
          </span>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label htmlFor="tracker-notes" className={labelClass}>
          <StickyNote className="w-3.5 h-3.5" /> Your notes
        </label>
        <textarea
          id="tracker-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Contact names, what you sent, what to ask..."
          className={fieldClass}
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500">{notes.length} / 2000</span>
          <button
            type="button"
            onClick={() => onSaveNotes(notes)}
            disabled={!notesChanged || isSaving}
            className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save notes
          </button>
        </div>
      </div>

      {/* Reminder */}
      <div className="space-y-2">
        <span className={labelClass}>
          <BellRing className="w-3.5 h-3.5" /> Follow-up reminder
        </span>
        {opportunity.reminderAt ? (
          <p className={`text-xs ${opportunity.reminderDue ? 'text-amber-300 font-bold' : 'text-slate-300'}`} data-testid="reminder-status">
            {opportunity.reminderDue ? 'Due now: ' : 'Set for '}
            {formatDateTime(opportunity.reminderAt)}
            {opportunity.reminderNote ? ` — ${opportunity.reminderNote}` : ''}
          </p>
        ) : (
          <p className="text-xs text-slate-500" data-testid="reminder-status">No reminder set.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label htmlFor="tracker-reminder-date" className="sr-only">Reminder date</label>
            <input
              id="tracker-reminder-date"
              type="date"
              value={reminderDate}
              min={tomorrow()}
              onChange={(e) => setReminderDate(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="tracker-reminder-note" className="sr-only">What to follow up on</label>
            <input
              id="tracker-reminder-note"
              type="text"
              value={reminderNote}
              maxLength={300}
              onChange={(e) => setReminderNote(e.target.value)}
              placeholder="What to follow up on"
              className={fieldClass}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          {opportunity.reminderAt && (
            <button
              type="button"
              onClick={() => onSetReminder(null, '')}
              disabled={isSaving}
              className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 text-xs font-bold cursor-pointer disabled:opacity-40"
            >
              Clear reminder
            </button>
          )}
          <button
            type="button"
            // 09:00 local time on the chosen day
            onClick={() => onSetReminder(new Date(`${reminderDate}T09:00:00`).toISOString(), reminderNote)}
            disabled={!reminderDate || isSaving}
            className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {opportunity.reminderAt ? 'Update reminder' : 'Set reminder'}
          </button>
        </div>
      </div>

      {/* Status history */}
      <div className="space-y-2">
        <span className={labelClass}>
          <History className="w-3.5 h-3.5" /> Status history
        </span>
        {history.length > 0 ? (
          <ol className="space-y-1.5" data-testid="status-history">
            {history.map((entry, index) => (
              <li key={`${entry.status}-${entry.changedAt}-${index}`} className="text-xs text-slate-300 flex flex-wrap gap-x-2">
                <span className="font-bold text-white">{APPLICATION_STATUS_LABEL[entry.status] || entry.status}</span>
                <span className="text-slate-400">{formatDateTime(entry.changedAt)}</span>
                {entry.note && <span className="text-slate-400">— {entry.note}</span>}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-slate-500">No status changes recorded yet.</p>
        )}
      </div>

      {/* Remove */}
      <div className="pt-3 border-t border-white/10">
        {confirmingRemove ? (
          <div className="flex flex-wrap items-center justify-between gap-2" role="group" aria-label="Confirm removal">
            <span className="text-xs text-slate-300">Remove this job and its notes, reminder and history?</span>
            <span className="flex gap-2">
              <button type="button" onClick={() => setConfirmingRemove(false)} className="py-1.5 px-3 rounded-lg bg-slate-900 border border-white/10 text-slate-200 text-xs font-bold cursor-pointer">
                Keep
              </button>
              <button type="button" onClick={onRemove} disabled={isSaving} className="py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer disabled:opacity-40">
                Remove
              </button>
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingRemove(true)}
            className="text-xs font-bold text-rose-300 hover:text-rose-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove from tracked jobs
          </button>
        )}
      </div>
    </section>
  );
};

export default ApplicationTrackerPanel;
