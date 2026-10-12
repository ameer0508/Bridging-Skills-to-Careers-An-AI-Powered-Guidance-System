import React from 'react';
import { X, Calculator, ShieldCheck, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CareerMethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CareerMethodologyModal: React.FC<CareerMethodologyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/15 bg-slate-900 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 block">
                  Deterministic Analytical Engine
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white tracking-tight">
                  Career Fit Methodology & Scoring Formula
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Core Methodology Pillars */}
          <div className="space-y-4 text-xs font-sans text-slate-300 leading-relaxed">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                1. Evidence-Grounded Verification (No Hallucinations)
              </h4>
              <p className="text-slate-400">
                Traditional career tools ask users for self-reported skills or rely on unstructured chat prompts that hallucinate fit scores. SkillBridge operates strictly on parsed documentary evidence from work experience, capstone projects, and accredited certifications.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-400" />
                2. Weighted Bipartite Role Fit Formula
              </h4>
              <p className="text-slate-400">
                Each target career profile defines a structured requirement taxonomy split into two tiers:
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 space-y-0.5">
                  <span className="text-slate-400 block uppercase text-[10px]">Core Skills (70%)</span>
                  <span className="text-emerald-400 font-bold">Mandatory Baseline</span>
                  <span className="text-[10px] text-slate-500 block">Requires verified documentary evidence</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 space-y-0.5">
                  <span className="text-slate-400 block uppercase text-[10px]">Preferred Skills (30%)</span>
                  <span className="text-cyan-300 font-bold">Competitive Multiplier</span>
                  <span className="text-[10px] text-slate-500 block">Differentiates top 10% candidates</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                3. Taxonomy Normalization & Alias Mapping
              </h4>
              <p className="text-slate-400">
                SkillBridge normalizes varied terminology (e.g., "Docker", "Containerization", "ECS", "Docker Compose") into canonical skill nodes, ensuring that ATS terminology differences do not penalize your fit score.
              </p>
            </div>
          </div>

          {/* Close Button Footer */}
          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              Close Methodology
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CareerMethodologyModal;
