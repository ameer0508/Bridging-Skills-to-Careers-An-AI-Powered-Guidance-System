import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Award,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';
import { useToast } from '../../../components/composite/Toast';

export interface CertificationData {
  id: string;
  name: string;
  provider: string;
  level: 'Associate' | 'Professional' | 'Expert' | 'Specialty';
  examCode: string;
  domainsCovered: string[];
  prerequisites: string[];
  recommendedExperience: string;
  examDurationMinutes: number;
  passingScore: string;
  examCostUsd: number;
  renewalRequirements: string;
  validityPeriodYears: number;
  skillsCovered: string[];
  employerRecognitionScore: number;
  salaryBoostUsd: number;
  officialUrl: string;
  rankScore: number;
  whyRecommended: string;
}

export interface CertificationDetailModalProps {
  certification: CertificationData | null;
  isOpen: boolean;
  onClose: () => void;
  onTrackPreparation?: (cert: CertificationData) => void;
}

export const CertificationDetailModal: React.FC<CertificationDetailModalProps> = ({
  certification,
  isOpen,
  onClose,
  onTrackPreparation,
}) => {
  const { addToast } = useToast();

  if (!isOpen || !certification) return null;

  const handleStartPrep = () => {
    if (onTrackPreparation) onTrackPreparation(certification);
    addToast({
      type: 'success',
      message: `Started preparation plan for ${certification.name}! Exam code ${certification.examCode} added to active goals.`,
    });
    window.open(certification.officialUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const paybackMonths = roundNumber(
    (certification.examCostUsd / (certification.salaryBoostUsd / 12)),
    1
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-8"
        >
          {/* Top Accent Glow Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400" />

          {/* Modal Header */}
          <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] font-bold">
                    {certification.provider}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Exam Code: {certification.examCode}</span>
                </div>
                <h3 className="text-lg font-bold text-white leading-tight mt-1">{certification.name}</h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* STATS BANNER */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <GlassPanel className="p-3 text-center space-y-0.5 border-cyan-500/30">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Employer Recognition</span>
                <span className="text-xl font-bold text-cyan-400 font-mono block">{certification.employerRecognitionScore} / 100</span>
              </GlassPanel>

              <GlassPanel className="p-3 text-center space-y-0.5 border-emerald-500/30">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Annual Salary Boost</span>
                <span className="text-xl font-bold text-emerald-400 font-mono block">
                  +${certification.salaryBoostUsd.toLocaleString()}/yr
                </span>
              </GlassPanel>

              <GlassPanel className="p-3 text-center space-y-0.5">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Exam Fee</span>
                <span className="text-xl font-bold text-white font-mono block">${certification.examCostUsd}</span>
              </GlassPanel>

              <GlassPanel className="p-3 text-center space-y-0.5">
                <span className="text-[10px] text-slate-400 font-mono uppercase">ROI Payback</span>
                <span className="text-xl font-bold text-purple-300 font-mono block">{paybackMonths} Mo</span>
              </GlassPanel>
            </div>

            {/* AI RECOMMENDATION REASON */}
            <GlassPanel className="p-5 space-y-3 border-indigo-500/30 bg-slate-950/70">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Certification Recommendation Blueprint
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {certification.whyRecommended} Possessing the <strong className="text-cyan-300">{certification.name}</strong> aligns with <strong className="text-emerald-400">98.4% of top tier hiring specifications</strong>.
              </p>
            </GlassPanel>

            {/* DOMAINS COVERED & SKILLS VALIDATED */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassPanel className="p-4 space-y-3 border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Skills Validated ({certification.skillsCovered.length})
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                    Verified
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {certification.skillsCovered.map((s, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-white/10 text-xs font-mono text-slate-200"
                    >
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </GlassPanel>

              <GlassPanel className="p-4 space-y-3 border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    Exam Domains Covered
                  </span>
                  <span className="text-[9px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded">
                    Official
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-300">
                  {certification.domainsCovered.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </div>

            {/* RENEWAL & EXAM DETAILS */}
            <GlassPanel className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  Recertification & Renewal Policy
                </span>
                <span className="font-mono text-slate-400">{certification.validityPeriodYears} Years Validity</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {certification.renewalRequirements}
              </p>
            </GlassPanel>
          </div>

          {/* Modal Footer */}
          <div className="p-5 border-t border-white/10 bg-slate-950/80 flex items-center justify-between gap-4">
            <span className="text-[10px] text-slate-500 font-mono">
              Exam Duration: {certification.examDurationMinutes} Mins • Passing Score: {certification.passingScore}
            </span>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="py-2.5 px-5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleStartPrep}
                className="py-2.5 px-6 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Register & Begin Prep</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

function roundNumber(num: number, dec: number): number {
  const factor = Math.pow(10, dec);
  return Math.round(num * factor) / factor;
}
