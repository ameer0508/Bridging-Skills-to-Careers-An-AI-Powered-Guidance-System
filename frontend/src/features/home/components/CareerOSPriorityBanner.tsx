import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, CheckCircle2, FileText } from 'lucide-react';

interface CareerOSPriorityBannerProps {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  hasRecommendation: boolean;
  onAction: () => void;
}

export const CareerOSPriorityBanner: React.FC<CareerOSPriorityBannerProps> = ({
  title,
  description,
  category = 'AI Intelligence',
  priority = 'high',
  hasRecommendation,
  onAction,
}) => {
  if (!hasRecommendation || !title) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-slate-950/80 p-5 sm:p-6 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono text-[10px] font-bold uppercase">
              AI Recommendation Engine Online
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Upload Your Resume to Generate Priority Skill Action Items</span>
            </h3>
            <p className="text-xs text-slate-400">
              Our AI engine will parse your skills & experience to produce tailored high-impact learning tasks.
            </p>
          </div>
          <button
            onClick={onAction}
            className="self-start sm:self-center shrink-0 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Upload Resume</span>
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-linear-to-r from-indigo-950/80 via-slate-950/90 to-slate-950/80 p-5 sm:p-6 shadow-xl"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold uppercase flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Priority Action • {priority}</span>
            </span>
            <span className="text-[11px] font-mono text-cyan-400 font-semibold">
              Category: {category}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{title}</span>
          </h3>
          {description && <p className="text-xs text-slate-300 leading-relaxed">{description}</p>}
        </div>

        <button
          onClick={onAction}
          className="self-start sm:self-center shrink-0 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <span>Execute Task</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-4 text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1 text-slate-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          Verified AI Engine Match
        </span>
      </div>
    </motion.div>
  );
};

export default CareerOSPriorityBanner;
