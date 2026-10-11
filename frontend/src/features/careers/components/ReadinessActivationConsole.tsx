import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, BookOpen, Brain } from 'lucide-react';

interface ReadinessActivationConsoleProps {
  onUploadResume: (file: File) => Promise<void>;
  uploadStatus?: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  onOpenMethodology?: () => void;
  onConsultAI?: () => void;
}

export const ReadinessActivationConsole: React.FC<ReadinessActivationConsoleProps> = ({
  onUploadResume,
  uploadStatus = 'idle',
  errorMessage,
  onOpenMethodology,
  onConsultAI,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFileName(file.name);
      await onUploadResume(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFileName(file.name);
      await onUploadResume(file);
    }
  };

  const isWorking = uploadStatus === 'uploading' || uploadStatus === 'processing';

  return (
    <div className="relative rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl overflow-hidden">
      {/* Dynamic Ambient Backlight */}
      <div
        className={`pointer-events-none absolute -inset-1 rounded-3xl opacity-25 blur-2xl transition-all duration-700 ${
          isDragOver
            ? 'bg-cyan-500'
            : isWorking
            ? 'bg-indigo-500 animate-pulse'
            : 'bg-linear-to-r from-cyan-500/30 via-indigo-500/20 to-emerald-500/30'
        }`}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Side: Activation Narrative */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-widest">
              Diagnostic Activation Terminal
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-tight">
              Ingest Experience Evidence to Run <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-indigo-300 to-emerald-400">Readiness Audit</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              SkillBridge analyzes your work history, verified projects, and credentials to calculate deterministic scores across 4 capability pillars. Upload your resume to activate personal assessment.
            </p>
          </div>

          {/* Action pills & triggers */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {onOpenMethodology && (
              <button
                type="button"
                onClick={onOpenMethodology}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/10 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Inspect Diagnostic Framework</span>
              </button>
            )}

            {onConsultAI && (
              <button
                type="button"
                onClick={onConsultAI}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-cyan-500/20 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
              >
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
                <span>Consult AI Architect</span>
              </button>
            )}

            <span className="text-[11px] font-mono text-slate-400">
              Supported: PDF, DOCX, DOC (max 10MB)
            </span>
          </div>
        </div>

        {/* Right Side: Interactive Drag & Drop Target */}
        <div className="lg:col-span-5">
          <motion.div
            whileHover={!isWorking ? { scale: 1.01 } : {}}
            whileTap={!isWorking ? { scale: 0.99 } : {}}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => {
              if (!isWorking) fileInputRef.current?.click();
            }}
            className={`relative p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-3 min-h-[190px] ${
              isDragOver
                ? 'border-cyan-400 bg-cyan-950/40 shadow-xl shadow-cyan-500/20'
                : isWorking
                ? 'border-indigo-500/50 bg-slate-900/90 cursor-wait'
                : uploadStatus === 'error'
                ? 'border-rose-500/40 bg-rose-950/20 hover:border-rose-400'
                : 'border-white/20 bg-slate-900/50 hover:border-cyan-400/60 hover:bg-slate-900/80'
            }`}
          >
            {/* Status Icons and Spinners */}
            {uploadStatus === 'uploading' ? (
              <div className="space-y-2">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">
                    Uploading Evidence Document...
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300">
                    {selectedFileName || 'Transferring to Secure Sandbox'}
                  </span>
                </div>
              </div>
            ) : uploadStatus === 'processing' ? (
              <div className="space-y-2">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">
                    Extracting Evidence & Evaluating 4 Dimensions...
                  </span>
                  <span className="text-[10px] font-mono text-indigo-300">
                    Running ReadinessCalculator & GapPrioritizer
                  </span>
                </div>
              </div>
            ) : uploadStatus === 'completed' ? (
              <div className="space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">
                    Diagnostic Audit Completed!
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300">
                    Loading Preparedness Profile...
                  </span>
                </div>
              </div>
            ) : uploadStatus === 'error' ? (
              <div className="space-y-2">
                <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-rose-300 block">
                    Evidence Ingestion Failed
                  </span>
                  <span className="text-[10px] text-slate-300 max-w-xs block">
                    {errorMessage || 'Unable to process document. Please re-try with a standard PDF or DOCX.'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-rose-400 font-bold underline cursor-pointer">
                  Click to Try Again
                </span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-xs font-extrabold text-white">
                      Drop resume here, or
                    </span>
                    <span className="text-xs font-extrabold text-cyan-400 underline decoration-cyan-400/50 hover:decoration-cyan-400">
                      browse files
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Activates multi-dimensional capability analysis
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ReadinessActivationConsole;
