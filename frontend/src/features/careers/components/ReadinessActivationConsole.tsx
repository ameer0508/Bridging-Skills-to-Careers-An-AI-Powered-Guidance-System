import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Sparkles, BookOpen, Brain } from 'lucide-react';

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
    <div className="relative rounded-3xl border border-aurora-line bg-aurora-canvas/60 p-6 sm:p-8 shadow-2xl overflow-hidden">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-aurora-violet/25 bg-aurora-violet/[0.06]">
            <Sparkles className="w-3.5 h-3.5 text-aurora-violet" />
            <span className="text-[10px] font-bold text-aurora-violet uppercase tracking-widest">
              Diagnostic Activation Terminal
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-aurora-ink tracking-tight">
              Ingest Experience Evidence to Run <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-indigo-300 to-emerald-400">Readiness Audit</span>
            </h2>
            <p className="text-xs sm:text-sm text-aurora-muted leading-relaxed max-w-xl">
              SkillBridge analyzes your work history, projects, and credentials to calculate deterministic scores across 4 capability pillars. Upload your resume to activate personal assessment.
            </p>
          </div>

          {/* Action pills & triggers */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {onOpenMethodology && (
              <button
                type="button"
                onClick={onOpenMethodology}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-aurora-line bg-aurora-canvas/60 hover:bg-aurora-canvas text-aurora-muted hover:text-aurora-indigo text-xs font-semibold transition-all cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-aurora-violet" />
                <span>Inspect Diagnostic Framework</span>
              </button>
            )}

            {onConsultAI && (
              <button
                type="button"
                onClick={onConsultAI}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-aurora-violet/25 bg-cyan-50 hover:bg-cyan-100 text-aurora-violet text-xs font-semibold transition-all cursor-pointer"
              >
                <Brain className="w-3.5 h-3.5 text-aurora-violet" />
                <span>Consult AI Architect</span>
              </button>
            )}

            <span className="text-[11px] text-aurora-muted">
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
                ? 'border-cyan-400 bg-cyan-50 shadow-xl shadow-cyan-500/20'
                : isWorking
                ? 'border-aurora-violet/25 bg-aurora-canvas/60 cursor-wait'
                : uploadStatus === 'error'
                ? 'border-rose-200 bg-rose-50 hover:border-rose-400'
                : 'border-aurora-line bg-aurora-canvas/60 hover:border-cyan-400/60 hover:bg-aurora-canvas/60'
            }`}
          >
            {/* Status Icons and Spinners */}
            {uploadStatus === 'uploading' ? (
              <div className="space-y-2">
                <Loader2 className="w-8 h-8 text-aurora-violet animate-spin mx-auto" />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-aurora-ink block">
                    Uploading Evidence Document...
                  </span>
                  <span className="text-[10px] text-aurora-violet">
                    {selectedFileName || 'Transferring to Secure Sandbox'}
                  </span>
                </div>
              </div>
            ) : uploadStatus === 'processing' ? (
              <div className="space-y-2">
                <Loader2 className="w-8 h-8 text-aurora-indigo animate-spin mx-auto" />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-aurora-ink block">
                    Extracting Evidence & Evaluating 4 Dimensions...
                  </span>
                  <span className="text-[10px] text-aurora-indigo">
                    Running ReadinessCalculator & GapPrioritizer
                  </span>
                </div>
              </div>
            ) : uploadStatus === 'completed' ? (
              <div className="space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-aurora-ink block">
                    Diagnostic Audit Completed!
                  </span>
                  <span className="text-[10px] text-emerald-700">
                    Loading Preparedness Profile...
                  </span>
                </div>
              </div>
            ) : uploadStatus === 'error' ? (
              <div className="space-y-2">
                <AlertCircle className="w-8 h-8 text-rose-700 mx-auto" />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-rose-700 block">
                    Evidence Ingestion Failed
                  </span>
                  <span className="text-[10px] text-aurora-muted max-w-xs block">
                    {errorMessage || 'Unable to process document. Please re-try with a standard PDF or DOCX.'}
                  </span>
                </div>
                <span className="text-[10px] text-rose-700 font-bold underline cursor-pointer">
                  Click to Try Again
                </span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-aurora-violet/[0.06] border border-aurora-violet/25 flex items-center justify-center text-aurora-violet shadow-inner">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-xs font-extrabold text-aurora-ink">
                      Drop resume here, or
                    </span>
                    <span className="text-xs font-extrabold text-aurora-violet underline decoration-cyan-400/50 hover:decoration-cyan-400">
                      browse files
                    </span>
                  </div>
                  <p className="text-[11px] text-aurora-muted">
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
