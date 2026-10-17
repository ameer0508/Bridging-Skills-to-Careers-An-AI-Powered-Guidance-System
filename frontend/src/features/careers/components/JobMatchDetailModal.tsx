import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { JobItem } from './JobIntelligenceFeed';
import { GlassPanel } from '../../../components/experience/workspace';
import { useToast } from '../../../components/composite/Toast';

export interface JobMatchDetailModalProps {
  job: JobItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApply?: (job: JobItem) => void;
}

export const JobMatchDetailModal: React.FC<JobMatchDetailModalProps> = ({
  job,
  isOpen,
  onClose,
  onApply,
}) => {
  const { addToast } = useToast();

  if (!isOpen || !job) return null;

  const handleApplyClick = () => {
    if (onApply) onApply(job);
    addToast({
      type: 'success',
      message: `Successfully submitted application to ${job.company} for ${job.title}!`,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aurora-canvas/60 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-aurora-canvas border border-aurora-line rounded-2xl shadow-2xl overflow-hidden text-aurora-ink my-8"
        >
          {/* Top Ambient Glow */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400" />

          {/* Modal Header */}
          <div className="p-6 border-b border-aurora-line flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-aurora-canvas border border-aurora-line flex items-center justify-center text-2xl shrink-0 shadow-lg">
                {job.companyLogo || '💼'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-aurora-ink leading-tight">{job.title}</h3>
                <div className="flex items-center gap-2 text-xs text-aurora-muted mt-1">
                  <span className="text-aurora-ink font-semibold">{job.company}</span>
                  <span>•</span>
                  <span>{job.location}</span>
                  <span>•</span>
                  <span className="text-aurora-violet">{job.workplaceType}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-aurora-muted hover:text-aurora-indigo hover:bg-aurora-canvas transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* MATCH SCORE & SALARY BANNER */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <GlassPanel className="p-4 flex flex-col items-center justify-center text-center space-y-1 border-aurora-violet/25">
                <span className="text-[10px] text-aurora-muted uppercase tracking-wider">
                  AI Fit Vector Score
                </span>
                <span className="text-2xl font-extrabold text-aurora-violet flex items-center gap-1">
                  <Zap className="w-5 h-5 fill-cyan-400" />
                  {job.matchScore}%
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">Tier 1 Target Alignment</span>
              </GlassPanel>

              <GlassPanel className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                <span className="text-[10px] text-aurora-muted uppercase tracking-wider">
                  Compensation Range
                </span>
                <span className="text-2xl font-extrabold text-emerald-700 tabular-nums">
                  ${job.salaryMin}k - ${job.salaryMax}k
                </span>
                <span className="text-[10px] text-aurora-muted">USD / Year + Equity</span>
              </GlassPanel>

              <GlassPanel className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                <span className="text-[10px] text-aurora-muted uppercase tracking-wider">
                  Current Readiness Score
                </span>
                <span className="text-2xl font-extrabold text-aurora-indigo tabular-nums">
                  {job.readinessScore}%
                </span>
                <span className="text-[10px] text-aurora-violet font-semibold">+{job.expectedImprovement}% Potential Boost</span>
              </GlassPanel>
            </div>

            {/* AI MATCH EXPLANATION (WHY THIS JOB MATCHES) */}
            <GlassPanel className="p-5 space-y-3 border-aurora-violet/25 bg-aurora-canvas/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-aurora-violet" />
                <h4 className="text-xs font-bold text-aurora-ink uppercase tracking-wider">
                  Why This Position Matches Your Profile
                </h4>
              </div>
              <p className="text-xs text-aurora-muted leading-relaxed">
                {job.whyMatchReason} Scored by SkillBridge's rule-based comparison of your extracted skills with {job.company}'s listed requirements; no language model produced this match.
              </p>
            </GlassPanel>

            {/* SKILLS ALIGNMENT BREAKDOWN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Matched Skills */}
              <GlassPanel className="p-4 space-y-3 border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-aurora-ink flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    Your Skills Matched ({job.matchingSkills.length})
                  </span>
                  <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    On your profile
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {job.matchingSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-aurora-canvas border border-aurora-line text-xs text-aurora-ink"
                    >
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </GlassPanel>

              {/* Missing Skills */}
              <GlassPanel className="p-4 space-y-3 border-rose-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-aurora-ink flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                    High Impact Gap Areas ({job.missingSkills.length})
                  </span>
                  <span className="text-[9px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded">
                    Actionable
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {job.missingSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700"
                    >
                      ⚡ {skill}
                    </span>
                  ))}
                </div>
              </GlassPanel>
            </div>

            {/* EXPECTED IMPROVEMENT PATHWAY */}
            <GlassPanel className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                  Expected Readiness Improvement
                </span>
                <span className="text-xs text-emerald-700 font-bold">
                  +{job.expectedImprovement}% Match Boost
                </span>
              </div>
              <p className="text-xs text-aurora-muted leading-relaxed">
                Completing recommended learning milestones for <strong className="text-aurora-ink">{job.missingSkills.join(', ')}</strong> will elevate your compatibility for {job.title} to <strong className="text-emerald-700">{Math.min(99.5, Math.round((job.matchScore + job.expectedImprovement) * 10) / 10)}%</strong>.
              </p>
            </GlassPanel>
          </div>

          {/* Modal Footer */}
          <div className="p-5 border-t border-aurora-line bg-aurora-canvas/60 flex items-center justify-between gap-4">
            <span className="text-[10px] text-aurora-muted tabular-nums">
              Posted {job.postingAge} • {job.category} Category
            </span>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="py-2.5 px-5 rounded-xl border border-aurora-line text-xs font-semibold text-aurora-muted hover:text-aurora-indigo hover:bg-aurora-canvas transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleApplyClick}
                className="py-2.5 px-6 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Submit Quick Application</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
