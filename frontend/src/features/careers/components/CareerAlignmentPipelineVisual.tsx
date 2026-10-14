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
      activeColor: 'text-amber-700 border-amber-200 bg-amber-50',
      nodeGlow: 'from-amber-500/20',
    },
    {
      step: '02',
      title: 'Skill Extraction',
      subtitle: 'Vector normalization',
      status: currentStage > 1 ? 'Vectorized' : currentStage === 1 ? 'Extracting...' : 'Taxonomy Armed',
      icon: Cpu,
      activeColor: 'text-aurora-violet border-aurora-violet/25 bg-aurora-violet/[0.06]',
      nodeGlow: 'from-cyan-500/20',
    },
    {
      step: '03',
      title: 'Career Alignment',
      subtitle: '8+ Domain taxonomies',
      status: currentStage > 2 ? 'Aligned' : currentStage === 2 ? 'Mapping...' : 'Standby',
      icon: Compass,
      activeColor: 'text-aurora-indigo border-aurora-violet/25 bg-aurora-violet/[0.06]',
      nodeGlow: 'from-indigo-500/20',
    },
    {
      step: '04',
      title: 'Role Fit Calculation',
      subtitle: 'Core 70% / Preferred 30%',
      status: currentStage > 3 ? 'Scored' : currentStage === 3 ? 'Calculating...' : 'Deterministic Model',
      icon: Calculator,
      activeColor: 'text-aurora-violet border-purple-500/40 bg-purple-500/10',
      nodeGlow: 'from-purple-500/20',
    },
    {
      step: '05',
      title: 'Skill Gap Audit',
      subtitle: 'Delta to 90%+ readiness',
      status: currentStage > 4 ? 'Diagnosed' : currentStage === 4 ? 'Auditing...' : 'Ready to Analyze',
      icon: Target,
      activeColor: 'text-emerald-700 border-emerald-200 bg-emerald-50',
      nodeGlow: 'from-emerald-500/20',
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-aurora-line bg-aurora-canvas/60 p-6 sm:p-8 lg:p-10 shadow-2xl">
      {/* Ambient background trajectory glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-linear-to-tr from-cyan-500/10 via-indigo-500/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-linear-to-bl from-amber-500/10 via-purple-500/10 to-transparent blur-3xl" />

      <div className="relative z-10 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-aurora-line pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-aurora-violet px-2 py-0.5 rounded bg-aurora-violet/[0.06] border border-aurora-violet/25">
                Analytical Pipeline Architecture
              </span>
              <span className="text-[10px] text-aurora-muted">
                Deterministic Fit Protocol
              </span>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-aurora-ink tracking-tight">
              Evidence-Driven Career Intelligence Sequence
            </h3>
          </div>
          <div className="text-xs text-aurora-muted flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
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
                    ? 'border-cyan-400/60 bg-aurora-canvas/60 shadow-lg shadow-cyan-500/10 scale-[1.02]'
                    : isPassed
                    ? 'border-emerald-200 bg-aurora-canvas/60'
                    : 'border-aurora-line bg-aurora-canvas/60 hover:border-aurora-line'
                }`}
              >
                {/* Connecting arrow for desktop between stages */}
                {idx < stages.length - 1 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-20 text-aurora-muted">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-aurora-muted">
                      {stage.step}
                    </span>
                    <div className={`p-2 rounded-xl border ${stage.activeColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-display text-sm font-bold text-aurora-ink tracking-tight">
                      {stage.title}
                    </h4>
                    <p className="text-[11px] text-aurora-muted font-sans leading-tight mt-0.5">
                      {stage.subtitle}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-aurora-line flex items-center justify-between">
                  <span className="text-[10px] text-aurora-muted uppercase">
                    Status:
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isPassed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isCurrent
                        ? 'bg-aurora-violet/[0.06] text-aurora-violet border border-aurora-violet/25 animate-pulse'
                        : 'bg-aurora-canvas text-aurora-muted border border-aurora-line'
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
        <div className="p-3.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-aurora-muted">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-aurora-violet shrink-0" />
            <span>
              SkillBridge utilizes <strong>deterministic bipartite requirement scoring</strong>, not opaque LLM hallucinations.
            </span>
          </div>
          <span className="text-aurora-muted text-[11px]">
            Input Document → Mapped Career Hypotheses
          </span>
        </div>
      </div>
    </div>
  );
};

export default CareerAlignmentPipelineVisual;
