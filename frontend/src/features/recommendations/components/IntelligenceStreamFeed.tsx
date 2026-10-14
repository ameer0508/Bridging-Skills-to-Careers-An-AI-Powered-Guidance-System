import React from 'react';
import {
  CheckCircle2,
  Bookmark,
  Trash2,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  BookOpen,
  Terminal,
  Award,
  FileText,
  ArrowUpRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface IRecommendation {
  _id: string;
  careerId?: {
    _id?: string;
    title?: string;
    category?: string;
  };
  category: string;
  title: string;
  description: string;
  priority: string;
  priorityScore: number;
  reason: string;
  impact: number;
  difficulty: string;
  estimatedTime: string;
  dependencies?: string[];
  actionLink?: string;
  actionType?: string;
  targetSkill?: string;
  status: string;
}

export interface IntelligenceStreamFeedProps {
  recommendations: IRecommendation[];
  onUpdateStatus: (id: string, status: string) => void;
  onInspect: (rec: IRecommendation) => void;
}

export const IntelligenceStreamFeed: React.FC<IntelligenceStreamFeedProps> = ({
  recommendations,
  onUpdateStatus,
  onInspect,
}) => {
  if (recommendations.length === 0) {
    return (
      <div className="rounded-3xl border border-aurora-line bg-aurora-canvas/60 backdrop-blur-xl p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo mx-auto flex items-center justify-center">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-base sm:text-lg font-bold text-aurora-ink">
            No Strategic Actions in This Dimension
          </h3>
          <p className="text-xs sm:text-sm text-aurora-muted max-w-md mx-auto">
            Try adjusting your search query, switching categories, or view another status tab to inspect other action items.
          </p>
        </div>
      </div>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Projects':
        return Terminal;
      case 'Certifications':
        return Award;
      case 'Resume Improvements':
        return FileText;
      default:
        return BookOpen;
    }
  };

  return (
    <div className="relative space-y-4">
      {/* Visual Trajectory Spine Running Down Stream on Desktop */}
      <div className="hidden lg:block absolute left-8 top-6 bottom-6 w-px bg-gradient-to-b from-indigo-500/40 via-amber-500/30 to-cyan-500/10 pointer-events-none" />

      {recommendations.map((rec, index) => {
        const CategoryIcon = getCategoryIcon(rec.category);
        const isHighest = rec.priority === 'Highest';
        const isHigh = rec.priority === 'High';
        const rankIndex = index + 1;

        return (
          <motion.div
            key={rec._id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            className={`group relative rounded-3xl border transition-all duration-300 backdrop-blur-xl p-5 sm:p-6 lg:p-7 ${
              isHighest
                ? 'bg-aurora-canvas/60 border-amber-200 hover:border-amber-200 shadow-xl shadow-amber-500/5'
                : 'bg-aurora-canvas/60 border-aurora-line hover:border-aurora-violet/25 shadow-xl'
            }`}
          >
            {/* Ambient subtle glow for highest items */}
            {isHighest && (
              <div className="pointer-events-none absolute -top-12 -right-12 w-64 h-64 rounded-full bg-amber-50 blur-3xl opacity-75 group-hover:opacity-100 transition-opacity" />
            )}

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Left Column: Stream Node + Rationale Core */}
              <div className="flex items-start gap-4 sm:gap-5 flex-1">
                {/* Node Rank Indicator */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xs font-extrabold border shadow-lg transition-transform group-hover:scale-105 ${
                      isHighest
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : isHigh
                        ? 'bg-aurora-violet/[0.06] border-aurora-violet/25 text-aurora-indigo'
                        : 'bg-aurora-canvas border-aurora-line text-aurora-muted'
                    }`}
                  >
                    #{rankIndex < 10 ? `0${rankIndex}` : rankIndex}
                  </div>
                  <span className="text-[9px] text-aurora-muted uppercase mt-1 hidden sm:block">
                    {rec.difficulty}
                  </span>
                </div>

                {/* Main Content Body */}
                <div className="space-y-2.5 flex-1">
                  {/* Category, Priority & Target Skill Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25 text-[10px] font-bold uppercase tracking-wider">
                      <CategoryIcon className="w-3 h-3" />
                      {rec.category}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${
                        isHighest
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isHigh
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-aurora-violet/[0.06] text-aurora-violet border-aurora-violet/25'
                      }`}
                    >
                      {rec.priority} Priority ({rec.priorityScore} Pts)
                    </span>

                    {rec.targetSkill && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-aurora-canvas border border-aurora-line text-[10px] text-aurora-muted">
                        <ShieldCheck className="w-3 h-3 text-aurora-violet" />
                        Target: <strong className="text-aurora-ink font-semibold">{rec.targetSkill}</strong>
                      </span>
                    )}
                  </div>

                  {/* Title & Tactical Briefing */}
                  <div className="space-y-1">
                    <h3 className="font-display text-base sm:text-lg font-bold text-aurora-ink tracking-tight leading-snug group-hover:text-aurora-indigo transition-colors">
                      {rec.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-aurora-muted leading-relaxed font-sans max-w-3xl">
                      {rec.description}
                    </p>
                  </div>

                  {/* Grounded AI Rationale Ribbon */}
                  {rec.reason && (
                    <div className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-violet/25 text-xs text-aurora-indigo/90 flex items-start gap-2 max-w-3xl">
                      <span className="text-amber-700 font-bold shrink-0">💡 AI Rationale:</span>
                      <span className="leading-relaxed">{rec.reason}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Telemetry Specs & Direct Action Controls */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 w-full lg:w-auto lg:min-w-[220px] pt-4 lg:pt-0 border-t lg:border-t-0 border-aurora-line">
                {/* Telemetry Snapshot */}
                <div className="grid grid-cols-2 gap-2 w-full text-[11px] font-mono">
                  <div className="p-2 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-center space-y-0.5">
                    <span className="text-[9px] text-aurora-muted uppercase block">Gap impact</span>
                    <span className="text-emerald-700 font-extrabold text-sm block">
                      {rec.impact}/100
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-center space-y-0.5">
                    <span className="text-[9px] text-aurora-muted uppercase block">Investment</span>
                    <span className="text-aurora-violet font-bold text-xs truncate block mt-0.5">
                      {rec.estimatedTime || '1-2 hrs'}
                    </span>
                  </div>
                </div>

                {/* Interactive Action Control Buttons */}
                <div className="flex items-center gap-2 w-full justify-between lg:justify-end">
                  {/* Secondary Options: Save for Later & Dismiss */}
                  <div className="flex items-center gap-1.5">
                    {rec.status === 'active' && (
                      <button
                        onClick={() => onUpdateStatus(rec._id, 'saved_for_later')}
                        title="Save to Radar"
                        className="p-2 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line text-aurora-muted hover:text-aurora-indigo transition-colors cursor-pointer"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    )}

                    {rec.status !== 'active' && (
                      <button
                        onClick={() => onUpdateStatus(rec._id, 'active')}
                        title="Move to Active Queue"
                        className="px-2.5 py-1.5 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line text-xs text-aurora-muted hover:text-aurora-indigo transition-colors cursor-pointer"
                      >
                        Activate
                      </button>
                    )}

                    {rec.status !== 'dismissed' && (
                      <button
                        onClick={() => onUpdateStatus(rec._id, 'dismissed')}
                        title="Dismiss Recommendation"
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-50 border border-rose-200 text-rose-700 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => onInspect(rec)}
                      title="Inspect Intelligence Rationale"
                      className="p-2 rounded-xl bg-aurora-violet/[0.06] hover:bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Primary Trigger: Mark Complete or Launch Action */}
                  <div className="flex items-center gap-2">
                    {rec.actionLink && (
                      <a
                        href={rec.actionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-aurora-violet/[0.06] hover:bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-violet transition-colors"
                        title="Open Resource URL"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    )}

                    {rec.status !== 'completed' ? (
                      <button
                        onClick={() => onUpdateStatus(rec._id, 'completed')}
                        className="py-2 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete</span>
                      </button>
                    ) : (
                      <span className="py-1.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Done
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default IntelligenceStreamFeed;
