import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface ResumeDropzoneCardProps {
  hasActiveResume: boolean;
  parsingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  uploadProgress?: number | null;
  validationError?: string | null;
  onFileSelect: (file: File) => void;
}

export const ResumeDropzoneCard: React.FC<ResumeDropzoneCardProps> = ({
  hasActiveResume,
  parsingStatus,
  uploadProgress,
  validationError,
  onFileSelect,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSubmit(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSubmit(e.target.files[0]);
    }
  };

  const validateAndSubmit = (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file format. Please upload a PDF or Word document (.pdf, .doc, .docx).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds maximum limit of 10MB.');
      return;
    }
    onFileSelect(file);
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          dragActive
            ? 'border-cyan-400 bg-cyan-500/10'
            : 'border-white/15 bg-slate-950/70 hover:border-indigo-500/40 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Upload className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">
              {hasActiveResume ? 'Drag & Drop to Replace Active Resume' : 'Drag & Drop Your Resume File'}
            </h3>
            <p className="text-xs text-slate-400">
              Supports PDF, DOC, DOCX up to <span className="text-cyan-300 font-bold">10 MB</span>
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress Bar */}
      {uploadProgress !== null && uploadProgress !== undefined && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span>Uploading document...</span>
            <span className="text-cyan-400 font-bold">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-linear-to-r from-indigo-500 to-cyan-400 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Parsing Status Ticker */}
      {parsingStatus && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 flex items-center gap-3">
          {parsingStatus === 'pending' || parsingStatus === 'processing' ? (
            <>
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">Transformer NLP Engine Active</span>
                <span className="text-slate-400">Executing 14-stage section classification & skill extraction...</span>
              </div>
            </>
          ) : parsingStatus === 'completed' ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-emerald-400 block">Analysis Complete</span>
                <span className="text-slate-300">Extracted skill nodes have been synchronized with your profile.</span>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-rose-400 block">Parsing Failed</span>
                <span className="text-slate-400">Please re-upload a clear text PDF or Word document.</span>
              </div>
            </>
          )}
        </div>
      )}

      {validationError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
          {validationError}
        </div>
      )}
    </div>
  );
};

export default ResumeDropzoneCard;
