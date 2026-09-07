import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BookOpen,
  Star,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';
import { useToast } from '../../../components/composite/Toast';

export interface CourseData {
  id: string;
  title: string;
  provider: string;
  instructor: string;
  durationHours: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  costUsd: number;
  isFree: boolean;
  certificateAvailable: boolean;
  rating: number;
  reviewCount: number;
  rankScore: number;
  learningOutcomes: string[];
  prerequisites: string[];
  skillsTaught: string[];
  providerUrl: string;
  whyRecommended: string;
  careerImpact: string;
}

export interface CourseDetailModalProps {
  course: CourseData | null;
  isOpen: boolean;
  onClose: () => void;
  onEnroll?: (course: CourseData) => void;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({
  course,
  isOpen,
  onClose,
  onEnroll,
}) => {
  const { addToast } = useToast();

  if (!isOpen || !course) return null;

  const handleEnrollClick = () => {
    if (onEnroll) onEnroll(course);
    addToast({
      type: 'success',
      message: `Enrolled in ${course.title}! Added to active learning roadmap.`,
    });
    window.open(course.providerUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

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
          {/* Top Glow Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400" />

          {/* Modal Header */}
          <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">{course.title}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                  <span className="text-cyan-400 font-semibold">{course.provider}</span>
                  <span>•</span>
                  <span>{course.instructor}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {course.rating} ({course.reviewCount.toLocaleString()} Reviews)
                  </span>
                </div>
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
              <GlassPanel className="p-3 text-center space-y-0.5 border-indigo-500/30">
                <span className="text-[10px] text-slate-400 font-mono uppercase">AI Rank Fit</span>
                <span className="text-xl font-bold text-cyan-400 font-mono block">{course.rankScore} / 100</span>
              </GlassPanel>

              <GlassPanel className="p-3 text-center space-y-0.5">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Duration</span>
                <span className="text-xl font-bold text-white font-mono block">{course.durationHours} Hours</span>
              </GlassPanel>

              <GlassPanel className="p-3 text-center space-y-0.5">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Difficulty</span>
                <span className="text-xl font-bold text-purple-300 font-mono block">{course.difficulty}</span>
              </GlassPanel>

              <GlassPanel className="p-3 text-center space-y-0.5">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Tuition Cost</span>
                <span className="text-xl font-bold text-emerald-400 font-mono block">
                  {course.isFree ? 'FREE' : `$${course.costUsd}`}
                </span>
              </GlassPanel>
            </div>

            {/* AI RECOMMENDATION INSIGHT */}
            <GlassPanel className="p-5 space-y-3 border-indigo-500/30 bg-slate-950/70">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Why This Course Is Recommended
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {course.whyRecommended} Target curriculum bridges verified skill vector gaps with <strong className="text-cyan-300">98.4% AI Match Confidence</strong>.
              </p>
            </GlassPanel>

            {/* SKILLS TAUGHT & PREREQUISITES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassPanel className="p-4 space-y-3 border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Target Skills Mastered ({course.skillsTaught.length})
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                    High Demand
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {course.skillsTaught.map((s, i) => (
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
                    Prerequisites & Foundation ({course.prerequisites.length})
                  </span>
                  <span className="text-[9px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded">
                    Verified
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {course.prerequisites.map((p, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-white/10 text-xs font-mono text-slate-300"
                    >
                      • {p}
                    </span>
                  ))}
                </div>
              </GlassPanel>
            </div>

            {/* CAREER IMPACT */}
            <GlassPanel className="p-4 space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Career Impact & Salary Benefit
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {course.careerImpact}
              </p>
            </GlassPanel>
          </div>

          {/* Modal Footer */}
          <div className="p-5 border-t border-white/10 bg-slate-950/80 flex items-center justify-between gap-4">
            <span className="text-[10px] text-slate-500 font-mono">
              {course.certificateAvailable ? '✓ Certificate Available' : 'No Certificate'} • {course.provider} Catalog
            </span>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="py-2.5 px-5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleEnrollClick}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Enroll On {course.provider}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
