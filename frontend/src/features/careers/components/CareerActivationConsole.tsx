import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, Loader2, Compass, ShieldCheck } from 'lucide-react';

export interface CareerActivationConsoleProps {
  onUpload: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number | null;
  parsingStatus?: 'pending' | 'processing' | 'completed' | 'failed' | null;
  validationError?: string | null;
  onOpenMethodology: () => void;
}

export const CareerActivationConsole: React.FC<CareerActivationConsoleProps> = ({
  onUpload,
  isUploading = false,
  uploadProgress = null,
  parsingStatus = null,
  validationError = null,
  onOpenMethodology,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!validTypes.includes(file.type)) {
      alert('Unsupported file format. Please upload a PDF or Word document (.pdf, .doc, .docx).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds maximum analytical limit of 10MB.');
      return;
    }
    setSelectedFile(file);
    onUpload(file);
  };

  const isProcessing = parsingStatus === 'pending' || parsingStatus === 'processing' || isUploading;

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-2xl p-6 sm:p-8 lg:p-10 shadow-2xl space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-[10px] font-bold uppercase tracking-wider">
              Activation Gateway
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              Secure Local Ingestion
            </span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
            Provide Resume Evidence to Activate Role Fit Mapping
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            SkillBridge calculates deterministic compatibility directly from your parsed work history, technical stack, and verified capstones. Upload your active CV or resume to execute vector extraction.
          </p>
        </div>

        <button
          onClick={onOpenMethodology}
          className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/15 hover:border-cyan-500/40 text-xs font-mono font-bold text-cyan-300 flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>Inspect Fit Methodology</span>
        </button>
      </div>

      {/* Upload Dropzone / Processing Console */}
      {!isProcessing ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition-all cursor-pointer ${
            isDragActive
              ? 'border-cyan-400 bg-cyan-500/10 shadow-xl shadow-cyan-500/10'
              : 'border-white/15 bg-slate-900/60 hover:border-indigo-500/50 hover:bg-slate-900/90'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-indigo-500/10">
              <Upload className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="font-display text-base sm:text-lg font-bold text-white">
                Drag & Drop Your Resume File Here
              </h4>
              <p className="text-xs text-slate-400 font-mono">
                or click to browse your workstation • PDF, DOC, DOCX up to <strong className="text-cyan-300">10 MB</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Zero Hallucination
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                Deterministic Scoring
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Real-Time Processing State Console */
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h4 className="font-display text-lg font-bold text-white">
              {isUploading
                ? 'Ingesting Resume Document...'
                : parsingStatus === 'pending'
                ? 'Queueing Deterministic Extraction Worker...'
                : 'Extracting Skills & Mapping Career Alignments...'}
            </h4>
            <p className="text-xs text-slate-400 font-mono">
              {selectedFile ? selectedFile.name : 'Active Resume Document'} • Processing through 5-stage analytical pipeline
            </p>
          </div>

          {/* Progress Bar */}
          {uploadProgress !== null && (
            <div className="max-w-md mx-auto space-y-1">
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-cyan-400 block text-right">
                {uploadProgress}% Ingested
              </span>
            </div>
          )}

          <div className="flex items-center justify-center gap-6 text-xs font-mono text-slate-400 pt-2 border-t border-white/5">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              Parsing Structure
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              Normalizing Taxonomy
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              Scoring Fit Matrix
            </span>
          </div>
        </div>
      )}

      {/* Validation Error Message */}
      {validationError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
};

export default CareerActivationConsole;
