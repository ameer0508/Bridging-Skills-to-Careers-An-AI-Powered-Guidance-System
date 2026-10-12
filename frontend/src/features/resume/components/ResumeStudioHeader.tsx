import React, { useEffect, useRef, useState } from 'react';
import { FileText, Download, Trash2, RefreshCw, RotateCw, AlertTriangle } from 'lucide-react';

interface ResumeStudioHeaderProps {
  hasActiveResume: boolean;
  originalFileName?: string;
  /** Name read from the resume, when the parser found one. */
  candidateName?: string;
  /** True while a run is pending or processing and not stuck. */
  isProcessing?: boolean;
  isReprocessing?: boolean;
  isDeleting?: boolean;
  onDownload?: () => void;
  onDelete?: () => void;
  onReprocess?: () => void;
  onRefresh?: () => void;
}

export const ResumeStudioHeader: React.FC<ResumeStudioHeaderProps> = ({
  hasActiveResume,
  originalFileName,
  candidateName,
  isProcessing = false,
  isReprocessing = false,
  isDeleting = false,
  onDownload,
  onDelete,
  onReprocess,
  onRefresh,
}) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirmingDelete) return;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setConfirmingDelete(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmingDelete]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-white/15 bg-slate-950/80 backdrop-blur-2xl shadow-2xl">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-[1px] shadow-lg shrink-0">
          <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center text-cyan-300">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Resume Intelligence Studio
            </h1>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold border border-indigo-500/30">
              Rule-based parser
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {hasActiveResume && originalFileName
              ? `Active file: ${originalFileName}`
              : 'Upload your PDF or DOCX resume to extract your skills and sections'}
          </p>
          {hasActiveResume && candidateName && (
            <p className="text-xs text-slate-300">
              Candidate: <span className="font-semibold text-white" data-testid="resume-candidate-name">{candidateName}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap self-start sm:self-center shrink-0">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh status"
            aria-label="Refresh status"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {hasActiveResume && onReprocess && (
          <button
            type="button"
            onClick={onReprocess}
            disabled={isProcessing || isReprocessing}
            title="Read the stored file again and rebuild your skills"
            className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCw className={`w-4 h-4 ${isProcessing || isReprocessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing || isReprocessing ? 'Processing…' : 'Reprocess'}</span>
          </button>
        )}

        {hasActiveResume && onDownload && (
          <button
            type="button"
            onClick={onDownload}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        )}

        {hasActiveResume && onDelete && (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={isDeleting}
            title="Delete resume"
            aria-label="Delete resume"
            className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {confirmingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-resume-title"
          onClick={() => setConfirmingDelete(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-950 p-6 space-y-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h2 id="delete-resume-title" className="text-sm font-bold text-white">
                  Delete this resume?
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The file{originalFileName ? ` "${originalFileName}"` : ''} will be removed, together with the skills,
                  career matches, readiness scores and active recommendations calculated from it.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your roadmap progress, saved jobs and interview history are kept, and so are skills you verified with a skill check. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 text-xs font-bold cursor-pointer"
              >
                Keep resume
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmingDelete(false);
                  onDelete?.();
                }}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                Delete resume
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeStudioHeader;
