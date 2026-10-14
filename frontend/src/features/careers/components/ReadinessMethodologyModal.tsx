import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Scale, Cpu, AlertTriangle, Award, CheckCircle2 } from 'lucide-react';

interface ReadinessMethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadinessMethodologyModal: React.FC<ReadinessMethodologyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl rounded-3xl border border-aurora-line bg-aurora-canvas p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-aurora-line pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-aurora-violet/25 bg-aurora-violet/[0.06] text-[10px] font-bold text-aurora-violet uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Deterministic Scoring Architecture</span>
              </div>
              <h3 className="text-lg sm:text-xl font-display font-bold text-aurora-ink tracking-tight">
                Career Readiness Diagnostic Methodology
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas text-aurora-muted hover:text-aurora-indigo transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Core Formula Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-aurora-violet uppercase tracking-wider">
              <Scale className="w-4 h-4 text-aurora-violet" />
              <span>1. Multidimensional Composite Formula</span>
            </div>
            <div className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-2 text-xs">
              <p className="text-aurora-indigo font-bold">
                BaseScore = (Tech × 0.50) + (Exp × 0.25) + (Proj × 0.15) + (Cert × 0.10)
              </p>
              <p className="text-amber-700 font-bold">
                Penalty = (Missing Required Competencies / Total Required) × 0.40
              </p>
              <p className="text-emerald-700 font-bold">
                Final Readiness = BaseScore × (1 - Penalty)
              </p>
            </div>
            <p className="text-xs text-aurora-muted leading-relaxed">
              Readiness is never estimated arbitrarily. Each dimension scores the candidate's verified evidence against role requirements published by industry benchmarks.
            </p>
          </div>

          {/* 4 Pillars Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-aurora-indigo uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-aurora-indigo" />
              <span>2. The Four Capability Pillars</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-1">
                <span className="font-bold text-aurora-ink block">Technical Skills (50%)</span>
                <p className="text-aurora-muted text-[11px] leading-relaxed">
                  Evaluates core competencies matching required skills. Scored from 0 to 100 based on verified keyword presence and evidence density.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-1">
                <span className="font-bold text-aurora-ink block">Professional Experience (25%)</span>
                <p className="text-aurora-muted text-[11px] leading-relaxed">
                  Validates real-world application from employment tenure, company scale, and role responsibilities mapped to the skill domain.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-1">
                <span className="font-bold text-aurora-ink block">Project Portfolio (15%)</span>
                <p className="text-aurora-muted text-[11px] leading-relaxed">
                  Measures hands-on capstone builds, production code artifacts, architecture depth, and open-source contributions.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-1">
                <span className="font-bold text-aurora-ink block">Education & Certifications (10%)</span>
                <p className="text-aurora-muted text-[11px] leading-relaxed">
                  Accounts for accredited degrees, certifications (AWS, GCP, CKA), and verified coursework that reinforce theoretical foundation.
                </p>
              </div>
            </div>
          </div>

          {/* Penalty and Tier Classification */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>3. Penalty Rigor & Readiness Tiers</span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-aurora-muted leading-relaxed">
                  <span className="text-aurora-ink font-bold">Mandatory Core Skill Penalty:</span> If a candidate lacks required baseline competencies (e.g. SQL for a Data Engineer), a strict penalty reduces overall readiness by up to 40%.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-amber-200 text-[11px]">
                <div className="p-2 rounded-lg bg-aurora-canvas/60 border border-aurora-line text-center">
                  <span className="text-aurora-muted block text-[9px]">≥ 80%</span>
                  <span className="text-emerald-700 font-bold">Senior Ready</span>
                </div>
                <div className="p-2 rounded-lg bg-aurora-canvas/60 border border-aurora-line text-center">
                  <span className="text-aurora-muted block text-[9px]">≥ 60%</span>
                  <span className="text-aurora-violet font-bold">Mid Ready</span>
                </div>
                <div className="p-2 rounded-lg bg-aurora-canvas/60 border border-aurora-line text-center">
                  <span className="text-aurora-muted block text-[9px]">≥ 35%</span>
                  <span className="text-aurora-indigo font-bold">Entry Ready</span>
                </div>
                <div className="p-2 rounded-lg bg-aurora-canvas/60 border border-aurora-line text-center">
                  <span className="text-aurora-muted block text-[9px]">&lt; 35%</span>
                  <span className="text-rose-700 font-bold">Not Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* Zero Hallucination Guarantee */}
          <div className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line flex items-center gap-3">
            <Award className="w-5 h-5 text-emerald-700 shrink-0" />
            <p className="text-xs text-aurora-muted leading-relaxed">
              <span className="text-aurora-ink font-bold">Zero-Hallucination Policy:</span> SkillBridge does not prompt language models to generate arbitrary readiness numbers. Scores are computed deterministically via <code className="text-aurora-violet">ReadinessCalculator.ts</code> directly on the server.
            </p>
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-aurora-violet hover:bg-aurora-indigo text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              Understood
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReadinessMethodologyModal;
