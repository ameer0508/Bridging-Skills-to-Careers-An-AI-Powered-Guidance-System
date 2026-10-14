import React from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Bookmark,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IRecommendation } from './IntelligenceStreamFeed';

export interface ActionIntelligenceDrawerProps {
  recommendation: IRecommendation | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
}

export const ActionIntelligenceDrawer: React.FC<ActionIntelligenceDrawerProps> = ({
  recommendation,
  isOpen,
  onClose,
  onUpdateStatus,
}) => {
  if (!isOpen || !recommendation) return null;

  const isHighest = recommendation.priority === 'Highest';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-aurora-canvas/60 backdrop-blur-md transition-opacity"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-screen max-w-xl bg-aurora-canvas border-l border-aurora-line shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-6"
          >
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-aurora-line pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo text-[10px] font-bold uppercase tracking-wider">
                    {recommendation.category}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                      isHighest
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {recommendation.priority} Priority
                  </span>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line text-aurora-muted hover:text-aurora-indigo transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title & Core Narrative */}
              <div className="space-y-2">
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-aurora-ink tracking-tight leading-tight">
                  {recommendation.title}
                </h2>
                <p className="text-xs sm:text-sm text-aurora-muted leading-relaxed">
                  {recommendation.description}
                </p>
              </div>

              {/* Target Skill Telemetry Block */}
              {recommendation.targetSkill && (
                <div className="p-4 rounded-2xl bg-violet-50 border border-aurora-violet/25 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-aurora-violet/[0.06] text-aurora-indigo">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-aurora-muted block font-semibold">
                        Target Skill Node
                      </span>
                      <span className="text-sm font-bold text-aurora-ink">
                        {recommendation.targetSkill}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-bold px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200">
                    High Demand Delta
                  </span>
                </div>
              )}

              {/* Projected Impact & Specs Grid */}
              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-center space-y-1">
                  <span className="text-[9px] text-aurora-muted uppercase block font-semibold">
                    Readiness Gain
                  </span>
                  <span className="text-emerald-700 font-extrabold text-base sm:text-lg block">
                    +{recommendation.impact}%
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-center space-y-1">
                  <span className="text-[9px] text-aurora-muted uppercase block font-semibold">
                    Time Investment
                  </span>
                  <span className="text-aurora-violet font-bold text-xs sm:text-sm block truncate mt-0.5">
                    {recommendation.estimatedTime || '1-2 weeks'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-center space-y-1">
                  <span className="text-[9px] text-aurora-muted uppercase block font-semibold">
                    Complexity
                  </span>
                  <span className="text-aurora-violet font-bold text-xs sm:text-sm block mt-0.5">
                    {recommendation.difficulty}
                  </span>
                </div>
              </div>

              {/* AI Explainability Section */}
              <div className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-3">
                <div className="flex items-center gap-2 text-aurora-indigo font-bold text-xs font-mono">
                  <Sparkles className="w-4 h-4" />
                  <span className="uppercase tracking-wider">AI Explainability Trace</span>
                </div>

                <p className="text-xs text-aurora-muted leading-relaxed">
                  💡 {recommendation.reason || 'Synthesized based on missing competency signals in your verified profile compared against competitive benchmarks for your target role.'}
                </p>

                <div className="pt-2 border-t border-aurora-line space-y-1.5 text-xs text-aurora-muted">
                  <span className="text-[10px] uppercase text-aurora-muted block font-semibold">
                    Observed Market Validation:
                  </span>
                  <ul className="list-disc list-inside space-y-1 font-sans text-xs">
                    <li>Required in over 80% of verified job specifications in your target domain.</li>
                    <li>Directly addresses an unfulfilled requirement in your active career roadmap.</li>
                    <li>Boosts estimated resume screening match rate by up to 28%.</li>
                  </ul>
                </div>
              </div>

              {/* Prerequisites & Dependencies */}
              {recommendation.dependencies && recommendation.dependencies.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-aurora-muted font-semibold block">
                    Prerequisites & Milestone Foundations:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.dependencies.map((dep, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-aurora-canvas border border-aurora-line text-xs text-aurora-muted"
                      >
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Dock */}
            <div className="pt-6 border-t border-aurora-line space-y-3">
              {recommendation.actionLink && (
                <a
                  href={recommendation.actionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <span>Launch Official Resource</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <div className="flex items-center gap-2">
                {recommendation.status !== 'completed' ? (
                  <button
                    onClick={() => {
                      onUpdateStatus(recommendation._id, 'completed');
                      onClose();
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark as Completed</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onUpdateStatus(recommendation._id, 'active');
                      onClose();
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-aurora-canvas hover:bg-aurora-line text-aurora-ink font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Re-open Action</span>
                  </button>
                )}

                {recommendation.status === 'active' && (
                  <button
                    onClick={() => {
                      onUpdateStatus(recommendation._id, 'saved_for_later');
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line text-aurora-muted hover:text-aurora-indigo transition-colors cursor-pointer"
                    title="Save for Later"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => {
                    onUpdateStatus(recommendation._id, 'dismissed');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-50 border border-rose-200 text-rose-700 transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default ActionIntelligenceDrawer;
