import React from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RotateCw } from 'lucide-react';

export interface ResumeSkillChanges {
  comparedToPrevious: boolean;
  added: string[];
  removed: string[];
  unchangedCount: number;
}

interface ResumeStatusPanelProps {
  parsingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  parsingError?: string;
  isStuck?: boolean;
  skillChanges?: ResumeSkillChanges | null;
  /** Error from the last download, delete or reprocess request. */
  actionError?: string | null;
  isReprocessing?: boolean;
  onReprocess: () => void;
}

const SkillList: React.FC<{ label: string; skills: string[]; tone: string }> = ({ label, skills, tone }) => (
  <div>
    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
      {label} ({skills.length})
    </span>
    {skills.length > 0 ? (
      <ul className="flex flex-wrap gap-1.5">
        {skills.map((skill) => (
          <li key={skill} className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${tone}`}>
            {skill}
          </li>
        ))}
      </ul>
    ) : (
      <span className="text-xs text-slate-500">None</span>
    )}
  </div>
);

/**
 * Shows the state of the last extraction run (running, failed, stuck) with a way to recover,
 * and what changed in the recognised skills compared with the previous resume.
 */
export const ResumeStatusPanel: React.FC<ResumeStatusPanelProps> = ({
  parsingStatus,
  parsingError,
  isStuck = false,
  skillChanges,
  actionError,
  isReprocessing = false,
  onReprocess,
}) => {
  const inFlight = parsingStatus === 'pending' || parsingStatus === 'processing';
  const showChanges =
    parsingStatus === 'completed' &&
    !!skillChanges?.comparedToPrevious &&
    (skillChanges.added.length > 0 || skillChanges.removed.length > 0);

  const reprocessButton = (
    <button
      type="button"
      onClick={onReprocess}
      disabled={isReprocessing}
      className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
    >
      <RotateCw className={`w-3.5 h-3.5 ${isReprocessing ? 'animate-spin' : ''}`} />
      <span>Reprocess resume</span>
    </button>
  );

  return (
    <div className="space-y-3" aria-live="polite">
      {actionError && (
        <div role="alert" className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-100">{actionError}</p>
        </div>
      )}

      {parsingStatus === 'failed' && (
        <div role="alert" className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-white">This resume could not be processed.</p>
              <p className="text-xs text-rose-100">{parsingError || 'No reason was reported.'}</p>
              <p className="text-xs text-slate-300">
                Your file is still stored. You can run the extraction again or replace the file.
              </p>
            </div>
          </div>
          {reprocessButton}
        </div>
      )}

      {inFlight && isStuck && (
        <div role="alert" className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-white">Processing is taking longer than expected.</p>
              <p className="text-xs text-slate-300">It may have been interrupted. You can start it again.</p>
            </div>
          </div>
          {reprocessButton}
        </div>
      )}

      {inFlight && !isStuck && (
        <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-cyan-300 animate-spin shrink-0" />
          <p className="text-xs text-slate-200">
            Reading your resume. Skills, career matches and readiness update when this finishes.
          </p>
        </div>
      )}

      {showChanges && skillChanges && (
        <div className="p-4 rounded-2xl border border-white/10 bg-slate-950/70 space-y-3" data-testid="resume-skill-changes">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <p className="text-xs font-bold text-white">What changed compared with your previous resume</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SkillList label="Skills added" skills={skillChanges.added} tone="bg-emerald-500/10 text-emerald-300 border-emerald-500/30" />
            <SkillList label="Skills no longer found" skills={skillChanges.removed} tone="bg-rose-500/10 text-rose-300 border-rose-500/30" />
          </div>
          <p className="text-xs text-slate-400">
            {skillChanges.unchangedCount} skill{skillChanges.unchangedCount === 1 ? '' : 's'} unchanged. Career matches,
            readiness and recommendations were recalculated from the new skill list.
          </p>
        </div>
      )}
    </div>
  );
};

export default ResumeStatusPanel;
