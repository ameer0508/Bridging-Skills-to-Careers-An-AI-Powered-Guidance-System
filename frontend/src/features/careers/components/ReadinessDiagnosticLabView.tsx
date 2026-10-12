import React, { useState } from 'react';
import { Compass, ShieldCheck, Activity } from 'lucide-react';
import { ReadinessDiagnosticPipelineVisual } from './ReadinessDiagnosticPipelineVisual';
import { ReadinessActivationConsole } from './ReadinessActivationConsole';
import { ReadinessDimensionFrameworkPreview } from './ReadinessDimensionFrameworkPreview';
import { ReadinessMethodologyModal } from './ReadinessMethodologyModal';

interface ReadinessDiagnosticLabViewProps {
  onUploadResume: (file: File) => Promise<void>;
  uploadStatus?: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  onConsultAI?: () => void;
}

export const ReadinessDiagnosticLabView: React.FC<ReadinessDiagnosticLabViewProps> = ({
  onUploadResume,
  uploadStatus = 'idle',
  errorMessage,
  onConsultAI,
}) => {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. HERO MASTHEAD */}
      <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-slate-950/80 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl shadow-black/80">
        {/* Ambient Radial Lights */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-linear-to-br from-cyan-500/20 via-indigo-500/10 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-linear-to-tl from-emerald-500/20 via-purple-500/10 to-transparent blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-md">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-wider uppercase">
                  Assessment · Diagnostic Lab
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[10px] font-mono font-bold text-emerald-300">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Deterministic Bipartite Model</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-[10px] font-mono font-bold text-purple-300">
                <Activity className="w-3 h-3 text-purple-400" />
                <span>4 Weighted Pillars</span>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Career <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-indigo-300 to-emerald-400">Readiness</span> Diagnostic Lab
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                Measure how prepared you are for your target career direction. SkillBridge evaluates your experience, capstone projects, and credentials to diagnose capability depth and prioritize high-impact development areas.
              </p>
            </div>
          </div>

          {/* Quick Stat Pillbox */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[220px]">
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                Primary Question
              </span>
              <span className="text-xs font-bold text-cyan-300 block">
                “How prepared am I for that role?”
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                Readiness Model
              </span>
              <span className="text-xs font-bold text-emerald-400 block">
                50% Tech · 25% Exp · 15% Proj · 10% Cert
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DIAGNOSTIC PIPELINE VISUAL */}
      <ReadinessDiagnosticPipelineVisual />

      {/* 3. RESUME ACTIVATION TERMINAL */}
      <ReadinessActivationConsole
        onUploadResume={onUploadResume}
        uploadStatus={uploadStatus}
        errorMessage={errorMessage}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onConsultAI={onConsultAI}
      />

      {/* 4. 4-DIMENSION CAPABILITY PREVIEW */}
      <ReadinessDimensionFrameworkPreview />

      {/* 5. METHODOLOGY MODAL */}
      <ReadinessMethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
};

export default ReadinessDiagnosticLabView;
