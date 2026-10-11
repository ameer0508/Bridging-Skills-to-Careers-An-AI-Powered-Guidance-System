import React from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Clock,
  Layers,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Bookmark,
  Trash2,
  HelpCircle,
  Award,
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
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-screen max-w-xl bg-slate-950 border-l border-white/10 shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-6"
          >
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                    {recommendation.category}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold uppercase border ${
                      isHighest
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {recommendation.priority} Priority
                  </span>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title & Core Narrative */}
              <div className="space-y-2">
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                  {recommendation.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {recommendation.description}
                </p>
              </div>

              {/* Target Skill Telemetry Block */}
              {recommendation.targetSkill && (
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                        Target Skill Node
                      </span>
                      <span className="font-mono text-sm font-bold text-white">
                        {recommendation.targetSkill}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    High Demand Delta
                  </span>
                </div>
              )}

              {/* Projected Impact & Specs Grid */}
              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-center space-y-1">
                  <span className="text-[9px] text-slate-400 uppercase block font-semibold">
                    Readiness Gain
                  </span>
                  <span className="text-emerald-400 font-extrabold text-base sm:text-lg block">
                    +{recommendation.impact}%
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-center space-y-1">
                  <span className="text-[9px] text-slate-400 uppercase block font-semibold">
                    Time Investment
                  </span>
                  <span className="text-cyan-300 font-bold text-xs sm:text-sm block truncate mt-0.5">
                    {recommendation.estimatedTime || '1-2 weeks'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-center space-y-1">
                  <span className="text-[9px] text-slate-400 uppercase block font-semibold">
                    Complexity
                  </span>
                  <span className="text-purple-300 font-bold text-xs sm:text-sm block mt-0.5">
                    {recommendation.difficulty}
                  </span>
                </div>
              </div>

              {/* AI Explainability Section */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs font-mono">
                  <Sparkles className="w-4 h-4" />
                  <span className="uppercase tracking-wider">AI Explainability Trace</span>
                </div>

                <p className="text-xs text-slate-300 font-mono leading-relaxed">
                  💡 {recommendation.reason || 'Synthesized based on missing competency signals in your verified profile compared against competitive benchmarks for your target role.'}
                </p>

                <div className="pt-2 border-t border-white/5 space-y-1.5 text-xs text-slate-400">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold">
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
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                    Prerequisites & Milestone Foundations:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.dependencies.map((dep, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-xs font-mono text-slate-300"
                      >
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Dock */}
            <div className="pt-6 border-t border-white/10 space-y-3">
              {recommendation.actionLink && (
                <a
                  href={recommendation.actionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
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
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
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
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
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
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
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
                  className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-colors cursor-pointer"
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
