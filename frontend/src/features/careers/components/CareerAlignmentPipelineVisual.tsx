import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Cpu, Compass, Calculator, Target, Sparkles, ArrowRight } from 'lucide-react';

export interface CareerAlignmentPipelineVisualProps {
  currentStage?: number; // 0 = awaiting resume, 1 = parsing, 2 = extracting skills, 3 = matching, 4 = complete
  isProcessing?: boolean;
}

export const CareerAlignmentPipelineVisual: React.FC<CareerAlignmentPipelineVisualProps> = ({
  currentStage = 0,
  isProcessing = false,
}) => {
  const stages = [
    {
      step: '01',
      title: 'Resume Evidence',
      subtitle: 'Work history & projects',
      status: currentStage > 0 ? 'Extracted' : isProcessing ? 'Reading...' : 'Awaiting Input',
      icon: FileText,
      activeColor: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
      nodeGlow: 'from-amber-500/20',
    },
    {
      step: '02',
      title: 'Skill Extraction',
      subtitle: 'Vector normalization',
      status: currentStage > 1 ? 'Vectorized' : currentStage === 1 ? 'Extracting...' : 'Taxonomy Armed',
      icon: Cpu,
      activeColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
      nodeGlow: 'from-cyan-500/20',
    },
    {
      step: '03',
      title: 'Career Alignment',
      subtitle: '8+ Domain taxonomies',
      status: currentStage > 2 ? 'Aligned' : currentStage === 2 ? 'Mapping...' : 'Standby',
      icon: Compass,
      activeColor: 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10',
      nodeGlow: 'from-indigo-500/20',
    },
    {
      step: '04',
      title: 'Role Fit Calculation',
      subtitle: 'Core 70% / Preferred 30%',
      status: currentStage > 3 ? 'Scored' : currentStage === 3 ? 'Calculating...' : 'Deterministic Model',
      icon: Calculator,
      activeColor: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
      nodeGlow: 'from-purple-500/20',
    },
    {
      step: '05',
      title: 'Skill Gap Audit',
      subtitle: 'Delta to 90%+ readiness',
      status: currentStage > 4 ? 'Diagnosed' : currentStage === 4 ? 'Auditing...' : 'Ready to Analyze',
      icon: Target,
      activeColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
      nodeGlow: 'from-emerald-500/20',
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-2xl p-6 sm:p-8 lg:p-10 shadow-2xl">
      {/* Ambient background trajectory glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-linear-to-tr from-cyan-500/10 via-indigo-500/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-linear-to-bl from-amber-500/10 via-purple-500/10 to-transparent blur-3xl" />

      <div className="relative z-10 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                Analytical Pipeline Architecture
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Deterministic Fit Protocol
              </span>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-white tracking-tight">
              Evidence-Driven Career Intelligence Sequence
            </h3>
          </div>
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Engine Status: {isProcessing ? 'Processing Input' : 'Awaiting Resume Evidence'}</span>
          </div>
        </div>

        {/* 5-Stage Analytical Pipeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isCurrent = currentStage === idx;
            const isPassed = currentStage > idx;

            return (
              <motion.div
                key={stage.step}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                className={`relative rounded-2xl border p-4 flex flex-col justify-between space-y-3 transition-all ${
                  isCurrent
                    ? 'border-cyan-400/60 bg-slate-900/90 shadow-lg shadow-cyan-500/10 scale-[1.02]'
                    : isPassed
                    ? 'border-emerald-500/30 bg-slate-900/70'
                    : 'border-white/10 bg-slate-950/60 hover:border-white/20'
                }`}
              >
                {/* Connecting arrow for desktop between stages */}
                {idx < stages.length - 1 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-20 text-slate-600">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-extrabold text-slate-500">
                      {stage.step}
                    </span>
                    <div className={`p-2 rounded-xl border ${stage.activeColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-display text-sm font-bold text-white tracking-tight">
                      {stage.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-sans leading-tight mt-0.5">
                      {stage.subtitle}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Status:
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      isPassed
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : isCurrent
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                        : 'bg-slate-900 text-slate-400 border border-white/5'
                    }`}
                  >
                    {stage.status}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Analytical Flow Guidance Footer */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              SkillBridge utilizes <strong>deterministic bipartite requirement scoring</strong>, not opaque LLM hallucinations.
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">
            Input Document → Mapped Career Hypotheses
          </span>
        </div>
      </div>
    </div>
  );
};

export default CareerAlignmentPipelineVisual;
