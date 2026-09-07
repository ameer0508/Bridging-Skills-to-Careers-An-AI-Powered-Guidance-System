import React from 'react';
import { FileText, Download, Trash2, RefreshCw } from 'lucide-react';

interface ResumeStudioHeaderProps {
  hasActiveResume: boolean;
  originalFileName?: string;
  onDownload?: () => void;
  onDelete?: () => void;
  onRefresh?: () => void;
}

export const ResumeStudioHeader: React.FC<ResumeStudioHeaderProps> = ({
  hasActiveResume,
  originalFileName,
  onDownload,
  onDelete,
  onRefresh,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-white/15 bg-slate-950/80 backdrop-blur-2xl shadow-2xl">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-[1px] shadow-lg shrink-0">
          <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center text-cyan-300">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Resume Intelligence Studio
            </h1>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold border border-indigo-500/30">
              14-Stage NLP Engine
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {hasActiveResume && originalFileName
              ? `Active File: ${originalFileName}`
              : 'Upload your PDF or DOCX resume to extract vector skill nodes & ATS metrics'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh Status"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {hasActiveResume && onDownload && (
          <button
            onClick={onDownload}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        )}

        {hasActiveResume && onDelete && (
          <button
            onClick={onDelete}
            title="Delete Resume"
            className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ResumeStudioHeader;
