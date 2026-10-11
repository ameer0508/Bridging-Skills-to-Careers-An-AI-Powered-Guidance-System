import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Sparkles, FileText, ArrowRight, ShieldCheck, Target, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';

import { CareerAlignmentPipelineVisual } from './CareerAlignmentPipelineVisual';
import { CareerActivationConsole } from './CareerActivationConsole';
import { CareerAnalysisDimensionsPreview } from './CareerAnalysisDimensionsPreview';
import { CareerMethodologyModal } from './CareerMethodologyModal';

export interface CareerAlignmentLabViewProps {
  onUpload: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number | null;
  parsingStatus?: 'pending' | 'processing' | 'completed' | 'failed' | null;
  validationError?: string | null;
}

export const CareerAlignmentLabView: React.FC<CareerAlignmentLabViewProps> = ({
  onUpload,
  isUploading = false,
  uploadProgress = null,
  parsingStatus = null,
  validationError = null,
}) => {
  const navigate = useNavigate();
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  const isProcessing = parsingStatus === 'pending' || parsingStatus === 'processing' || isUploading;
  const currentStage = isProcessing ? 2 : 0;

  return (
    <div className="space-y-10 pb-16">
      {/* SECTION 1 — LAB HERO MASTHEAD */}
      <div className="relative overflow-hidden rounded-[32px] border border-white/15 bg-slate-950/85 backdrop-blur-2xl p-6 sm:p-8 lg:p-10 shadow-2xl shadow-black/80">
        {/* Subtle Ambient Radial Lighting */}
        <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-linear-to-bl from-cyan-500/20 via-indigo-500/10 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-linear-to-tr from-purple-500/20 via-slate-900/10 to-transparent blur-3xl" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Compass className="w-4 h-4 animate-spin duration-3000" />
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-300">
                Career Alignment Lab • Deterministic Analytics
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-xs font-mono text-slate-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Model State: Ready for Evidence
              </span>
            </div>
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Understand Where Your Skills{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-indigo-300 to-amber-300">
                Can Take You
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
              SkillBridge analyzes evidence from your resume, extracts and normalizes your skills, and mathematically maps them against relevant career roles using deterministic fit analysis.
            </p>
          </div>

          {/* Quick Technical Specs Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Engine Type:</span>
              <span className="text-white font-bold">Bipartite Weighted Matching</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Taxonomy Resolution:</span>
              <span className="text-white font-bold">8+ Industry Domains</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 flex items-center gap-2">
              <Calculator className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400">Scoring Integrity:</span>
              <span className="text-white font-bold">100% Deterministic</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 — CENTRAL ANALYTICAL PIPELINE MATRIX */}
      <CareerAlignmentPipelineVisual
        currentStage={currentStage}
        isProcessing={isProcessing}
      />

      {/* SECTION 3 — RESUME ACTIVATION CONSOLE */}
      <CareerActivationConsole
        onUpload={onUpload}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        parsingStatus={parsingStatus}
        validationError={validationError}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
      />

      {/* SECTION 4 — ANALYTICAL DIMENSIONS PREVIEW ("WHAT WILL BE ANALYZED") */}
      <CareerAnalysisDimensionsPreview />

      {/* METHODOLOGY EXPLAINER MODAL */}
      <CareerMethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
};

export default CareerAlignmentLabView;
